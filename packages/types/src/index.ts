export type Role = 'STUDENT' | 'FACULTY' | 'ADMIN' | 'SUPER_ADMIN';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'REJECTED';

export type FacultyRole = 'HOD' | 'CLASS_COORDINATOR' | 'PROFESSOR' | 'ASSISTANT_PROFESSOR';

export type InstituteStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface TeachingAssignment {
  id?: string;
  subjectName: string;
  subjectCode?: string;
  department: string;
  academicYear: string;
  semester: string;
  division?: string;
}

export interface DepartmentSubject {
  id?: string;
  _id?: string;
  department: string;
  name: string;
  code?: string;
  academicYear: string;
  semester: string;
  addedBy?: string;
  createdAt?: string;
}

export interface InstituteDTO {
  id: string;
  name: string;
  code: string;
  domain?: string;
  address?: string;
  status: InstituteStatus;
  departments: string[];
  academicYears: string[];
  semesters: string[];
  departmentSubjects?: DepartmentSubject[];
  adminUserId?: string;
  studentCount?: number;
  facultyCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type DMPermission = 'ALLOW_ALL' | 'SAME_DEPARTMENT_ONLY' | 'FACULTY_ONLY';

export interface UserPrivacySettings {
  dmPermission: DMPermission;
}

export interface FacultyRatingSummary {
  averageRating: number;
  clarityAverage: number;
  paceAverage: number;
  totalReviews: number;
}

export interface EnrolledSubjectSummary {
  id: string;
  name: string;
  code?: string;
  facultyName?: string;
  facultyId?: string;
}

export interface StudentMentorSummary {
  id: string;
  name: string;
  email?: string;
  facultyRole?: string;
  coordinatorYear?: string;
}

export interface StudentLinks {
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  institutionalId: string;
  rollNumber?: string;
  department: string;
  academicYear?: string;
  semester?: string;
  degreeProgram?: string;
  division?: string;
  batchSection?: string;
  admissionYear?: string;
  passingYear?: string;
  prnNumber?: string;
  bloodGroup?: string;
  campusRoles?: string[];
  links?: StudentLinks;
  mentor?: StudentMentorSummary;
  currentSemesterSubjects?: EnrolledSubjectSummary[];
  instituteId?: string;
  instituteName?: string;
  instituteCode?: string;
  facultyRole?: FacultyRole;
  coordinatorYear?: string;
  teachingAssignments?: TeachingAssignment[];
  facultyRating?: FacultyRatingSummary;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  avatarUrl?: string;
  bio?: string;
  isOnline?: boolean;
  privacySettings?: UserPrivacySettings;
  createdAt: string;
  updatedAt: string;
}

export type NoticePriority = 'NORMAL' | 'IMPORTANT' | 'HIGH' | 'CRITICAL' | 'URGENT';
export type NoticeCategory = 'ACADEMIC' | 'ADMINISTRATIVE' | 'EXAMINATION' | 'PLACEMENT' | 'SPORTS' | 'URGENT';
export type NoticeStatus = 'DRAFT' | 'PUBLISHED' | 'EXPIRED' | 'ARCHIVED';

export interface NoticeDTO {
  id: string;
  title: string;
  content: string;
  summary: string;
  priority: NoticePriority;
  category: NoticeCategory;
  status: NoticeStatus;
  targetAudience: {
    roles: Role[];
    departments: string[];
    academicYears?: string[];
  };
  author: {
    id: string;
    name: string;
    role: Role;
    department: string;
  };
  attachments?: {
    name: string;
    url: string;
    size: number;
    mimeType: string;
  }[];
  publishedAt?: string;
  expiresAt?: string;
  readCount?: number;
  hasRead?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ComplaintStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED' | 'CLOSED';
export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ComplaintCategory = 'ACADEMIC' | 'INFRASTRUCTURE' | 'HOSTEL' | 'HARASSMENT' | 'ADMINISTRATIVE' | 'OTHER';

export interface ComplaintTimelineItem {
  id: string;
  status: ComplaintStatus;
  actor: {
    id: string;
    name: string;
    role: Role;
  };
  note?: string;
  createdAt: string;
}

export interface ComplaintDTO {
  id: string;
  ticketNumber: string;
  instituteId?: string;
  subject: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  isAnonymous: boolean;
  submittedBy?: {
    id: string;
    name: string;
    department: string;
  };
  department: string;
  location?: string;
  assignedTo?: {
    id: string;
    name: string;
    role: Role;
  };
  attachments?: {
    name: string;
    url: string;
    size: number;
    mimeType?: string;
  }[];
  timeline: ComplaintTimelineItem[];
  stage?: { step: number; label: string; isComplete: boolean };
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}


export interface EventDTO {
  id: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  capacity: number;
  registeredCount: number;
  isRegistered?: boolean;
  organizer: {
    id: string;
    name: string;
    department: string;
  };
  status: 'DRAFT' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface MessageAttachment {
  name: string;
  url: string;
  size: number;
  mimeType: string;
  publicId?: string;
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  sender: {
    id: string;
    name: string;
    avatarUrl?: string;
    role: Role;
    department?: string;
  };
  content: string;
  attachments?: MessageAttachment[];
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  reactions?: {
    emoji: string;
    userId: string;
  }[];
  isReadBy?: string[];
  isUnsent?: boolean;
  unsentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ConversationType = 'DIRECT' | 'CHANNEL';
export type ChannelScope = 'CAMPUS' | 'DEPARTMENT' | 'BATCH' | 'SUBJECT' | 'CUSTOM';
export type ConversationStatus = 'ACTIVE' | 'REQUEST_PENDING' | 'DECLINED' | 'BLOCKED';
export type GroupAccessMode = 'APPROVAL_REQUIRED' | 'OPEN' | 'INVITE_ONLY';

export interface ConversationDTO {
  id: string;
  type: ConversationType;
  name?: string;
  description?: string;
  scope?: ChannelScope;
  department?: string;
  academicYear?: string;
  semester?: string;
  subjectName?: string;
  instituteId: string;
  participants: UserDTO[];
  pendingInvites?: UserDTO[];
  creatorId?: string;
  adminIds?: string[];
  joinRequests?: UserDTO[];
  accessMode?: GroupAccessMode;
  isDiscoverable?: boolean;
  status: ConversationStatus;
  initiatedBy?: string;
  isAnnouncementOnly?: boolean;
  lastMessage?: MessageDTO;
  unreadCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupInviteDTO {
  id: string;
  name: string;
  description?: string;
  department?: string;
  creator?: {
    id: string;
    name: string;
    role: Role;
    department?: string;
    avatarUrl?: string;
  };
  memberCount: number;
  createdAt: string;
}

export interface DiscoverableGroupDTO {
  id: string;
  name: string;
  description?: string;
  scope: ChannelScope;
  department?: string;
  academicYear?: string;
  semester?: string;
  subjectName?: string;
  accessMode: GroupAccessMode;
  memberCount: number;
  creator?: {
    id: string;
    name: string;
    role: Role;
    department?: string;
    avatarUrl?: string;
  };
  isMember: boolean;
  hasRequestedJoin: boolean;
  createdAt: string;
}

export interface ReportDTO {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  conversationId: string;
  reason: string;
  contextSnapshot: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export type PollStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

export interface PollDTO {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  targetAudience: {
    roles: Role[];
    departments: string[];
    academicYears?: string[];
  };
  isAnonymous: boolean;
  allowMultipleChoices: boolean;
  status: PollStatus;
  startDate: string;
  endDate: string;
  author: {
    id: string;
    name: string;
    role: Role;
    department?: string;
  };
  instituteId: string;
  totalVotes: number;
  hasVoted?: boolean;
  userSelectedOptionIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackDTO {
  id: string;
  instituteId: string;
  facultyId: string;
  facultyName: string;
  courseName: string;
  department: string;
  academicYear: string;
  rating: number; // 1-5 overall
  clarity: number; // 1-5 teaching clarity
  pace: number; // 1-5 syllabus pacing
  comments?: string;
  isAnonymous: boolean;
  submittedBy?: {
    id: string;
    name: string;
    role: Role;
  };
  createdAt: string;
}

export type AcademicFileCategory =
  | 'SYLLABUS'
  | 'LECTURE_NOTES'
  | 'LAB_MANUAL'
  | 'PYQ_PAPERS'
  | 'PROJECT_GUIDELINES'
  | 'OTHER';

export interface AcademicFileDTO {
  id: string;
  title: string;
  description?: string;
  category: AcademicFileCategory;
  department: string;
  academicYear?: string;
  semester?: string;
  subjectCode?: string;
  subjectName?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadsCount: number;
  uploadedBy: {
    id: string;
    name: string;
    role: Role;
  };
  instituteId: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'NOTICE' | 'EVENT' | 'POLL' | 'SURVEY' | 'COMPLAINT' | 'MESSAGE' | 'SYSTEM';

export interface NotificationDTO {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt: string;
}



export interface EmergencyAlertDTO {
  id: string;
  instituteId: string;
  title: string;
  message: string;
  severity: 'WARNING' | 'CRITICAL' | 'EVACUATION';
  affectedAreas: string[];
  actionRequired: string;
  issuedBy: {
    id: string;
    name: string;
    role: Role;
  };
  isActive: boolean;
  expiresAt: string;
  resolvedAt?: string;
  resolvedBy?: {
    id: string;
    name: string;
  };
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogDTO {
  id: string;
  actor: {
    id: string;
    name: string;
    role: Role;
    email: string;
  };
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface DepartmentCatalogItem {
  name: string;
  category: 'Computer & IT' | 'Electronics & Electrical' | 'Mechanical & Production' | 'Civil & Infrastructure' | 'Chemical & Bio' | 'Emerging Tech' | 'Management & Sciences';
  code: string;
}

export const INDIAN_HIGHER_ED_DEPARTMENTS: DepartmentCatalogItem[] = [
  // Computer & IT
  { name: 'Computer Science & Engineering', code: 'CSE', category: 'Computer & IT' },
  { name: 'Information Technology', code: 'IT', category: 'Computer & IT' },
  { name: 'Computer Technology', code: 'CT', category: 'Computer & IT' },
  { name: 'Computer Science & Business Systems', code: 'CSBS', category: 'Computer & IT' },
  { name: 'Computer Science & Design', code: 'CSD', category: 'Computer & IT' },
  { name: 'Software Engineering', code: 'SE', category: 'Computer & IT' },
  { name: 'Master of Computer Applications', code: 'MCA', category: 'Computer & IT' },

  // Emerging Tech
  { name: 'Artificial Intelligence & Machine Learning', code: 'AIML', category: 'Emerging Tech' },
  { name: 'Artificial Intelligence & Data Science', code: 'AIDS', category: 'Emerging Tech' },
  { name: 'Data Science & Analytics', code: 'DSA', category: 'Emerging Tech' },
  { name: 'Cyber Security & Digital Forensics', code: 'CSDF', category: 'Emerging Tech' },
  { name: 'Internet of Things (IoT)', code: 'IOT', category: 'Emerging Tech' },
  { name: 'Robotics & Automation', code: 'RA', category: 'Emerging Tech' },
  { name: 'Cloud Computing & Virtualization', code: 'CCV', category: 'Emerging Tech' },
  { name: 'Blockchain Technology', code: 'BT', category: 'Emerging Tech' },

  // Electronics & Electrical
  { name: 'Electronics & Telecommunication Engineering', code: 'EXTC', category: 'Electronics & Electrical' },
  { name: 'Electronics Engineering', code: 'ETRX', category: 'Electronics & Electrical' },
  { name: 'Electrical Engineering', code: 'EE', category: 'Electronics & Electrical' },
  { name: 'Electrical & Electronics Engineering', code: 'EEE', category: 'Electronics & Electrical' },
  { name: 'Instrumentation & Control Engineering', code: 'ICE', category: 'Electronics & Electrical' },
  { name: 'VLSI Design & Embedded Systems', code: 'VLSI', category: 'Electronics & Electrical' },

  // Mechanical & Production
  { name: 'Mechanical Engineering', code: 'MECH', category: 'Mechanical & Production' },
  { name: 'Mechatronics Engineering', code: 'MTRX', category: 'Mechanical & Production' },
  { name: 'Automobile Engineering', code: 'AUTO', category: 'Mechanical & Production' },
  { name: 'Aerospace Engineering', code: 'AERO', category: 'Mechanical & Production' },
  { name: 'Production & Industrial Engineering', code: 'PROD', category: 'Mechanical & Production' },
  { name: 'Metallurgical & Materials Engineering', code: 'META', category: 'Mechanical & Production' },
  { name: 'Manufacturing Engineering', code: 'MFG', category: 'Mechanical & Production' },

  // Civil & Infrastructure
  { name: 'Civil Engineering', code: 'CIVIL', category: 'Civil & Infrastructure' },
  { name: 'Structural Engineering', code: 'STRUC', category: 'Civil & Infrastructure' },
  { name: 'Environmental Engineering', code: 'ENV', category: 'Civil & Infrastructure' },
  { name: 'Architecture & Planning', code: 'ARCH', category: 'Civil & Infrastructure' },
  { name: 'Construction Technology & Management', code: 'CTM', category: 'Civil & Infrastructure' },

  // Chemical & Bio
  { name: 'Chemical Engineering', code: 'CHEM', category: 'Chemical & Bio' },
  { name: 'Biotechnology Engineering', code: 'BIOTECH', category: 'Chemical & Bio' },
  { name: 'Biomedical Engineering', code: 'BME', category: 'Chemical & Bio' },
  { name: 'Petroleum Engineering', code: 'PETRO', category: 'Chemical & Bio' },
  { name: 'Polymer & Plastic Technology', code: 'POLY', category: 'Chemical & Bio' },
  { name: 'Food Technology', code: 'FOOD', category: 'Chemical & Bio' },
  { name: 'Pharmacy (B.Pharm / M.Pharm)', code: 'PHARM', category: 'Chemical & Bio' },

  // Management & Sciences
  { name: 'First Year Engineering (Applied Sciences & Humanities)', code: 'FYENG', category: 'Management & Sciences' },
  { name: 'Master of Business Administration', code: 'MBA', category: 'Management & Sciences' },
  { name: 'Applied Mathematics & Computing', code: 'MATH', category: 'Management & Sciences' },
  { name: 'Applied Physics', code: 'PHYS', category: 'Management & Sciences' },
  { name: 'Applied Chemistry', code: 'CHEM_SCI', category: 'Management & Sciences' },
];

export type SurveyType = 'COURSE_EXIT' | 'GENERAL_ACADEMIC' | 'FACULTY_EVALUATION' | 'FACILITY_FEEDBACK';
export type SurveyQuestionType = 'RATING_5' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT';

export interface SurveyQuestion {
  id: string;
  text: string;
  type: SurveyQuestionType;
  coTag?: string; // e.g. "CO1", "CO2", "CO3", "CO4", "CO5"
  options?: string[];
  required: boolean;
}

export interface SurveyDTO {
  id: string;
  title: string;
  description?: string;
  type: SurveyType;
  department: string;
  courseName?: string;
  courseCode?: string;
  academicYear: string;
  semester: string;
  author: {
    id: string;
    name: string;
    role: Role;
    department?: string;
    facultyRole?: string;
  };
  questions: SurveyQuestion[];
  status: 'ACTIVE' | 'CLOSED' | 'DRAFT';
  isAnonymous: boolean;
  endDate: string;
  totalResponses: number;
  hasResponded?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyAnswer {
  questionId: string;
  ratingValue?: number; // 1 to 5
  textValue?: string;
  selectedOptions?: string[];
}

export interface COAttainmentItem {
  coTag: string;
  questionText: string;
  averageRating: number;
  percentage: number;
  responseCount: number;
  level: 'HIGH' | 'MODERATE' | 'LOW'; // >=75% High, 60-74% Moderate, <60% Low
}

export interface SurveyAnalyticsDTO {
  survey: SurveyDTO;
  totalResponses: number;
  coAttainment: COAttainmentItem[];
  overallAttainmentPercentage: number;
  questionStats: {
    questionId: string;
    text: string;
    type: SurveyQuestionType;
    averageRating?: number;
    optionCounts?: Record<string, number>;
    textResponses?: string[];
  }[];
}

