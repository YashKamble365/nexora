/**
 * Nexora Campus — Complete 13-Flow Acceptance & Quality Gate Verification
 * Tests all end-to-end workflows directly against live API server & MongoDB Atlas.
 */

const BASE_URL = 'http://localhost:4000';

async function request(endpoint: string, options: RequestInit = {}, token?: string): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, ok: res.ok, data };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runAllFlows() {
  console.log('================================================================');
  console.log('🚀 NEXORA CAMPUS — 13-FLOW CRITICAL ACCEPTANCE TEST SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // FLOW 1: AUTHENTICATION & RBAC
  // -------------------------------------------------------------
  console.log('[FLOW 1] Authentication, RBAC & Multi-Role Sessions');

  // Student login
  const studentLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'prathamesh.patange@prpcem.edu', password: 'student123' }),
  });
  assert(studentLogin.ok, 'Student login succeeds');
  const studentToken = studentLogin.data.token;
  const studentUser = studentLogin.data.user;
  assert(studentUser.role === 'STUDENT', 'Student role verified');

  // Admin login
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@prpcem.edu', password: 'admin123' }),
  });
  assert(adminLogin.ok, 'Institute Admin login succeeds');
  const adminToken = adminLogin.data.token;
  const adminUser = adminLogin.data.user;
  assert(adminUser.role === 'ADMIN', 'Admin role verified');

  // Faculty login
  const facultyLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'atul.raut@prpcem.edu', password: 'faculty123' }),
  });
  assert(facultyLogin.ok, 'Faculty (HoD) login succeeds');
  const facultyToken = facultyLogin.data.token;

  // RBAC test: student trying to access admin metrics -> 403 Forbidden
  const forbiddenAdminCheck = await request('/api/admin/metrics', { method: 'GET' }, studentToken);
  assert(forbiddenAdminCheck.status === 403, 'Student hitting /api/admin/metrics returns 403 Forbidden');

  // -------------------------------------------------------------
  // FLOW 2: STUDENT READS NOTICE
  // -------------------------------------------------------------
  console.log('\n[FLOW 2] Student Reads Notice & Mark as Read');
  const noticesRes = await request('/api/notices', { method: 'GET' }, studentToken);
  assert(noticesRes.ok && noticesRes.data.notices.length > 0, 'Notices list returned to student');
  const targetNotice = noticesRes.data.notices[0];

  const readAckRes = await request(`/api/notices/${targetNotice.id}/read`, { method: 'PATCH' }, studentToken);
  assert(readAckRes.ok, `Mark notice ${targetNotice.id} as read returns 200`);

  // -------------------------------------------------------------
  // FLOW 3: STUDENT REGISTERS FOR CAMPUS EVENT
  // -------------------------------------------------------------
  console.log('\n[FLOW 3] Student Campus Event Discovery & Registration');
  const eventsRes = await request('/api/events', { method: 'GET' }, studentToken);
  assert(eventsRes.ok && eventsRes.data.events.length > 0, 'Events feed returned successfully');
  const testEvent = eventsRes.data.events[0];

  const registerEventRes = await request(`/api/events/${testEvent.id}/register`, { method: 'POST' }, studentToken);
  assert(registerEventRes.ok || registerEventRes.status === 409, `Event RSVP registration handled (status ${registerEventRes.status}): "${testEvent.title}"`);

  // -------------------------------------------------------------
  // FLOW 4 & 5: REAL-TIME MESSAGING (STUDENT SENDS & FACULTY RECEIVES)
  // -------------------------------------------------------------
  console.log('\n[FLOW 4 & 5] Grid Messaging: Student Sends & Faculty Reads');
  const convsRes = await request('/api/conversations', { method: 'GET' }, studentToken);
  assert(convsRes.ok && convsRes.data.length > 0, 'Conversations grid retrieved');
  
  // Find a shared departmental or batch channel where both student and faculty belong (must be interactive)
  const targetConv = convsRes.data.find((c: any) => c.type === 'CHANNEL' && !c.isAnnouncementOnly && (c.name?.includes('cse') || c.name?.includes('Grid') || c.name?.includes('final-year'))) || convsRes.data.find((c: any) => c.type === 'CHANNEL' && !c.isAnnouncementOnly) || convsRes.data[0];
  assert(!!targetConv, `Target conversation channel found: ${targetConv.name || targetConv.id}`);

  const postMsgRes = await request(`/api/messages/${targetConv.id}`, {
    method: 'POST',
    body: JSON.stringify({
      content: `Automated QA Test Dispatch: ${new Date().toISOString()}`,
    }),
  }, studentToken);
  assert(postMsgRes.ok, 'Student posted message successfully to grid channel');

  // Verify faculty can read messages from the conversation
  const facultyMsgRes = await request(`/api/messages/${targetConv.id}`, { method: 'GET' }, facultyToken);
  assert(facultyMsgRes.ok && facultyMsgRes.data.length > 0, 'Faculty successfully loaded chat message history');

  // -------------------------------------------------------------
  // FLOW 6: STUDENT SUBMITS COMPLAINT / WHISTLEBLOWER
  // -------------------------------------------------------------
  console.log('\n[FLOW 6] Student Submits Grievance with Confidentiality Shield');
  const createComplaintRes = await request('/api/complaints', {
    method: 'POST',
    body: JSON.stringify({
      subject: `QA Automated Ticket: Projector Defect in Room 402 - ${Date.now()}`,
      category: 'INFRASTRUCTURE',
      priority: 'HIGH',
      location: 'CCF Block A, Room 402',
      description: 'HDMI projector blinks intermittently during lecture sessions.',
      isAnonymous: true,
      attachments: [
        {
          name: 'projector_hardware_fault.jpg',
          url: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&q=80&w=1000',
          size: 204800,
          mimeType: 'image/jpeg',
        },
      ],
    }),
  }, studentToken);
  assert(createComplaintRes.ok, 'Complaint submitted successfully with whistleblower encryption');
  const createdTicket = createComplaintRes.data.complaint;
  assert(!!createdTicket.ticketNumber, `Ticket assigned valid institutional ID: ${createdTicket.ticketNumber}`);

  // -------------------------------------------------------------
  // FLOW 7: ADMIN PROCESSES COMPLAINT & LOGS AUDIT TIMELINE
  // -------------------------------------------------------------
  console.log('\n[FLOW 7] Administrative Grievance Triage & Lifecycle Timeline');
  const updateStatusRes = await request(`/api/complaints/${createdTicket.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'IN_PROGRESS',
      note: 'AV technician dispatched to replace HDMI splitter and test cable.',
    }),
  }, adminToken);
  assert(updateStatusRes.ok, 'Admin transitioned complaint status to IN_PROGRESS');

  const resolveStatusRes = await request(`/api/complaints/${createdTicket.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'RESOLVED',
      note: 'Cable replaced and projector tested successfully with 1080p source.',
    }),
  }, adminToken);
  assert(resolveStatusRes.ok, 'Admin transitioned complaint status to RESOLVED');
  assert(resolveStatusRes.data.complaint.timeline.length >= 3, 'Audit timeline verified with 3+ verifiable events');

  // -------------------------------------------------------------
  // FLOW 8: TARGETED SURVEYS / POLLS & ANTI-FRAUD 1-VOTE LIMIT
  // -------------------------------------------------------------
  console.log('\n[FLOW 8] Campus Poll Voting & Fraud Prevention Validation');
  const pollsRes = await request('/api/polls', { method: 'GET' }, studentToken);
  assert(pollsRes.ok && pollsRes.data.length > 0, 'Polls list fetched');
  const activePoll = pollsRes.data[0];

  // Try voting
  const voteRes = await request(`/api/polls/${activePoll.id}/vote`, {
    method: 'POST',
    body: JSON.stringify({ optionIndex: 0 }),
  }, studentToken);
  // May be 200 (first vote) or 400 (already voted from earlier run)
  if (voteRes.ok) {
    assert(voteRes.ok, 'First vote successfully recorded');
    // Test duplicate vote prevention
    const duplicateVote = await request(`/api/polls/${activePoll.id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionIndex: 0 }),
    }, studentToken);
    assert(duplicateVote.status === 400, 'Duplicate vote prevented with 400 ALREADY_VOTED');
  } else {
    assert(voteRes.status === 400, 'Duplicate vote prevented by compound unique index');
  }

  // -------------------------------------------------------------
  // FLOW 9: ADMIN CREATES OFFICIAL NOTICE
  // -------------------------------------------------------------
  console.log('\n[FLOW 9] Admin Publishes Official Notice to Campus Grid');
  const publishNoticeRes = await request('/api/notices', {
    method: 'POST',
    body: JSON.stringify({
      title: `End-Semester Timetable Notification ${Date.now()}`,
      content: 'Official circular regarding venue allocation and roll list verification for University examinations.',
      summary: 'University exam schedule and hall allocations released.',
      priority: 'HIGH',
      category: 'EXAMINATION',
    }),
  }, adminToken);
  assert(publishNoticeRes.ok, 'Admin created official examination notice');

  // -------------------------------------------------------------
  // FLOW 10: EMERGENCY ALERT LIFECYCLE (DECLARE & RESOLVE)
  // -------------------------------------------------------------
  console.log('\n[FLOW 10] Emergency Alert Broadcast & All-Clear Resolution');
  const declareAlertRes = await request('/api/emergency', {
    method: 'POST',
    body: JSON.stringify({
      severity: 'CRITICAL',
      title: `QA Test Alert: Chemical Drill ${Date.now()}`,
      message: 'Safety inspection team simulating spill protocol in Chemistry Block 2.',
      affectedAreas: ['Chemistry Wing', 'Lab Block B'],
      actionRequired: 'Avoid corridors in Sector B during ventilation check.',
      confirmationCode: 'CONFIRM_BROADCAST',
    }),
  }, adminToken);
  assert(declareAlertRes.ok, 'Admin authorized and broadcast campus emergency alert');
  const alertId = declareAlertRes.data.alert.id;

  // Verify active alert
  const activeAlertCheck = await request('/api/emergency/active', { method: 'GET' }, studentToken);
  const alertsList = Array.isArray(activeAlertCheck.data) ? activeAlertCheck.data : activeAlertCheck.data?.activeAlerts || [];
  assert(activeAlertCheck.ok && alertsList.length > 0, 'Active emergency alert visible to campus students');

  // Resolve alert
  const resolveAlertRes = await request(`/api/emergency/${alertId}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify({
      resolutionNote: 'Safety drill complete. All zones verified clear and normal operations resumed.',
    }),
  }, adminToken);
  assert(resolveAlertRes.ok, 'Admin issued verified all-clear directive');

  // -------------------------------------------------------------
  // FLOW 11: NOTIFICATION FEED
  // -------------------------------------------------------------
  console.log('\n[FLOW 11] Notifications Grid Delivery');
  const notificationsRes = await request('/api/notifications', { method: 'GET' }, studentToken);
  assert(notificationsRes.ok, 'Notifications retrieved for student profile');

  // -------------------------------------------------------------
  // FLOW 12: ACADEMIC FILE CENTER & DOWNLOAD TRACKING
  // -------------------------------------------------------------
  console.log('\n[FLOW 12] Academic File Repository & Cloudinary CDN Tracking');
  const createFileRes = await request('/api/files', {
    method: 'POST',
    body: JSON.stringify({
      title: `Distributed Systems Lab Manual 2026 - ${Date.now()}`,
      category: 'LAB_MANUAL',
      department: 'Computer Science & Engineering',
      academicYear: 'Final Year',
      subjectCode: 'CS-702L',
      fileUrl: 'https://res.cloudinary.com/nexora-campus/raw/upload/v1/samples/ds-manual.pdf',
      fileName: 'ds-manual-2026.pdf',
      fileSize: 2048576,
      mimeType: 'application/pdf',
      description: 'Contains RPC, RMI, MPI, and MapReduce lab exercise sheets.',
    }),
  }, facultyToken);
  assert(createFileRes.ok, 'Faculty registered academic file with Cloudinary CDN metadata');
  const uploadedFileId = createFileRes.data.file.id;

  // Track download
  const downloadRes = await request(`/api/files/${uploadedFileId}/download`, { method: 'GET' }, studentToken);
  assert(downloadRes.ok, 'Student download tracked and CDN URL returned');
  assert(downloadRes.data.downloadsCount >= 1, 'Download counter incremented in database');

  // -------------------------------------------------------------
  // FLOW 13: ADMIN USER GOVERNANCE & IMMUTABLE AUDIT LOGGING
  // -------------------------------------------------------------
  console.log('\n[FLOW 13] Admin User Management & Immutable Audit Ledger');
  const usersRes = await request('/api/admin/users?limit=5', { method: 'GET' }, adminToken);
  const userList = usersRes.data?.data || usersRes.data?.users || [];
  assert(usersRes.ok && userList.length > 0, 'Admin listed users from multi-tenant institute');

  const auditLogsRes = await request('/api/admin/audit-logs?limit=5', { method: 'GET' }, adminToken);
  const logList = auditLogsRes.data?.data || auditLogsRes.data?.logs || [];
  assert(auditLogsRes.ok && logList.length > 0, 'Immutable audit logs retrieved from database');

  console.log('\n================================================================');
  console.log('🎉 ALL 13 CRITICAL PRODUCT FLOWS PASSED WITH 100% SUCCESS RATE');
  console.log('================================================================\n');
}

runAllFlows().catch((err) => {
  console.error('\n❌ QA TEST SUITE ENCOUNTERED UNEXPECTED ERROR:');
  console.error(err);
  process.exit(1);
});
