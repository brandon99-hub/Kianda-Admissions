import { db } from '../db';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

async function clearData() {
  console.log('');
  console.log('=========================================');
  console.log('  KIANDA ADMISSIONS — CLEAR APPLICATIONS ');
  console.log('=========================================');
  console.log('');

  try {
    // 1. Count applications before deletion
    const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM applications`);
    const appCount = parseInt((countResult.rows[0] as any).count, 10);

    // 2. Count upload folders before deletion
    const uploadsDir = path.join(process.cwd(), 'uploads');
    let uploadFolderCount = 0;
    try {
      const entries = await fs.readdir(uploadsDir);
      uploadFolderCount = entries.length;
    } catch {
      // uploads dir doesn't exist yet — that's fine
    }

    console.log(`📋 Applications found:     ${appCount}`);
    console.log(`📁 Upload folders found:   ${uploadFolderCount}`);
    console.log('');

    if (appCount === 0 && uploadFolderCount === 0) {
      console.log('ℹ️  Nothing to delete. System is already clean.');
      console.log('');
      process.exit(0);
    }

    // 3. Truncate all application-linked tables and reset sequences
    //    (grade_management, assessments, admission_cycles, admin_users, process_documents are PRESERVED)
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
    console.log(`✅ Application ID sequence reset to 1 (next submission will be ID #1).`);

    // 4. Delete per-candidate upload folders (each is a subdirectory)
    if (uploadFolderCount > 0) {
      const entries = await fs.readdir(uploadsDir);
      for (const entry of entries) {
        await fs.rm(path.join(uploadsDir, entry), { recursive: true, force: true });
      }
      console.log(`✅ Deleted ${uploadFolderCount} upload folder(s) from disk.`);
    } else {
      console.log('ℹ️  No upload folders to delete.');
    }

    console.log('');
    console.log('------------------------------------------');
    console.log('✅ Done. System is clean and ready.');
    console.log('------------------------------------------');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Failed to clear data:', error);
    console.error('');
    process.exit(1);
  }
}

clearData();
