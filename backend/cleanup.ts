import { db } from './db/index.js';
import * as schema from './db/schema.js';
import { eq } from 'drizzle-orm';

async function cleanup() {
  try {
    const pendingApps = await db.select().from(schema.applications).where(eq(schema.applications.paymentVerified, false));
    
    if (pendingApps.length === 0) {
      console.log('No pending applications found to delete.');
      process.exit(0);
    }
    
    console.log(`Found ${pendingApps.length} pending_payment applications. Deleting...`);
    
    for (const app of pendingApps) {
      console.log(`Deleting application ID: ${app.id}`);
      
      await db.delete(schema.candidates).where(eq(schema.candidates.applicationId, app.id));
      await db.delete(schema.parentDetails).where(eq(schema.parentDetails.applicationId, app.id));
      await db.delete(schema.additionalInfo).where(eq(schema.additionalInfo.applicationId, app.id));
      await db.delete(schema.siblings).where(eq(schema.siblings.applicationId, app.id));
      await db.delete(schema.schoolsAttended).where(eq(schema.schoolsAttended.applicationId, app.id));
      await db.delete(schema.documents).where(eq(schema.documents.applicationId, app.id));
      
      await db.delete(schema.applications).where(eq(schema.applications.id, app.id));
    }
    
    console.log('Successfully deleted all pending applications.');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanup();
