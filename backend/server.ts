import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { db } from './db';
import * as schema from './db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import jwt from 'jsonwebtoken';
import { initiateSTKPush } from './utils/mpesa';
import { pushCandidateToProxy } from './utils/businessCentral';
import { generateApplicationPDFBuffer } from './utils/pdfGenerator';

import {
  getSuccessEmail,
  getAssessmentInvitationEmail,
  getInterviewInviteEmail,
  getAdmissionOfferEmail,
  getWaitlistEmail,
  getRejectionEmail,
  getAssessmentScheduleEmail,
  getApplicationPdfEmail
} from '../src/utils/emailTemplates';

dotenv.config();

const app = express();
const port = process.env.PORT || 8095;

// ── Security Middleware ─────────────────────────────────────────────────────
// helmet: sets X-Content-Type-Options, X-Frame-Options, HSTS, CSP, Referrer-Policy etc.
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow blob URLs for passport photos and PDF rendering
  hsts: false, // EXPLICITLY disable HSTS to allow internal HTTP IP connections
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],  // React JSX requires unsafe-inline
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],    // Passport photos loaded as blobs
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      upgradeInsecureRequests: null, // Disable forced HTTPS upgrades for local network IPs
    }
  }
}));

// Cookie parser — required for HttpOnly JWT session cookies
app.use(cookieParser());

// ── Rate Limiters ───────────────────────────────────────────────────────────
// 10 failed attempts per 15 minutes per IP on login routes
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true, // Only counts failed attempts
});

// 5 registrations per hour per IP
const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please try again in 1 hour.' },
});

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:8090',
  'http://192.168.0.100:8090',
  'https://kiandaadmissions.kiandaschool.ac.ke', // No trailing slash
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Use a Set for O(1) exact-match lookups — prevents substring bypass (e.g. evil.com:3001)
const allowedOriginsSet = new Set(allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOriginsSet.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));


// ── JWT ─────────────────────────────────────────────────────────────────────
// Fatal startup guard — never allow a missing or fallback JWT secret
if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is not set. Server cannot start.');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET as string;

// Pre-computed dummy bcrypt hash — used only for constant-time login responses
// to prevent timing-based email enumeration. Always fails to match any real password.
const DUMMY_HASH_PROMISE = bcrypt.hash('__dummy_never_matches_placeholder__', 10);

// ── Auth Middleware ─────────────────────────────────────────────────────────
const authenticateAdmin = (req: any, res: any, next: any) => {
  const token = req.cookies?.kianda_admin_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

// Secure uploads - only admins can view documents
// Mount on /api/uploads so NGINX proxies it directly
app.use('/api/uploads', authenticateAdmin, express.static(path.join(process.cwd(), 'uploads')));
// Keep legacy route for fallback if needed
app.use('/uploads', authenticateAdmin, express.static(path.join(process.cwd(), 'uploads')));


// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const candidateName = req.query.candidateName ? String(req.query.candidateName).replace(/[^a-z0-9 ]/gi, '_') : 'Unknown';
    const dir = path.join(process.cwd(), 'uploads', candidateName);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });


// Document Upload Route
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const candidateName = req.query.candidateName ? String(req.query.candidateName).replace(/[^a-z0-9 ]/gi, '_') : 'Unknown';
  // Return the URL path
  const fileUrl = `/api/uploads/${candidateName}/${req.file.filename}`;
  res.json({ fileUrl });

});

// Nodemailer Config
// Gmail on port 465 (SSL) presents a valid certificate — rejectUnauthorized not needed
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// --- Public Routes ---

// Get Grades with Vacancies (Filtered by Cycle)
app.get('/api/grades/available', async (req, res) => {
  try {
    const now = new Date();
    // Check if there is an active admission cycle for the current time
    const activeCycle = await db.query.admissionCycles.findFirst({
      where: (cycle, { and, lte, gte, eq }) => and(
        eq(cycle.isActive, true),
        lte(cycle.startDate, now),
        gte(cycle.endDate, now)
      )
    });

    if (!activeCycle) {
      return res.json([]); // Cycle closed, return no grades
    }

    // Fetch grades for that active cycle where manual toggle is true
    const availableGrades = await db.query.gradeManagement.findMany({
      where: (grade, { and, eq }) => and(
        eq(grade.academicYear, activeCycle.academicYear),
        eq(grade.isAcceptingApplications, true)
      ),
    });
    res.json(availableGrades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ error: 'Failed to fetch available grades' });
  }
});

