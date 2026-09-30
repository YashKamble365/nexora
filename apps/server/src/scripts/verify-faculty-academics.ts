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
  console.log('--- STARTING VERIFICATION: FACULTY ACADEMICS & HOD WORKFLOWS ---');

  // 1. Log in users
  const admin = await login('admin@prpcem.edu', 'admin123');
  const hod = await login('atul.raut@prpcem.edu', 'faculty123');
  const faculty = await login('pr.maskare@prpcem.edu', 'faculty123');
  const student = await login('prathamesh.patange@prpcem.edu', 'student123');

  console.log('✓ HoD, Admin, Faculty, Student logged in successfully');
  const instituteId = typeof hod.user.instituteId === 'object' ? (hod.user.instituteId.id || hod.user.instituteId._id) : hod.user.instituteId;

  // 2. HoD adds department curriculum subject
  console.log('\n--- 1. HoD CURRICULUM SUBJECT MANAGEMENT ---');
  const addSubjectRes = await fetch(`${BASE_URL}/institutes/${instituteId}/subjects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hod.token}`,
    },
    body: JSON.stringify({
      department: 'Computer Science & Engineering',
      name: 'Cloud Computing & DevOps',
      code: 'CSE401',
      academicYear: 'Final Year',
      semester: 'Semester 7',
    }),
  });
  if (!addSubjectRes.ok) {
    throw new Error(`Failed to add subject as HoD: ${await addSubjectRes.text()}`);
  }
  const subjectResult = (await addSubjectRes.json()) as any;
  console.log('✓ HoD successfully added subject to departmental catalog:', subjectResult.subject?.name);

  // Cross-department check: HoD cannot add subject to Mechanical Engineering
  const crossDeptRes = await fetch(`${BASE_URL}/institutes/${instituteId}/subjects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hod.token}`,
    },
    body: JSON.stringify({
      department: 'Mechanical Engineering',
      name: 'Thermodynamics II',
      academicYear: 'Third Year',
      semester: 'Semester 5',
    }),
  });
  if (crossDeptRes.status === 403) {
    console.log('✓ HoD correctly blocked from adding subject to other department (403 Forbidden)');
  } else {
    throw new Error(`Expected 403 for cross-department subject addition, got ${crossDeptRes.status}`);
  }

  // 3. Faculty multi-class & multi-subject teaching assignments
  console.log('\n--- 2. FACULTY TEACHING ASSIGNMENTS (MULTI-CLASS/MULTI-SUBJECT) ---');
  const updateAssignmentsRes = await fetch(`${BASE_URL}/users/profile/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${faculty.token}`,
    },
    body: JSON.stringify({
      teachingAssignments: [
        {
          department: 'Computer Science & Engineering',
          academicYear: 'Final Year',
          semester: 'Semester 7',
          subjectName: 'Cloud Computing & DevOps',
          subjectCode: 'CSE401',
        },
        {
          department: 'Computer Science & Engineering',
          academicYear: 'Third Year',
          semester: 'Semester 5',
          subjectName: 'Database Management Systems',
          subjectCode: 'CSE301',
        },
      ],
    }),
  });
  if (!updateAssignmentsRes.ok) {
    throw new Error(`Failed to update teaching assignments: ${await updateAssignmentsRes.text()}`);
  }
  const updatedResData = (await updateAssignmentsRes.json()) as any;
  const updatedFaculty = updatedResData.user || updatedResData;
  if (updatedFaculty.teachingAssignments?.length === 2) {
    console.log('✓ Faculty updated multiple teaching assignments across years & semesters:');
    updatedFaculty.teachingAssignments.forEach((a: any) => {
      console.log(`   - ${a.academicYear} | ${a.semester} | ${a.subjectName} (${a.subjectCode})`);
    });
  } else {
    throw new Error('Teaching assignments length mismatch');
  }

  // 4. Faculty registration with assignments & HoD approval of pending faculty
  console.log('\n--- 3. FACULTY REGISTRATION & HOD FACULTY APPROVAL ---');
  const testFacEmail = `pending.faculty.${Date.now()}@prpcem.edu`;
  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Prof. Test NewFaculty',
      email: testFacEmail,
      password: 'password123',
      role: 'FACULTY',
      facultyRole: 'ASSISTANT_PROFESSOR',
      instituteId: instituteId,
      department: 'Computer Science & Engineering',
      institutionalId: `FAC-TEST-${Date.now().toString().slice(-4)}`,
      teachingAssignments: [
        {
          department: 'Computer Science & Engineering',
          academicYear: 'Second Year',
          semester: 'Semester 3',
          subjectName: 'Object Oriented Programming',
          subjectCode: 'CSE201',
        },
      ],
    }),
  });
  if (!registerRes.ok) {
    throw new Error(`Failed to register test faculty: ${await registerRes.text()}`);
  }
  const registeredFac = (await registerRes.json()) as any;
  console.log('✓ New faculty registered with teaching assignment. Status:', registeredFac.user?.status);

  // HoD views pending approvals
  const pendingApprovalsRes = await fetch(`${BASE_URL}/approvals/pending`, {
    headers: { Authorization: `Bearer ${hod.token}` },
  });
  const pendingList = (await pendingApprovalsRes.json()) as any;
  const foundPendingFac = pendingList.pendingUsers?.find((u: any) => u.email === testFacEmail);
  if (!foundPendingFac) {
    throw new Error('HoD cannot see pending departmental faculty in approval queue');
  }
  console.log('✓ HoD successfully sees pending faculty in departmental approval queue');

  // HoD approves the pending faculty
  const approveRes = await fetch(`${BASE_URL}/approvals/users/${foundPendingFac.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hod.token}`,
    },
    body: JSON.stringify({ status: 'ACTIVE' }),
  });
  if (!approveRes.ok) {
    throw new Error(`HoD failed to approve faculty: ${await approveRes.text()}`);
  }
  console.log('✓ HoD successfully approved departmental faculty to ACTIVE status');

  // 5. Auto-scoped academic files
  console.log('\n--- 4. AUTO-SCOPED ACADEMIC FILES & ACCESS CONTROL ---');
  // Upload a file scoped to Final Year, Semester 7, Cloud Computing & DevOps
  const uploadRes = await fetch(`${BASE_URL}/files`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${faculty.token}`,
    },
    body: JSON.stringify({
      title: 'Lecture 1: Distributed Architectures',
      category: 'LECTURE_NOTES',
      scope: 'CLASS',
      department: 'Computer Science & Engineering',
      academicYear: 'Final Year',
      semester: 'Semester 7',
      subjectName: 'Cloud Computing & DevOps',
      fileUrl: 'https://res.cloudinary.com/nexora-campus/raw/upload/v1/samples/cloud_notes.pdf',
      fileName: 'cloud_notes.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      description: 'Distributed Architectures notes for Sem 7',
    }),
  });
  if (!uploadRes.ok) {
    throw new Error(`File upload failed: ${await uploadRes.text()}`);
  }
  const uploadedFileData = (await uploadRes.json()) as any;
  const uploadedFile = uploadedFileData.file || uploadedFileData;
  console.log('✓ Faculty uploaded academic file scoped to subject:', uploadedFile.subjectName, '| Sem:', uploadedFile.semester);

  // Student (Final Year CSE) queries files with semester filter
  const studentFilesRes = await fetch(`${BASE_URL}/files?semester=Semester%207&department=Computer%20Science%20%26%20Engineering`, {
    headers: { Authorization: `Bearer ${student.token}` },
  });
  const studentFilesData = (await studentFilesRes.json()) as any;
  const fileList = Array.isArray(studentFilesData) ? studentFilesData : (studentFilesData.files || []);
  const matchFile = fileList.find((f: any) => f.id === uploadedFile.id);
  if (!matchFile) {
    throw new Error('Enrolled student unable to see auto-scoped subject academic note');
  }
  console.log('✓ Enrolled student (Final Year Sem 7) successfully retrieved auto-scoped note');

  // Query with mismatched semester: should return empty / not contain file
  const otherSemRes = await fetch(`${BASE_URL}/files?semester=Semester%203&department=Computer%20Science%20%26%20Engineering`, {
    headers: { Authorization: `Bearer ${student.token}` },
  });
  const otherFilesData = (await otherSemRes.json()) as any;
  const otherList = Array.isArray(otherFilesData) ? otherFilesData : (otherFilesData.files || []);
  const wrongMatch = otherList.find((f: any) => f.id === uploadedFile.id);
  if (wrongMatch) {
    throw new Error('Student accessed note from wrong semester');
  }
  console.log('✓ Scoping verified: file filtered out for other semesters');

  // 6. Broadcast Channel with 'SUBJECT' scope
  console.log('\n--- 5. CLASS & SUBJECT SCOPED BROADCAST CHANNEL ---');
  const channelRes = await fetch(`${BASE_URL}/conversations/channels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${faculty.token}`,
    },
    body: JSON.stringify({
      name: 'cloud-computing-announcements',
      description: 'Official announcements for Final Year CSE Sem 7 Cloud Computing',
      scope: 'SUBJECT',
      department: 'Computer Science & Engineering',
      academicYear: 'Final Year',
      semester: 'Semester 7',
      subjectName: 'Cloud Computing & DevOps',
      isAnnouncementOnly: true,
    }),
  });
  if (!channelRes.ok) {
    throw new Error(`Failed to create SUBJECT broadcast channel: ${await channelRes.text()}`);
  }
  const channel = (await channelRes.json()) as any;
  console.log('✓ Faculty created SUBJECT-scoped broadcast channel:', channel.name, '| Scope:', channel.scope);

  // Check student channels
  const studentConversationsRes = await fetch(`${BASE_URL}/conversations`, {
    headers: { Authorization: `Bearer ${student.token}` },
  });
  const studentConvsData = (await studentConversationsRes.json()) as any;
  const convList = Array.isArray(studentConvsData) ? studentConvsData : (studentConvsData.conversations || []);
  const foundChannel = convList.find((c: any) => c.id === channel.id);
  if (!foundChannel) {
    throw new Error('Enrolled student was not auto-included in SUBJECT-scoped broadcast channel');
  }
  console.log('✓ Enrolled student automatically included in SUBJECT-scoped broadcast audience');

  // 7. Faculty Ratings, Anti-Fraud Duplicate Guard & Monthly Reminders
  console.log('\n--- 6. FACULTY RATINGS & ANTI-FRAUD SAFEGUARDS ---');
  // Student checks reminder status
  const reminderRes = await fetch(`${BASE_URL}/feedback/reminder-status`, {
    headers: { Authorization: `Bearer ${student.token}` },
  });
  const reminderData = (await reminderRes.json()) as any;
  console.log('✓ Student monthly reminder status fetched. Has teaching faculty:', reminderData.facultyToRate?.length > 0);

  // Submit first rating for faculty
  const ratingRes = await fetch(`${BASE_URL}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${student.token}`,
    },
    body: JSON.stringify({
      targetFacultyId: faculty.user.id,
      courseName: 'Cloud Computing & DevOps',
      rating: 5,
      comment: 'Exceptional lab hands-on sessions and real-world Docker demonstrations.',
      isAnonymous: false,
    }),
  });
  if (!ratingRes.ok) {
    throw new Error(`Failed to submit faculty rating: ${await ratingRes.text()}`);
  }
  console.log('✓ Student successfully submitted 5-star course evaluation for faculty');

  // Anti-fraud test: Duplicate review by same student for same faculty and course
  const dupRatingRes = await fetch(`${BASE_URL}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${student.token}`,
    },
    body: JSON.stringify({
      targetFacultyId: faculty.user.id,
      courseName: 'Cloud Computing & DevOps',
      rating: 1,
      comment: 'Attempted duplicate rating spam',
      isAnonymous: false,
    }),
  });
  if (dupRatingRes.status === 409) {
    console.log('✓ Anti-fraud duplicate rating check passed (409 Conflict returned)');
  } else {
    throw new Error(`Expected 409 for duplicate review, got ${dupRatingRes.status}`);
  }

  // Check faculty profile ratings calculation
  const profileRes = await fetch(`${BASE_URL}/users/profile/${faculty.user.id}`, {
    headers: { Authorization: `Bearer ${student.token}` },
  });
  const profileData = (await profileRes.json()) as any;
  const ratingInfo = profileData.user?.facultyRating || profileData.facultyRating;
  if (ratingInfo && ratingInfo.totalReviews >= 1) {
    console.log('✓ Faculty profile rating aggregate computed dynamically:');
    console.log(`   - Average Score: ${ratingInfo.averageRating}/5.0`);
    console.log(`   - Total Evaluations: ${ratingInfo.totalReviews}`);
    console.log(`   - Clarity Average: ${ratingInfo.clarityAverage}/5.0`);
    console.log(`   - Pace Average: ${ratingInfo.paceAverage}/5.0`);
  } else {
    throw new Error(`Faculty rating aggregate not populated on profile: ${JSON.stringify(profileData)}`);
  }

  console.log('\n======================================================');
  console.log('ALL FACULTY ACADEMICS & HOD FEATURES VERIFIED SUCCESSFULLY!');
  console.log('======================================================');
}

run().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
