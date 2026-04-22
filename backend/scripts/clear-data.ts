import { db } from '../db';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function clearData() {
  console.log('Clearing all application and assessment data...');
  console.log('Retaining admin accounts...');
  
  try {
    // Truncate tables with cascade to handle foreign keys and reset identities
    // We explicitly list the tables that contain dynamic data
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
        applications, 
        assessments, 
        grade_management 
      RESTART IDENTITY CASCADE;
    `);
    
    console.log('------------------------------------------');
    console.log('✅ Database cleared successfully!');
    console.log('✅ Retained admin_users table.');
    console.log('------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to clear data:', error);
    process.exit(1);
  }
}

clearData();
