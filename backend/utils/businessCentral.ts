export async function pushCandidateToProxy(appData: any) {
  // Check if integration is enabled
  const isEnabled = process.env.BC_INTEGRATION_ENABLED === 'true';
  const proxyUrl = process.env.BC_PROXY_URL;
  const apiKey = process.env.BC_PROXY_API_KEY;

  if (!proxyUrl || !apiKey) {
    console.warn('[BC Integration] BC_PROXY_URL or BC_PROXY_API_KEY is not defined in .env.');
    if (isEnabled) return; 
  }

  // Format the payload to match AdmissionsPayload in C# proxy
  const payload = {
    Candidate: {
      FullName: appData.candidate?.fullName || '',
      Dob: appData.candidate?.dob || '',
      Religion: appData.candidate?.religion || '',
      Denomination: appData.candidate?.denomination || '',
      BirthOrder: appData.candidate?.birthOrder || '',
      MedicalInfo: appData.candidate?.medicalInfo || ''
    },
    ParentDetails: {
      Residency: appData.parentDetails?.residency || '',
      HouseTelephoneNo: appData.parentDetails?.houseTelephoneNo || '',
      HouseNo: appData.parentDetails?.houseNo ? parseInt(appData.parentDetails.houseNo, 10) : 0
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
      Dob: s.dob || ''
    }))
  };

  if (!isEnabled) {
    console.log('\n[DRY RUN] BC Integration is disabled. Would push to Proxy:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');
    return;
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

    if (!response.ok) {
      throw new Error(`Proxy responded with ${response.status}: ${responseText}`);
    }

    console.log(`[BC Integration] Successfully pushed to proxy: ${responseText}`);
  } catch (error) {
    console.error('[BC Integration ERROR] Failed to communicate with proxy:', error);
    // Rethrowing allows the caller to decide whether to fail the main request or swallow the error
    throw error;
  }
}
