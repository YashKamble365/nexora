# Nexora Campus — Product Specification Document

## 1. Product Statement & Target Audience

### 1.1 Problem Statement
Educational institutions suffer from severe communication fragmentation:
- **Delayed Announcements**: Notices posted on physical boards or buried in unread email chains.
- **Untracked Complaints**: Student grievances are lost in paper forms or informal chats, lacking transparency, accountability, and resolution timelines.
- **Scattered Communication**: Class groups split between WhatsApp, Telegram, and Google Classroom, with no institutional oversight or privacy protections.
- **Absence of Emergency Grids**: Lack of an instantaneous, high-severity broadcast channel that cuts through normal notifications during emergencies.

### 1.2 The Nexora Solution
Nexora Campus unifies institutional life into an integrated communication grid. One authenticated identity provides access to academic messaging, verified campus bulletins, real-time event participation, formal grievance tracking, and emergency notifications.

### 1.3 Personas & User Roles
1. **Student**: Requires instant access to campus notices, direct/group communication with classmates and faculty, transparent grievance submission, event registration, and academic file downloads.
2. **Faculty Member**: Requires verified notice publication, event scheduling, class-level messaging groups, poll creation for student feedback, and assignment to department complaints.
3. **Administrator**: Requires institutional governance: user account lifecycle, global notice moderation, complaints assignment and escalation, audit log inspection, emergency broadcast triggers, and real metrics.

---

## 2. Roles & Permissions Matrix

| Module / Action | Student | Faculty | Admin | Super Admin |
| :--- | :---: | :---: | :---: | :---: |
| **View Published Notices** | Yes | Yes | Yes | Yes |
| **Draft / Publish Notices** | No | Departmental | All | All |
| **View Campus Directory** | Yes | Yes | Yes | Yes |
| **Send 1:1 Messages** | Yes | Yes | Yes | Yes |
| **Create Group Chats** | Yes (Students/Study) | Yes (Course/Dept) | Yes | Yes |
| **File Grievances / Complaints** | Yes | Yes | No | No |
| **Resolve & Assign Complaints** | No | If Assigned | Yes | Yes |
| **Register for Events** | Yes | Yes | N/A | N/A |
| **Publish Events** | No | Departmental | All | All |
| **Create Polls / Surveys** | No | Yes | Yes | Yes |
| **Vote on Polls** | Yes | Yes | Yes | Yes |
| **Submit Campus Feedback** | Yes | Yes | No | No |
| **Broadcast Emergency Alert** | No | No | Yes (2-Step) | Yes (2-Step) |
| **User & Role Management** | No | No | Yes | Yes |
| **Inspect System Audit Logs** | No | No | Yes (Readonly) | Yes |
| **System Configuration** | No | No | Limited | Full |

---

## 3. Module Functional Specifications

### 3.1 Authentication & Profile Management
- **Institutional Login**: Email format validation (`*@college.edu`), password with complexity enforcement, rate-limiting on failed attempts (5 attempts / 15 min lock).
- **Registration Flow**: Multi-field registration requiring full name, institutional ID, student roll number/employee ID, department, year of study, role.
- **Session Management**: JWT token with refresh rotation, HTTP-only secure cookies, "Log out all sessions" capability.
- **Profile Customization**: Avatar upload (validated MIME: JPEG/PNG/WebP, max 2MB), bio, contact preferences, department badge.

### 3.2 Global Application Shell & Command Center (Cmd+K)
- **App Shell**: Responsive sidebar with collapsible states, badge counters for unread messages, notices, and complaints.
- **Topbar**: Active page contextual breadcrumb, search input triggering Command Palette, notification popover, profile dropdown.
- **Command Palette (`Cmd+K` / `Ctrl+K`)**:
  - Global search across People, Notices, Events, Complaints, and Settings.
  - Quick action triggers: "New Direct Message", "Submit Complaint", "View Active Emergency".
  - Keyboard navigation: Arrow keys, Enter to execute, Escape to dismiss.

### 3.3 Role-Aware Dashboard
- **Student View**:
  - Emergency Banner (top priority, red high-contrast banner if active).
  - Unread Notices summary (carousel/list of critical bulletins).
  - Upcoming Events (registered and upcoming campus highlights).
  - My Complaints Tracker (real-time status chips of pending grievances).
  - Quick Actions: Submit Complaint, View Notices, Explore Directory.
- **Faculty View**:
  - Assigned Complaints queue with SLA countdowns.
  - Active departmental notices and draft quick links.
  - Today's schedule / events organized.
- **Admin View**:
  - Operational KPIs: Total Active Users, Open Complaints, Pending Notices, Active Emergency status.
  - Urgent Action Items: Overdue complaints (>48h unassigned), pending user approvals.
  - System activity stream.

### 3.4 Real-Time Messaging & Presence
- **Conversation Models**: Direct Messages (1:1 between any 2 members) and Group Chats (Study groups, class groups, department teams).
- **Desktop 3-Column Layout**:
  - Column 1: Filterable conversation list with search, unread badge, and presence dot.
  - Column 2: Message stream with chronological grouping, read receipts (`Sent`, `Delivered`, `Read`), reply previews, attachment embeds.
  - Column 3: Contextual panel showing conversation members, shared media/files, mute notification switch, search within thread.