// Submit Application
app.post('/api/applications', async (req, res) => {
  try {
    const { candidate, parent, additional, payment, documents } = req.body;

    // Look up grade to get the academic year and vacancies
    const gradeDetails = await db.query.gradeManagement.findFirst({
      where: eq(schema.gradeManagement.gradeName, candidate.grade)
    });

    const isWaitlisted = gradeDetails && gradeDetails.vacantSpots <= 0;
    const initialStatus = isWaitlisted ? 'waitlisted' : 'pending';

    const admissionType = ['Grade 1', 'Grade 7', 'Grade 10'].includes(candidate.grade) ? 'New' : 'Transfer';

    let newAppId = payment.applicationId;
    let paymentVerified = false;
    let paymentRecordId = null;

    if (payment.mpesaCode) {
      const code = payment.mpesaCode.trim().toUpperCase();
      const existingPayment = await db.query.payments.findFirst({
        where: eq(schema.payments.transactionCode, code)
      });
      if (existingPayment && (!existingPayment.mappedApplicationId || existingPayment.mappedApplicationId === newAppId)) {
        paymentVerified = true;
        paymentRecordId = existingPayment.id;
      }
    }

    let applicantUserId: number | undefined = undefined;
    const applicantCookieToken = req.cookies?.kianda_applicant_token;
    if (applicantCookieToken) {
      try {
        const decoded = jwt.verify(applicantCookieToken, JWT_SECRET);
        applicantUserId = (decoded as any).id;
      } catch (e) {
        // ignore if token invalid during submission
      }
    }

    await db.transaction(async (tx) => {
      if (newAppId) {
        await tx.update(schema.applications).set({
          mpesaCode: payment.mpesaCode,
          status: initialStatus,
          academicYear: gradeDetails?.academicYear || new Date().getFullYear(),
          admissionType: admissionType,
          paymentVerified,
          applicantUserId: applicantUserId || undefined
        }).where(eq(schema.applications.id, newAppId));

        await tx.delete(schema.candidates).where(eq(schema.candidates.applicationId, newAppId));
        await tx.delete(schema.schoolsAttended).where(eq(schema.schoolsAttended.applicationId, newAppId));
        await tx.delete(schema.parentDetails).where(eq(schema.parentDetails.applicationId, newAppId));
        await tx.delete(schema.siblings).where(eq(schema.siblings.applicationId, newAppId));
        await tx.delete(schema.additionalInfo).where(eq(schema.additionalInfo.applicationId, newAppId));
        await tx.delete(schema.documents).where(eq(schema.documents.applicationId, newAppId));
      } else {
        const [newApp] = await tx.insert(schema.applications).values({
          mpesaCode: payment.mpesaCode,
          status: initialStatus,
          academicYear: gradeDetails?.academicYear || new Date().getFullYear(),
          admissionType: admissionType,
          paymentVerified,
          applicantUserId: applicantUserId || undefined
        }).returning();
        newAppId = newApp.id;
      }

      const { schools, passportPhoto, passportPhotoPreview, ...candidateData } = candidate;
      await tx.insert(schema.candidates).values({
        applicationId: newAppId,
        passportPhotoUrl: passportPhoto,
        ...candidateData
      });

      if (schools && Array.isArray(schools)) {
        const schoolsToInsert = schools.map((s: any) => ({
          applicationId: newAppId,
          schoolType: s.type || 'Unknown',
          schoolName: s.name,
          yearsRange: s.years
        })).filter((s: any) => s.schoolName);
        if (schoolsToInsert.length > 0) {
          await tx.insert(schema.schoolsAttended).values(schoolsToInsert);
        }
      }

      await tx.insert(schema.parentDetails).values({ applicationId: newAppId, ...parent });

      const { siblings, ...additionalData } = additional;
      if (siblings && siblings.length > 0) {
        await tx.insert(schema.siblings).values(siblings.map((s: any) => ({ applicationId: newAppId, ...s })));
      }
      await tx.insert(schema.additionalInfo).values({ applicationId: newAppId, ...additionalData });

      if (documents) {
        const docsToInsert = [];
        if (documents.letter) docsToInsert.push({ applicationId: newAppId, documentType: 'Application Letter', fileUrl: documents.letter });
        if (documents.birthCert) docsToInsert.push({ applicationId: newAppId, documentType: "Candidate's Birth Certificate", fileUrl: documents.birthCert });
        if (documents.report) docsToInsert.push({ applicationId: newAppId, documentType: 'Latest School Report', fileUrl: documents.report });
        if (docsToInsert.length > 0) await tx.insert(schema.documents).values(docsToInsert);
      }

      if (paymentVerified && paymentRecordId) {
        await tx.update(schema.payments).set({ mappedApplicationId: newAppId }).where(eq(schema.payments.id, paymentRecordId));
      }
    });

    let checkoutRequestId = null;
    if (payment.phoneNumber) {
      try {
        // initiate STK push with amount 1 for testing, 10 for production testing
        const accountRef = candidate.fullName ? `${candidate.fullName.trim().split(/\s+/).slice(0, 2).join(' ')} APP` : `APP-${newAppId}`;
        const stkAmount = process.env.MPESA_ENVIRONMENT === 'sandbox' ? 1 : 2000;
        checkoutRequestId = await initiateSTKPush(payment.phoneNumber, stkAmount, accountRef);
        await db.update(schema.applications)
          .set({ checkoutRequestId })
          .where(eq(schema.applications.id, newAppId));
      } catch (stkError) {
        console.error('STK Push Initiation Failed:', stkError);
        // Continue anyway, user can fallback to manual
      }
    }

    if (!checkoutRequestId) {
      // Prepare Email
      const emailContent = getSuccessEmail(candidate.fullName, candidate.grade, gradeDetails?.academicYear || new Date().getFullYear(), gradeDetails?.assessmentDate?.toISOString(), gradeDetails?.location);
      const parentEmails = [parent.fatherEmail, parent.motherEmail].filter(Boolean).join(', ');

      // Generate PDF for attachment
      let pdfBuffer: Buffer | null = null;
      try {
        const appRecordForPDF = {
          id: newAppId,
          academicYear: gradeDetails?.academicYear || new Date().getFullYear(),
          admissionType: admissionType,
          candidate: { ...candidate, passportPhotoUrl: candidate.passportPhoto },
          parentDetails: parent,
          additionalInfo: additional,
          schoolsAttended: (candidate.schools || []).map((s: any) => ({
            schoolType: s.type,
            schoolName: s.name,
            yearsRange: s.years
          })),
          siblings: additional.siblings,
          documents: documents ? Object.entries(documents).map(([k, v]) => ({ fileUrl: v })) : []
        };
        pdfBuffer = await generateApplicationPDFBuffer(appRecordForPDF);
      } catch (e) {
        console.error('Failed to generate PDF for success email', e);
      }

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const attachments: any[] = [
          { filename: 'kianda-school-logo-removebg-preview.png', path: path.resolve(__dirname, '../public/kianda-school-logo-removebg-preview.png'), cid: 'kiandalogo' }
        ];
        if (pdfBuffer) {
          attachments.push({
            filename: `Kianda_Application_${newAppId}.pdf`,
            content: pdfBuffer
          });
        }

        transporter.sendMail({
          from: `"Kianda Admissions" <${process.env.EMAIL_USER}>`,
          to: parentEmails,
          subject: emailContent.subject,
          html: emailContent.body,
          attachments
        }).then(() => {
          console.log(`[EMAIL SENT] Success email sent to ${parentEmails}`);
        }).catch((e) => {
          console.error('[EMAIL ERROR] Failed to send email via nodemailer:', e);
        });
      } else {
        console.log(`[MOCK EMAIL] To: ${parentEmails}\nSubject: ${emailContent.subject}\nBody:\n${emailContent.body}`);
      }
    }

    res.status(201).json({ success: true, applicationId: newAppId, checkoutRequestId });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

// --- M-PESA Routes ---

app.post('/api/mpesa/callback', async (req, res) => {
  try {
    console.log('M-PESA Callback Received:', JSON.stringify(req.body, null, 2));

    const body = req.body;
    if (body.Body && body.Body.stkCallback) {
      const callbackData = body.Body.stkCallback;
      const resultCode = callbackData.ResultCode;
      const checkoutRequestId = callbackData.CheckoutRequestID;

      if (resultCode === 0) {
        // Success
        const callbackMetadata = callbackData.CallbackMetadata.Item;
        const receiptItem = callbackMetadata.find((item: any) => item.Name === 'MpesaReceiptNumber');
        const amountItem = callbackMetadata.find((item: any) => item.Name === 'Amount');
        const phoneItem = callbackMetadata.find((item: any) => item.Name === 'PhoneNumber');

        const receiptNumber = receiptItem ? receiptItem.Value : '';
        const amount = amountItem ? amountItem.Value : 0;
        const phone = phoneItem ? phoneItem.Value : '';

        await db.update(schema.applications)
          .set({ paymentVerified: true, mpesaCode: receiptNumber })
          .where(eq(schema.applications.checkoutRequestId, checkoutRequestId));

        console.log(`Payment successful for request ${checkoutRequestId}, receipt ${receiptNumber}`);

        // Fetch application details to send the success email and PDF
        try {
          const appRecord = await db.query.applications.findFirst({
            where: eq(schema.applications.checkoutRequestId, checkoutRequestId),
            with: {
              candidate: true,
              parentDetails: true,
              additionalInfo: true,
              siblings: true,
              schoolsAttended: true,
              documents: true
            }
          });

          if (appRecord) {
            // Save to payments table
            try {
              await db.insert(schema.payments).values({
                transactionCode: receiptNumber,
                amount: parseFloat(amount),
                phoneNumber: String(phone),
                customerName: [appRecord.parentDetails?.fatherName, appRecord.parentDetails?.motherName].filter(Boolean).join(' & ') || 'STK Push Payment',
                accountReference: appRecord.candidate ? `${appRecord.candidate.fullName.trim().split(/\s+/).slice(0, 2).join(' ')} APP` : 'Application',
                paymentType: 'STK_PUSH',
                mappedApplicationId: appRecord.id
              });
            } catch (e) {
              console.error('Failed to insert STK push into payments table:', e);
            }
          }

          if (appRecord && appRecord.candidate && appRecord.parentDetails) {
            const gradeDetails = await db.query.gradeManagement.findFirst({
              where: eq(schema.gradeManagement.gradeName, appRecord.candidate.grade)
            });

            const emailContent = getSuccessEmail(appRecord.candidate.fullName, appRecord.candidate.grade, appRecord.academicYear || new Date().getFullYear(), gradeDetails?.assessmentDate?.toISOString(), gradeDetails?.location);
            const parentEmails = [appRecord.parentDetails.fatherEmail, appRecord.parentDetails.motherEmail].filter(Boolean).join(', ');

            let pdfBuffer: Buffer | null = null;
            try {
              const appRecordForPDF = {
                id: appRecord.id,
                academicYear: appRecord.academicYear || new Date().getFullYear(),
                admissionType: appRecord.admissionType || 'New',
                candidate: appRecord.candidate,
                parentDetails: appRecord.parentDetails,
                additionalInfo: appRecord.additionalInfo,
                schoolsAttended: appRecord.schoolsAttended || [],
                siblings: appRecord.siblings || [],
                documents: appRecord.documents || []
              };
              pdfBuffer = await generateApplicationPDFBuffer(appRecordForPDF);
            } catch (e) {
              console.error('Failed to generate PDF for callback email', e);
            }

            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
              const attachments: any[] = [
                { filename: 'kianda-school-logo-removebg-preview.png', path: path.resolve(__dirname, '../public/kianda-school-logo-removebg-preview.png'), cid: 'kiandalogo' }
              ];
              if (pdfBuffer) {
                attachments.push({
                  filename: `Kianda_Application_${appRecord.id}.pdf`,
                  content: pdfBuffer
                });
              }

              transporter.sendMail({
                from: `"Kianda Admissions" <${process.env.EMAIL_USER}>`,
                to: parentEmails,
                subject: emailContent.subject,
                html: emailContent.body,
                attachments
              }).then(() => {
                console.log(`[EMAIL SENT] Callback success email sent to ${parentEmails}`);
              }).catch((e) => {
                console.error('[EMAIL ERROR] Failed to send callback email via nodemailer:', e);
              });
            } else {
              console.log(`[MOCK EMAIL] To: ${parentEmails}\nSubject: ${emailContent.subject}`);
            }
          }
        } catch (emailError) {
          console.error('Failed to process post-payment email:', emailError);
        }
      } else {
        console.log(`Payment failed for request ${checkoutRequestId}: ${callbackData.ResultDesc}`);
        await db.update(schema.applications)
          .set({ stkPushFailed: true })
          .where(eq(schema.applications.checkoutRequestId, checkoutRequestId));
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('M-PESA Webhook Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/applications/:id/payment-status', async (req, res) => {
  try {
    const { id } = req.params;
    const appRecord = await db.query.applications.findFirst({
      where: eq(schema.applications.id, parseInt(id))
    });

    if (!appRecord) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ paymentVerified: appRecord.paymentVerified, mpesaCode: appRecord.mpesaCode, stkPushFailed: appRecord.stkPushFailed });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/applications/:id/submit-mpesa-code', async (req, res) => {
  try {
    const { id } = req.params;
    const { mpesaCode } = req.body;

    if (!mpesaCode) {
      return res.status(400).json({ error: 'M-PESA Code is required' });
    }

    const appId = parseInt(id);

    await db.update(schema.applications)
      .set({ mpesaCode: mpesaCode.toUpperCase().trim(), stkPushFailed: false })
      .where(eq(schema.applications.id, appId));

    // Fetch app details to send the success email and PDF
    const appRecord = await db.query.applications.findFirst({
      where: eq(schema.applications.id, appId),
      with: {
        candidate: true,
        parentDetails: true,
        additionalInfo: true,
        siblings: true,
        schoolsAttended: true,
        documents: true
      }
    });

    if (appRecord && appRecord.candidate && appRecord.parentDetails) {
      const gradeDetails = await db.query.gradeManagement.findFirst({
        where: eq(schema.gradeManagement.gradeName, appRecord.candidate.grade)
      });

      const emailContent = getSuccessEmail(appRecord.candidate.fullName, appRecord.candidate.grade, appRecord.academicYear || new Date().getFullYear(), gradeDetails?.assessmentDate?.toISOString(), gradeDetails?.location);
      const parentEmails = [appRecord.parentDetails.fatherEmail, appRecord.parentDetails.motherEmail].filter(Boolean).join(', ');

      let pdfBuffer: Buffer | null = null;
      try {
        const appRecordForPDF = {
          id: appRecord.id,
          academicYear: appRecord.academicYear || new Date().getFullYear(),
          admissionType: appRecord.admissionType || 'New',
          candidate: appRecord.candidate,
          parentDetails: appRecord.parentDetails,
          additionalInfo: appRecord.additionalInfo,
          schoolsAttended: appRecord.schoolsAttended || [],
          siblings: appRecord.siblings || [],
          documents: appRecord.documents || []
        };
        pdfBuffer = await generateApplicationPDFBuffer(appRecordForPDF);
      } catch (e) {
        console.error('Failed to generate PDF for manual code submit', e);
      }

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const attachments: any[] = [
          { filename: 'kianda-school-logo-removebg-preview.png', path: path.resolve(__dirname, '../public/kianda-school-logo-removebg-preview.png'), cid: 'kiandalogo' }
        ];
        if (pdfBuffer) {
          attachments.push({
            filename: `Kianda_Application_${appRecord.id}.pdf`,
            content: pdfBuffer
          });
        }

        transporter.sendMail({
          from: `"Kianda Admissions" <${process.env.EMAIL_USER}>`,
          to: parentEmails,
          subject: emailContent.subject,
          html: emailContent.body,
          attachments
        }).then(() => {
          console.log(`[EMAIL SENT] Success email sent after manual code entry to ${parentEmails}`);
        }).catch((e) => {
          console.error('[EMAIL ERROR] Failed to send email via nodemailer:', e);
        });
      } else {
        console.log(`[MOCK EMAIL] To: ${parentEmails}\nSubject: ${emailContent.subject}`);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Submit MPESA Code Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Safaricom published production callback IP ranges
const SAFARICOM_IPS = new Set([
  '196.201.214.200', '196.201.214.206', '196.201.213.114',
  '196.201.214.207', '196.201.214.208', '196.201.213.44',
  '196.201.212.127', '196.201.212.128', '196.201.212.129',
  '196.201.212.136', '196.201.212.74', '196.201.212.69',
]);

// In sandbox/dev the IP check is skipped so local testing works without restriction.
// In production, only requests from Safaricom's IP range are accepted.
const requireSafaricomIP = (req: any, res: any, next: any) => {
  if (process.env.MPESA_ENVIRONMENT !== 'production') return next();
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()
    || req.socket.remoteAddress || '';
  if (SAFARICOM_IPS.has(clientIp)) return next();
  console.warn(`[MPESA] Rejected C2B callback from unauthorised IP: ${clientIp}`);
  return res.status(403).json({ ResultCode: 1, ResultDesc: 'Forbidden' });
};

app.post('/api/mpesa/c2b/validation', requireSafaricomIP, async (req, res) => {
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

app.post('/api/mpesa/c2b/confirmation', requireSafaricomIP, async (req, res) => {
  try {
    const { TransID, TransAmount, MSISDN, FirstName, MiddleName, LastName, BillRefNumber } = req.body;

    await db.insert(schema.payments).values({
      transactionCode: TransID,
      amount: parseFloat(TransAmount) || 0,
      phoneNumber: String(MSISDN),
      customerName: [FirstName, MiddleName, LastName].filter(Boolean).join(' '),
      accountReference: BillRefNumber,
      paymentType: 'C2B'
    });

    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (err) {
    console.error('C2B Confirmation error', err);
    res.status(500).send('Error');
  }
});

// --- Admin Routes ---

// Admin Login — rate-limited + constant-time response + HttpOnly cookie session
app.post('/api/admin/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.email, email),
    });

    // Always run bcrypt.compare regardless of whether the email exists.
    // This prevents timing-based enumeration of valid admin email addresses.
    const hashToCompare = admin?.passwordHash ?? (await DUMMY_HASH_PROMISE);
    const isValid = await bcrypt.compare(password, hashToCompare);

    if (admin && isValid) {
      const token = jwt.sign(
        { id: admin.id, email: admin.email },
        JWT_SECRET,
        { expiresIn: '8h' }
      );
      res.cookie('kianda_admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000, // 8 hours in ms
      });
      return res.json({ email: admin.email });
    }

    res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin Logout — clear the HttpOnly session cookie
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('kianda_admin_token');
  res.json({ success: true });
});

// GET Payments
app.get('/api/admin/payments', authenticateAdmin, async (req, res) => {
  try {
    const paymentsList = await db.query.payments.findMany({
      orderBy: (payments, { desc }) => [desc(payments.createdAt)],
      with: {
        application: {
          with: { candidate: true }
        }
      }
    });
    res.json(paymentsList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// MAP Payment
app.post('/api/admin/payments/map', authenticateAdmin, async (req, res) => {
  try {
    const { paymentId, applicationId } = req.body;

    await db.update(schema.payments)
      .set({ mappedApplicationId: applicationId })
      .where(eq(schema.payments.id, paymentId));

    const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.id, paymentId));
    if (payment) {
      await db.update(schema.applications)
        .set({ paymentVerified: true, mpesaCode: payment.transactionCode })
        .where(eq(schema.applications.id, applicationId));
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to map payment' });
  }
});

// --- Process Documents ---
app.get('/api/admin/process-documents', authenticateAdmin, async (req, res) => {
  try {
    const docs = await db.select().from(schema.processDocuments).orderBy(schema.processDocuments.gradeName);
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch process documents' });
  }
});

app.post('/api/admin/process-documents', authenticateAdmin, async (req, res) => {
  try {
    const { gradeName, title, fileUrl } = req.body;
    await db.insert(schema.processDocuments).values({
      gradeName: gradeName || null,
      title,
      fileUrl
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload process document' });
  }
});

app.delete('/api/admin/process-documents/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(schema.processDocuments).where(eq(schema.processDocuments.id, parseInt(id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Get Applications with Full Info
app.get('/api/admin/applications', authenticateAdmin, async (req, res) => {
  try {
    const allApps = await db.query.applications.findMany({
      with: {
        candidate: true,
        parentDetails: true,
        documents: true,
        additionalInfo: true,
        siblings: true,
        schoolsAttended: true,
        assessmentResults: {
          with: {
            assessment: true
          }
        }
      }
    });
    res.json(allApps);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Delete Application
app.delete('/api/admin/applications/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const appId = parseInt(id);

    await db.transaction(async (tx) => {
      // Detach payments
      await tx.update(schema.payments).set({ mappedApplicationId: null }).where(eq(schema.payments.mappedApplicationId, appId));
      // Delete child records
      await tx.delete(schema.assessmentResults).where(eq(schema.assessmentResults.applicationId, appId));
      await tx.delete(schema.interviewSlots).where(eq(schema.interviewSlots.applicationId, appId));
      await tx.delete(schema.additionalInfo).where(eq(schema.additionalInfo.applicationId, appId));
      await tx.delete(schema.siblings).where(eq(schema.siblings.applicationId, appId));
      await tx.delete(schema.schoolsAttended).where(eq(schema.schoolsAttended.applicationId, appId));
      await tx.delete(schema.documents).where(eq(schema.documents.applicationId, appId));
      await tx.delete(schema.parentDetails).where(eq(schema.parentDetails.applicationId, appId));
      await tx.delete(schema.candidates).where(eq(schema.candidates.applicationId, appId));
      // Delete main record
      await tx.delete(schema.applications).where(eq(schema.applications.id, appId));
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete application:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

app.post('/api/admin/applications/bulk-send-pdf', authenticateAdmin, async (req, res) => {
  try {
    const { applicationIds } = req.body;
    if (!applicationIds || !Array.isArray(applicationIds)) {
      return res.status(400).json({ error: 'applicationIds array is required' });
    }

    const apps = await db.query.applications.findMany({
      where: inArray(schema.applications.id, applicationIds),
      with: {
        candidate: true,
        parentDetails: true,
        documents: true,
        additionalInfo: true,
        siblings: true,
        schoolsAttended: true
      }
    });

    if (apps.length === 0) {
      return res.status(404).json({ error: 'No applications found' });
    }

    let sentCount = 0;
    for (const appRecord of apps) {
      if (!appRecord.candidate || !appRecord.parentDetails) continue;

      const parentEmails = [appRecord.parentDetails.fatherEmail, appRecord.parentDetails.motherEmail].filter(Boolean).join(', ');
      if (!parentEmails) continue;

      let pdfBuffer: Buffer | null = null;
      try {
        pdfBuffer = await generateApplicationPDFBuffer(appRecord);
      } catch (e) {
        console.error(`Failed to generate PDF for app ${appRecord.id}`, e);
        continue;
      }

      const emailContent = getApplicationPdfEmail(appRecord.candidate.fullName);

      const attachments: any[] = [
        { filename: 'kianda-school-logo-removebg-preview.png', path: path.resolve(__dirname, '../public/kianda-school-logo-removebg-preview.png'), cid: 'kiandalogo' }
      ];
      if (pdfBuffer) {
        attachments.push({
          filename: `Kianda_Application_${appRecord.id}.pdf`,
          content: pdfBuffer
        });
      }

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          await transporter.sendMail({
            from: `"Kianda Admissions" <${process.env.EMAIL_USER}>`,
            to: parentEmails,
            subject: emailContent.subject,
            html: emailContent.body,
            attachments
          });
          sentCount++;
        } catch (e) {
          console.error(`[EMAIL ERROR] Failed to send PDF for app ${appRecord.id}`, e);
        }
      } else {
        console.log(`[MOCK BULK PDF EMAIL] To: ${parentEmails}`);
        sentCount++;
      }
    }

    res.json({ success: true, sentCount });
  } catch (error) {
    console.error('Bulk PDF send error:', error);
    res.status(500).json({ error: 'Failed to send bulk PDFs' });
  }
});

// Update Application Details
app.put('/api/admin/applications/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { candidate, parentDetails, additionalInfo } = req.body;

    const appId = parseInt(id);
    if (isNaN(appId)) return res.status(400).json({ error: 'Invalid ID' });

    if (candidate) {
      await db.update(schema.candidates)
        .set({
          fullName: candidate.fullName,
          grade: candidate.grade,
          dob: candidate.dob,
          religion: candidate.religion,
          denomination: candidate.denomination,
          birthOrder: candidate.birthOrder,
          medicalInfo: candidate.medicalInfo,
        })
        .where(eq(schema.candidates.applicationId, appId));
    }

    if (parentDetails) {
      await db.update(schema.parentDetails)
        .set({
          fatherName: parentDetails.fatherName,
          fatherPhone: parentDetails.fatherPhone,
          fatherEmail: parentDetails.fatherEmail,
          fatherProfession: parentDetails.fatherProfession,
          motherName: parentDetails.motherName,
          motherPhone: parentDetails.motherPhone,
          motherEmail: parentDetails.motherEmail,
          motherProfession: parentDetails.motherProfession,
          residency: parentDetails.residency,
          fatherResidency: parentDetails.fatherResidency,
          motherResidency: parentDetails.motherResidency,
        })
        .where(eq(schema.parentDetails.applicationId, appId));
    }

    if (additionalInfo) {
      await db.update(schema.additionalInfo)
        .set({
          motivation: additionalInfo.motivation,
          source: additionalInfo.source,
          sourceOther: additionalInfo.sourceOther,
        })
        .where(eq(schema.additionalInfo.applicationId, appId));
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update Application Error:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Update Application Status (Accept / Reject)
app.post('/api/admin/applications/status', authenticateAdmin, async (req, res) => {
  try {
    let { applicationId, status, reason } = req.body;

    // Update Application record
    const updateData: any = { status };
    if (status === 'rejected') {
      updateData.rejectionRemarks = reason;
      updateData.rejectionDate = new Date();
    } else if (status === 'passed_assessment') {
      // Clear rejection info if re-accepted
      updateData.rejectionRemarks = null;
      updateData.rejectionDate = null;
    }

    await db.update(schema.applications)
      .set(updateData)
      .where(eq(schema.applications.id, applicationId));

    // Fetch deep candidate data to construct emails
    const appData = await db.query.applications.findFirst({
      where: eq(schema.applications.id, applicationId),
      with: { candidate: true, parentDetails: true, additionalInfo: true, schoolsAttended: true, siblings: true }
    });

    if (appData && appData.candidate && appData.parentDetails) {
      const parentEmails = [appData.parentDetails.fatherEmail, appData.parentDetails.motherEmail].filter(Boolean).join(', ');

      let emailContent;

      if (status === 'assessment_scheduled') {
        const gradeDetails = await db.query.gradeManagement.findFirst({
          where: eq(schema.gradeManagement.gradeName, appData.candidate.grade)
        });
        const assessmentDate = gradeDetails?.assessmentDate
          ? new Date(gradeDetails.assessmentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
          : 'To be communicated';
        emailContent = getAssessmentInvitationEmail(appData.candidate.fullName, assessmentDate);
      } else if (status === 'rejected') {
        emailContent = getRejectionEmail(appData.candidate.fullName, appData.academicYear || new Date().getFullYear());
      } else if (status === 'accepted') {
        const grade = await db.query.gradeManagement.findFirst({
          where: eq(schema.gradeManagement.gradeName, appData.candidate.grade)
        });

        if (grade && grade.vacantSpots > 0) {
          let deadlineStr = 'To be communicated';
          if (grade.paymentDeadlineDate) {
            deadlineStr = new Date(grade.paymentDeadlineDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
          }

          emailContent = getAdmissionOfferEmail(appData.candidate.fullName, appData.candidate.grade, appData.academicYear || new Date().getFullYear(), deadlineStr);
          // 1. Double check status matches
          await db.update(schema.applications)
            .set({ status: 'accepted' })
            .where(eq(schema.applications.id, applicationId));

          // 2. Decrement vacancies
          await db.update(schema.gradeManagement)
            .set({ vacantSpots: grade.vacantSpots - 1 })
            .where(eq(schema.gradeManagement.id, grade.id));

          // 3. Push to Business Central Proxy
          let syncStatus = 'synced';
          let admissionNo = null;
          try {
            admissionNo = await pushCandidateToProxy(appData, appData.erpAdmissionNo);
          } catch (error: any) {
            console.error('Failed to push candidate to proxy, but application is still accepted', error);
            admissionNo = error.admissionNo || appData.erpAdmissionNo;
            syncStatus = admissionNo ? 'failed_partially' : 'failed';
          }

          // @ts-ignore - Ignoring type error if schema isn't fully updated in TS types yet
          await db.update(schema.applications)
            .set({
              erpSyncStatus: syncStatus,
              erpAdmissionNo: admissionNo
            } as any)
            .where(eq(schema.applications.id, applicationId));
        } else {
          // No slots left, force waitlist
          status = 'waitlisted';
          emailContent = getWaitlistEmail(appData.candidate.fullName);
          await db.update(schema.applications)
            .set({ status: 'waitlisted' })
            .where(eq(schema.applications.id, applicationId));
        }
      }

      if (emailContent) {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          try {
            await transporter.sendMail({
              from: `"Kianda Admissions" <${process.env.EMAIL_USER}>`,
              to: parentEmails,
              subject: emailContent.subject,
              html: emailContent.body,
              attachments: [{ filename: 'kianda-school-logo-removebg-preview.png', path: path.resolve(__dirname, '../public/kianda-school-logo-removebg-preview.png'), cid: 'kiandalogo' }]
            });
          } catch (e) {
            console.error('[EMAIL ERROR]', e);
          }
        } else {
          console.log(`[MOCK STATUS EMAIL] To: ${parentEmails}\nSubject: ${emailContent.subject}\nBody:\n${emailContent.body}`);
        }
      }
    }

    let responseData: any = { success: true, status };
    if (status === 'accepted') {
      const updatedApp = await db.query.applications.findFirst({
        where: eq(schema.applications.id, applicationId)
      });
      responseData.erpSyncStatus = (updatedApp as any)?.erpSyncStatus;
      responseData.erpAdmissionNo = (updatedApp as any)?.erpAdmissionNo;
    }
    res.json(responseData);
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.post('/api/admin/applications/:id/resync', authenticateAdmin, async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);

    const appData = await db.query.applications.findFirst({
      where: eq(schema.applications.id, applicationId),
      with: { candidate: true, parentDetails: true, additionalInfo: true, schoolsAttended: true, siblings: true }
    });

    if (!appData) {
      return res.status(404).json({ error: 'Application not found' });
    }

    let syncStatus = 'synced';
    let admissionNo = null;
    try {
      admissionNo = await pushCandidateToProxy(appData, (appData as any).erpAdmissionNo);
    } catch (error: any) {
      console.error('Failed to resync candidate to proxy', error);
      admissionNo = error.admissionNo || (appData as any).erpAdmissionNo;
      syncStatus = admissionNo ? 'failed_partially' : 'failed';
    }

    await db.update(schema.applications)
      .set({
        erpSyncStatus: syncStatus,
        erpAdmissionNo: admissionNo
      } as any)
      .where(eq(schema.applications.id, applicationId));

    res.json({ success: true, erpSyncStatus: syncStatus, erpAdmissionNo: admissionNo });
  } catch (error) {
    console.error('Resync error:', error);
    res.status(500).json({ error: 'Failed to resync application' });
  }
});

// GET Dashboard Stats
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    // Filter apps and grades by year
    const allApps = await db.select().from(schema.applications).where(eq(schema.applications.academicYear, year));
    const gradeStats = await db.select().from(schema.gradeManagement).where(eq(schema.gradeManagement.academicYear, year));

    // Calculate Interviews Today (still based on current date, but could be scoped if needed)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const allInterviews = await db.query.interviewSlots.findMany({
      with: {
        application: true
      }
    });

    const interviewsToday = allInterviews.filter(i => {
      const d = new Date(i.slotTime);
      const sameDate = d >= today && d < tomorrow;
      const sameYear = i.application?.academicYear === year;
      return sameDate && sameYear;
    }).length;

    const totalApps = allApps.length;
    const acceptedCount = allApps.filter(a => a.status === 'accepted').length;

    const stats = {
      totalApplications: totalApps,
      totalVacantSpots: gradeStats.reduce((acc, curr) => acc + (curr.vacantSpots || 0), 0),
      interviewsToday: interviewsToday,
      acceptanceRate: totalApps > 0 ? Math.round((acceptedCount / totalApps) * 100) : 0,
    };

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// --- Admission Cycles ---

app.get('/api/admin/cycles', authenticateAdmin, async (req, res) => {
  try {
    const cycles = await db.select().from(schema.admissionCycles).orderBy(schema.admissionCycles.academicYear);
    res.json(cycles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cycles' });
  }
});

app.post('/api/admin/cycles', authenticateAdmin, async (req, res) => {
  try {
    const { id, academicYear, startDate, endDate, isActive } = req.body;
    if (id) {
      await db.update(schema.admissionCycles)
        .set({ startDate: new Date(startDate), endDate: new Date(endDate), isActive })
        .where(eq(schema.admissionCycles.id, id));
    } else {
      await db.insert(schema.admissionCycles).values({
        academicYear,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive
      });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Cycle update error:', error);
    res.status(500).json({ error: 'Failed to update cycle' });
  }
});

app.delete('/api/admin/cycles/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(schema.admissionCycles).where(eq(schema.admissionCycles.id, parseInt(id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete cycle' });
  }
});

// --- Grade Management ---

// GET Grade Management
app.get('/api/admin/grades', authenticateAdmin, async (req, res) => {
  try {
    const grades = await db.select().from(schema.gradeManagement).orderBy(schema.gradeManagement.gradeName);
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

// CREATE/UPDATE Grade
app.post('/api/admin/grades', authenticateAdmin, async (req, res) => {
  try {
    const { id, gradeName, vacantSpots, assessmentDate, paymentDeadlineDate, academicYear, location, isAcceptingApplications } = req.body;
    const year = academicYear || new Date().getFullYear();
    const finalDate = assessmentDate ? new Date(assessmentDate) : null;
    const finalDeadlineDate = paymentDeadlineDate ? new Date(paymentDeadlineDate) : null;

    const payload: any = {
      vacantSpots,
      assessmentDate: finalDate,
      paymentDeadlineDate: finalDeadlineDate,
      academicYear: year,
      location
    };
    if (isAcceptingApplications !== undefined) {
      payload.isAcceptingApplications = isAcceptingApplications;
    }

    if (id) {
      await db.update(schema.gradeManagement)
        .set(payload)
        .where(eq(schema.gradeManagement.id, id));
    } else {
      await db.insert(schema.gradeManagement).values({
        gradeName,
        ...payload
      });
    }

    // --- AUTOMATION TRIGGER: Batch Scheduling ---
    // Only trigger if notifyCandidates is explicitly true
    if (finalDate && req.body.notifyCandidates) {
      const dateStr = finalDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

      const studentsToNotify = await db.query.applications.findMany({
        where: (app, { eq, and, or, inArray }) => and(
          or(
            eq(app.status, 'pending'),
            eq(app.status, 'assessment_scheduled')
          ),
          eq(app.academicYear, year)
        ),
        with: {
          candidate: true,
          parentDetails: true
        }
      });

      const targetedApps = studentsToNotify.filter(app => app.candidate?.grade === gradeName);

      if (targetedApps.length > 0) {
        const appIds = targetedApps.map(a => a.id);

        // 1. Update technical status to scheduled (if they were pending)
        await db.update(schema.applications)
          .set({ status: 'assessment_scheduled' })
          .where(inArray(schema.applications.id, appIds));

        // 2. Dispatch invitation/update emails
        for (const appOfGrade of targetedApps) {
          const recipient = [appOfGrade.parentDetails.fatherEmail, appOfGrade.parentDetails.motherEmail].filter(Boolean).join(', ');
          if (recipient) {
            const email = getAssessmentScheduleEmail(appOfGrade.candidate.fullName, dateStr, location || 'Main Campus');
            transporter.sendMail({
              from: `"Kianda Admissions" <${process.env.EMAIL_USER}>`,
              to: recipient,
              subject: email.subject,
              html: email.body,
              attachments: [{ filename: 'kianda-school-logo-removebg-preview.png', path: path.resolve(__dirname, '../public/kianda-school-logo-removebg-preview.png'), cid: 'kiandalogo' }]
            }).catch(e => console.error('Failed to send batch invite:', e));
          }
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Grade update error:', error);
    res.status(500).json({ error: 'Failed to update grade' });
  }
});

// DELETE Grade
app.delete('/api/admin/grades/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(schema.gradeManagement).where(eq(schema.gradeManagement.id, parseInt(id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete grade. It may be in use.' });
  }
});

// --- Assessment & Results ---

// GET Assessments
app.get('/api/admin/assessments', authenticateAdmin, async (req, res) => {
  try {
    const data = await db.query.assessments.findMany({
      with: { grade: true }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// CREATE/UPDATE Assessment
app.post('/api/admin/assessments', authenticateAdmin, async (req, res) => {
  try {
    const { id, gradeId, title, maxMarks } = req.body;
    if (id) {
      await db.update(schema.assessments)
        .set({ title, maxMarks })
        .where(eq(schema.assessments.id, id));
    } else {
      await db.insert(schema.assessments).values({
        gradeId,
        title,
        maxMarks
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to manage assessment' });
  }
});

// DELETE Assessment
app.delete('/api/admin/assessments/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(schema.assessments).where(eq(schema.assessments.id, parseInt(id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
});

// GET Results
app.get('/api/admin/results', authenticateAdmin, async (req, res) => {
  try {
    const results = await db.query.assessmentResults.findMany({
      with: {
        application: { with: { candidate: true } },
        assessment: { with: { grade: true } }
      }
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// RECORD Result
app.post('/api/admin/results', authenticateAdmin, async (req, res) => {
  try {
    const { id, applicationId, assessmentId, marksObtained, passed } = req.body;
    if (id) {
      await db.update(schema.assessmentResults)
        .set({ marksObtained, passed })
        .where(eq(schema.assessmentResults.id, id));
    } else {
      await db.insert(schema.assessmentResults).values({
        applicationId,
        assessmentId,
        marksObtained,
        passed
      });
    }

    // Update Application Status if passed
    if (passed) {
      await db.update(schema.applications)
        .set({ status: 'passed_assessment' })
        .where(eq(schema.applications.id, applicationId));
    } else if (passed === false) {
      await db.update(schema.applications)
        .set({ status: 'rejected' })
        .where(eq(schema.applications.id, applicationId));
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record result' });
  }
});

// BULK Sync Results
app.post('/api/admin/results/bulk', authenticateAdmin, async (req, res) => {
  try {
    const { results } = req.body; // Array of { applicationId, assessmentId, marksObtained, passed }

    for (const item of results) {
      const [existing] = await db.select().from(schema.assessmentResults)
        .where(and(
          eq(schema.assessmentResults.applicationId, item.applicationId),
          eq(schema.assessmentResults.assessmentId, item.assessmentId)
        ));

      if (existing) {
        await db.update(schema.assessmentResults)
          .set({ marksObtained: item.marksObtained, passed: item.passed })
          .where(eq(schema.assessmentResults.id, existing.id));
      } else {
        await db.insert(schema.assessmentResults).values({
          applicationId: item.applicationId,
          assessmentId: item.assessmentId,
          marksObtained: item.marksObtained,
          passed: item.passed
        });
      }

      // Update Application status ONLY if it hasn't progressed yet
      const [currentApp] = await db.select().from(schema.applications).where(eq(schema.applications.id, item.applicationId));
      if (currentApp && ['pending', 'assessment_scheduled'].includes(currentApp.status || '')) {
        if (item.passed) {
          await db.update(schema.applications).set({ status: 'passed_assessment' }).where(eq(schema.applications.id, item.applicationId));
        } else {
          await db.update(schema.applications).set({ status: 'failed' }).where(eq(schema.applications.id, item.applicationId));
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Bulk sync failed' });
  }
});

// PRODUCTION Status Email Sender
app.post('/api/admin/send-status-email', authenticateAdmin, async (req, res) => {
  try {
    const { email, subject, content } = req.body;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail({
        from: `"Kianda Admissions" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: content,
        attachments: [{ filename: 'kianda-school-logo-removebg-preview.png', path: path.resolve(__dirname, '../public/kianda-school-logo-removebg-preview.png'), cid: 'kiandalogo' }]
      });
      console.log(`[EMAIL SENT] Status email sent to ${email}`);
    } else {
      console.log(`[MOCK EMAIL] To: ${email}\nSubject: ${subject}\nBody:\n${content}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[EMAIL ERROR]', error);
    res.status(500).json({ error: 'Failed to dispatch email' });
  }
});

// GET Interview Slots
app.get('/api/admin/interviews', authenticateAdmin, async (req, res) => {
  try {
    const slots = await db.query.interviewSlots.findMany({
      with: {
        application: {
          with: {
            candidate: true,
            parentDetails: true,
            schoolsAttended: true,
            siblings: true,
            documents: true,
            additionalInfo: true,
            assessmentResults: {
              with: {
                assessment: true
              }
            }
          }
        }
      }
    });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// CREATE Interview Slot (Bulk)
app.post('/api/admin/interviews', authenticateAdmin, async (req, res) => {
  try {
    const { applicationIds, slotTime, endTime, location } = req.body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ error: 'At least one application must be selected.' });
    }

    for (const applicationId of applicationIds) {
      // 1. Create slot
      await db.insert(schema.interviewSlots).values({
        applicationId,
        slotTime: new Date(slotTime),
        endTime: endTime ? new Date(endTime) : null,
        location
      });

      // 2. Update status
      await db.update(schema.applications)
        .set({ status: 'interview_scheduled' })
        .where(eq(schema.applications.id, applicationId));

      // 3. Send Email
      const appData = await db.query.applications.findFirst({
        where: eq(schema.applications.id, applicationId),
        with: { candidate: true, parentDetails: true }
      });

      if (appData && appData.candidate && appData.parentDetails) {
        const parentEmails = [appData.parentDetails.fatherEmail, appData.parentDetails.motherEmail].filter(Boolean).sort().filter((e, i, a) => !i || e !== a[i - 1]).join(', ');
        const dateStr = new Date(slotTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const startTimeStr = new Date(slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTimeStr = endTime ? new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        const timeStr = endTimeStr ? `${startTimeStr} - ${endTimeStr}` : startTimeStr;
        const emailContent = getInterviewInviteEmail(appData.candidate.fullName, appData.candidate.grade, appData.academicYear || new Date().getFullYear(), dateStr, timeStr, location);

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          await transporter.sendMail({
            from: `"Kianda Admissions" <${process.env.EMAIL_USER}>`,
            to: parentEmails,
            subject: emailContent.subject,
            html: emailContent.body,
            attachments: [{ filename: 'kianda-school-logo-removebg-preview.png', path: path.resolve(__dirname, '../public/kianda-school-logo-removebg-preview.png'), cid: 'kiandalogo' }]
          });
        }
      }
    }

    res.json({ success: true, count: applicationIds.length });
  } catch (error) {
    console.error('Interview schedule error:', error);
    res.status(500).json({ error: 'Failed to schedule interviews' });
  }
});

// RECORD Interview Outcome
app.post('/api/admin/interviews/outcome', authenticateAdmin, async (req, res) => {
  try {
    const { applicationId, outcome, reason } = req.body; // outcome: 'accepted' | 'rejected'

    // 1. Update Application Status & Persistence
    const updateData: any = { status: outcome };
    if (outcome === 'rejected') {
      updateData.rejectionRemarks = reason;
      updateData.rejectionDate = new Date();
    } else if (outcome === 'accepted') {
      updateData.rejectionRemarks = null;
      updateData.rejectionDate = null;
    }

    await db.update(schema.applications)
      .set(updateData)
      .where(eq(schema.applications.id, applicationId));

    const appData = await db.query.applications.findFirst({
      where: eq(schema.applications.id, applicationId),
      with: { candidate: true, parentDetails: true, additionalInfo: true, schoolsAttended: true, siblings: true }
    });

    if (appData && appData.candidate && appData.parentDetails) {
      const parentEmails = [appData.parentDetails.fatherEmail, appData.parentDetails.motherEmail].filter(Boolean).join(', ');
      let emailContent;

      if (outcome === 'accepted') {
        const grade = await db.query.gradeManagement.findFirst({
          where: eq(schema.gradeManagement.gradeName, appData.candidate.grade)
        });

        if (grade && grade.vacantSpots > 0) {
          let deadlineStr = 'To be communicated';
          if (grade.paymentDeadlineDate) {
            deadlineStr = new Date(grade.paymentDeadlineDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
          }

          emailContent = getAdmissionOfferEmail(appData.candidate.fullName, appData.candidate.grade, appData.academicYear || new Date().getFullYear(), deadlineStr);
          // 2. Decrement vacancies
          await db.update(schema.gradeManagement)
            .set({ vacantSpots: grade.vacantSpots - 1 })
            .where(eq(schema.gradeManagement.id, grade.id));

          // 3. Push to Business Central Proxy
          let syncStatus = 'synced';
          let admissionNo = null;
          try {
            admissionNo = await pushCandidateToProxy(appData, (appData as any).erpAdmissionNo);
          } catch (error: any) {
            console.error('Failed to push candidate to proxy, but application is still accepted', error);
            admissionNo = error.admissionNo || (appData as any).erpAdmissionNo;
            syncStatus = admissionNo ? 'failed_partially' : 'failed';
          }

          // @ts-ignore
          await db.update(schema.applications)
            .set({
              erpSyncStatus: syncStatus,
              erpAdmissionNo: admissionNo
            } as any)
            .where(eq(schema.applications.id, applicationId));

        } else {
          // No slots left, set to waitlisted instead
          emailContent = getWaitlistEmail(appData.candidate.fullName);
          await db.update(schema.applications)
            .set({ status: 'waitlisted' })
            .where(eq(schema.applications.id, applicationId));
        }
      } else {
        emailContent = getRejectionEmail(appData.candidate.fullName, appData.academicYear || new Date().getFullYear());
      }

      if (emailContent) {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          try {
            await transporter.sendMail({
              from: `"Kianda Admissions" <${process.env.EMAIL_USER}>`,
              to: parentEmails,
              subject: emailContent.subject,
              html: emailContent.body,
              attachments: [{ filename: 'kianda-school-logo-removebg-preview.png', path: path.resolve(__dirname, '../public/kianda-school-logo-removebg-preview.png'), cid: 'kiandalogo' }]
            });
          } catch (e) {
            console.error('[EMAIL ERROR]', e);
          }
        } else {
          console.log(`[MOCK OUTCOME EMAIL] To: ${parentEmails}\nSubject: ${emailContent.subject}\nBody:\n${emailContent.body}`);
        }
      }
    }

    let responseData: any = { success: true };
    if (outcome === 'accepted') {
      const updatedApp = await db.query.applications.findFirst({
        where: eq(schema.applications.id, applicationId)
      });
      responseData.erpSyncStatus = (updatedApp as any)?.erpSyncStatus;
      responseData.erpAdmissionNo = (updatedApp as any)?.erpAdmissionNo;
    }

    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record outcome' });
  }
});

// Serve compiled React frontend
app.use(express.static(path.join(__dirname, '../dist')));


// ── /api/auth/me — lightweight session check (replaces client-side JWT decode) ──
// The frontend calls this on mount to determine the active session role.
// Returns 401 (unauthenticated) or { role, email } without exposing the token.
app.get('/api/auth/me', (req: any, res) => {
  const adminToken = req.cookies?.kianda_admin_token;
  const applicantToken = req.cookies?.kianda_applicant_token;
  try {
    if (adminToken) {
      const decoded = jwt.verify(adminToken, JWT_SECRET) as any;
      return res.json({ role: 'admin', email: decoded.email });
    }
    if (applicantToken) {
      const decoded = jwt.verify(applicantToken, JWT_SECRET) as any;
      return res.json({ role: 'applicant', email: decoded.email });
    }
  } catch { /* token expired or invalid */ }
  return res.status(401).json({ role: null });
});

// --- Applicant (Parent) Routes ---

// Auth middleware for applicants — reads from HttpOnly cookie (not Authorization header)
const authenticateApplicant = (req: any, res: any, next: any) => {
  const token = req.cookies?.kianda_applicant_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.applicant = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

// Applicant Logout — clear the HttpOnly session cookie
app.post('/api/applicants/logout', (req, res) => {
  res.clearCookie('kianda_applicant_token');
  res.json({ success: true });
});

// Register: Create an account and link it to an existing application
app.post('/api/applicants/register', async (req, res) => {
  try {
    const { email, password, applicationId } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({ error: 'Password does not meet all security requirements.' });
    }

    // Check if user already exists
    const existing = await db.query.applicantUsers.findFirst({
      where: eq(schema.applicantUsers.email, email.toLowerCase().trim())
    });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(schema.applicantUsers).values({
      email: email.toLowerCase().trim(),
      passwordHash,
    }).returning();

    // Link the application to this user if applicationId is provided
    console.log(`[REGISTER] applicationId received: ${applicationId} (type: ${typeof applicationId})`);
    if (applicationId && Number(applicationId) > 0) {
      const appExists = await db.query.applications.findFirst({
        where: eq(schema.applications.id, Number(applicationId))
      });
      if (!appExists) {
        console.warn(`[REGISTER] applicationId ${applicationId} not found in DB — linkage skipped`);
      } else {
        await db.update(schema.applications)
          .set({ applicantUserId: newUser.id })
          .where(eq(schema.applications.id, Number(applicationId)));
        console.log(`[REGISTER] Linked application ${applicationId} → user ${newUser.id} (${newUser.email})`);
      }
    } else {
      console.warn(`[REGISTER] No valid applicationId provided — account created without application link`);
    }

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: 'applicant' }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('kianda_applicant_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in ms
    });
    res.status(201).json({ email: newUser.email });
  } catch (error) {
    console.error('Applicant Register Error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login — rate-limited + constant-time response + HttpOnly cookie session
app.post('/api/applicants/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.query.applicantUsers.findFirst({
      where: eq(schema.applicantUsers.email, email.toLowerCase().trim())
    });

    // Always run bcrypt.compare to prevent timing-based email enumeration
    const hashToCompare = user?.passwordHash ?? (await DUMMY_HASH_PROMISE);
    const isValid = await bcrypt.compare(password, hashToCompare);

    if (user && isValid) {
      const token = jwt.sign({ id: user.id, email: user.email, role: 'applicant' }, JWT_SECRET, { expiresIn: '24h' });
      res.cookie('kianda_applicant_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours in ms
      });
      return res.json({ email: user.email });
    }

    res.status(401).json({ error: 'Invalid email or password' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get my applications
app.get('/api/applicants/my-applications', authenticateApplicant, async (req, res) => {
  try {
    const applicantId = (req as any).applicant.id;
    const apps = await db.query.applications.findMany({
      where: eq(schema.applications.applicantUserId, applicantId),
      with: {
        candidate: true,
        parentDetails: true,
        additionalInfo: true,
        documents: true,
        siblings: true,
        schoolsAttended: true,
      },
      orderBy: (apps, { desc }) => [desc(apps.createdAt)],
    });
    res.json(apps);
  } catch (error) {
    console.error('Fetch My Applications Error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Edit application (only allowed when status = 'pending')
app.put('/api/applicants/applications/:id', authenticateApplicant, async (req, res) => {
  try {
    const applicantId = (req as any).applicant.id;
    const appId = parseInt(req.params.id);
    if (isNaN(appId)) return res.status(400).json({ error: 'Invalid application ID' });

    // Verify this application belongs to this applicant
    const existingApp = await db.query.applications.findFirst({
      where: and(eq(schema.applications.id, appId), eq(schema.applications.applicantUserId, applicantId)),
    });

    if (!existingApp) return res.status(404).json({ error: 'Application not found' });
    if (existingApp.status !== 'pending') {
      return res.status(403).json({ error: 'This application can no longer be edited. Only pending applications can be modified.' });
    }

    const { candidate, parent, additional, documents } = req.body;

    await db.transaction(async (tx) => {
      if (candidate) {
        const { schools, passportPhoto, passportPhotoPreview, ...candidateData } = candidate;
        await tx.update(schema.candidates).set({
          ...candidateData,
          passportPhotoUrl: passportPhoto || candidateData.passportPhotoUrl,
        }).where(eq(schema.candidates.applicationId, appId));

        if (schools && Array.isArray(schools)) {
          await tx.delete(schema.schoolsAttended).where(eq(schema.schoolsAttended.applicationId, appId));
          const schoolsToInsert = schools
            .filter((s: any) => s.name)
            .map((s: any) => ({ applicationId: appId, schoolType: s.type || 'Unknown', schoolName: s.name, yearsRange: s.years }));
          if (schoolsToInsert.length > 0) {
            await tx.insert(schema.schoolsAttended).values(schoolsToInsert);
          }
        }
      }

      if (parent) {
        await tx.update(schema.parentDetails).set(parent).where(eq(schema.parentDetails.applicationId, appId));
      }

      if (additional) {
        const { siblings, ...additionalData } = additional;
        await tx.update(schema.additionalInfo).set(additionalData).where(eq(schema.additionalInfo.applicationId, appId));
        if (siblings && Array.isArray(siblings)) {
          await tx.delete(schema.siblings).where(eq(schema.siblings.applicationId, appId));
          if (siblings.length > 0) {
            await tx.insert(schema.siblings).values(siblings.map((s: any) => ({ applicationId: appId, ...s })));
          }
        }
      }

      if (documents) {
        await tx.delete(schema.documents).where(eq(schema.documents.applicationId, appId));
        const docsToInsert = [];
        if (documents.letter) docsToInsert.push({ applicationId: appId, documentType: 'Application Letter', fileUrl: documents.letter });
        if (documents.birthCert) docsToInsert.push({ applicationId: appId, documentType: "Candidate's Birth Certificate", fileUrl: documents.birthCert });
        if (documents.report) docsToInsert.push({ applicationId: appId, documentType: 'Latest School Report', fileUrl: documents.report });
        if (docsToInsert.length > 0) await tx.insert(schema.documents).values(docsToInsert);
      }

      await tx.update(schema.applications)
        .set({ updatedAt: new Date() })
        .where(eq(schema.applications.id, appId));
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Edit Application Error:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// --- Automated Google Drive Backup (Daily Cron at 2:00 AM) ---
import cron from 'node-cron';
import { runBackup } from './scripts/backupToDrive.js';

// Run every day at 2:00 AM server time
cron.schedule('0 2 * * *', async () => {
  console.log('[CRON] Starting scheduled Google Drive backup...');
  await runBackup();
});

console.log('[CRON] Daily backup scheduled for 2:00 AM.');

// React Router catch-all — must be AFTER all API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
