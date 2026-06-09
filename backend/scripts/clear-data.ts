import { db } from '../db';
import { sql } from 'drizzle-orm';
import { eq, ilike } from 'drizzle-orm';
import * as schema from '../db/schema';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Remove a single upload folder by candidateName (sanitised, as stored on disk). */
async function deleteUploadFolder(candidateName: string) {
  const sanitised = candidateName.replace(/[^a-z0-9 ]/gi, '_');
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const folderPath = path.join(uploadsDir, sanitised);
  try {
    await fs.rm(folderPath, { recursive: true, force: true });
    console.log(`🗑️  Deleted upload folder: uploads/${sanitised}`);
  } catch {
    console.log(`ℹ️  No upload folder found for: ${sanitised}`);
  }
}

/** Remove every folder inside the uploads directory. */
async function deleteAllUploadFolders(): Promise<number> {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  try {
    const entries = await fs.readdir(uploadsDir);
    for (const entry of entries) {
      await fs.rm(path.join(uploadsDir, entry), { recursive: true, force: true });
      console.log(`🗑️  Deleted: uploads/${entry}`);
    }
    return entries.length;
  } catch {
    console.log('ℹ️  No uploads directory found — skipping file deletion.');
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Targeted deletion — delete ONE application by candidate name
// ─────────────────────────────────────────────────────────────────────────────

async function clearSingleApplication(candidateName: string) {
  console.log('');
  console.log('=========================================');
  console.log('  KIANDA ADMISSIONS — DELETE CANDIDATE   ');
  console.log('=========================================');
  console.log(`\n🔍 Searching for candidate: "${candidateName}"\n`);

  // Find the candidate (case-insensitive)
  const match = await db.query.candidates.findFirst({
    where: ilike(schema.candidates.fullName, candidateName),
  });

  if (!match || !match.applicationId) {
    console.log(`❌ No candidate found with the name "${candidateName}".`);
    console.log('   Check the spelling or run without an argument to list all applications.\n');
    process.exit(1);
  }

  const appId = match.applicationId;
  console.log(`✅ Found: ${match.fullName} — Application ID #${appId}`);
  console.log('');

  // Delete all child rows for this application (order matters for FKs)
  await db.delete(schema.assessmentResults).where(eq(schema.assessmentResults.applicationId, appId));
  await db.delete(schema.interviewSlots).where(eq(schema.interviewSlots.applicationId, appId));
  await db.delete(schema.documents).where(eq(schema.documents.applicationId, appId));
  await db.delete(schema.additionalInfo).where(eq(schema.additionalInfo.applicationId, appId));
  await db.delete(schema.siblings).where(eq(schema.siblings.applicationId, appId));
  await db.delete(schema.schoolsAttended).where(eq(schema.schoolsAttended.applicationId, appId));
  await db.delete(schema.parentDetails).where(eq(schema.parentDetails.applicationId, appId));
  await db.delete(schema.candidates).where(eq(schema.candidates.id, match.id));
  await db.delete(schema.applications).where(eq(schema.applications.id, appId));

  console.log(`✅ Deleted application #${appId} and all linked records for "${match.fullName}".`);
  console.log('ℹ️  ID sequence is NOT reset — existing application IDs are preserved.');

  // Delete the candidate's upload folder
  console.log('');
  console.log('--- Cleaning upload folder ---');
  await deleteUploadFolder(match.fullName);

  console.log('');
  console.log('------------------------------------------');
  console.log(`✅ Done. "${match.fullName}" has been removed.`);
  console.log('------------------------------------------');
  console.log('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Ghost deletion — delete ONLY incomplete/failed applications
// ─────────────────────────────────────────────────────────────────────────────

async function clearGhostApplications() {
  console.log('');
  console.log('=========================================');
  console.log('  KIANDA ADMISSIONS — CLEAR GHOST APPS  ');
  console.log('=========================================');
  console.log('');
  console.log('ℹ️  Ghosts = applications with no matching candidates row.');
  console.log('ℹ️  These are the result of mid-transaction rollbacks.');
  console.log('ℹ️  All fully-submitted applications will be preserved.');
  console.log('');

  // Find application IDs that have NO corresponding row in the candidates table
  const ghostResult = await db.execute(sql`
    SELECT a.id 
    FROM applications a
    LEFT JOIN candidates c ON c.application_id = a.id
    WHERE c.id IS NULL
    ORDER BY a.id
  `);

  const ghostIds: number[] = ghostResult.rows.map((r: any) => r.id);

  if (ghostIds.length === 0) {
    console.log('✅ No ghost applications found. Database is clean.');
    console.log('');
    process.exit(0);
  }

  console.log(`📋 Ghost applications found: ${ghostIds.length}`);
  console.log(`   IDs: ${ghostIds.join(', ')}`);
  console.log('');

  // For each ghost, delete any partial child rows then the application itself.
  // These should have NO child rows (due to rollback), but we clean defensively.
  for (const id of ghostIds) {
    await db.execute(sql`DELETE FROM assessment_results WHERE application_id = ${id}`);
    await db.execute(sql`DELETE FROM interview_slots    WHERE application_id = ${id}`);
    await db.execute(sql`DELETE FROM documents          WHERE application_id = ${id}`);
    await db.execute(sql`DELETE FROM additional_info    WHERE application_id = ${id}`);
    await db.execute(sql`DELETE FROM siblings           WHERE application_id = ${id}`);
    await db.execute(sql`DELETE FROM schools_attended   WHERE application_id = ${id}`);
    await db.execute(sql`DELETE FROM parent_details     WHERE application_id = ${id}`);
    await db.execute(sql`DELETE FROM candidates         WHERE application_id = ${id}`);
    await db.execute(sql`DELETE FROM applications       WHERE id = ${id}`);
  }

  console.log(`✅ Deleted ${ghostIds.length} ghost application(s).`);
  console.log('ℹ️  ID sequence is NOT reset — your real applications keep their IDs.');

  console.log('');
  console.log('------------------------------------------');
  console.log('✅ Done. Ghost applications removed.');
  console.log('------------------------------------------');
  console.log('');
}


async function clearAllApplications() {
  console.log('');
  console.log('=========================================');
  console.log('  KIANDA ADMISSIONS — CLEAR APPLICATIONS ');
  console.log('=========================================');
  console.log('');

  // Count before deletion
  const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM applications`);
  const appCount = parseInt((countResult.rows[0] as any).count, 10);

  // Count upload folders before deletion
  const uploadsDir = path.join(process.cwd(), 'uploads');
  let uploadFolderCount = 0;
  try {
    const entries = await fs.readdir(uploadsDir);
    uploadFolderCount = entries.length;
  } catch {
    // uploads directory doesn't exist — that's fine
  }

  console.log(`📋 Applications found:     ${appCount}`);
  console.log(`📁 Upload folders found:   ${uploadFolderCount}`);
  console.log('');

  if (appCount === 0 && uploadFolderCount === 0) {
    console.log('ℹ️  Nothing to delete. System is already clean.');
    console.log('');
    process.exit(0);
  }

  // Truncate all application-linked tables and reset sequences.
  // NOT touched: assessments, grade_management, admission_cycles, admin_users, process_documents
  await db.execute(sql`
    TRUNCATE TABLE
      assessment_results,
      interview_slots,
      documents,
      additional_info,
      siblings,
      schools_attended,
      parent_details,
      candidates,
      applications
    RESTART IDENTITY CASCADE;
  `);

  console.log(`✅ Deleted ${appCount} application(s) and all linked records.`);
  console.log('✅ Application ID sequence reset to 1 (next submission will be ID #1).');

  // Delete upload folders
  console.log('');
  console.log('--- Cleaning uploads directory ---');
  const deleted = await deleteAllUploadFolders();
  if (deleted > 0) {
    console.log(`✅ Deleted ${deleted} upload folder(s) from disk.`);
  }

  console.log('');
  console.log('------------------------------------------');
  console.log('✅ Done. System is clean and ready.');
  console.log('------------------------------------------');
  console.log('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  const arg = process.argv[2]?.trim();

  try {
    if (arg === 'ghosts') {
      // Delete only incomplete/rolled-back applications, keep all real ones
      await clearGhostApplications();
    } else if (arg) {
      // Delete one specific candidate by name
      await clearSingleApplication(arg);
    } else {
      // Full wipe + reset ID sequence to 1
      await clearAllApplications();
    }
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Operation failed:', error);
    console.error('');
    process.exit(1);
  }
}

run();
