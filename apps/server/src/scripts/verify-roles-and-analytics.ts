
const BASE_URL = 'http://localhost:4000/api';

async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as any;
  if (!res.ok) throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  return { token: data.token, user: data.user };
}

async function run() {
  console.log('--- STARTING VERIFICATION: ROLES & ANALYTICS ---');

  const admin = await login('admin@prpcem.edu', 'admin123');
  const faculty = await login('atul.raut@prpcem.edu', 'faculty123');
  const student = await login('prathamesh.patange@prpcem.edu', 'student123');

  console.log('✓ All 3 roles logged in successfully');

  // 1. Student emergency test (expect 403)
  const studentAlertRes = await fetch(`${BASE_URL}/emergency`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${student.token}`,
    },
    body: JSON.stringify({
      title: 'Student Attempt Alert',
      message: 'This should be blocked',
      severity: 'LOW',
      scope: 'CAMPUS',
    }),
  });
  if (studentAlertRes.status === 403) {
    console.log('✓ Student correctly blocked from emergency alert broadcast (403 Forbidden)');
  } else {
    throw new Error(`Expected 403 for student emergency broadcast, got ${studentAlertRes.status}`);
  }

  // 2. Faculty emergency test (expect 201)
  const facultyAlertRes = await fetch(`${BASE_URL}/emergency`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${faculty.token}`,
    },
    body: JSON.stringify({
      title: 'Faculty Test Emergency Protocol',
      message: 'Electrical hazard in Lab 3. Evacuate immediately.',
      severity: 'CRITICAL',
      actionRequired: 'Evacuate Lab 3 and assemble in main courtyard.',
      confirmationCode: 'CONFIRM_BROADCAST',
      department: 'Computer Science & Engineering',
    }),
  });
  const facultyAlertData = (await facultyAlertRes.json()) as any;
  if (facultyAlertRes.status === 201 && facultyAlertData.alert?.id) {
    console.log('✓ Faculty declared emergency alert successfully (201 Created)');
  } else {
    throw new Error(`Faculty failed to declare alert: ${JSON.stringify(facultyAlertData)}`);
  }

  // 3. Faculty resolves emergency test (expect 200)
  const facultyResolveRes = await fetch(`${BASE_URL}/emergency/${facultyAlertData.alert.id}/deactivate`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${faculty.token}`,
    },
    body: JSON.stringify({ reason: 'All clear by faculty safety team' }),
  });
  if (facultyResolveRes.ok) {
    console.log('✓ Faculty resolved emergency alert successfully (200 OK)');
  } else {
    throw new Error(`Faculty failed to resolve alert: ${facultyResolveRes.status}`);
  }

  // 4. Admin detailed analytics verification
  const analyticsRes = await fetch(`${BASE_URL}/admin/analytics/detailed?range=30d`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  const analyticsData = (await analyticsRes.json()) as any;
  if (!analyticsRes.ok) throw new Error(`Analytics failed: ${JSON.stringify(analyticsData)}`);

  const d = analyticsData.data;
  if (!d.readership || typeof d.readership.penetrationRate !== 'number') {
    throw new Error('Missing or invalid readership in analytics data');
  }
  if (!d.evaluations || typeof d.evaluations.avgRating !== 'number') {
    throw new Error('Missing or invalid evaluations in analytics data');
  }
  if (!d.democracy || typeof d.democracy.turnoutRate !== 'number') {
    throw new Error('Missing or invalid democracy in analytics data');
  }
  if (d.files || (d.departments && d.departments.some((dept: any) => 'downloads' in dept))) {
    throw new Error('File downloads metric still found in analytics response!');
  }
  console.log('✓ Analytics endpoint verified: Readership, Evaluations, and Democracy metrics active');
  console.log(`  - Bulletin Readership Penetration: ${d.readership.penetrationRate}% (${d.readership.totalReads} reads)`);
  console.log(`  - Teaching Quality Benchmark: ${d.evaluations.avgRating} / 5.0 (Clarity: ${d.evaluations.avgClarity}, Pace: ${d.evaluations.avgPace})`);
  console.log(`  - Campus Civic Turnout: ${d.democracy.turnoutRate}% (${d.democracy.totalVotes} votes cast)`);

  // 5. Admin CSV export verification
  const exportRes = await fetch(`${BASE_URL}/admin/analytics/export`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  const exportCsv = await exportRes.text();
  if (!exportRes.ok) throw new Error(`Export failed: ${exportCsv}`);

  if (exportCsv.includes('ACADEMIC REPOSITORY ASSETS')) {
    throw new Error('CSV export still contains ACADEMIC REPOSITORY ASSETS!');
  }
  if (!exportCsv.includes('CAMPUS BULLETINS & READERSHIP REACH')) {
    throw new Error('CSV export missing CAMPUS BULLETINS & READERSHIP REACH!');
  }
  if (!exportCsv.includes('FACULTY TEACHING EVALUATIONS')) {
    throw new Error('CSV export missing FACULTY TEACHING EVALUATIONS!');
  }
  if (!exportCsv.includes('DEMOCRATIC CAMPUS POLLS & ELECTIONS')) {
    throw new Error('CSV export missing DEMOCRATIC CAMPUS POLLS & ELECTIONS!');
  }
  console.log('✓ CSV export verified: Zero file downloads, contains Bulletins, Evaluations, and Polls');

  // 6. Super Admin verification (Approvals + Dual-Scope Analytics)
  const superAdmin = await login('superadmin@nexora.edu', 'super123');
  console.log('✓ Super Admin logged in successfully');

  // A. Super Admin approvals queue (expect empty pendingUsers since Super Admin only does colleges)
  const superApprovalsRes = await fetch(`${BASE_URL}/approvals/pending`, {
    headers: { Authorization: `Bearer ${superAdmin.token}` },
  });
  const superApprovalsData = (await superApprovalsRes.json()) as any;
  if (!superApprovalsRes.ok || !Array.isArray(superApprovalsData.pendingUsers) || superApprovalsData.pendingUsers.length !== 0) {
    throw new Error(`Expected empty pendingUsers for Super Admin, got: ${JSON.stringify(superApprovalsData)}`);
  }
  console.log('✓ Super Admin correctly receives 0 individual user approvals (Campus approval handles admins/users)');

  // B. Super Admin Global Analytics (instituteId=ALL)
  const globalAnalyticsRes = await fetch(`${BASE_URL}/admin/analytics/detailed?instituteId=ALL&range=30d`, {
    headers: { Authorization: `Bearer ${superAdmin.token}` },
  });
  const globalAnalyticsData = (await globalAnalyticsRes.json()) as any;
  if (!globalAnalyticsRes.ok) throw new Error(`Global analytics failed: ${JSON.stringify(globalAnalyticsData)}`);

  const gd = globalAnalyticsData.data;
  if (gd.scope !== 'GLOBAL') throw new Error(`Expected scope GLOBAL, got ${gd.scope}`);
  if (!Array.isArray(gd.institutesMatrix) || gd.institutesMatrix.length === 0) {
    throw new Error('Missing or empty institutesMatrix in global analytics');
  }
  if (!gd.institutesSummary || typeof gd.institutesSummary.total !== 'number') {
    throw new Error('Missing or invalid institutesSummary in global analytics');
  }
  console.log('✓ Super Admin Global Analytics verified:');
  console.log(`  - Scope: ${gd.scope}`);
  console.log(`  - Connected Campuses: ${gd.institutesSummary.total} (${gd.institutesSummary.approved} active, ${gd.institutesSummary.pending} pending)`);
  console.log(`  - Multi-Campus Matrix Entries: ${gd.institutesMatrix.length} colleges`);
  console.log(`  - Cross-Campus Readership: ${gd.readership.penetrationRate}% (${gd.readership.totalReads} reads)`);

  // C. Super Admin Filtered Single-Campus Analytics (instituteId=<prpcem>)
  const firstInstId = gd.institutesMatrix[0].id;
  const singleCampusRes = await fetch(`${BASE_URL}/admin/analytics/detailed?instituteId=${firstInstId}&range=30d`, {
    headers: { Authorization: `Bearer ${superAdmin.token}` },
  });
  const singleCampusData = (await singleCampusRes.json()) as any;
  if (!singleCampusRes.ok || singleCampusData.data.scope !== 'CAMPUS' || !Array.isArray(singleCampusData.data.departments)) {
    throw new Error(`Single campus drill-down failed: ${JSON.stringify(singleCampusData)}`);
  }
  console.log(`✓ Super Admin single-campus drill-down verified for ${singleCampusData.data.instituteName} (${singleCampusData.data.departments.length} departments)`);

  // D. Super Admin Global CSV Export
  const globalExportRes = await fetch(`${BASE_URL}/admin/analytics/export?instituteId=ALL`, {
    headers: { Authorization: `Bearer ${superAdmin.token}` },
  });
  const globalExportCsv = await globalExportRes.text();
  if (!globalExportRes.ok || !globalExportCsv.includes('REGISTERED EDUCATIONAL INSTITUTES')) {
    throw new Error(`Global CSV export missing REGISTERED EDUCATIONAL INSTITUTES: ${globalExportCsv.slice(0, 300)}`);
  }
  console.log('✓ Super Admin Global CSV Export verified: contains REGISTERED EDUCATIONAL INSTITUTES');

  // 7. Global Users Filtering Verification
  const globalUsersRes = await fetch(`${BASE_URL}/admin/users?instituteId=ALL&page=1&limit=10`, {
    headers: { Authorization: `Bearer ${superAdmin.token}` },
  });
  const globalUsersData = (await globalUsersRes.json()) as any;
  if (!globalUsersRes.ok || !Array.isArray(globalUsersData.data)) {
    throw new Error(`Global users fetch failed: ${JSON.stringify(globalUsersData)}`);
  }
  console.log(`✓ Super Admin Global Users directory: ${globalUsersData.total} total network users`);

  // Filter by institute
  const filteredByInstRes = await fetch(`${BASE_URL}/admin/users?instituteId=${firstInstId}&page=1&limit=10`, {
    headers: { Authorization: `Bearer ${superAdmin.token}` },
  });
  const filteredByInstData = (await filteredByInstRes.json()) as any;
  if (!filteredByInstRes.ok || !Array.isArray(filteredByInstData.data)) {
    throw new Error(`Filtered users by institute failed: ${JSON.stringify(filteredByInstData)}`);
  }
  console.log(`✓ Super Admin users filtered by institute ${firstInstId}: ${filteredByInstData.total} members`);

  // Filter by department
  const filteredByDeptRes = await fetch(`${BASE_URL}/admin/users?department=Computer%20Science%20%26%20Engineering&page=1&limit=10`, {
    headers: { Authorization: `Bearer ${superAdmin.token}` },
  });
  const filteredByDeptData = (await filteredByDeptRes.json()) as any;
  if (!filteredByDeptRes.ok || !Array.isArray(filteredByDeptData.data)) {
    throw new Error(`Filtered users by department failed: ${JSON.stringify(filteredByDeptData)}`);
  }
  if (filteredByDeptData.data.some((u: any) => u.department && u.department !== 'Computer Science & Engineering')) {
    throw new Error('Found user outside filtered department!');
  }
  console.log(`✓ Super Admin users filtered by department "Computer Science & Engineering": ${filteredByDeptData.total} members`);

  console.log('\n--- ALL ROLE & ANALYTICS VERIFICATIONS PASSED ---');
}

run().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
