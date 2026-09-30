# Nexora Campus — Implementation & Execution Plan

## 1. Methodology & Phased Progression

Nexora Campus follows a strict 16-phase development lifecycle. Each phase is self-contained with verifiable acceptance criteria and automated quality gates (`TypeScript check`, `ESLint`, `Build`, `Test`). Progression to subsequent phases occurs only when the current phase passes all criteria.

---

## 2. Phase Breakdown & Deliverables

### Phase 0: Repository Audit, Architecture & Planning (Current Phase)
- [x] Audit existing directory and runtime environment (Node 24.5, npm 11.5).
- [x] Review functional requirements from `master.md` and `CEP Project Synopics FInal 2..pdf`.
- [x] Author system architecture blueprint (`docs/architecture.md`).
- [x] Author product specification for all 16 modules (`docs/product-spec.md`).
- [x] Author design system & token definitions (`docs/design-system.md`).
- [x] Author sequential execution plan (`docs/implementation-plan.md`).

### Phase 1: Workspace & Frontend Foundation
- **Goal**: Initialize monorepo workspace, Next.js App Router, Tailwind CSS, shadcn/ui base primitives, and persistent AppShell.
- **Key Tasks**:
  1. Initialize workspace packages (`apps/web`, `apps/server`, `packages/types`).
  2. Configure Tailwind CSS with design tokens (CSS variables for light/dark).
  3. Install and configure shadcn/ui components (`button`, `dialog`, `dropdown-menu`, `input`, `badge`, `sheet`, `command`, `table`, `tabs`, `avatar`).
  4. Build responsive `AppShell` with desktop collapsible sidebar, mobile sheet drawer, and top header.
  5. Implement `CommandMenu` (`Cmd+K`) palette foundation.
- **Quality Gate**: `npm run build` succeeds, zero lint errors, responsive shell toggles seamlessly.

### Phase 2: Authentication & Authorization (RBAC)
- **Goal**: Implement secure session and token handling with role enforcement.
- **Key Tasks**:
  1. Backend auth service: Argon2/bcrypt password hashing, JWT generation, HTTP-only refresh cookies.
  2. RBAC middleware: Role definitions (`STUDENT`, `FACULTY`, `ADMIN`, `SUPER_ADMIN`) and route guards.
  3. Frontend auth pages: `/auth/login`, `/auth/register`, `/auth/forgot-password`.
  4. Session hydration & automatic token refresh in Next.js client.
- **Quality Gate**: Unauthorized requests receive `401/403`, session persists on refresh, role boundaries enforced server-side.

### Phase 3: Database & API Foundation
- **Goal**: MongoDB connection, Mongoose schemas, compound indexes, and centralized REST infrastructure.
- **Key Tasks**:
  1. Mongoose schemas for User, Department, Conversation, Message, Notice, Event, Complaint, Poll, Feedback, File, Notification, EmergencyAlert, AuditLog.
  2. Implement compound indexes for high-throughput queries.
  3. Centralized API response format, Zod validation middleware, global error handler.
  4. Realistic database seed script (`npm run seed`) creating test users and demo campus data.
- **Quality Gate**: Database connects cleanly, seed script populates with zero errors, validation catches invalid payloads.

### Phase 4: Dashboard & Campus Core (Notices & Events)
- **Goal**: Build role-aware dashboards and functional notice/event systems with live API integration.
- **Key Tasks**:
  1. Student/Faculty personalized dashboard with active alerts, recent notices, upcoming events, complaint statuses.
  2. Admin operational dashboard with real KPIs and urgent action queues.
  3. Notice Board: priority badges, audience filtering, detail drawer, read receipt tracking.
  4. Event Module: upcoming/past filter, 1-click registration with capacity constraints.
- **Quality Gate**: Dashboards populate with real MongoDB data, zero hardcoded fake metrics, event registrations update capacity accurately.

### Phase 5: Real-Time Messaging & Presence
- **Goal**: High-craft 1:1 and group chat system with Socket.IO.
- **Key Tasks**:
  1. Socket.IO gateway with handshake authentication.
  2. 3-column desktop messaging interface (conversation list, message thread, thread details).
  3. Real-time events: message send/receive, typing indicators, read receipts, online presence.
  4. Attachment handling and message replies.
- **Quality Gate**: Instant message delivery across two simultaneous browser sessions, presence updates on disconnect/reconnect.

### Phase 6: Complaint & Grievance Management
- **Goal**: Full lifecycle issue tracker with audit timeline.
- **Key Tasks**:
  1. Student complaint submission form with category, location, severity, and anonymous flag.
  2. Status transition pipeline (`SUBMITTED` -> `UNDER_REVIEW` -> `ASSIGNED` -> `IN_PROGRESS` -> `RESOLVED`).
  3. Immutable timeline component showing every status change, note, and actor.
  4. Admin/Faculty triage table with assignment dropdown and status change dialogs.
