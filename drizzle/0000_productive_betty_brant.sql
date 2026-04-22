CREATE TYPE "public"."application_status" AS ENUM('pending', 'assessment_scheduled', 'interview_scheduled', 'accepted', 'rejected');--> statement-breakpoint
CREATE TABLE "additional_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer,
	"motivation" text,
	"source" varchar(255),
	"source_other" text,
	"has_applied_before" boolean,
	"previous_application_year" integer
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" "application_status" DEFAULT 'pending',
	"payment_verified" boolean DEFAULT false,
	"mpesa_code" varchar(20),
	"application_fee_paid_at" timestamp,
	"acceptance_fee_paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer,
	"grade" varchar(50) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"dob" varchar(20) NOT NULL,
	"religion" varchar(100),
	"denomination" varchar(100),
	"birth_order" varchar(50),
	"medical_info" text
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer,
	"document_type" varchar(100),
	"file_url" text,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "grade_management" (
	"id" serial PRIMARY KEY NOT NULL,
	"grade_name" varchar(50) NOT NULL,
	"vacant_spots" integer DEFAULT 0,
	"assessment_date" timestamp,
	CONSTRAINT "grade_management_grade_name_unique" UNIQUE("grade_name")
);
--> statement-breakpoint
CREATE TABLE "interview_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer,
	"slot_time" timestamp NOT NULL,
	"group_name" varchar(100),
	"location" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "parent_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer,
	"father_name" varchar(255),
	"father_phone" varchar(50),
	"father_email" varchar(255),
	"father_profession" varchar(255),
	"father_work" varchar(255),
	"mother_name" varchar(255),
	"mother_phone" varchar(50),
	"mother_email" varchar(255),
	"mother_profession" varchar(255),
	"mother_work" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "schools_attended" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer,
	"school_type" varchar(50),
	"school_name" varchar(255),
	"years_range" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "siblings" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer,
	"name" varchar(255),
	"grade" varchar(50),
	"relationship" varchar(100)
);
--> statement-breakpoint
ALTER TABLE "additional_info" ADD CONSTRAINT "additional_info_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_slots" ADD CONSTRAINT "interview_slots_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_details" ADD CONSTRAINT "parent_details_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schools_attended" ADD CONSTRAINT "schools_attended_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "siblings" ADD CONSTRAINT "siblings_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;