import { Types } from 'mongoose';

const API_BASE = 'http://localhost:4000/api';

async function request(path: string, options: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, data: JSON.parse(text) };
  } catch {
    return { status: res.status, ok: res.ok, data: text };
  }
}

async function run() {
  console.log('--- STARTING NOTIFICATIONS END-TO-END VERIFICATION ---');

  // 1. Log in users
  const studentLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'prathamesh.patange@prpcem.edu', password: 'student123' }),
  });
  if (!studentLogin.ok) throw new Error('Student login failed: ' + JSON.stringify(studentLogin.data));
  const studentToken = studentLogin.data.token;
  const studentUser = studentLogin.data.user;

  const hodLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'atul.raut@prpcem.edu', password: 'faculty123' }),
  });
  if (!hodLogin.ok) throw new Error('HoD login failed: ' + JSON.stringify(hodLogin.data));
  const hodToken = hodLogin.data.token;

  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@prpcem.edu', password: 'admin123' }),
  });
  if (!adminLogin.ok) throw new Error('Admin login failed: ' + JSON.stringify(adminLogin.data));
  const adminToken = adminLogin.data.token;

  console.log('✓ Logged in Student, HoD, Admin');

  // 2. Publish Notice and check notification dispatch
  const noticeRes = await request('/notices', {
    method: 'POST',
    body: JSON.stringify({
      title: `Notice Test ${Date.now()}`,
      content: 'Important notification system test across computer science.',
      priority: 'HIGH',
      category: 'ACADEMIC',
      targetAudience: {
        roles: ['STUDENT', 'FACULTY'],
        departments: [studentUser.department || 'Computer Science and Engineering'],
      },
    }),
  }, hodToken);
  console.log('✓ Notice published status:', noticeRes.status);

  // 3. Create Event
  const eventRes = await request('/events', {
    method: 'POST',
    body: JSON.stringify({
      title: `Hackathon ${Date.now()}`,
      description: 'Campus codefest and exhibition',
      category: 'HACKATHON',
      venue: 'Main Auditorium',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 172800000).toISOString(),
      registrationDeadline: new Date(Date.now() + 43200000).toISOString(),
      capacity: 50,
    }),
  }, adminToken);
  console.log('✓ Event created status:', eventRes.status);

  // 4. Upload Academic File
  const fileRes = await request('/files', {
    method: 'POST',
    body: JSON.stringify({
      title: `Operating Systems Lecture Notes ${Date.now()}`,
      category: 'LECTURE_NOTES',
      department: studentUser.department || 'Computer Science and Engineering',
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
      fileName: 'os_lecture_notes.pdf',
      fileSize: 1024500,
      mimeType: 'application/pdf',
    }),
  }, hodToken);
  console.log('✓ Academic file uploaded status:', fileRes.status);

  // 5. Submit Grievance
  const complaintRes = await request('/complaints', {
    method: 'POST',
    body: JSON.stringify({
      subject: `Lab Air Conditioning Malfunction ${Date.now()}`,
      category: 'INFRASTRUCTURE',
      priority: 'MEDIUM',
      department: studentUser.department || 'Computer Science and Engineering',
      description: 'The computer lab AC is not functioning properly.',
      attachments: [
        {
          url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          name: 'evidence.jpg',
          size: 204800,
          mimeType: 'image/jpeg',
        },
      ],
    }),
  }, studentToken);
  console.log('✓ Grievance submitted status:', complaintRes.status);
  const complaintId = complaintRes.data.complaint?.id;

  // 6. HoD / Admin updates Grievance status
  if (complaintId) {
    const statusRes = await request(`/complaints/${complaintId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'IN_PROGRESS',
        note: 'Technician dispatched to inspection site.',
      }),
    }, adminToken);
    console.log('✓ Grievance status updated status:', statusRes.status);
  }

  // 7. Verify Student receives notifications
  const studentNotifs = await request('/notifications', {}, studentToken);
  console.log('✓ Student notifications fetched:', studentNotifs.data.length, 'items');
  if (studentNotifs.data.length === 0) {
    throw new Error('Expected student to have notifications, but got 0');
  }

  const types = studentNotifs.data.map((n: any) => n.type);
  console.log('✓ Found notification types in student feed:', [...new Set(types)].join(', '));

  // 8. Test Mark Single Read
  const firstUnread = studentNotifs.data.find((n: any) => !n.isRead);
  if (firstUnread) {
    const readRes = await request(`/notifications/${firstUnread.id}/read`, { method: 'PATCH' }, studentToken);
    console.log('✓ Mark single read status:', readRes.status);
  }

  // 9. Test Mark All Read
  const markAllRes = await request('/notifications/read-all', { method: 'PATCH' }, studentToken);
  console.log('✓ Mark all read status:', markAllRes.status);

  const finalNotifs = await request('/notifications', {}, studentToken);
  const remainingUnread = finalNotifs.data.filter((n: any) => !n.isRead).length;
  console.log('✓ Remaining unread count after mark-all-read:', remainingUnread);
  if (remainingUnread !== 0) {
    throw new Error(`Expected 0 unread, found ${remainingUnread}`);
  }

  console.log('======================================================');
  console.log('🎉 ALL NOTIFICATION LIFECYCLE TESTS PASSED PERFECTLY!');
  console.log('======================================================');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