- **Quality Gate**: End-to-end lifecycle test from student submission to faculty resolution with complete audit history.

### Phase 7: Polls, Feedback & Engagement
- **Goal**: Interactive student feedback and democratic campus polling.
- **Key Tasks**:
  1. Poll creation tool (single/multiple choice, ratings) with target audience filter.
  2. Voting interface with one-vote-per-user enforcement.
  3. Live percentage result visualization.
  4. Campus feedback submission for facilities with sentiment rating analytics.
- **Quality Gate**: Duplicate votes rejected by database constraint, poll closes at deadline, feedback statistics aggregated correctly.

### Phase 8: People Directory, Files & Notifications
- **Goal**: Searchable campus registry, authenticated file center, and centralized notifications.
- **Key Tasks**:
  1. Campus directory with fuzzy search by name/ID and filters by department, role, year.
  2. File center with upload, MIME verification, category tagging, and authenticated download stream.
  3. Notification center popover with deep links to notices, messages, and complaint updates.
- **Quality Gate**: Unauthenticated users cannot download private files, search returns accurate results in <100ms.

### Phase 9: Emergency Alert Grid
- **Goal**: High-urgency broadcast system with multi-step safeguard.
- **Key Tasks**:
  1. Admin emergency composer with required 2-step confirmation ("BROADCAST EMERGENCY").
  2. Immediate Socket.IO push to all connected users.
  3. High-contrast persistent banner displayed on all authenticated and public views.
  4. Deactivation workflow and emergency audit record.
- **Quality Gate**: Emergency alert appears on all active sessions in <500ms without page reload, unauthorized alert attempts blocked.

### Phase 10: Administration Command Center
- **Goal**: Dedicated administration suite for comprehensive campus governance.
- **Key Tasks**:
  1. User management DataTable: role modification, status suspension, search and batch actions.
  2. Notice, event, and poll administration tables.
  3. Immutable system audit log viewer with actor, IP, timestamp, and diff data.
  4. Platform settings management.
- **Quality Gate**: Admin tables support pagination, sorting, and filtering; audit logs cannot be edited or deleted.

### Phase 11: Operational Analytics & Reporting
- **Goal**: Real-data operational insights for department heads and administrators.
- **Key Tasks**:
  1. Aggregate MongoDB pipelines for DAU/WAU, complaint turnaround SLA, notice engagement rate.
  2. Chart.js / Recharts visualizations showing real institutional trends.
  3. Exportable summary reports (CSV/JSON).
- **Quality Gate**: Zero fabricated percentages; all analytics derive directly from active database records.

### Phase 12: Security Hardening Pass
- **Goal**: Comprehensive security audit and penetration resistance.
- **Key Tasks**:
  1. Helmet security headers, CORS restrictions, rate-limiting on sensitive endpoints.
  2. Input sanitization (XSS prevention), MongoDB injection prevention.
  3. Strict authorization verification on every API route and WebSocket handler.
- **Quality Gate**: Automated security checklist passes, brute force rate-limits verified, zero exposed stack traces.

### Phase 13: Responsive & Polish Pass
- **Goal**: Flawless experience across mobile, tablet, laptop, and 4K displays.
- **Key Tasks**:
  1. Mobile responsive testing: drawer navigation, stacked tables, tap targets.
  2. Tablet collapsed sidebar testing.
  3. Refined loading skeletons, empty state illustrations, and toast feedback.
- **Quality Gate**: Zero horizontal page overflow, smooth animations conforming to `prefers-reduced-motion`.

### Phase 14: Accessibility (a11y) Pass
- **Goal**: Full WCAG 2.1 AA compliance.
- **Key Tasks**:
  1. Semantic HTML audit (headings, labels, landmarks).
  2. Full keyboard navigation audit (`Tab`, `Shift+Tab`, `Enter`, `Escape`, `Cmd+K`).
  3. Color contrast verification across light and dark modes.
  4. ARIA live regions for realtime alerts and chat messages.
- **Quality Gate**: Lighthouse a11y score >= 95, screen reader announcements for alerts verified.

### Phase 15: Performance & Optimization Pass
- **Goal**: Sub-second load times and fluid real-time communication.
- **Key Tasks**:
  1. Next.js bundle analysis, dynamic imports for heavy components.
  2. Database query optimization with `.explain()` and compound index verification.
  3. Image optimization and lazy loading.
- **Quality Gate**: First Contentful Paint < 1.2s, API p95 response time < 100ms.

### Phase 16: QA, End-to-End Verification & Final Polish
- **Goal**: Complete system verification across all 13 critical user flows.
- **Key Tasks**:
  1. Automated integration and API test execution.
  2. End-to-end multi-user workflow testing with browser subagent.
  3. Production build validation and comprehensive README setup guide.
- **Quality Gate**: All 13 critical user journeys pass end-to-end; production build executes cleanly.
