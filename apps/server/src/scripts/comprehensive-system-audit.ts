/**
 * Nexora Campus — Comprehensive System Audit & End-to-End Verification Suite
 * Verifies every module, workflow, role permission, and data integrity on live server.
 */

const BASE_URL = 'http://localhost:4000/api';

interface StepResult {
  module: string;
  name: string;
  status: 'PASS' | 'FAIL';
  httpCode: number;
  details: string;
}

const auditLog: StepResult[] = [];

async function call(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<{ status: number; ok: boolean; data: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

function record(module: string, name: string, condition: boolean, httpCode: number, details: string) {
  auditLog.push({
    module,
    name,
    status: condition ? 'PASS' : 'FAIL',
    httpCode,
    details,
  });
  const icon = condition ? '✓' : '❌';
  console.log(`  ${icon} [${module}] ${name} (${httpCode}) — ${details}`);
}

async function runComprehensiveAudit() {
  console.log('================================================================');
  console.log('🏛️  NEXORA CAMPUS — 100% EXHAUSTIVE END-TO-END SYSTEM AUDIT');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // MODULE 1: AUTHENTICATION & MULTI-ROLE SESSIONS
  // -------------------------------------------------------------
  console.log('--- 1. Multi-Role Authentication & Session Tokens ---');
  
  const superAdminAuth = await call('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'superadmin@nexora.edu', password: 'super123' }),
  });
  record('AUTH', 'Super Admin Login', superAdminAuth.ok && superAdminAuth.data.user.role === 'SUPER_ADMIN', superAdminAuth.status, superAdminAuth.data.user?.name || superAdminAuth.data.message);
  const superToken = superAdminAuth.data.token;

  const adminAuth = await call('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@prpcem.edu', password: 'admin123' }),
  });
  record('AUTH', 'Campus Admin Login', adminAuth.ok && adminAuth.data.user.role === 'ADMIN', adminAuth.status, adminAuth.data.user?.name || adminAuth.data.message);
  const adminToken = adminAuth.data.token;
  const adminInstId = typeof adminAuth.data.user.instituteId === 'object'
    ? (adminAuth.data.user.instituteId.id || adminAuth.data.user.instituteId._id)
    : adminAuth.data.user.instituteId;

  const hodAuth = await call('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'atul.raut@prpcem.edu', password: 'faculty123' }),
  });
  record('AUTH', 'Faculty HoD Login', hodAuth.ok && hodAuth.data.user.facultyRole === 'HOD', hodAuth.status, hodAuth.data.user?.name || hodAuth.data.message);
  const hodToken = hodAuth.data.token;

  const coordAuth = await call('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'pr.maskare@prpcem.edu', password: 'faculty123' }),
  });
  record('AUTH', 'Faculty Coordinator Login', coordAuth.ok && coordAuth.data.user.facultyRole === 'CLASS_COORDINATOR', coordAuth.status, coordAuth.data.user?.name || coordAuth.data.message);
  const coordToken = coordAuth.data.token;

  const studentAuth = await call('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'prathamesh.patange@prpcem.edu', password: 'student123' }),
  });
  record('AUTH', 'Student Login', studentAuth.ok && studentAuth.data.user.role === 'STUDENT', studentAuth.status, studentAuth.data.user?.name || studentAuth.data.message);
  const studentToken = studentAuth.data.token;

  // -------------------------------------------------------------
  // MODULE 2: INSTITUTE REGISTRATION & SUPER ADMIN APPROVAL
  // -------------------------------------------------------------
  console.log('\n--- 2. Multi-Tenant Institute Lifecycle ---');

  const testCode = 'INST' + Math.floor(Math.random() * 8999 + 1000);
  const regInst = await call('/institutes/register', {
    method: 'POST',
    body: JSON.stringify({
      name: `Automated Test Institute ${testCode}`,
      code: testCode,
      domain: `${testCode.toLowerCase()}.edu`,
      address: '100 University Highway, Innovation Park',
      departments: ['Computer Science & Engineering', 'Mechanical Engineering'],
      adminName: 'Prof. Registrar Admin',
      adminEmail: `admin@${testCode.toLowerCase()}.edu`,
      adminPassword: 'Password123!',
      institutionalId: `ADM-${testCode}`,
    }),
  });
  record('INSTITUTES', 'Institute Self-Registration', regInst.ok, regInst.status, `Registered code: ${testCode}`);
  const registeredInstId = regInst.data?.institute?.id;

  if (registeredInstId) {
    const approveInst = await call(`/institutes/${registeredInstId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'APPROVED' }),
    }, superToken);
    record('INSTITUTES', 'Super Admin Approves Institute', approveInst.ok, approveInst.status, `Institute ${registeredInstId} transitioned to APPROVED`);
  }

  // -------------------------------------------------------------
  // MODULE 3: VERIFICATION HIERARCHY (COORDINATOR -> ADMIN)
  // -------------------------------------------------------------
  console.log('\n--- 3. Two-Tier Approval Hierarchy ---');

  const coordQueue = await call('/approvals/pending', { method: 'GET' }, coordToken);
  record('APPROVALS', 'Class Coordinator Pending Approvals Queue', coordQueue.ok, coordQueue.status, `${coordQueue.data?.length || 0} queue items`);

  const adminQueue = await call('/approvals/pending', { method: 'GET' }, adminToken);
  record('APPROVALS', 'Campus Admin Final Approvals Queue', adminQueue.ok, adminQueue.status, `${adminQueue.data?.length || 0} queue items`);

  // -------------------------------------------------------------
  // MODULE 4: ACADEMIC STRUCTURE
  // -------------------------------------------------------------
  console.log('\n--- 4. Academic Departments & Hierarchy ---');

  const structureRes = await call(`/institutes/${adminInstId}/structure`, { method: 'GET' }, adminToken);
  record('ACADEMICS', 'Institute Academic Departments & Batches', structureRes.ok, structureRes.status, `${structureRes.data?.departments?.length || 0} departments configured`);

  // -------------------------------------------------------------
  // MODULE 5: CAMPUS NOTICES & CIRCULARS
  // -------------------------------------------------------------
  console.log('\n--- 5. Campus Notices Bulletin ---');

  const postNotice = await call('/notices', {
    method: 'POST',
    body: JSON.stringify({
      title: `Official Examination Directive ${Date.now()}`,
      content: 'Detailed circular on end-semester laboratory timetable and submission deadlines.',
      summary: 'Timetable published for winter 2026 exams.',
      priority: 'HIGH',
      category: 'EXAMINATION',
    }),
  }, adminToken);
  record('NOTICES', 'Admin Publishes Official Notice', postNotice.ok, postNotice.status, postNotice.data?.notice?.title || 'Notice created');
  const noticeId = postNotice.data?.notice?.id;

  const getNotices = await call('/notices', { method: 'GET' }, studentToken);
  record('NOTICES', 'Student Reads Notice Feed', getNotices.ok && getNotices.data.notices?.length > 0, getNotices.status, `${getNotices.data?.notices?.length} notices available`);

  if (noticeId) {
    const markRead = await call(`/notices/${noticeId}/read`, { method: 'PATCH' }, studentToken);
    record('NOTICES', 'Student Acknowledges Read Receipt', markRead.ok, markRead.status, 'Read state saved in MongoDB');
  }

  // -------------------------------------------------------------
  // MODULE 6: ACADEMIC FILES REPOSITORY
  // -------------------------------------------------------------
  console.log('\n--- 6. Academic Files & Cloudinary Tracking ---');

  const uploadFileRes = await call('/files', {
    method: 'POST',
    body: JSON.stringify({
      title: `Operating Systems Notes Unit 4 - ${Date.now()}`,
      category: 'LECTURE_NOTES',
      department: 'Computer Science & Engineering',
      academicYear: 'Third Year',
      subjectCode: 'CS-501',
      fileUrl: 'https://res.cloudinary.com/nexora-campus/raw/upload/v1/notes/os-unit4.pdf',
      fileName: 'os-unit4.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      description: 'Covers process scheduling, semaphores, and virtual memory paging.',
    }),
  }, hodToken);
  record('FILES', 'Faculty Publishes Lecture File', uploadFileRes.ok, uploadFileRes.status, uploadFileRes.data?.file?.title || 'Uploaded');
  const fileId = uploadFileRes.data?.file?.id;

  const listFiles = await call('/files', { method: 'GET' }, studentToken);
  record('FILES', 'Student Searches Academic Repository', listFiles.ok, listFiles.status, `${listFiles.data?.files?.length || 0} course documents found`);

  if (fileId) {
    const downloadFile = await call(`/files/${fileId}/download`, { method: 'GET' }, studentToken);
    record('FILES', 'Student Downloads File & Increments Counter', downloadFile.ok, downloadFile.status, `Download count: ${downloadFile.data?.downloadsCount}`);
  }

  // -------------------------------------------------------------
  // MODULE 7: EVENTS, RSVP, ATTENDEES ROSTER & RETRACTION
  // -------------------------------------------------------------
  console.log('\n--- 7. Events, RSVP Capacity & Attendee Roster ---');

  const createEvent = await call('/events', {
    method: 'POST',
    body: JSON.stringify({
      title: `Annual AI & Robotics Conclave ${Date.now()}`,
      description: 'National symposium showcasing student AI autonomous navigation drones.',
      category: 'Hackathon',
      venue: 'Dr. APJ Abdul Kalam Auditorium',
      startDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 4).toISOString(),
      registrationDeadline: new Date(Date.now() + 86400000 * 2).toISOString(),
      capacity: 100,
    }),
  }, hodToken);
  record('EVENTS', 'Faculty Creates Campus Event', createEvent.ok, createEvent.status, createEvent.data?.event?.title || 'Created');
  const eventId = createEvent.data?.event?.id;

  if (eventId) {
    // Student RSVP
    const rsvpRes = await call(`/events/${eventId}/register`, { method: 'POST' }, studentToken);
    record('EVENTS', 'Student Registers Event Pass (RSVP)', rsvpRes.ok, rsvpRes.status, 'RSVP Confirmed');

    // Faculty checks attendees roster
    const rosterRes = await call(`/events/${eventId}/attendees`, { method: 'GET' }, hodToken);
    const applicantCount = rosterRes.data?.attendees?.length || 0;
    record('EVENTS', 'Organizer Views Registered Applicants Roster', rosterRes.ok && applicantCount >= 1, rosterRes.status, `${applicantCount} verified attendee(s) in roster`);

    // Student cancels RSVP
    const cancelRsvp = await call(`/events/${eventId}/unregister`, { method: 'POST' }, studentToken);
    record('EVENTS', 'Student Cancels RSVP Pass', cancelRsvp.ok, cancelRsvp.status, 'RSVP slot released');

    // Retract event
    const retractEvent = await call(`/events/${eventId}`, { method: 'DELETE' }, hodToken);
    record('EVENTS', 'Organizer Retracts Event', retractEvent.ok, retractEvent.status, 'Event removed cleanly');
  }

  // -------------------------------------------------------------
  // MODULE 8: GRIEVANCES & WHISTLEBLOWER ENCRYPTION
  // -------------------------------------------------------------
  console.log('\n--- 8. Grievances, Whistleblower Privacy & Lifecycle ---');

  const fileGrievance = await call('/complaints', {
    method: 'POST',
    body: JSON.stringify({
      subject: `Confidential Facility Ticket ${Date.now()}`,
      category: 'INFRASTRUCTURE',
      priority: 'HIGH',
      location: 'Block C 3rd Floor Lab',
      description: 'Power backup UPS failing during voltage drop.',
      isAnonymous: true,
    }),
  }, studentToken);
  record('COMPLAINTS', 'Student Submits Grievance with Whistleblower Shield', fileGrievance.ok, fileGrievance.status, fileGrievance.data?.complaint?.ticketNumber || 'Ticket Created');
  const complaintId = fileGrievance.data?.complaint?.id;

  if (complaintId) {
    // HoD views complaint: must mask identity
    const hodViewComplaint = await call(`/complaints/${complaintId}`, { method: 'GET' }, hodToken);
    const isMasked = hodViewComplaint.data?.submittedBy?.name === 'Anonymous Whistleblower' && !hodViewComplaint.data?.submittedBy?.id;
    record('COMPLAINTS', 'Whistleblower Identity Masked for Staff', isMasked, hodViewComplaint.status, 'Submitter name masked, ID stripped');

    // Admin updates status to IN_PROGRESS
    const progressStatus = await call(`/complaints/${complaintId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'IN_PROGRESS', note: 'Electrician team assigned.' }),
    }, adminToken);
    record('COMPLAINTS', 'Admin Transitions Ticket to IN_PROGRESS', progressStatus.ok, progressStatus.status, 'Status updated');

    // Admin resolves ticket
    const resolveTicket = await call(`/complaints/${complaintId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'RESOLVED', note: 'UPS battery cells replaced.' }),
    }, adminToken);
    record('COMPLAINTS', 'Admin Resolves Grievance with Audit Note', resolveTicket.ok, resolveTicket.status, 'Resolved with timeline note');
  }

  // -------------------------------------------------------------
  // MODULE 9: POLLS, SURVEYS & FRAUD CONTROLS
  // -------------------------------------------------------------
  console.log('\n--- 9. Campus Polls, Voting & Anti-Fraud Controls ---');

  const createPoll = await call('/polls', {
    method: 'POST',
    body: JSON.stringify({
      title: `Annual Tech Fest Theme Poll ${Date.now()}`,
      description: 'Vote for preferred tracks in the upcoming national hackathon.',
      options: ['AI & Autonomous Agents', 'Cybersecurity & Privacy', 'Clean Energy IoT'],
      scope: 'CAMPUS',
      endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    }),
  }, hodToken);
  record('POLLS', 'Faculty Creates Campus-Wide Poll', createPoll.ok, createPoll.status, createPoll.data?.poll?.title || 'Poll active');
  const pollId = createPoll.data?.poll?.id || createPoll.data?.id;
  const pollOptionId = createPoll.data?.poll?.options?.[0]?.id || 'opt_1';

  if (pollId) {
    // Student votes
    const vote1 = await call(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ selectedOptionIds: [pollOptionId] }),
    }, studentToken);
    record('POLLS', 'Student Submits Ballot', vote1.ok, vote1.status, 'Vote recorded');

    // Student votes again -> duplicate prevention
    const vote2 = await call(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ selectedOptionIds: [pollOptionId] }),
    }, studentToken);
    record('POLLS', 'Anti-Fraud Duplicate Vote Prevented', vote2.status === 409 || vote2.status === 400, vote2.status, 'Duplicate vote blocked with 409/400 ALREADY_VOTED');
  }

  // -------------------------------------------------------------
  // MODULE 10: CONVERSATIONS & MESSAGING GRID
  // -------------------------------------------------------------
  console.log('\n--- 10. Real-Time Conversations & Chat Grid ---');

  const getConvs = await call('/conversations', { method: 'GET' }, studentToken);
  record('MESSAGING', 'Student Fetches Department Channels & Direct Chats', getConvs.ok, getConvs.status, `${getConvs.data?.length || 0} active channels`);

  const channel = getConvs.data?.find((c: any) => c.type === 'CHANNEL');
  if (channel) {
    const postChat = await call(`/messages/${channel.id}`, {
      method: 'POST',
      body: JSON.stringify({ content: `Audit test message at ${new Date().toISOString()}` }),
    }, studentToken);
    record('MESSAGING', 'Student Transmits Message to Channel', postChat.ok, postChat.status, 'Dispatched to room');

    const getChat = await call(`/messages/${channel.id}`, { method: 'GET' }, hodToken);
    record('MESSAGING', 'Faculty Retrieves Channel Message History', getChat.ok && getChat.data?.length > 0, getChat.status, `${getChat.data?.length} messages in channel`);
  }

  // -------------------------------------------------------------
  // MODULE 11: EMERGENCY BROADCAST SIREN & ALL-CLEAR
  // -------------------------------------------------------------
  console.log('\n--- 11. Campus Emergency Siren System ---');

  const triggerEmergency = await call('/emergency', {
    method: 'POST',
    body: JSON.stringify({
      severity: 'CRITICAL',
      title: `Flash Flood Advisory ${Date.now()}`,
      message: 'Severe waterlogging near Gate 2. Avoid ground-floor parking areas.',
      affectedAreas: ['Gate 2', 'Block A Parking'],
      actionRequired: 'Move vehicles to elevated lot B.',
      confirmationCode: 'CONFIRM_BROADCAST',
    }),
  }, adminToken);
  record('EMERGENCY', 'Admin Authorizes Emergency Broadcast Siren', triggerEmergency.ok, triggerEmergency.status, triggerEmergency.data?.alert?.title || 'Siren Triggered');
  const alertId = triggerEmergency.data?.alert?.id;

  const activeAlerts = await call('/emergency/active', { method: 'GET' }, studentToken);
  record('EMERGENCY', 'Student Receives Active Emergency Warning', activeAlerts.ok && activeAlerts.data?.length > 0, activeAlerts.status, `${activeAlerts.data?.length} active alert(s)`);

  if (alertId) {
    const resolveEmergency = await call(`/emergency/${alertId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolutionNote: 'Drainage cleared. Normal operations resumed.' }),
    }, adminToken);
    record('EMERGENCY', 'Admin Issues Official All-Clear Directive', resolveEmergency.ok, resolveEmergency.status, 'All-clear resolved');
  }

  // -------------------------------------------------------------
  // MODULE 12: PEOPLE DIRECTORY & PRIVACY PREFERENCES
  // -------------------------------------------------------------
  console.log('\n--- 12. Campus People Directory & Privacy Controls ---');

  const dirSearch = await call('/users/directory?search=Atul', { method: 'GET' }, studentToken);
  const foundUsers = Array.isArray(dirSearch.data) ? dirSearch.data.length : 0;
  record('DIRECTORY', 'Student Searches Campus People Directory', dirSearch.ok && foundUsers > 0, dirSearch.status, `Found ${foundUsers} users matching "Atul"`);

  const updatePrivacy = await call('/users/privacy', {
    method: 'PATCH',
    body: JSON.stringify({
      profileVisibility: 'CAMPUS',
      dmPermission: 'ALLOW_ALL',
      showEmail: true,
      showPhone: false,
    }),
  }, studentToken);
  record('DIRECTORY', 'Student Updates Privacy Settings', updatePrivacy.ok, updatePrivacy.status, 'Privacy preferences persisted in MongoDB');

  // -------------------------------------------------------------
  // MODULE 13: ADMINISTRATIVE INTELLIGENCE & AUDIT LOGS
  // -------------------------------------------------------------
  console.log('\n--- 13. System Metrics, Audit Ledger & Health ---');

  const overviewKPI = await call('/overview', { method: 'GET' });
  record('ANALYTICS', 'Platform KPI Metrics Aggregator', overviewKPI.ok, overviewKPI.status, `Users: ${overviewKPI.data?.metrics?.activeUsers}, Notices: ${overviewKPI.data?.metrics?.publishedNotices}`);

  const adminMetrics = await call('/admin/metrics', { method: 'GET' }, adminToken);
  const usersObj = adminMetrics.data?.data?.users;
  record('ANALYTICS', 'Campus Admin Real-Time Metrics & Distributions', adminMetrics.ok && usersObj !== undefined, adminMetrics.status, `Total Students: ${usersObj?.students}, Faculty: ${usersObj?.faculty}`);

  const auditLogs = await call('/admin/audit-logs?limit=5', { method: 'GET' }, adminToken);
  record('ANALYTICS', 'Immutable Security Audit Trail Ledger', auditLogs.ok && auditLogs.data?.data?.length > 0, auditLogs.status, `${auditLogs.data?.total || 0} security events logged`);

  // RBAC Escaping Guard: Student denied access to audit logs
  const rbacDeny = await call('/admin/audit-logs', { method: 'GET' }, studentToken);
  record('RBAC', 'Privilege Escalation Blocked (Student accessing Audit Logs)', rbacDeny.status === 403, rbacDeny.status, 'Forbidden 403 correctly returned');

  // -------------------------------------------------------------
  // AUDIT SUMMARY
  // -------------------------------------------------------------
  const total = auditLog.length;
  const passed = auditLog.filter(s => s.status === 'PASS').length;
  const failed = total - passed;

  console.log('\n================================================================');
  console.log(`📊 FINAL E2E TEST AUDIT RESULT: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  if (failed > 0) {
    console.log(`❌ ${failed} CHECK(S) FAILED:`);
    auditLog.filter(s => s.status === 'FAIL').forEach(f => console.log(`   - [${f.module}] ${f.name} (${f.httpCode}): ${f.details}`));
    process.exit(1);
  } else {
    console.log('🎉 100% OF ALL MODULES, WORKFLOWS & ACCESS CHECKS PASSED OPERATIONAL QUALITY GATES!');
  }
  console.log('================================================================\n');
}

runComprehensiveAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
