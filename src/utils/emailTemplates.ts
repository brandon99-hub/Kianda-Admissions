/**
 * Drafts for automated emails sent during the admissions process.
 */

const getBaseLayout = (subject: string, content: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f9; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background-color: #18216d; padding: 30px; text-align: center; border-bottom: 4px solid #ffc425; }
        .content { padding: 40px; }
        .footer { background-color: #f8f9fa; padding: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
        .info-card { background: #f0f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc425; }
        .info-card strong { color: #18216d; }
        .button { display: inline-block; padding: 12px 24px; background-color: #ffc425; color: #18216d; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        .signature { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
        .signature p { margin: 2px 0; font-size: 14px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">KIANDA SCHOOL</h2>
            <p style="color: #ffc425; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Admissions Portal</p>
        </div>
        <div class="content">
            <h3 style="color: #18216d; margin-top: 0; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">${subject}</h3>
            ${content}
            <div class="signature">
                <p>Yours sincerely,</p>
                <p><strong>Yvette Odero (Miss)</strong></p>
                <p>Admissions Secretary</p>
                <p style="color: #666; font-size: 12px; margin-top: 10px;">Kianda School | Admissions Office</p>
            </div>
        </div>
        <div class="footer">
            <p><strong>Kianda School</strong><br>Email: info@kiandaschool.ac.ke | Enquiries: 020 8077381, 0733-846959<br>www.kiandaschool.ac.ke</p>
            <div style="margin-top: 15px; opacity: 0.6;">
                &copy; ${new Date().getFullYear()} Kianda School. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>
`;

export const getRejectionEmail = (candidateName: string, academicYear: number) => {
  const subject = `Admission Decision - ${candidateName} (${academicYear})`;
  const content = `
    <p>Dear Parents,</p>
    <p>I hope this message finds you well.</p>
    <p>Thank you for applying for a place for your daughter and for bringing her for the Assessment for the ${academicYear} academic year. We truly appreciate the time and effort you invested in the process.</p>
    <p>Thank you for your interest in Kianda School. We appreciate the time and effort you invested in the application and assessment process for the ${academicYear} academic year.</p>
    <p>After careful consideration, we regret to inform you that we are unable to offer your daughter a place at Kianda School at this time.</p>
    <p>We are grateful for the interest you have shown in our school and wish your daughter every success in her future endeavours.</p>
  `;
  return { subject, body: getBaseLayout(subject, content) };
};

export const getAssessmentPassEmail = (candidateName: string) => {
  const subject = `Assessment Stage Cleared - ${candidateName}`;
  const content = `
    <p>Dear Parents,</p>
    <p>We are pleased to inform you that <strong>${candidateName}</strong> has successfully cleared the entrance assessment stage. Congratulations to her on this achievement!</p>
    <p>Our admissions office will reach out to you shortly regarding the scheduling of the interview, which is the final stage of our admissions process.</p>
    <p>Thank you for your continued interest in Kianda School.</p>
  `;
  return { subject, body: getBaseLayout(subject, content) };
};



export const getSuccessEmail = (candidateName: string, grade: string, academicYear: number, assessmentDate?: string, location?: string) => {
  const dateObj = assessmentDate ? new Date(assessmentDate) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }) : 'To be communicated';

  const subject = `KIANDA ENTRANCE ASSESSMENT – ${grade.toUpperCase()} (${academicYear})`;
  const content = `
    <p>Dear Parents,</p>
    <p>Thank you for applying for a ${grade} (${academicYear}) slot in Kianda School for your daughter, <strong>${candidateName}</strong>.</p>
    <p>The assessment will be on <strong>${formattedDate}</strong>${location ? ` in the <strong>${location}</strong>` : ''}. It will begin at 8:00 a.m. and end at 11:00 a.m. Parents will be required to leave the children and come back for them at 11:00 a.m.</p>
    <p>You will need to register your daughter at <strong>7:45 a.m.</strong> on the day of the assessment${location ? `, outside the ${location},` : ''} and pick her from the same place after the assessment.</p>
    <div class="info-card">
        <strong>Your daughter should come with:</strong>
        <ul>
            <li>2 pencils</li>
            <li>An eraser</li>
            <li>Coloured pencils (pack of 12, not crayons)</li>
            <li>A sharpener</li>
            <li>A healthy snack</li>
        </ul>
    </div>
    <p>Your daughter will be given a reference number on the day of the assessment.</p>
    <p>Those who are shortlisted will be invited for an oral interview together with their parents. We will communicate to the shortlisted parents via email.</p>
  `;
  return { subject, body: getBaseLayout(subject, content) };
};

export const getAssessmentInvitationEmail = (candidateName: string, assessmentDate: string) => {
  const subject = `Entrance Assessment Invitation - ${candidateName}`;
  const content = `
    <p>Dear Parents,</p>
    <p>Following the successful administrative review of your application, we are pleased to officially invite ${candidateName} for the Kianda School Entrance Assessment.</p>
    <div class="info-card">
        <strong>Scheduled Assessment Date:</strong><br>
        ${assessmentDate}
    </div>
    <p>Kindly ensure the candidate arrives punctually and is well-prepared for the evaluation. We look forward to welcoming ${candidateName} to our campus.</p>
  `;
  return { subject, body: getBaseLayout(subject, content) };
};

export const getInterviewInviteEmail = (candidateName: string, grade: string, academicYear: number, date: string, time: string, location: string) => {
  const subject = `Oral Interview Invitation - ${candidateName}`;
  const content = `
    <p>Dear Parent,</p>
    <p>I hope this message finds you well.</p>
    <p>We are pleased to inform you that your daughter, <strong>${candidateName}</strong>, has been shortlisted for an Oral Interview for <strong>${grade}</strong> entry in <strong>${academicYear}</strong>. Kindly note that <strong>both parents are required to accompany her</strong> for the interview.</p>
    <div class="info-card">
        <strong>Interview Details:</strong><br>
        Date: ${date}<br>
        Time Slot: ${time}<br>
        Location: ${location}
    </div>
    <p>Please confirm your appointment by calling our receptionist on <strong>0716 875838</strong> or <strong>0721 547572</strong>.</p>
    <p>We look forward to welcoming you.</p>
  `;
  return { subject, body: getBaseLayout(subject, content) };
};

export const getAdmissionOfferEmail = (candidateName: string, grade: string, academicYear: number, deadlineDate: string) => {
  const subject = `Admission Offer - ${candidateName} - ${academicYear}`;
  const content = `
    <p>Dear Parents,</p>
    <p>We are pleased to inform you that your daughter, <strong>${candidateName}</strong>, has been offered admission into <strong>${grade}</strong> for the year <strong>${academicYear}</strong>.</p>
    <p>To secure this place, kindly pay a <strong>non-refundable acceptance fee of Kshs 25,000</strong> on or before <strong>${deadlineDate}</strong>. <strong>PLEASE NOTE:</strong> To finalize the registration, you must email a copy of the payment receipt or M-Pesa confirmation message to the Accounts Department at <a href="mailto:accounts@kiandaschool.ac.ke">accounts@kiandaschool.ac.ke</a>, and copy <a href="mailto:info@kiandaschool.ac.ke">info@kiandaschool.ac.ke</a>.</p>
    <div class="info-card">
        <strong>Payment Instructions:</strong><br>
        <strong>Paybill Number:</strong> 34104<br>
        <strong>Account Name:</strong> ${candidateName} – ${grade}<br>
        <span style="font-size: 12px; color: #666;">(e.g., Account: Ann Susan Brown – Grade 3)</span>
    </div>
    <p>Upon receipt of your confirmation and payment, your daughter will be issued with an admission number. The school fee structure and further admission details will then be shared with you.</p>
    <p>Thank you for choosing Kianda School. We look forward to welcoming your daughter to our community.</p>
  `;
  return { subject, body: getBaseLayout(subject, content) };
};

export const getWaitlistEmail = (candidateName: string) => {
  const subject = `Waitlist Notification - ${candidateName}`;
  const content = `
    <p>Dear Parent,</p>
    <p>I hope this message finds you well.</p>
    <p>Thank you for bringing your daughter for the Oral interview. We truly appreciate the time, effort, and interest you have shown in our school.</p>
    <p>Regrettably, we are unable to offer your daughter a place at this time due to limited vacancies. However, we have placed her on our waiting list and will be happy to reconsider her application should a vacancy arise.</p>
    <p>We remain grateful for your engagement with our school and wish your daughter every success in her future endeavours.</p>
  `;
  return { subject, body: getBaseLayout(subject, content) };
};