- **Real-time Capabilities**:
  - WebSocket typing indicators ("Rahul is typing...").
  - Instant message delivery without polling.
  - Real-time online/offline presence status.

### 3.5 Notice Board Module
- **Categories**: `ACADEMIC`, `ADMINISTRATIVE`, `EXAMINATION`, `PLACEMENT`, `SPORTS`, `URGENT`.
- **Target Audience Filter**: All Campus, Specific Departments, Specific Academic Years, Faculty Only.
- **Priority Indicator**: `NORMAL`, `IMPORTANT`, `CRITICAL`.
- **Read Receipts**: Tracks individual student read status for compliance.
- **Lifecycle**: Draft -> Scheduled -> Published -> Expired / Archived.

### 3.6 Event Management Module
- **Listing Views**: Upcoming Events, Past Events, My Registered Events.
- **Event Card/Detail**: Title, banner image, date/time, venue (hall/lab), organizer, description, capacity indicator (`42 / 100 spots filled`).
- **Registration**: 1-click register / unregister with capacity locking and deadline enforcement.
- **Admin Controls**: Attendee list export (CSV/JSON), registration check-in toggle.

### 3.7 Grievance & Complaint Tracking
- **Lifecycle States**:
  `SUBMITTED` ➔ `UNDER_REVIEW` ➔ `ASSIGNED` ➔ `IN_PROGRESS` ➔ `RESOLVED` (or `REJECTED` / `CLOSED`)
- **Submission Fields**: Category (Academic, Infrastructure, Hostel, Harassment, Administration), Subject, Detailed Description, Incident Location, Severity Level (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), Supporting Attachment.
- **Anonymous Filing Option**: Anonymity flag masks student identity from non-superadmin viewers while preserving ticket tracking.
- **Audit Timeline**: Every status update appends an immutable timeline item with timestamp, actor name, action taken, and internal note.

### 3.8 Polls & Surveys
- **Poll Formats**: Single-choice, Multiple-choice, 1-5 Star Rating.
- **Integrity**: One-vote-per-student constraint enforced via database unique compound key `{ pollId, userId }`.
- **Live Results**: Visual percentage breakdown available immediately or only after poll closes based on creator settings.

### 3.9 Campus Feedback
- **Purpose**: General campus facility and service sentiment (Canteen, Library, Wi-Fi, Laboratories).
- **Fields**: Facility category, 1-5 star satisfaction score, qualitative comments, optional photo.
- **Admin Sentiment Summary**: Average ratings by facility, trend over 30 days.

### 3.10 Emergency Alert Grid
- **Urgency Level**: High-contrast, audio/visual visual cue, persistent top-of-screen banner on every page.
- **Safeguards**: 2-step confirmation dialog with explicit challenge text ("BROADCAST EMERGENCY") to prevent accidental triggers.
- **Fields**: Emergency title, severity (`WARNING`, `CRITICAL`, `EVACUATION`), affected zones/buildings, instruction manual/safe points, issued by authority, active until timestamp.
- **Delivery**: Broadcast over global Socket.IO channel to all connected clients immediately.

### 3.11 File Center
- **Categories**: Lecture Notes, Syllabus, Administrative Forms, Examination Papers.
- **Security**: Uploaded files scanned for MIME validity, max size 25MB, download links authenticated and rate-limited.
- **Folder / Tagging**: Filter by department, course code, semester.

### 3.12 Notifications System
- **Channels**: In-app popover, banner badges, real-time push.
- **Deep Linking**: Clicking notification routes user directly to relevant entity (`/app/complaints/123`, `/app/notices/456`).

### 3.13 People Directory
- **Search & Filters**: Fuzzy search by name, filter by department, role, year, and online availability.
- **Actions**: Direct message trigger button, public academic profile view.

### 3.14 System Audit Logs
- **Immutable Ledger**: Records all administrative actions: `USER_ROLE_CHANGED`, `COMPLAINT_STATUS_UPDATED`, `NOTICE_PUBLISHED`, `EMERGENCY_TRIGGERED`, `USER_SUSPENDED`.
- **Payload**: Timestamp, Actor ID, Actor IP, Action, Entity Type, Entity ID, Diff changes.

### 3.15 Operational Analytics
- **Strict Real Data**: Zero fake metrics. All graphs driven by MongoDB aggregations.
- **Metrics**: 7-day active user count, complaint average turnaround time (hours to resolution), notice read percentage, daily message volume.

### 3.16 Premium Public Landing Page
- **Hero**: Clean, typography-forward introduction to Nexora Campus with realistic product UI screenshot/canvas preview.
- **Features Breakdown**: Unified notice grid, transparent complaint resolution, secure campus chat.
- **Architecture Showcase**: Demonstrates modern enterprise standard vs antiquated paper workflows.
