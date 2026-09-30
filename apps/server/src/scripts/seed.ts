import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { User } from '../modules/users/user.model.js';
import { Institute } from '../modules/institutes/institute.model.js';
import { Notice } from '../modules/notices/notice.model.js';
import { Event } from '../modules/events/event.model.js';
import { Complaint } from '../modules/complaints/complaint.model.js';
import { Poll, Vote } from '../modules/polls/poll.model.js';
import { Feedback } from '../modules/feedback/feedback.model.js';
import { AcademicFile } from '../modules/files/file.model.js';
import { Notification } from '../modules/notifications/notification.model.js';
import { EmergencyAlert } from '../modules/emergency/emergency.model.js';
import { Conversation } from '../modules/conversations/conversation.model.js';


import { Message } from '../modules/messages/message.model.js';
import { AuditLog } from '../modules/audit/audit.model.js';

dotenv.config();

async function runSeed() {
  console.log('--- Starting Nexora Multi-Tenant Campus Database Seed ---');
  await connectDatabase();

  console.log('Clearing existing collections...');
  await Promise.all([
    Institute.deleteMany({}),
    User.deleteMany({}),
    Notice.deleteMany({}),
    Event.deleteMany({}),
    Complaint.deleteMany({}),
    Poll.deleteMany({}),
    Vote.deleteMany({}),
    Feedback.deleteMany({}),
    AcademicFile.deleteMany({}),
    Notification.deleteMany({}),
    EmergencyAlert.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);




  console.log('Seeding institutes...');
  const prpcem = await Institute.create({
    name: 'P. R. Pote Patil College of Engineering and Management',
    code: 'PRPCEM',
    domain: 'prpcem.edu',
    address: 'Pote Estate, Kathora Road, Amravati, Maharashtra 444604',
    status: 'APPROVED',
    departments: [
      'Computer Science & Engineering',
      'Artificial Intelligence & Data Science',
      'Information Technology',
      'Electronics & Telecommunication',
      'Mechanical Engineering',
      'Civil Engineering',
    ],
    academicYears: ['First Year', 'Second Year', 'Third Year', 'Final Year'],
    semesters: [
      'Semester 1',
      'Semester 2',
      'Semester 3',
      'Semester 4',
      'Semester 5',
      'Semester 6',
      'Semester 7',
      'Semester 8',
    ],
  });

  const coep = await Institute.create({
    name: 'COEP Technological University',
    code: 'COEP',
    domain: 'coep.ac.in',
    address: 'Wellesley Rd, Shivajinagar, Pune, Maharashtra 411005',
    status: 'APPROVED',
    departments: [
      'Computer Engineering',
      'Information Technology',
      'Electronics & Telecommunication',
      'Mechanical Engineering',
      'Electrical Engineering',
    ],
    academicYears: ['First Year', 'Second Year', 'Third Year', 'Final Year'],
    semesters: [
      'Semester 1',
      'Semester 2',
      'Semester 3',
      'Semester 4',
      'Semester 5',
      'Semester 6',
      'Semester 7',
      'Semester 8',
    ],
  });

  const gcoea = await Institute.create({
    name: 'Government College of Engineering, Amravati',
    code: 'GCOEA',
    domain: 'gcoea.ac.in',
    address: 'VMV Road, Gadge Nagar, Amravati, Maharashtra 444604',
    status: 'PENDING_APPROVAL',
    departments: [
      'Computer Science & Engineering',
      'Information Technology',
      'Electrical Engineering',
      'Civil Engineering',
    ],
    academicYears: ['First Year', 'Second Year', 'Third Year', 'Final Year'],
    semesters: [
      'Semester 1',
      'Semester 2',
      'Semester 3',
      'Semester 4',
      'Semester 5',
      'Semester 6',
      'Semester 7',
      'Semester 8',
    ],
  });

  console.log('Seeding institutional users and hierarchical roles...');
  const studentPassword = await bcrypt.hash('student123', 10);
  const facultyPassword = await bcrypt.hash('faculty123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);
  const superPassword = await bcrypt.hash('super123', 10);

  // 1. Super Admin (Platform Oversight)
  const superAdmin = await User.create({
    name: 'Nexora Platform Controller',
    email: 'superadmin@nexora.edu',
    passwordHash: superPassword,
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    institutionalId: 'SYS-ROOT-00',
    department: 'Platform Governance',
    bio: 'Root governance overseeing all registered colleges and institutional admins.',
    isOnline: true,
  });

  // 2. PRPCEM Admin
  const prpcemAdmin = await User.create({
    name: 'Dean Administration',
    email: 'admin@prpcem.edu',
    passwordHash: adminPassword,
    role: 'ADMIN',
    status: 'ACTIVE',
    institutionalId: 'ADM-PRPCEM-01',
    instituteId: prpcem._id,
    department: 'Institutional Administration',
    bio: 'Campus administrative controller and security oversight.',
    isOnline: true,
  });
  prpcem.adminUserId = prpcemAdmin._id;
  await prpcem.save();

  // 3. PRPCEM HoD (CSE)
  const cseHod = await User.create({
    name: 'Dr. Atul D. Raut',
    email: 'atul.raut@prpcem.edu',
    passwordHash: facultyPassword,
    role: 'FACULTY',
    facultyRole: 'HOD',
    status: 'ACTIVE',
    institutionalId: 'EMP-CSE-001',
    instituteId: prpcem._id,
    department: 'Computer Science & Engineering',
    bio: 'Head of Department & Project Guide.',
    isOnline: true,
  });

  // 4. PRPCEM Class Coordinator (Final Year CSE)
  const finalYearCoordinator = await User.create({
    name: 'Prof. P. R. Maskare',
    email: 'pr.maskare@prpcem.edu',
    passwordHash: facultyPassword,
    role: 'FACULTY',
    facultyRole: 'CLASS_COORDINATOR',
    coordinatorYear: 'Final Year',
    status: 'ACTIVE',
    institutionalId: 'EMP-CSE-012',
    instituteId: prpcem._id,
    department: 'Computer Science & Engineering',
    bio: 'Final Year Class Coordinator & Lab In-charge.',
    isOnline: true,
  });

  // 5. PRPCEM Active Student (Approved)
  const student1 = await User.create({
    name: 'Prathamesh Patange',
    email: 'prathamesh.patange@prpcem.edu',
    passwordHash: studentPassword,
    role: 'STUDENT',
    status: 'ACTIVE',
    institutionalId: '26-CSE-014',
    instituteId: prpcem._id,
    department: 'Computer Science & Engineering',
    academicYear: 'Final Year',
    semester: 'Semester 7',
    approvedBy: finalYearCoordinator._id,
    approvedAt: new Date(),
    bio: 'Lead coordinator for Community Engagement Project.',
    isOnline: true,
  });

  // 6. PRPCEM Pending Student (Awaiting Class Coordinator / HoD Approval)
  const student2Pending = await User.create({
    name: 'Vishvaratna Wasnik',
    email: 'vishvaratna.wasnik@prpcem.edu',
    passwordHash: studentPassword,
    role: 'STUDENT',
    status: 'PENDING',
    institutionalId: '26-CSE-015',
    instituteId: prpcem._id,
    department: 'Computer Science & Engineering',
    academicYear: 'Final Year',
    bio: 'Core development lead for Nexora smart grid.',
    isOnline: false,
  });

  // 7. PRPCEM Pending Faculty (Awaiting Institute Admin Approval)
  const facultyPending = await User.create({
    name: 'Prof. Rohit Sharma',
    email: 'rohit.sharma@prpcem.edu',
    passwordHash: facultyPassword,
    role: 'FACULTY',
    facultyRole: 'PROFESSOR',
    status: 'PENDING',
    institutionalId: 'EMP-MECH-044',
    instituteId: prpcem._id,
    department: 'Mechanical Engineering',
    bio: 'Assistant Professor, Thermodynamics and CAD modeling.',
    isOnline: false,
  });

  // 8. COEP Admin & Active Student (Demonstrating Multi-Tenancy)
  const coepAdmin = await User.create({
    name: 'Director COEP Tech',
    email: 'admin@coep.ac.in',
    passwordHash: adminPassword,
    role: 'ADMIN',
    status: 'ACTIVE',
    institutionalId: 'DIR-COEP-01',
    instituteId: coep._id,
    department: 'Institutional Administration',
    bio: 'Academic Director, COEP Pune.',
    isOnline: true,
  });
  coep.adminUserId = coepAdmin._id;
  await coep.save();

  const coepStudent = await User.create({
    name: 'Aditya Deshmukh',
    email: 'aditya.deshmukh@coep.ac.in',
    passwordHash: studentPassword,
    role: 'STUDENT',
    status: 'ACTIVE',
    institutionalId: '24-CE-089',
    instituteId: coep._id,
    department: 'Computer Engineering',
    academicYear: 'Third Year',
    bio: 'Robotics and Embedded Systems club lead.',
    isOnline: true,
  });

  // 9. GCOEA Pending College Admin
  const gcoeaAdmin = await User.create({
    name: 'Principal GCOEA',
    email: 'principal@gcoea.ac.in',
    passwordHash: adminPassword,
    role: 'ADMIN',
    status: 'PENDING',
    institutionalId: 'ADM-GCOEA-01',
    instituteId: gcoea._id,
    department: 'Institutional Administration',
    bio: 'College Principal applying for Nexora grid integration.',
    isOnline: false,
  });
  gcoea.adminUserId = gcoeaAdmin._id;
  await gcoea.save();

  console.log('Seeding campus notices...');
  await Notice.create([
    {
      title: 'End-Semester Examination Time Table & Hall Ticket Verification (Winter 2026)',
      content: 'All B.Tech Computer Science and Engineering students are hereby informed that the draft time table for Winter 2026 practical and theory examinations has been finalized. Verify your registered elective courses before Friday 5:00 PM in the student portal.',
      summary: 'Draft Winter 2026 examination time table released for student elective verification.',
      priority: 'CRITICAL',
      category: 'EXAMINATION',
      status: 'PUBLISHED',
      targetAudience: {
        roles: ['STUDENT'],
        departments: ['Computer Science & Engineering', 'Information Technology'],
        academicYears: ['Final Year', 'Third Year'],
      },
      author: {
        id: cseHod._id,
        name: cseHod.name,
        role: cseHod.role,
        department: cseHod.department,
      },
      publishedAt: new Date(Date.now() - 2 * 3600 * 1000),
      readBy: [student1._id],
    },
    {
      title: 'T&P Drive: Campus Recruitment Schedule for Final Year Engineering Batches',
      content: 'Technical assessment rounds for shortlisted candidates commence on Monday at 09:00 AM sharp in Central Computing Facility Lab 4. Candidates must bring their institutional identity cards and 2 copies of their resume.',
      summary: 'Recruitment technical rounds in CCF Lab 4 for eligible final year students.',
      priority: 'HIGH',
      category: 'PLACEMENT',
      status: 'PUBLISHED',
      targetAudience: {
        roles: ['STUDENT'],
        departments: ['Computer Science & Engineering', 'Artificial Intelligence & Data Science'],
      },
      author: {
        id: prpcemAdmin._id,
        name: prpcemAdmin.name,
        role: prpcemAdmin.role,
        department: prpcemAdmin.department,
      },
      publishedAt: new Date(Date.now() - 24 * 3600 * 1000),
      readBy: [],
    },
  ]);

  console.log('Seeding campus events...');
  await Event.create([
    {
      title: 'TechnoVision 2026 — Annual Innovation & Project Exhibition',
      description: 'Annual technical festival showcasing student capstone and community engagement projects with industry evaluations.',
      category: 'Technical Symposium',
      venue: 'Main Auditorium & CCF Lab 2',
      startDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      endDate: new Date(Date.now() + 6 * 24 * 3600 * 1000),
      registrationDeadline: new Date(Date.now() + 3 * 24 * 3600 * 1000),
      capacity: 150,
      registeredUsers: [student1._id],
      organizer: {
        id: cseHod._id,
        name: cseHod.name,
        department: cseHod.department,
      },
      status: 'UPCOMING',
    },
  ]);

  console.log('Seeding grievance and complaints...');
  await Complaint.create([
    {
      ticketNumber: 'TKT-202609-0042',
      instituteId: prpcem._id,
      subject: 'Lab 3 Workstation Hardware Diagnostics & Monitor Replacement',
      description: 'Three workstations in Row D (machines D-04, D-05, D-06) display flickering monitor displays and sporadic reboot cycles during compiler executions.',
      category: 'INFRASTRUCTURE',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      isAnonymous: false,
      submittedBy: {
        id: student1._id,
        name: student1.name,
        department: student1.department,
      },
      department: 'Computer Science & Engineering',
      location: 'Central Computing Facility Lab 3',
      assignedTo: {
        id: finalYearCoordinator._id,
        name: finalYearCoordinator.name,
        role: finalYearCoordinator.role,
      },
      attachments: [
        {
          name: 'monitor_glitch_diagnostics.jpg',
          url: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&q=80&w=1000',
          size: 428000,
          mimeType: 'image/jpeg',
        },
      ],
      timeline: [
        {
          status: 'SUBMITTED',
          actor: { id: student1._id, name: student1.name, role: student1.role },
          note: 'Grievance ticket created with diagnostic description.',
          createdAt: new Date(Date.now() - 48 * 3600 * 1000),
        },
        {
          status: 'UNDER_REVIEW',
          actor: { id: cseHod._id, name: cseHod.name, role: cseHod.role },
          note: 'HoD reviewed report. Forwarded to Lab Coordinator for inspection.',
          createdAt: new Date(Date.now() - 24 * 3600 * 1000),
        },
        {
          status: 'IN_PROGRESS',
          actor: { id: finalYearCoordinator._id, name: finalYearCoordinator.name, role: finalYearCoordinator.role },
          note: 'Technician dispatched. Replacement VGA and HDMI cables ordered from vendor inventory.',
          createdAt: new Date(Date.now() - 4 * 3600 * 1000),
        },
      ],
    },
    {
      ticketNumber: 'TKT-202609-0089',
      instituteId: prpcem._id,
      subject: 'Elective Course Slot Overlap (Advanced AI & Cloud Architecture)',
      description: 'The timetable slots for open elective "Advanced Artificial Intelligence" overlap with "Cloud Architecture" on Tuesday second half.',
      category: 'ACADEMIC',
      priority: 'MEDIUM',
      status: 'RESOLVED',
      isAnonymous: false,
      submittedBy: {
        id: student1._id,
        name: student1.name,
        department: student1.department,
      },
      department: 'Computer Science & Engineering',
      location: 'Academic Section Classroom C-302',
      assignedTo: {
        id: cseHod._id,
        name: cseHod.name,
        role: cseHod.role,
      },
      attachments: [
        {
          name: 'timetable_clash_screenshot.pdf',
          url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1000',
          size: 154000,
          mimeType: 'application/pdf',
        },
      ],
      resolvedAt: new Date(Date.now() - 12 * 3600 * 1000),
      timeline: [
        {
          status: 'SUBMITTED',
          actor: { id: student1._id, name: student1.name, role: student1.role },
          note: 'Timetable conflict reported for batch 2026-27.',
          createdAt: new Date(Date.now() - 36 * 3600 * 1000),
        },
        {
          status: 'RESOLVED',
          actor: { id: cseHod._id, name: cseHod.name, role: cseHod.role },
          note: 'Academic timetable revised. Cloud Architecture rescheduled to Friday 11:30 AM slot. Circular published.',
          createdAt: new Date(Date.now() - 12 * 3600 * 1000),
        },
      ],
    },
    {
      ticketNumber: 'TKT-202609-0105',
      instituteId: prpcem._id,
      subject: 'Hostel Block B Night Curfew Noise & Ragging Prevention Report',
      description: 'Repeated excessive loudspeaker disruptions occurring on 2nd floor corridor after 11 PM curfew hours despite warnings.',
      category: 'HARASSMENT',
      priority: 'URGENT',
      status: 'UNDER_REVIEW',
      isAnonymous: true,
      submittedBy: {
        id: student1._id,
        name: 'Anonymous Whistleblower',
        department: 'Computer Science & Engineering',
      },
      department: 'Computer Science & Engineering',
      location: 'Boys Hostel Block B, 2nd Floor Corridor',
      assignedTo: {
        id: prpcemAdmin._id,
        name: prpcemAdmin.name,
        role: prpcemAdmin.role,
      },
      attachments: [
        {
          name: 'hostel_noise_incident_log.jpg',
          url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=1000',
          size: 320000,
          mimeType: 'image/jpeg',
        },
      ],
      timeline: [
        {
          status: 'SUBMITTED',
          actor: { id: student1._id, name: 'Anonymous Student', role: 'STUDENT' },
          note: 'Confidential whistleblower report registered through encrypted protocol.',
          createdAt: new Date(Date.now() - 6 * 3600 * 1000),
        },
        {
          status: 'UNDER_REVIEW',
          actor: { id: prpcemAdmin._id, name: prpcemAdmin.name, role: prpcemAdmin.role },
          note: 'Disciplinary warden alerted. Night patrolling rounds doubled.',
          createdAt: new Date(Date.now() - 2 * 3600 * 1000),
        },
      ],
    },
  ]);


  console.log('Seeding channels and conversations...');
  const campusAnnouncements = await Conversation.create({
    type: 'CHANNEL',
    name: '#campus-announcements',
    description: 'Official verified circulars and administrative broadcasts',
    scope: 'CAMPUS',
    instituteId: prpcem._id,
    creatorId: prpcemAdmin._id,
    status: 'ACTIVE',
    isAnnouncementOnly: true,
    participants: [prpcemAdmin._id, cseHod._id, finalYearCoordinator._id, student1._id],
  });

  const cseHub = await Conversation.create({
    type: 'CHANNEL',
    name: '#cse-department-grid',
    description: 'Computer Science & Engineering departmental forum',
    scope: 'DEPARTMENT',
    department: 'Computer Science & Engineering',
    instituteId: prpcem._id,
    creatorId: cseHod._id,
    status: 'ACTIVE',
    isAnnouncementOnly: false,
    participants: [cseHod._id, finalYearCoordinator._id, student1._id],
  });

  const batchChannel = await Conversation.create({
    type: 'CHANNEL',
    name: '#cse-final-year-2026',
    description: 'Final Year B.Tech CSE Class Workspace and Discussion',
    scope: 'BATCH',
    department: 'Computer Science & Engineering',
    academicYear: 'Final Year (B.Tech)',
    instituteId: prpcem._id,
    creatorId: finalYearCoordinator._id,
    status: 'ACTIVE',
    isAnnouncementOnly: false,
    participants: [finalYearCoordinator._id, student1._id],
  });

  const initialMsg = await Message.create({
    conversationId: batchChannel._id,
    senderId: finalYearCoordinator._id,
    content: 'Good morning batch 2026-27. Please ensure your Major Project synopsis documents adhere strictly to university format.',
    reactions: [{ emoji: '👍', userId: student1._id }],
    readBy: [finalYearCoordinator._id, student1._id],
  });

  batchChannel.lastMessage = initialMsg._id as any;
  await batchChannel.save();

  // Also seed a direct conversation between student1 and coordinator
  const dmConv = await Conversation.create({
    type: 'DIRECT',
    instituteId: prpcem._id,
    participants: [finalYearCoordinator._id, student1._id],
    status: 'ACTIVE',
    initiatedBy: student1._id,
  });

  const dmMsg = await Message.create({
    conversationId: dmConv._id,
    senderId: student1._id,
    content: 'Sir, I have submitted my semester registration acknowledgment for verification.',
    readBy: [student1._id, finalYearCoordinator._id],
  });

  dmConv.lastMessage = dmMsg._id as any;
  await dmConv.save();

  console.log('Seeding targeted polls and institutional surveys...');
  const poll1 = await Poll.create({
    title: 'Department Elective Track Selection for Semester 8 (Batch 2026-27)',
    description: 'Please cast your preference for the specialized departmental elective stream for your final semester syllabus.',
    options: [
      { id: 'opt_1', text: 'Quantum Computing & Post-Quantum Cryptography', voteCount: 0 },
      { id: 'opt_2', text: 'Distributed Systems & Cloud-Native Microservices', voteCount: 0 },
      { id: 'opt_3', text: 'Generative AI & Autonomous Agent Architectures', voteCount: 1 },
      { id: 'opt_4', text: 'Cyber Threat Intelligence & Digital Forensics', voteCount: 0 },
    ],
    targetAudience: {
      roles: ['STUDENT'],
      departments: ['Computer Science & Engineering'],
      academicYears: ['Final Year (B.Tech)'],
    },
    isAnonymous: true,
    allowMultipleChoices: false,
    status: 'ACTIVE',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7 days from now
    author: {
      id: cseHod._id,
      name: cseHod.name,
      role: cseHod.role,
      department: cseHod.department,
    },
    instituteId: prpcem._id,
    totalVotes: 1,
  });

  // Seed sample vote from student1
  await Vote.create({
    pollId: poll1._id,
    userId: student1._id,
    selectedOptionIds: ['opt_3'],
    instituteId: prpcem._id,
  });

  const poll2 = await Poll.create({
    title: 'Campus Tech Symposium 2026 Hackathon Track Theme',
    description: 'College-wide vote for the flagship 36-hour National Hackathon primary challenge category.',
    options: [
      { id: 'opt_1', text: 'Next-Gen Agentic AI & Developer Automation', voteCount: 38 },
      { id: 'opt_2', text: 'Clean Energy & Smart Campus Sustainability', voteCount: 22 },
      { id: 'opt_3', text: 'Healthcare IoT & Remote Medical Diagnosis', voteCount: 17 },
      { id: 'opt_4', text: 'FinTech, Open Banking & Zero-Knowledge Proofs', voteCount: 14 },
    ],
    targetAudience: {
      roles: ['STUDENT', 'FACULTY'],
    },
    isAnonymous: true,
    allowMultipleChoices: false,
    status: 'ACTIVE',
    startDate: new Date(),
    endDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
    author: {
      id: finalYearCoordinator._id,
      name: finalYearCoordinator.name,
      role: finalYearCoordinator.role,
      department: finalYearCoordinator.department,
    },
    instituteId: prpcem._id,
    totalVotes: 91,
  });

  console.log('Seeding course evaluations and faculty feedback...');
  await Feedback.create([
    {
      instituteId: prpcem._id,
      facultyId: cseHod._id,
      facultyName: cseHod.name,
      courseName: 'Distributed Systems & Cloud Computing (CS-702)',
      department: 'Computer Science & Engineering',
      academicYear: 'Final Year (B.Tech)',
      rating: 5,
      clarity: 5,
      pace: 4,
      comments: 'Excellent real-world industry case studies on Raft consensus and AWS architecture.',
      isAnonymous: true,
      submittedBy: {
        id: student1._id,
        name: 'Anonymous Student',
        role: 'STUDENT',
      },
    },
    {
      instituteId: prpcem._id,
      facultyId: finalYearCoordinator._id,
      facultyName: finalYearCoordinator.name,
      courseName: 'Major Project Evaluation & Research Methodology',
      department: 'Computer Science & Engineering',
      academicYear: 'Final Year (B.Tech)',
      rating: 5,
      clarity: 5,
      pace: 5,
      comments: 'Very supportive project guidance and timely review feedbacks on research papers.',
      isAnonymous: true,
      submittedBy: {
        id: student1._id,
        name: 'Anonymous Student',
        role: 'STUDENT',
      },
    },
  ]);

  console.log('Seeding academic files repository...');
  await AcademicFile.create([
    {
      title: 'Distributed Systems & Cloud Computing Syllabus (2026-27 Scheme)',
      description: 'Official university curriculum structure, course outcomes, credit distribution, and textbook references.',
      category: 'SYLLABUS',
      department: 'Computer Science & Engineering',
      academicYear: 'Final Year (B.Tech)',
      semester: 'Semester 7',
      subjectCode: 'CS-702',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileName: 'CSE_702_Distributed_Systems_Syllabus.pdf',
      fileSize: 245000,
      mimeType: 'application/pdf',
      downloadsCount: 42,
      uploadedBy: {
        id: cseHod._id,
        name: cseHod.name,
        role: cseHod.role,
      },
      instituteId: prpcem._id,
    },
    {
      title: 'Advanced Operating Systems Kernel Programming Lab Manual',
      description: 'Step-by-step instructions for kernel module compilation, system call tracing, and POSIX multithreading experiments.',
      category: 'LAB_MANUAL',
      department: 'Computer Science & Engineering',
      academicYear: 'Final Year (B.Tech)',
      semester: 'Semester 7',
      subjectCode: 'CS-701L',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileName: 'Kernel_Programming_Lab_Manual_v4.pdf',
      fileSize: 856000,
      mimeType: 'application/pdf',
      downloadsCount: 68,
      uploadedBy: {
        id: cseHod._id,
        name: cseHod.name,
        role: cseHod.role,
      },
      instituteId: prpcem._id,
    },
    {
      title: 'Artificial Intelligence & Machine Learning University Question Paper (Winter 2025)',
      description: 'Past semester university question paper with marking scheme and model solution keys.',
      category: 'PYQ_PAPERS',
      department: 'Computer Science & Engineering',
      academicYear: 'Final Year (B.Tech)',
      semester: 'Semester 6',
      subjectCode: 'CS-603',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileName: 'PYQ_Winter2025_AIML_CS603.pdf',
      fileSize: 312000,
      mimeType: 'application/pdf',
      downloadsCount: 119,
      uploadedBy: {
        id: finalYearCoordinator._id,
        name: finalYearCoordinator.name,
        role: finalYearCoordinator.role,
      },
      instituteId: prpcem._id,
    },
    {
      title: 'Final Year Major Capstone Project Handbook & Synopsis Formatting Template',
      description: 'Mandatory IEEE project report guidelines, synopsis verification milestones, and evaluation rubrics.',
      category: 'PROJECT_GUIDELINES',
      department: 'Computer Science & Engineering',
      academicYear: 'Final Year (B.Tech)',
      semester: 'Semester 7',
      subjectCode: 'CS-801',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileName: 'Final_Year_Major_Project_Guidelines_2026.pdf',
      fileSize: 520000,
      mimeType: 'application/pdf',
      downloadsCount: 94,
      uploadedBy: {
        id: finalYearCoordinator._id,
        name: finalYearCoordinator.name,
        role: finalYearCoordinator.role,
      },
      instituteId: prpcem._id,
    },
  ]);

  console.log('Seeding activity notifications feed...');
  await Notification.create([
    {
      userId: student1._id,
      instituteId: prpcem._id,
      title: 'Official Circular Published',
      message: 'Community Engagement Project (CEP) schedule released by CSE Department.',
      type: 'NOTICE',
      link: '/app/notices',
      isRead: false,
    },
    {
      userId: student1._id,
      instituteId: prpcem._id,
      title: 'New Campus Poll Active',
      message: 'Department Elective Track Selection for Semester 8 is now open for voting.',
      type: 'POLL',
      link: '/app/polls',
      isRead: false,
    },
    {
      userId: student1._id,
      instituteId: prpcem._id,
      title: 'Grievance Progress Update',
      message: 'Your ticket TKT-202609-0042 (Lab 3 Workstation) has been marked IN_PROGRESS.',
      type: 'COMPLAINT',
      link: '/app/complaints',
      isRead: true,
    },
  ]);

  console.log('Seeding emergency alerts...');
  await EmergencyAlert.create([
    {
      title: 'Monsoon Flash Flooding & Power Grid Failure in North Wing',
      message: 'Heavy cloudburst caused waterlogging in lower basement parking and mechanical workshop areas. High-voltage transformers temporarily shut down.',
      severity: 'WARNING',
      affectedAreas: ['Mechanical Workshop Block', 'Basement Parking', 'Civil Engg Lab Annex'],
      actionRequired: 'All students parked in North Lot move vehicles to Elevated West Deck immediately. Do not access lower basement corridors.',
      issuedBy: {
        id: prpcemAdmin._id,
        name: prpcemAdmin.name,
        role: prpcemAdmin.role,
      },
      instituteId: prpcem._id,
      isActive: false,
      expiresAt: new Date(Date.now() - 24 * 3600 * 1000),
      resolvedAt: new Date(Date.now() - 36 * 3600 * 1000),
      resolvedBy: {
        id: prpcemAdmin._id,
        name: prpcemAdmin.name,
      },
      resolutionNote: 'Water pumped out by municipal civil team. Electrical safety certificate verified by campus engineer. All clear.',
    },
  ]);

  console.log('Seeding compliance audit trail...');


  await AuditLog.create([
    {
      actor: { id: superAdmin._id, name: superAdmin.name, role: superAdmin.role, email: superAdmin.email },
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'PLATFORM',
      entityId: 'NEXORA-MULTI-TENANT-ROOT',
      metadata: { environment: 'Development', release: '2026-27' },
      ipAddress: '127.0.0.1',
    },
  ]);

  console.log('✔ Multi-tenant database seed completed successfully!');
  console.log('Accounts available:');
  console.log('  1. Super Admin: superadmin@nexora.edu (super123)');
  console.log('  2. PRPCEM Admin: admin@prpcem.edu (admin123)');
  console.log('  3. PRPCEM CSE HoD: atul.raut@prpcem.edu (faculty123)');
  console.log('  4. PRPCEM Final Year Coordinator: pr.maskare@prpcem.edu (faculty123)');
  console.log('  5. PRPCEM Active Student: prathamesh.patange@prpcem.edu (student123)');
  console.log('  6. PRPCEM Pending Student: vishvaratna.wasnik@prpcem.edu (student123) [Awaiting Coordinator]');
  console.log('  7. PRPCEM Pending Faculty: rohit.sharma@prpcem.edu (faculty123) [Awaiting Admin]');
  console.log('  8. COEP Admin: admin@coep.ac.in (admin123)');
  console.log('  9. COEP Student: aditya.deshmukh@coep.ac.in (student123)');
  console.log('  10. GCOEA Pending College: GCOEA (Awaiting Super Admin)');

  await disconnectDatabase();
}

runSeed().catch((err) => {
  console.error('Seed execution error:', err);
  process.exit(1);
});
