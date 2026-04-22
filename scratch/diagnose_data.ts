import { db } from '../backend/db';
import * as schema from '../backend/db/schema';
import fs from 'fs';
import path from 'path';

async function diagnose() {
  console.log('--- DIAGNOSIS START ---');
  try {
    const apps = await db.query.applications.findMany({
      with: {
        assessmentResults: {
          with: { assessment: true }
        }
      }
    });
    
    const output = JSON.stringify(apps, null, 2);
    fs.writeFileSync(path.join(__dirname, 'diagnosis_output.json'), output);
    console.log(`Successfully wrote ${apps.length} applications to diagnosis_output.json`);
    
    const graded = apps.filter(a => (a as any).assessmentResults?.length > 0);
    console.log(`Found ${graded.length} applications with assessment results.`);
    
  } catch (error) {
    console.error('Diagnosis failed:', error);
  }
  console.log('--- DIAGNOSIS END ---');
}

diagnose();
