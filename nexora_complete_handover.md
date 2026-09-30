# Nexora Campus — Complete System & Conversation Handover

## 1. Project Overview & Mission
- **Project Name**: Nexora Campus — Smart Communication Grid for Education Institutes.
- **Master Specification**: Defined in [`master.md`](./master.md).
- **Architecture**: Production-grade, multi-tenant digital communication and governance layer for higher education institutes.
- **Monorepo Structure**:
  - `apps/web`: Next.js 16.3.7 (Turbopack), React 19, Tailwind CSS, shadcn/ui (port `3000`).
  - `apps/server`: Node.js, Express, TypeScript, Socket.IO, MongoDB/Mongoose, Cloudinary (port `4000`).
  - `packages/types`: Shared TypeScript interfaces, DTOs, and enums across client and server.

---

## 2. Multi-Tenant Foundation & Roles

### Registered Seed Institutes
1. **P. R. Pote Patil College of Engineering and Management (PRPCEM)** (`code: PRPCEM`, `domain: prpcem.edu`) - Approved.
2. **COEP Technological University (COEP)** (`code: COEP`, `domain: coep.ac.in`) - Approved.
3. **Government College of Engineering, Amravati (GCOEA)** - Pending approval.

### Role Hierarchy & Seed Credentials
All users share standardized test passwords seeded in `apps/server/src/scripts/seed.ts`:
- **SUPER_ADMIN**: `superadmin@nexora.edu` / `super123` (Platform Governance across all institutes).
- **ADMIN**: `admin@prpcem.edu` / `admin123` (Campus administrator & registrar).
- **FACULTY (HoD)**: `atul.raut@prpcem.edu` / `faculty123` (Dr. Atul D. Raut, HoD CSE).
- **FACULTY (Class Coordinator)**: `pr.maskare@prpcem.edu` / `faculty123` (Prof. P. R. Maskare, Final Year CSE Coordinator).
- **STUDENT**: `prathamesh.patange@prpcem.edu` / `student123` (Enrolled Final Year CSE student).

---

## 3. Subsystems & Feature Breakdown

### A. Real-Time Communication Grid (`/app/messages`)
- **Gateway & Protocols**: Socket.IO authenticated via JWT handshake for instant messaging, read receipts, and live status.
- **Hierarchical Channels**:
  - Campus-wide, department-specific (`CS`, `IT`), and academic year channels (`FE`, `SE`, `TE`, `BE`).
  - **Broadcast Mode (`isAnnouncementOnly`)**: Only Faculty and Admins can publish circulars. Students view and add emoji reactions.
- **Student Custom Groups**:
  - Scope: `CAMPUS` (cross-department teams) or `DEPARTMENT` (department circles).
  - Access: `OPEN` (instant join) or `APPROVAL_REQUIRED` (inbound requests requiring admin review).
  - Admin controls: Creator (Crown icon) can promote members to Group Admins (`adminIds`) or demote them.
  - Inbound Requests: Group admins approve/reject join requests directly in Details Drawer.
  - Member Invites: Search peers by department and year; invites require invitee consent.
- **Campus Discovery Hub (Explore Tab)**:
  - Campus-wide directory of all student groups and study circles.
  - Search by topic/keyword, scope tabs (`All`, `Campus-Wide`, `My Department`), and department dropdown filter.
  - Action buttons: `Open Channel`, `Join Group`, `Request to Join`, or `Cancel Request`.
- **Consent-First Direct Messaging (DM)**:
  - Messaging out-of-network peers creates an inbound consent request. Recipient can accept or decline.
  - Separate `Incoming` and `Outgoing` request tabs.
- **DM Privacy Shield**:
  - User options: `ALLOW_ALL`, `SAME_DEPARTMENT_ONLY`, `FACULTY_ONLY` (blocks student DMs).
- **Campus Misuse & Harassment Reporting**:
  - Audit snapshot frozen and reported directly to Head of Department and Admin.

### B. Campus Notices & Circulars (`/app/notices`)
- Official institute memos with priority tagging (`NORMAL`, `URGENT`, `CRITICAL`).
- Department and academic year audience targeting.
- Read tracking, PDF attachments via Cloudinary CDN.

