import { db } from '../db';
import { adminUsers } from '../db/schema';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  const email = 'info@kiandaschool.ac.ke';
  const password = 'Kianda@123!';
  const passwordHash = await bcrypt.hash(password, 10);

  console.log(`Seeding admin: ${email}...`);
  
  try {
    await db.insert(adminUsers).values({
      email,
      passwordHash,
    }).onConflictDoUpdate({
      target: adminUsers.email,
      set: { passwordHash }
    });
    console.log('Admin seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
