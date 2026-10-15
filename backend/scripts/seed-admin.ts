import { db } from '../db';
import { adminUsers } from '../db/schema';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded from the project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

async function seed() {
  const email = process.env.ADMIN_SEED_EMAIL || process.env.ADMIN_EMAIL || 'info@kiandaschool.ac.ke';
  const password = process.env.ADMIN_SEED_PASSWORD || process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error('\n❌ ERROR: ADMIN_PASSWORD (or ADMIN_SEED_PASSWORD) is not defined in your .env file.');
    console.error('👉 Please add ADMIN_PASSWORD=your_new_password to your .env file before running this script.\n');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  console.log(`Seeding/updating admin credentials for: ${email}...`);
  
  try {
    await db.insert(adminUsers).values({
      email,
      passwordHash,
    }).onConflictDoUpdate({
      target: adminUsers.email,
      set: { passwordHash }
    });
    console.log('✅ Admin credentials updated successfully in the database!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Admin seeding failed:', error);
    process.exit(1);
  }
}

seed();