### C. Event Management & RSVPs (`/app/events`)
- Campus workshops, hackathons, cultural festivals, and technical symposiums.
- Seat capacity limits, RSVP tracking, venue details, and calendar export.

### D. Grievance & Complaints Management (`/app/complaints`)
- Confidential student complaints with tracking status (`PENDING`, `IN_REVIEW`, `RESOLVED`, `REJECTED`).
- Departmental assignment, admin resolution timeline notes, and HoD audit.

### E. Campus Polls & Elections (`/app/polls`)
- Real-time voting for student council elections, class feedback, and campus polls.
- Single/multiple-choice options, live percentage breakdown, duplicate vote prevention.

### F. Academic Resource Vault (`/app/files`)
- Verified course materials, previous year question papers, syllabi, and lab manuals.
- Filter by department, semester, subject, and file type.

### G. Emergency Broadcast Siren (`/app/emergency`)
- High-priority campus security and weather alerts.
- Top-level persistent siren banners overriding normal UI across all active devices.

### H. People Directory & Institutional Search (`/app/people`)
- Search verified faculty, staff, and students by name, roll number, or department.

### I. Institutional Profile & Preferences (`/app/profile`, `/app/settings`)
- Verified roll number, institutional email, bio, avatar, and notification settings.

---

## 4. Key Fixes & Refinements Made in This Session
1. **Real-time Connection Stability**:
   - Fixed Socket.IO connection URL synchronization between Next.js and Express backend on port `4000`.
2. **Student Custom Groups & Campus Directory**:
   - Built complete end-to-end custom groups architecture: schema, endpoints, Explore UI, invite flow, and join requests.
3. **React Key Collision Fix**:
   - Error: `Encountered two children with the same key, '6abbc8679d6925e7ec89617d'` in `selectedConversation.participants.map`.
   - Fixed: Deduplicated `participants`, `joinRequests`, and `pendingInvites` via `Map` on frontend and backend route serializer, using unique composite keys (`key={`part-${p.id}-${idx}`}`).
4. **Responsive UI Boundary Overhaul**:
   - Fixed mobile column conflict: Column 1 hides when Explore Hub or a chat is active on mobile.
   - Added mobile "Back to Messages" button in Explore Hub.
   - Fixed filter wrapping and dropdown widths so wide department names don't cause horizontal overflow.
   - Changed group cards grid from `md:grid-cols-2` to `lg:grid-cols-2` with text truncation.
   - Converted Column 3 Details Drawer into an overlay sliding drawer with backdrop on screens `< lg`.
   - Constrained all modals with `max-h-[90vh] overflow-y-auto`.
5. **Code Health**:
   - `apps/web`: `npx tsc --noEmit` exited 0.
   - `apps/server`: `npx tsc --noEmit` exited 0.

---

## 5. Directory Map of Key Files
- `master.md`: Project master design specification and rules.
- `apps/server/src/index.ts`: Server entry point and Socket.IO initialization.
- `apps/server/src/scripts/seed.ts`: Complete database seeder with institutes, users, channels, notices, events, and complaints.
- `apps/server/src/modules/conversations/`:
  - `conversation.model.ts`: Conversation schema (channels, DMs, custom groups, access modes, adminIds, joinRequests).
  - `conversation.routes.ts`: API endpoints for conversations, custom groups, explore directory, invites, join requests.
- `apps/server/src/modules/socket/socket.handler.ts`: Real-time WebSocket handlers.
- `apps/web/app/(dashboard)/app/messages/page.tsx`: Full messaging UI (Column 1 Sidebar, Column 2 Chat & Explore Hub, Column 3 Details Drawer, Modals).
- `packages/types/src/index.ts`: Shared TypeScript types across monorepo.

---

## 6. How to Run the Project
```bash
# Terminal 1 - Server (Port 4000)
npm run dev --workspace=server

# Terminal 2 - Web (Port 3000)
npm run dev --workspace=web -- -p 3000

# Seed Database (if needed)
npm run seed --workspace=server
```
