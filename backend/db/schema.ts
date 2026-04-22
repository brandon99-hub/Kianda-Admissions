import { pgTable, serial, text, varchar, timestamp, boolean, integer, jsonb, pgEnum, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const applicationStatusEnum = pgEnum('application_status', [
  'pending', 'assessment_scheduled', 'passed_assessment', 'interview_scheduled', 'accepted', 'rejected', 'failed', 'waitlisted'
]);

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  status: applicationStatusEnum('status').default('pending'),
  paymentVerified: boolean('payment_verified').default(false),
  mpesaCode: varchar('mpesa_code', { length: 20 }),
  applicationFeePaidAt: timestamp('application_fee_paid_at'),
  acceptanceFeePaidAt: timestamp('acceptance_fee_paid_at'),
  academicYear: integer('academic_year'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const candidates = pgTable('candidates', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').references(() => applications.id),
  grade: varchar('grade', { length: 50 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  dob: varchar('dob', { length: 20 }).notNull(),
  religion: varchar('religion', { length: 100 }),
  denomination: varchar('denomination', { length: 100 }),
  birthOrder: varchar('birth_order', { length: 50 }),
  medicalInfo: text('medical_info'),
});

export const parentDetails = pgTable('parent_details', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').references(() => applications.id),
  // Father
  fatherName: varchar('father_name', { length: 255 }),
  fatherPhone: varchar('father_phone', { length: 50 }),
  fatherEmail: varchar('father_email', { length: 255 }),
  fatherProfession: varchar('father_profession', { length: 255 }),
  fatherWork: varchar('father_work', { length: 255 }),
  // Mother
  motherName: varchar('mother_name', { length: 255 }),
  motherPhone: varchar('mother_phone', { length: 50 }),
  motherEmail: varchar('mother_email', { length: 255 }),
  motherProfession: varchar('mother_profession', { length: 255 }),
  motherWork: varchar('mother_work', { length: 255 }),
});

export const schoolsAttended = pgTable('schools_attended', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').references(() => applications.id),
  schoolType: varchar('school_type', { length: 50 }), // 'Kindergarten', 'Primary', 'Junior'
  schoolName: varchar('school_name', { length: 255 }),
  yearsRange: varchar('years_range', { length: 100 }),
});

export const siblings = pgTable('siblings', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').references(() => applications.id),
  name: varchar('name', { length: 255 }),
  grade: varchar('grade', { length: 50 }),
  relationship: varchar('relationship', { length: 100 }),
});

export const additionalInfo = pgTable('additional_info', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').references(() => applications.id),
  motivation: text('motivation'),
  source: varchar('source', { length: 255 }),
  sourceOther: text('source_other'),
  hasAppliedBefore: boolean('has_applied_before'),
  previousApplicationYear: integer('previous_application_year'),
});

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').references(() => applications.id),
  documentType: varchar('document_type', { length: 100 }), // 'Application Letter', etc.
  fileUrl: text('file_url'),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

export const gradeManagement = pgTable('grade_management', {
  id: serial('id').primaryKey(),
  gradeName: varchar('grade_name', { length: 50 }).notNull(),
  vacantSpots: integer('vacant_spots').default(0),
  assessmentDate: timestamp('assessment_date'),
  academicYear: integer('academic_year').default(new Date().getFullYear()),
}, (t) => ({
  unq: unique().on(t.gradeName, t.academicYear),
}));

export const assessments = pgTable('assessments', {
  id: serial('id').primaryKey(),
  gradeId: integer('grade_id').references(() => gradeManagement.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  maxMarks: integer('max_marks').notNull(),
});

export const assessmentResults = pgTable('assessment_results', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').references(() => applications.id).notNull(),
  assessmentId: integer('assessment_id').references(() => assessments.id, { onDelete: 'cascade' }).notNull(),
  marksObtained: integer('marks_obtained'),
  passed: boolean('passed').default(false),
});

export const interviewSlots = pgTable('interview_slots', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').references(() => applications.id),
  slotTime: timestamp('slot_time').notNull(),
  endTime: timestamp('end_time'),
  groupName: varchar('group_name', { length: 100 }),
  location: varchar('location', { length: 255 }),
});

export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [applications.id],
    references: [candidates.applicationId],
  }),
  parentDetails: one(parentDetails, {
    fields: [applications.id],
    references: [parentDetails.applicationId],
  }),
  additionalInfo: one(additionalInfo, {
    fields: [applications.id],
    references: [additionalInfo.applicationId],
  }),
  documents: many(documents),
  schoolsAttended: many(schoolsAttended),
  siblings: many(siblings),
  interviews: many(interviewSlots),
  assessmentResults: many(assessmentResults),
}));

export const candidatesRelations = relations(candidates, ({ one }) => ({
  application: one(applications, {
    fields: [candidates.applicationId],
    references: [applications.id],
  }),
}));

export const interviewSlotsRelations = relations(interviewSlots, ({ one }) => ({
  application: one(applications, {
    fields: [interviewSlots.applicationId],
    references: [applications.id],
  }),
}));

export const gradeManagementRelations = relations(gradeManagement, ({ many }) => ({
  assessments: many(assessments),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  grade: one(gradeManagement, {
    fields: [assessments.gradeId],
    references: [gradeManagement.id],
  }),
  results: many(assessmentResults),
}));

export const assessmentResultsRelations = relations(assessmentResults, ({ one }) => ({
  application: one(applications, {
    fields: [assessmentResults.applicationId],
    references: [applications.id],
  }),
  assessment: one(assessments, {
    fields: [assessmentResults.assessmentId],
    references: [assessments.id],
  }),
}));

export const parentDetailsRelations = relations(parentDetails, ({ one }) => ({
  application: one(applications, {
    fields: [parentDetails.applicationId],
    references: [applications.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  application: one(applications, {
    fields: [documents.applicationId],
    references: [applications.id],
  }),
}));

export const schoolsAttendedRelations = relations(schoolsAttended, ({ one }) => ({
  application: one(applications, {
    fields: [schoolsAttended.applicationId],
    references: [applications.id],
  }),
}));

export const siblingsRelations = relations(siblings, ({ one }) => ({
  application: one(applications, {
    fields: [siblings.applicationId],
    references: [applications.id],
  }),
}));

export const additionalInfoRelations = relations(additionalInfo, ({ one }) => ({
  application: one(applications, {
    fields: [additionalInfo.applicationId],
    references: [applications.id],
  }),
}));
