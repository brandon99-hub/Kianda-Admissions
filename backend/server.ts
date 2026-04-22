import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db';
import * as schema from './db/schema';
import { eq, and } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

import { 
  getSuccessEmail, 
  getApplicationRejectionEmail, 
  getAssessmentInvitationEmail, 
  getInterviewInviteEmail, 
  getAdmissionOfferEmail,
  getWaitlistEmail
} from '../src/utils/emailTemplates';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
const upload = multer({ storage });

// Document Upload Route
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const candidateName = req.query.candidateName ? String(req.query.candidateName).replace(/[^a-z0-9 ]/gi, '_') : 'Unknown';
  // Return the URL path
  const fileUrl = `/uploads/${candidateName}/${req.file.filename}`;
  res.json({ fileUrl });
});

// Nodemailer Config
const transporter = nodemailer.createTransport({
  service: 'gmail',
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

// Get Grades with Vacancies
app.get('/api/grades/available', async (req, res) => {
  try {
    const availableGrades = await db.query.gradeManagement.findMany({
      where: (grade, { gt }) => gt(grade.vacantSpots, 0),
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

    // Look up grade to get the academic year
    const gradeDetails = await db.query.gradeManagement.findFirst({
      where: eq(schema.gradeManagement.gradeName, candidate.grade)
    });

    const [newApp] = await db.insert(schema.applications).values({
      mpesaCode: payment.mpesaCode,
      status: 'pending',
      academicYear: gradeDetails?.academicYear || new Date().getFullYear()
    }).returning();

    // 1. Insert Candidate
    const { schools, ...candidateData } = candidate;
    await db.insert(schema.candidates).values({
      applicationId: newApp.id,
      ...candidateData
    });

    // 2. Insert Schools
    if (schools) {
      const schoolsToInsert = [];
      if (schools.kindergarten?.name) schoolsToInsert.push({ applicationId: newApp.id, schoolType: 'Kindergarten', schoolName: schools.kindergarten.name, yearsRange: schools.kindergarten.years });
      if (schools.primary?.name) schoolsToInsert.push({ applicationId: newApp.id, schoolType: 'Primary', schoolName: schools.primary.name, yearsRange: schools.primary.years });
      if (schools.junior?.name) schoolsToInsert.push({ applicationId: newApp.id, schoolType: 'Junior', schoolName: schools.junior.name, yearsRange: schools.junior.years });
      
      if (schoolsToInsert.length > 0) {
        await db.insert(schema.schoolsAttended).values(schoolsToInsert);
      }
    }

    // 3. Insert Parent Details
    await db.insert(schema.parentDetails).values({
      applicationId: newApp.id,
      ...parent
    });

    // 4. Insert Additional Info & Siblings
    const { siblings, ...additionalData } = additional;
    if (siblings && siblings.length > 0) {
      await db.insert(schema.siblings).values(
        siblings.map((s: any) => ({ applicationId: newApp.id, ...s }))
      );
    }
    await db.insert(schema.additionalInfo).values({
      applicationId: newApp.id,
      ...additionalData
    });

    // 5. Insert Documents
    if (documents) {
      const docsToInsert = [];
      if (documents.letter) docsToInsert.push({ applicationId: newApp.id, documentType: 'Application Letter', fileUrl: documents.letter });
      if (documents.birthCert) docsToInsert.push({ applicationId: newApp.id, documentType: "Candidate's Birth Certificate", fileUrl: documents.birthCert });
      if (documents.report) docsToInsert.push({ applicationId: newApp.id, documentType: 'Latest School Report', fileUrl: documents.report });
      
      if (docsToInsert.length > 0) {
        await db.insert(schema.documents).values(docsToInsert);
      }
    }

    // Prepare Email
    const emailContent = getSuccessEmail(candidate.fullName, gradeDetails?.assessmentDate?.toISOString());
    const parentEmails = [parent.fatherEmail, parent.motherEmail].filter(Boolean).join(', ');

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await transporter.sendMail({
          from: `"Kianda Admissions" <${process.env.EMAIL_USER}>`,
          to: parentEmails,
          subject: emailContent.subject,
          text: emailContent.body
        });
        console.log(`[EMAIL SENT] Success email sent to ${parentEmails}`);
      } catch (e) {
        console.error('[EMAIL ERROR] Failed to send email via nodemailer:', e);
      }
    } else {
      console.log(`[MOCK EMAIL] To: ${parentEmails}\nSubject: ${emailContent.subject}\nBody:\n${emailContent.body}`);
    }

    res.status(201).json({ success: true, applicationId: newApp.id });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Admin Routes ---

// Real Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const admin = await db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.email, email),
    });

    if (admin && await bcrypt.compare(password, admin.passwordHash)) {
      res.json({ token: 'mock-jwt-token', email: admin.email });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Applications with Full Info
app.get('/api/admin/applications', async (req, res) => {
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

// Update Application Status (Accept / Reject)
app.post('/api/admin/applications/status', async (req, res) => {
  try {
    let { applicationId, status, reason } = req.body;
    
    // Update Application record
    const updateData: any = { status };
    if (status === 'rejected') {
      updateData.rejectionRemarks = reason;
      updateData.rejectionDate = new Date();
    } else if (status === 'accepted' || status === 'passed_assessment') {
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
      with: { candidate: true, parentDetails: true }
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
        emailContent = getApplicationRejectionEmail(appData.candidate.fullName, reason || 'Did not meet requirements');
      } else if (status === 'accepted') {
        const grade = await db.query.gradeManagement.findFirst({
          where: eq(schema.gradeManagement.gradeName, appData.candidate.grade)
        });

        if (grade && grade.vacantSpots > 0) {
          emailContent = getAdmissionOfferEmail(appData.candidate.fullName);
          // 1. Double check status matches
          await db.update(schema.applications)
            .set({ status: 'accepted' })
            .where(eq(schema.applications.id, applicationId));

          // 2. Decrement vacancies
          await db.update(schema.gradeManagement)
            .set({ vacantSpots: grade.vacantSpots - 1 })
            .where(eq(schema.gradeManagement.id, grade.id));
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
              text: emailContent.body
            });
          } catch (e) {
            console.error('[EMAIL ERROR]', e);
          }
        } else {
          console.log(`[MOCK STATUS EMAIL] To: ${parentEmails}\nSubject: ${emailContent.subject}\nBody:\n${emailContent.body}`);
        }
      }
    }

    res.json({ success: true, status });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// GET Dashboard Stats
app.get('/api/admin/stats', async (req, res) => {
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

// GET Grade Management
app.get('/api/admin/grades', async (req, res) => {
  try {
    const grades = await db.select().from(schema.gradeManagement).orderBy(schema.gradeManagement.gradeName);
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

// CREATE/UPDATE Grade
app.post('/api/admin/grades', async (req, res) => {
  try {
    const { id, gradeName, vacantSpots, assessmentDate, academicYear } = req.body;
    const year = academicYear || new Date().getFullYear();
    
    if (id) {
       await db.update(schema.gradeManagement)
        .set({ 
          vacantSpots, 
          assessmentDate: assessmentDate ? new Date(assessmentDate) : null,
          academicYear: year
        })
        .where(eq(schema.gradeManagement.id, id));
    } else {
       await db.insert(schema.gradeManagement).values({
         gradeName,
         vacantSpots,
         assessmentDate: assessmentDate ? new Date(assessmentDate) : null,
         academicYear: year
       });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update grade' });
  }
});

// DELETE Grade
app.delete('/api/admin/grades/:id', async (req, res) => {
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
app.get('/api/admin/assessments', async (req, res) => {
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
app.post('/api/admin/assessments', async (req, res) => {
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
app.delete('/api/admin/assessments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(schema.assessments).where(eq(schema.assessments.id, parseInt(id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
});

// GET Results
app.get('/api/admin/results', async (req, res) => {
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
app.post('/api/admin/results', async (req, res) => {
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
app.post('/api/admin/results/bulk', async (req, res) => {
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

      // Update Application status
      if (item.passed) {
        await db.update(schema.applications).set({ status: 'passed_assessment' }).where(eq(schema.applications.id, item.applicationId));
      } else {
        await db.update(schema.applications).set({ status: 'failed' }).where(eq(schema.applications.id, item.applicationId));
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Bulk sync failed' });
  }
});

// PRODUCTION Status Email Sender
app.post('/api/admin/send-status-email', async (req, res) => {
  try {
    const { email, subject, content } = req.body;
    
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail({
        from: `"Kianda Admissions" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        text: content
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
app.get('/api/admin/interviews', async (req, res) => {
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
app.post('/api/admin/interviews', async (req, res) => {
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
        const parentEmails = [appData.parentDetails.fatherEmail, appData.parentDetails.motherEmail].filter(Boolean).sort().filter((e, i, a) => !i || e !== a[i-1]).join(', ');
        const dateStr = new Date(slotTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const startTimeStr = new Date(slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTimeStr = endTime ? new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        
        const timeStr = endTimeStr ? `${startTimeStr} - ${endTimeStr}` : startTimeStr;
        const emailContent = getInterviewInviteEmail(appData.candidate.fullName, dateStr, timeStr, location);
        
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          await transporter.sendMail({
            from: `"Kianda Admissions" <${process.env.EMAIL_USER}>`,
            to: parentEmails,
            subject: emailContent.subject,
            html: emailContent.body
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
app.post('/api/admin/interviews/outcome', async (req, res) => {
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
      with: { candidate: true, parentDetails: true }
    });

    if (appData && appData.candidate && appData.parentDetails) {
      const parentEmails = [appData.parentDetails.fatherEmail, appData.parentDetails.motherEmail].filter(Boolean).join(', ');
      let emailContent;

      if (outcome === 'accepted') {
        const grade = await db.query.gradeManagement.findFirst({
          where: eq(schema.gradeManagement.gradeName, appData.candidate.grade)
        });

        if (grade && grade.vacantSpots > 0) {
          emailContent = getAdmissionOfferEmail(appData.candidate.fullName);
          // 2. Decrement vacancies
          await db.update(schema.gradeManagement)
            .set({ vacantSpots: grade.vacantSpots - 1 })
            .where(eq(schema.gradeManagement.id, grade.id));
        } else {
          // No slots left, set to waitlisted instead
          emailContent = getWaitlistEmail(appData.candidate.fullName);
          await db.update(schema.applications)
            .set({ status: 'waitlisted' })
            .where(eq(schema.applications.id, applicationId));
        }
      } else {
        emailContent = getApplicationRejectionEmail(appData.candidate.fullName, reason || 'Did not meet requirements');
      }

      if (emailContent) {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          try {
            await transporter.sendMail({
              from: `"Kianda Admissions" <${process.env.EMAIL_USER}>`,
              to: parentEmails,
              subject: emailContent.subject,
              text: emailContent.body
            });
          } catch (e) {
            console.error('[EMAIL ERROR]', e);
          }
        } else {
          console.log(`[MOCK OUTCOME EMAIL] To: ${parentEmails}\nSubject: ${emailContent.subject}\nBody:\n${emailContent.body}`);
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record outcome' });
  }
});

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});

