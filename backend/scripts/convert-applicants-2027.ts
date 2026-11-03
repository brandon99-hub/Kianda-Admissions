import { db } from '../db';
import * as schema from '../db/schema';
import { sql, eq, inArray, or, ilike } from 'drizzle-orm';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const TARGET_APPLICANTS = [
  { id: 337, name: 'CAROLINE MUTHEU', grade: 'Grade 10' },
  { id: 336, name: 'NATALIE MUTIKI MUNYALO', grade: 'Grade 10' },
  { id: 344, name: 'Ella Natania Chek', grade: 'Grade 8' },
];

const TARGET_YEAR = 2027;

async function convertApplicantsTo2027() {
  console.log('\n======================================================');
  console.log(`   KIANDA ADMISSIONS — CONVERT APPLICANTS TO YEAR ${TARGET_YEAR}   `);
  console.log('======================================================\n');

  const args = process.argv.slice(2);
  const convertAll2026 = args.includes('--all-2026');
  const customIdsArg = args.find(a => a.startsWith('--ids='));
  const customIds = customIdsArg
    ? customIdsArg.replace('--ids=', '').split(',').map(n => parseInt(n.trim(), 10)).filter(Boolean)
    : null;

  try {
    // 1. Check admission_cycles table for Target Year 2027
    console.log(`📌 Verifying Admission Cycle ${TARGET_YEAR} in database...`);
    const cycle2027 = await db.query.admissionCycles.findFirst({
      where: eq(schema.admissionCycles.academicYear, TARGET_YEAR),
    });

    if (cycle2027) {
      console.log(`✅ Admission Cycle ${TARGET_YEAR} is configured:`);
      console.log(`   - Starts: ${cycle2027.startDate ? new Date(cycle2027.startDate).toLocaleDateString() : 'N/A'}`);
      console.log(`   - Ends:   ${cycle2027.endDate ? new Date(cycle2027.endDate).toLocaleDateString() : 'N/A'}`);
      console.log(`   - Active: ${cycle2027.isActive ? 'YES' : 'NO'}\n`);
    } else {
      console.log(`⚠️  Notice: Cycle ${TARGET_YEAR} not explicitly defined in admission_cycles table.`);
      console.log(`   Proceeding with updating applicant records to academicYear = ${TARGET_YEAR}.\n`);
    }

    // 2. Locate target applications
    let matchedApps: {
      applicationId: number;
      academicYear: number | null;
      status: string | null;
      candidateName: string;
      grade: string;
    }[] = [];

    if (convertAll2026) {
      console.log('🔍 Searching for ALL applications with academicYear = 2026...');
      const rows = await db
        .select({
          applicationId: schema.applications.id,
          academicYear: schema.applications.academicYear,
          status: schema.applications.status,
          candidateName: schema.candidates.fullName,
          grade: schema.candidates.grade,
        })
        .from(schema.applications)
        .leftJoin(schema.candidates, eq(schema.candidates.applicationId, schema.applications.id))
        .where(eq(schema.applications.academicYear, 2026));

      matchedApps = rows.map(r => ({
        applicationId: r.applicationId,
        academicYear: r.academicYear,
        status: r.status,
        candidateName: r.candidateName || 'Unknown',
        grade: r.grade || 'Unassigned',
      }));
    } else {
      const targetIds = customIds || TARGET_APPLICANTS.map(a => a.id);
      console.log(`🔍 Searching for target application IDs: [${targetIds.join(', ')}]...`);

      const rowsById = await db
        .select({
          applicationId: schema.applications.id,
          academicYear: schema.applications.academicYear,
          status: schema.applications.status,
          candidateName: schema.candidates.fullName,
          grade: schema.candidates.grade,
        })
        .from(schema.applications)
        .leftJoin(schema.candidates, eq(schema.candidates.applicationId, schema.applications.id))
        .where(inArray(schema.applications.id, targetIds));

      matchedApps = rowsById.map(r => ({
        applicationId: r.applicationId,
        academicYear: r.academicYear,
        status: r.status,
        candidateName: r.candidateName || 'Unknown',
        grade: r.grade || 'Unassigned',
      }));

      // Fallback lookup by candidate names if any target applicant was not found by ID
      if (matchedApps.length < TARGET_APPLICANTS.length && !customIds) {
        const foundIds = new Set(matchedApps.map(m => m.applicationId));
        const missingApplicants = TARGET_APPLICANTS.filter(t => !foundIds.has(t.id));

        for (const missing of missingApplicants) {
          const rowsByName = await db
            .select({
              applicationId: schema.applications.id,
              academicYear: schema.applications.academicYear,
              status: schema.applications.status,
              candidateName: schema.candidates.fullName,
              grade: schema.candidates.grade,
            })
            .from(schema.applications)
            .leftJoin(schema.candidates, eq(schema.candidates.applicationId, schema.applications.id))
            .where(ilike(schema.candidates.fullName, `%${missing.name.trim()}%`));

          if (rowsByName.length > 0) {
            const found = rowsByName[0];
            if (!foundIds.has(found.applicationId)) {
              matchedApps.push({
                applicationId: found.applicationId,
                academicYear: found.academicYear,
                status: found.status,
                candidateName: found.candidateName || missing.name,
                grade: found.grade || missing.grade,
              });
              foundIds.add(found.applicationId);
              console.log(`ℹ️  Found ${missing.name} by name matching (Application ID #${found.applicationId})`);
            }
          }
        }
      }
    }

    if (matchedApps.length === 0) {
      console.log('❌ No matching applications found to update.');
      console.log('   Please verify that the applications exist in your database.\n');
      process.exit(0);
    }

    console.log(`\n📋 Found ${matchedApps.length} application(s) to convert:\n`);
    matchedApps.forEach(app => {
      const formattedId = `APP-${String(app.applicationId).padStart(4, '0')}`;
      console.log(`   - ${formattedId}: ${app.candidateName} (${app.grade}) | Current Year: ${app.academicYear} | Status: ${app.status}`);
    });

    // 3. Execute the update to academicYear = 2027
    const appIdsToUpdate = matchedApps.map(a => a.applicationId);
    console.log(`\n⚙️  Updating ${appIdsToUpdate.length} record(s) in "applications" table to academic_year = ${TARGET_YEAR}...`);

    await db
      .update(schema.applications)
      .set({ academicYear: TARGET_YEAR })
      .where(inArray(schema.applications.id, appIdsToUpdate));

    console.log(`✅ Successfully updated ${appIdsToUpdate.length} application(s) to Year ${TARGET_YEAR}!`);

    // 4. Ensure grade_management entries exist for 2027 for the involved grades
    const distinctGrades = Array.from(new Set(matchedApps.map(a => a.grade).filter(g => g && g !== 'Unassigned')));
    console.log(`\n📌 Checking Grade Management capacity configs for Year ${TARGET_YEAR} (${distinctGrades.join(', ')})...`);

    for (const gName of distinctGrades) {
      const existingGrade2027 = await db.query.gradeManagement.findFirst({
        where: sql`lower(trim(${schema.gradeManagement.gradeName})) = lower(trim(${gName})) AND ${schema.gradeManagement.academicYear} = ${TARGET_YEAR}`,
      });

      if (!existingGrade2027) {
        // Fetch 2026 configuration if available to copy vacant spots/settings
        const grade2026 = await db.query.gradeManagement.findFirst({
          where: sql`lower(trim(${schema.gradeManagement.gradeName})) = lower(trim(${gName})) AND ${schema.gradeManagement.academicYear} = 2026`,
        });

        const vacantSpots = grade2026 ? grade2026.vacantSpots : 20;
        const location = grade2026 ? grade2026.location : 'Main School Block';

        console.log(`   Creating grade management entry for "${gName}" (Year ${TARGET_YEAR}, Vacancies: ${vacantSpots})...`);
        try {
          await db.insert(schema.gradeManagement).values({
            gradeName: gName,
            academicYear: TARGET_YEAR,
            vacantSpots: vacantSpots,
            isAcceptingApplications: true,
            location: location,
          });
          console.log(`   ✅ "${gName}" configured for Year ${TARGET_YEAR}`);
        } catch (err: any) {
          console.log(`   ℹ️  Note for "${gName}": ${err.message || 'Already present'}`);
        }
      } else {
        console.log(`   ℹ️  "${gName}" already exists for Year ${TARGET_YEAR} (Vacancies: ${existingGrade2027.vacantSpots})`);
      }
    }

    // 5. Verification step
    console.log('\n======================================================');
    console.log('                 VERIFICATION REPORT                  ');
    console.log('======================================================\n');

    const verifiedRows = await db
      .select({
        applicationId: schema.applications.id,
        academicYear: schema.applications.academicYear,
        status: schema.applications.status,
        candidateName: schema.candidates.fullName,
        grade: schema.candidates.grade,
      })
      .from(schema.applications)
      .leftJoin(schema.candidates, eq(schema.candidates.applicationId, schema.applications.id))
      .where(inArray(schema.applications.id, appIdsToUpdate));

    verifiedRows.forEach(row => {
      const formattedId = `APP-${String(row.applicationId).padStart(4, '0')}`;
      console.log(`✨ ${formattedId} | ${row.candidateName} | ${row.grade} | Academic Year: ${row.academicYear} | Status: ${row.status}`);
    });

    console.log('\n🎉 All target applicants now belong to Academic Year 2027!');
    console.log('   They will now seamlessly show up in the 2027 Dashboard, Applications view, and Export filters.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error converting applicants:', error);
    process.exit(1);
  }
}

convertApplicantsTo2027();

