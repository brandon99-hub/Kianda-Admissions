/**
 * Drafts for automated emails sent during the admissions process.
 */

export const getRejectionEmail = (candidateName: string, reason: string) => ({
  subject: `Update on your application to Kianda School - ${candidateName}`,
  body: `
Dear Parents,

Thank you for your interest in Kianda School. 

After careful review of the recent assessments, we regret to inform you that we are unable to progress ${candidateName}'s application. 

Decision Notes:
${reason}

We wish her the best in her future academic endeavors.

Kind regards,
The Admissions Team
Kianda School
  `.trim()
});

export const getAssessmentPassEmail = (candidateName: string) => ({
  subject: `Congratulations! Assessment Stage Cleared - ${candidateName}`,
  body: `
Dear Parents,

We are pleased to inform you that ${candidateName} has successfully cleared the entrance assessment stage.

Congratulations to her on this achievement! 

Our admissions office will reach out to you shortly regarding the scheduling of the interview, which is the final stage of our admissions process.

Thank you for your continued interest in Kianda School.

Kind regards,
The Admissions Team
Kianda School
  `.trim()
});

export const getApplicationRejectionEmail = (candidateName: string, reason: string) => ({
  subject: `Application Update - Kianda School - ${candidateName}`,
  body: `
Dear Parents,

Thank you for applying to Kianda School and paying the application fee.

After an initial administrative review of your application, we regret to inform you that we cannot proceed with ${candidateName}'s application at this time.

Decision Notes:
${reason}

We deeply appreciate your interest in our institution and wish you the best.

Kind regards,
The Admissions Team
Kianda School
  `.trim()
});

export const getSuccessEmail = (candidateName: string, assessmentDate?: string) => {
  const dateObj = assessmentDate ? new Date(assessmentDate) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }) : null;

  return {
    subject: `Application Received - Kianda School - ${candidateName}`,
    body: `
Dear Parents,

We have successfully received your application and application fee for ${candidateName}.

Your application is currently under administrative review. ${formattedDate ? `The assessment for this grade is scheduled for ${formattedDate}. Kindly ensure to avail yourself and candidate during this day for the set tests.` : 'You will be notified via email shortly regarding the outcome of the review and any subsequent assessment schedules.'}

Thank you for choosing Kianda School.

Kind regards,
The Admissions Team
Kianda School
    `.trim()
  };
};

export const getAssessmentInvitationEmail = (candidateName: string, assessmentDate: string) => ({
  subject: `Application Accepted & Assessment Scheduled - ${candidateName}`,
  body: `
Dear Parents,

Congratulations! We have completed the administrative review for ${candidateName}'s application.

We are pleased to inform you that the application has been accepted to advance to the testing stage. Please take note of the formally scheduled assessment date for the candidate:

Assessment Date: ${assessmentDate}

We will follow up with logistical instructions closer to the date. Ensure the candidate arrives on time.

Kind regards,
The Admissions Team
Kianda School
  `.trim()
});

export const getInterviewInviteEmail = (candidateName: string, date: string, time: string, location: string) => ({
  subject: `Interview Invitation - Kianda School - ${candidateName}`,
  body: `
Dear Parents,

We are pleased to invite ${candidateName} for an oral interview as the final stage of the Kianda School admissions process.

Please find the scheduled details below:

Date: ${date}
Time Slot: ${time}
Location: ${location}

Please ensure that you arrive at the school at least 15 minutes before the scheduled time.

We look forward to meeting you and your daughter.

Kind regards,
The Admissions Team
Kianda School
  `.trim()
});

export const getAdmissionOfferEmail = (candidateName: string) => ({
  subject: `Admission Offer - Kianda School - ${candidateName}`,
  body: `
Dear Parents,

Congratulations! We are delighted to formally offer ${candidateName} a place at Kianda School. 

To secure this position, we kindly request you to pay the admissions fees of Ksh 25,000. Please note that this payment should be made directly through the unique student account assigned to ${candidateName} by our Finance Department. 

The Finance Office will contact you shortly with the specific account details and instructions to finalize the enrollment. Kindly note that all subsequent payments are handled through these official finance channels rather than the admissions portal.

Welcome to the Kianda School family!

Kind regards,
The Admissions Team
Kianda School
  `.trim()
});

export const getWaitlistEmail = (candidateName: string) => ({
  subject: `Waitlist Notification - Kianda School - ${candidateName}`,
  body: `
Dear Parents,

Thank you for participating in the recent oral interview for ${candidateName}.

We are pleased to inform you that ${candidateName} has successfully met our admission requirements. However, as our current vacancies for this grade level are fully depleted at this time, we have placed her on our **Waiting List**.

Should a spot become available due to standard admissions flux, we will reach out to you immediately with a formal admission offer.

We appreciate your patience and your interest in Kianda School.

Kind regards,
The Admissions Team
Kianda School
  `.trim()
});
