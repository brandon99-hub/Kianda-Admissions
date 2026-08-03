/**
 * Google Drive Backup Utility
 * 
 * Backs up the PostgreSQL database and uploads/ directory to Google Drive.
 * Uses a Service Account for authentication - set up your service account and
 * add its credentials to service-account.json in the project root.
 * 
 * Required .env variables:
 * - DATABASE_URL: PostgreSQL connection URL
 * - GOOGLE_DRIVE_FOLDER_ID: The ID of the target folder in Google Drive (Shared Drive)
 * - GOOGLE_SERVICE_ACCOUNT_PATH: (Optional) Custom path to service account JSON (defaults to ./service-account.json)
 */

import { google } from 'googleapis';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '../../');

function getAuth() {
  const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH
    ? path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_PATH)
    : path.join(ROOT, 'service-account.json');

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Service account file not found at: ${serviceAccountPath}`);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: serviceAccountPath,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return auth;
}

async function uploadFileToDrive(drive: any, filePath: string, fileName: string, folderId: string) {
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType: 'application/octet-stream',
    body: fs.createReadStream(filePath),
  };

  console.log(`[BACKUP] Uploading ${fileName} to Google Drive...`);
  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name',
    supportsAllDrives: true,
  });

  console.log(`[BACKUP] Uploaded ${fileName}: File ID = ${res.data.id}`);
  return res.data;
}

export async function runBackup(): Promise<{ success: boolean; message: string; files?: string[] }> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    const msg = '[BACKUP] GOOGLE_DRIVE_FOLDER_ID is not set in .env. Skipping backup.';
    console.error(msg);
    return { success: false, message: msg };
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const tempDir = path.join(ROOT, 'backup_tmp');

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const dbDumpPath = path.join(tempDir, `db-backup-${timestamp}.sql`);
  const uploadsDumpPath = path.join(tempDir, `uploads-backup-${timestamp}.zip`);
  const uploadedFiles: string[] = [];

  try {
    // 1. Dump the database
    console.log('[BACKUP] Dumping PostgreSQL database...');
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('DATABASE_URL is not set');
    
    // Extract connection params from URL
    await execAsync(`pg_dump "${dbUrl}" -f "${dbDumpPath}" --no-password`);
    console.log(`[BACKUP] Database dump saved to ${dbDumpPath}`);

    // 2. Zip the uploads directory
    const uploadsDir = path.join(ROOT, 'uploads');
    if (fs.existsSync(uploadsDir)) {
      console.log('[BACKUP] Zipping uploads directory...');
      await execAsync(`powershell -Command "Compress-Archive -Path '${uploadsDir}\\*' -DestinationPath '${uploadsDumpPath}' -Force"`);
      console.log(`[BACKUP] Uploads zipped to ${uploadsDumpPath}`);
    } else {
      console.log('[BACKUP] No uploads directory found, skipping uploads zip.');
    }

    // 3. Upload to Google Drive
    const auth = getAuth();
    const drive = google.drive({ version: 'v3', auth });

    if (fs.existsSync(dbDumpPath)) {
      await uploadFileToDrive(drive, dbDumpPath, `db-backup-${timestamp}.sql`, folderId);
      uploadedFiles.push(`db-backup-${timestamp}.sql`);
    }

    if (fs.existsSync(uploadsDumpPath)) {
      await uploadFileToDrive(drive, uploadsDumpPath, `uploads-backup-${timestamp}.zip`, folderId);
      uploadedFiles.push(`uploads-backup-${timestamp}.zip`);
    }

    const msg = `[BACKUP] Backup completed successfully at ${timestamp}. Files: ${uploadedFiles.join(', ')}`;
    console.log(msg);
    return { success: true, message: msg, files: uploadedFiles };

  } catch (error: any) {
    const msg = `[BACKUP] Backup failed: ${error.message}`;
    console.error(msg, error);
    return { success: false, message: msg };
  } finally {
    // Cleanup temp files
    try {
      if (fs.existsSync(dbDumpPath)) fs.unlinkSync(dbDumpPath);
      if (fs.existsSync(uploadsDumpPath)) fs.unlinkSync(uploadsDumpPath);
      if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
        fs.rmdirSync(tempDir);
      }
    } catch (cleanupError) {
      console.warn('[BACKUP] Failed to clean up temp files:', cleanupError);
    }
  }
}
