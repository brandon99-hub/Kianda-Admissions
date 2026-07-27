export async function pushCandidateToProxy(appData: any, erpAdmissionNo?: string | null) {
  // Check if integration is enabled
  const isEnabled = process.env.BC_INTEGRATION_ENABLED === 'true';
  const proxyUrl = process.env.BC_PROXY_URL;
  const apiKey = process.env.BC_PROXY_API_KEY;

  if (!proxyUrl || !apiKey) {
    console.warn('[BC Integration] BC_PROXY_URL or BC_PROXY_API_KEY is not defined in .env.');
    if (isEnabled) return null; 
  }

  // Format the payload to match AdmissionsPayload in C# proxy
  const payload = {
    Admission_No: erpAdmissionNo || '',
    ApplyingGrade: appData.candidate?.grade || '',
    TransactionCode: appData.mpesaCode || '',
    AdmissionCycleYear: appData.academicYear || 0,
    Candidate: {
      FullName: appData.candidate?.fullName || '',
      Dob: appData.candidate?.dob || '',
      Religion: appData.candidate?.religion || '',
      Denomination: appData.candidate?.denomination || '',
      BirthOrder: appData.candidate?.birthOrder || '',
      MedicalInfo: appData.candidate?.medicalInfo || ''
    },
    ParentDetails: {
      Residency: [appData.parentDetails?.motherResidency, appData.parentDetails?.fatherResidency].filter(Boolean).join(', '),
      FatherName: appData.parentDetails?.fatherName || '',
      FatherPhone: appData.parentDetails?.fatherPhone || '',
      FatherProfession: appData.parentDetails?.fatherProfession || '',
      FatherWork: appData.parentDetails?.fatherWork || '',
      FatherEmail: appData.parentDetails?.fatherEmail || '',
      MotherName: appData.parentDetails?.motherName || '',
      MotherPhone: appData.parentDetails?.motherPhone || '',
      MotherProfession: appData.parentDetails?.motherProfession || '',
      MotherWork: appData.parentDetails?.motherWork || '',
      MotherEmail: appData.parentDetails?.motherEmail || ''
    },
    AdditionalInfo: {
      Source: appData.additionalInfo?.source || '',
      HasAppliedBefore: appData.additionalInfo?.hasAppliedBefore || false,
      PreviousApplicationYears: appData.additionalInfo?.previousApplicationYears || []
    },
    SchoolsAttended: (appData.schoolsAttended || []).map((s: any) => ({
      SchoolName: s.schoolName || '',
      YearsRange: s.yearsRange || ''
    })),
    Siblings: (appData.siblings || []).map((s: any) => ({
      Name: s.name || '',
      Relationship: s.relationship || '',
      SchoolName: s.schoolName || '',
      Order: parseInt(s.kiandaOrder) || 0,
      SiblingType: s.relationship || ''
    }))
  };

  if (!isEnabled) {
    console.log('\n[DRY RUN] BC Integration is disabled. Would push to Proxy:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');
    return null;
  }

  try {
    console.log(`[BC Integration] Pushing ${payload.Candidate.FullName} to proxy at ${proxyUrl}...`);
    
    const response = await globalThis.fetch(proxyUrl as string, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey as string
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let jsonResponse: any = {};
    try {
      jsonResponse = JSON.parse(responseText);
    } catch(e) {}

    if (!response.ok) {
      const error: any = new Error(`Proxy responded with ${response.status}: ${responseText}`);
      error.admissionNo = jsonResponse?.admissionNo;
      throw error;
    }

    console.log(`[BC Integration] Successfully pushed to proxy: ${responseText}`);
    return jsonResponse?.admissionNo;
  } catch (error) {
    console.error('[BC Integration ERROR] Failed to communicate with proxy:', error);
    throw error;
  }
}
