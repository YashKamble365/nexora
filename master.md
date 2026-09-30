You are the lead software architect, senior frontend engineer, senior backend engineer, product designer, UX designer, accessibility engineer, security engineer, and QA lead responsible for building the complete production-quality web application described below.

PROJECT NAME:
Nexora Campus — Smart Communication Grid for Education Institutes

MISSION:
Build Nexora Campus as a modern, professional, enterprise-grade campus communication and engagement platform for educational institutes.

The product should feel like a serious software product designed by a top-tier digital product studio, not like a student CRUD project, generic admin template, AI-generated dashboard, or collection of unrelated pages.

IMPORTANT:
This is a web implementation of the project concept described in the provided project synopsis.

The original synopsis describes a desktop client-server solution using Java Socket Programming, TCP/IP, multithreading, OOP, file handling and JDBC/MySQL.

FOR THIS IMPLEMENTATION, DO NOT USE THE ORIGINAL JAVA/JDBC STACK.

The actual implementation stack is:

Frontend:
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- shadcn blocks where useful

Backend:
- Node.js
- TypeScript
- REST API
- WebSocket/Socket.IO for real-time communication

Database:
- MongoDB
- Mongoose or an equally robust MongoDB ODM

Authentication:
- Secure session/token architecture using HTTP-only cookies where appropriate
- Role-based access control
- Proper password hashing
- Server-side authorization

The final system should preserve the original project's functional purpose while using the above modern web stack.

==================================================
1. PRODUCT VISION
==================================================

Nexora Campus is a centralized digital communication layer for an educational institute.

Instead of forcing students and faculty to use separate systems for:
- notices
- messaging
- events
- complaints
- feedback
- surveys/polls
- file sharing
- emergency communication
- member discovery
- notifications

Nexora should bring these workflows into one coherent application.

Core design principle:

"One campus. One communication layer."

The product should prioritize:
- clarity
- speed
- trust
- information hierarchy
- discoverability
- consistency
- accessibility
- responsive design
- operational usefulness

Do not optimize for visual novelty.

Optimize for:
- excellent UX
- polished visual hierarchy
- consistency
- real workflows
- quality states
- maintainability
- performance

==================================================
2. SOURCE OF TRUTH
==================================================

Use the provided project synopsis as the functional source of truth.

The synopsis establishes:
- students, faculty and administrators as users
- secure registration/login
- profiles
- group/private chat
- campus notices
- event management
- emergency alerts
- complaint management
- feedback
- polls/surveys
- online members
- file sharing
- user search
- notifications
- message history
- admin panel
- campus statistics dashboard

The implementation may improve UX, architecture, information architecture and technical implementation, but must not silently remove core requirements.

Where the synopsis specifies a feature, implement it.

Where the synopsis does not define detailed behavior, make sensible product decisions consistent with enterprise software.

Do not invent unnecessary features simply to increase feature count.

==================================================
3. NON-NEGOTIABLE PRODUCT QUALITY BAR
==================================================

The final application must NOT look like:
- an AI-generated SaaS template
- a generic Tailwind dashboard
- a college project made from random cards
- a Dribbble concept that ignores usability
- a copied shadcn demo
- a collection of giant rounded cards
- a neon/purple "AI startup" interface
- a glassmorphism template
- a dashboard with meaningless statistics
- a page with excessive gradients
- a site using random illustrations

Avoid:
- excessive gradients
- glowing backgrounds
- giant decorative blobs
- unnecessary glassmorphism
- excessive rounded cards
- excessive shadows
- excessive animation
- fake statistics
- fake testimonials
- fake customer logos
- meaningless illustrations
- AI-generated campus imagery
- stock imagery unless genuinely useful
- decorative icons without semantic purpose
- huge typography everywhere
- excessive empty whitespace when information density is appropriate

Do not use AI-generated media.

If imagery is required for the product, use:
- carefully selected local assets
- neutral image placeholders
- uploaded user content
- simple editorial imagery
- CSS-based visual treatment

Do not generate fake institutional statistics or fake user activity.

For seed/demo data, clearly structure it as development/demo data.

==================================================
4. DESIGN DIRECTION
==================================================

Design Nexora as a premium enterprise product.

Reference the design principles of:
- Linear
- Notion
- modern enterprise operations platforms
- high-quality communication products
- polished institutional software

Do NOT copy any brand.

The desired result:
- restrained
- sophisticated
- highly legible
- information-dense where appropriate
- spacious where appropriate
- minimal
- intentional
- calm
- functional
- premium

Design should communicate:
- trust
- institutional reliability
- speed
- order
- modernity

The application should have a strong visual identity but not rely on visual gimmicks.

==================================================
5. SHADCN/UI STRATEGY
==================================================

Use shadcn/ui extensively.

Do NOT treat shadcn as the visual identity.

Use shadcn as the foundation.

Use official shadcn components for primitives and use shadcn blocks as starting compositions where they genuinely accelerate development.

Potential components:
- Button
- Input
- Textarea
- Label
- Badge
- Avatar
- Card
- Separator
- Skeleton
- Tooltip
- Dialog
- AlertDialog
- Sheet
- Drawer
- DropdownMenu
- Popover
- Command
- Tabs
- Select
- Combobox
- Calendar
- DatePicker
- Checkbox
- RadioGroup
- Switch
- Progress
- ScrollArea
- Breadcrumb
- Sidebar
- Table
- Pagination
- Chart
- Toast/Sonner
- Form

Use shadcn blocks for:
- authentication foundations
- application shell
- sidebar
- dashboard structure
- data-heavy screens
- settings structures
- administration foundations

BUT:
Never simply copy a shadcn block and leave its demo styling/content intact.

Every block must be adapted to Nexora's:
- design tokens
- typography
- spacing
- colors
- hierarchy
- content model
- interaction patterns
- responsive behavior

Create a layer above shadcn:

components/ui/
    generic shadcn primitives

components/shared/
    reusable Nexora primitives

components/domain/
    product-specific components

Example:

components/ui/button.tsx
components/ui/dialog.tsx

components/shared/page-header.tsx
components/shared/data-table.tsx
components/shared/status-badge.tsx
components/shared/empty-state.tsx
components/shared/filter-bar.tsx

components/domain/messaging/message-bubble.tsx
components/domain/complaints/complaint-timeline.tsx
components/domain/events/event-card.tsx
components/domain/notices/notice-row.tsx

==================================================
6. DESIGN SYSTEM
==================================================

Before building many screens, establish a real design system.

Define:
- typography scale
- font family
- font weights
- spacing scale
- radius scale
- shadows
- borders
- elevation
- colors
- semantic colors
- component states
- icon sizing
- layout widths
- grid rules
- motion rules

Typography should prioritize readability.

Suggested hierarchy:
- display
- page title
- section title
- card title
- body
- body-small
- metadata
- label
- table/data text

Do not use excessively large headings inside authenticated application screens.

Color system:
- neutral foundation
- one primary brand/accent
- restrained semantic colors
- success
- warning
- destructive
- informational
- muted

Emergency states must have clear semantic differentiation.

Use design tokens instead of scattered hardcoded colors.

Support:
- light mode
- dark mode
- system mode

Dark mode must be intentionally designed, not simply inverted.

==================================================
7. USER ROLES
==================================================

Primary roles:

1. STUDENT
2. FACULTY
3. ADMIN

Potential future:
4. SUPER_ADMIN

Do not implement unnecessary role complexity initially.

STUDENT:
- view notices
- view events
- register for events
- communicate
- private message
- group chat
- search users
- view online members
- submit complaints
- track complaints
- respond to polls
- submit feedback
- access files
- receive notifications
- receive emergency alerts
- manage profile
- manage preferences

FACULTY:
Student capabilities where relevant
+
- authorized notices
- events
- polls
- group communication
- file publishing
- communication to relevant groups
- complaint handling if assigned/authorized

ADMIN:
- user management
- role management
- notice management
- event management
- complaint management
- poll/survey management
- feedback management
- file management
- emergency alerts
- notification management
- analytics
- audit logs
- platform settings

Permissions must be enforced server-side.

Never rely only on frontend role hiding.

==================================================
8. INFORMATION ARCHITECTURE
==================================================

PUBLIC

/
    landing page

/auth/login
/auth/register
/auth/forgot-password
/auth/reset-password

AUTHENTICATED APPLICATION

/app
/app/dashboard

/app/messages
/app/messages/[conversationId]

/app/people
/app/people/[userId]

/app/notices
/app/notices/[noticeId]

/app/events
/app/events/[eventId]

/app/files

/app/polls
/app/polls/[pollId]

/app/feedback

/app/complaints
/app/complaints/[complaintId]

/app/emergency

/app/notifications

/app/activity

/app/profile

/app/settings

ADMIN

/admin
/admin/dashboard

/admin/users
/admin/users/[userId]

/admin/notices
/admin/notices/new
/admin/notices/[noticeId]/edit

/admin/events
/admin/events/new
/admin/events/[eventId]/edit

/admin/complaints
/admin/complaints/[complaintId]

/admin/polls
/admin/polls/new
/admin/polls/[pollId]/edit

/admin/feedback

/admin/files

/admin/alerts

/admin/analytics

/admin/audit-logs

/admin/settings

Use route groups/layouts appropriately.

==================================================
9. GLOBAL APPLICATION SHELL
==================================================

Create a reusable application shell.

Desktop:

Left:
- branded sidebar

Top:
- page title/context
- global search
- notifications
- profile

Main:
- responsive content container

Desktop sidebar should support:
- expanded
- collapsed
- tooltips when collapsed

Mobile:
- sidebar becomes mobile navigation
- use drawer/sheet or bottom navigation where appropriate

Do NOT squeeze desktop layout onto mobile.

The layout must intentionally adapt.

==================================================
10. SIDEBAR
==================================================

Structure:

NEXORA

OVERVIEW
- Overview

COMMUNICATION
- Messages
- People
- Files

CAMPUS
- Notices
- Events

ENGAGEMENT
- Polls
- Feedback

SUPPORT
- Complaints
- Emergency

PERSONAL
- Activity
- Notifications

BOTTOM
- Settings
- Profile

ADMIN users get an additional ADMINISTRATION section.

Display:
- unread counts
- relevant badges
- active route
- collapse state

Do not clutter with unnecessary icons.

==================================================
11. GLOBAL COMMAND CENTER
==================================================

Implement a global command palette using shadcn Command.

Keyboard shortcut:
- Cmd/Ctrl + K

Capabilities:
- navigate
- search users
- search notices
- search events
- search files
- search messages
- create actions
- context-aware actions based on role

Example:
Search:
"Rahul"

Results:
People
Notices
Events
Messages
Files

Allow keyboard navigation.

==================================================
12. AUTHENTICATION
==================================================

Build a complete authentication system.

Screens:
- login
- registration
- forgot password
- reset password

Login:
- institutional email
- password
- remember device where appropriate
- show/hide password
- validation
- loading
- server error
- account disabled state

Registration:
- full name
- institutional ID
- email
- password
- confirm password
- department
- role-appropriate academic information
- optional profile image

Implement:
- secure password hashing
- secure sessions/tokens
- HTTP-only cookies where appropriate
- session validation
- logout
- logout all devices if supported
- authorization
- rate limiting
- input validation
- CSRF protection where applicable
- secure error handling

Never expose sensitive authentication information in frontend code.

==================================================
13. DASHBOARD
==================================================

The dashboard is a command center, not a collection of random cards.

Student/faculty dashboard:

Header:
"Good morning, [name]"
Subtext:
brief contextual summary

Top priority area:
- emergency alert if active
- important unread notice count
- critical action reminders

Quick actions:
- New message
- Submit complaint
- View notices
- View events
- Polls

Main sections:
- latest notices
- upcoming events
- active polls
- complaint status
- recent activity
- online people

Use role-aware content.

Do not show the same dashboard to every role.

ADMIN DASHBOARD:

Header:
"Campus administration"

Operational metrics:
- total users
- online users
- open complaints
- active events

Attention required:
- overdue complaints
- expiring notices
- pending approvals
- active emergency alerts

Operational overview:
- complaints
- communication activity
- notices
- events

Recent activity:
- admin actions
- system events
- important changes

Upcoming:
- events
- notices

Use data for meaningful operational decisions.

Do not create fake percentages simply to fill charts.

==================================================
14. MESSAGING MODULE
==================================================

Messaging is a core product area.

Support:
- one-to-one conversations
- group conversations
- message history
- online status
- typing indicators
- message read state
- file attachments
- images
- documents
- replies
- reactions
- delete/edit where appropriate
- message search
- pinned conversations
- mute conversation
- unread counts

Use real-time updates through Socket.IO/WebSockets.

Architecture:

Next.js frontend
    |
Node.js API
    |
MongoDB

and

Next.js client
    |
Socket.IO
    |
Node.js real-time server

Realtime events:
- message:new
- message:read
- message:edited
- message:deleted
- user:online
- user:offline
- typing:start
- typing:stop
- conversation:updated
- notification:new

Messages interface:

Three-column desktop layout:

left:
conversation list

center:
chat

right:
conversation details

On mobile:
conversation list
    ->
chat
    ->
details

Do not attempt three-column mobile UI.

Conversation list:
- avatar
- name
- preview
- timestamp
- unread count
- online state
- pinned/muted state

Chat:
- grouped messages
- timestamps
- sender information where needed
- reply context
- reactions
- attachments

Composer:
- textarea
- attachment
- emoji
- reply preview
- send button

Avoid unnecessary decorative chat bubbles.

==================================================
15. PEOPLE / DIRECTORY
==================================================

Build a campus directory.

Features:
- search
- filter
- role filter
- department filter
- year filter
- online filter

User card:
- avatar
- name
- role
- department
- academic year
- online state
- message action

Profile detail:
- avatar
- name
- role
- department
- approved institutional details
- groups
- files where applicable
- recent activity where permission allows

Respect privacy.

==================================================
16. NOTICE MODULE
==================================================

Notice listing:
- all
- important
- academic
- administrative
- event-related
- department-specific

Notice row:
- priority
- title
- summary
- department
- author
- publish date
- expiry
- unread state

Notice detail:
- title
- priority
- author
- department
- publication date
- expiration
- content
- attachments
- related event
- read status

Admin notice editor:
- title
- content
- category
- target audience
- department
- priority
- publish now
- schedule
- expiry
- attachments
- preview

Support drafts.

Support scheduled publishing if feasible.

==================================================
17. EVENT MODULE
==================================================

Event listing:
- upcoming
- past
- registered
- filters

Event:
- title
- description
- date
- time
- venue
- organizer
- category
- capacity
- registration state
- registration deadline
- cover image if available
- attachments
- announcements

Registration:
- register
- unregister where allowed
- capacity
- registration closed
- already registered

Admin:
- create
- edit
- publish
- schedule
- cancel
- archive
- manage registrations

Avoid designing every event as a giant colorful marketing card.

Use clean editorial/event-management layouts.

==================================================
18. COMPLAINT MANAGEMENT
==================================================

This should feel like a real issue-tracking workflow.

Student:
"My complaints"

Statistics:
- open
- under review
- in progress
- resolved

Submit complaint:
- category
- subject
- description
- location
- priority
- attachment
- anonymous option only if institution configuration permits

Complaint detail:
- complaint ID
- category
- description
- submitted time
- status
- priority
- department
- assigned person
- attachments
- history

Status lifecycle:

SUBMITTED
    ↓
UNDER_REVIEW
    ↓
ASSIGNED
    ↓
IN_PROGRESS
    ↓
RESOLVED

Possible:
REJECTED
CLOSED

Every status transition should be recorded.

Timeline:
- timestamp
- actor
- status
- note

Admin complaint table:
- ID
- subject
- category
- submitted by
- department
- priority
- status
- assignee
- created date
- age

Admin actions:
- assign
- change status
- add note
- request information
- resolve
- reopen

Use:
- DataTable
- FilterBar
- Sheet
- Dialog
- Timeline

This should be one of the strongest modules in the system.

==================================================
19. POLLS AND SURVEYS
==================================================

Support:
- single-choice
- multiple-choice
- rating
- short text
- long text

Poll metadata:
- title
- description
- author
- audience
- department
- anonymous
- start date
- end date
- result visibility

Student experience:
- question
- options
- submission
- confirmation
- results where permitted

Admin poll builder:
Two-column layout:

left:
configuration

right:
live preview

Support draft/published/closed states.

Prevent duplicate submissions.

==================================================
20. FEEDBACK MODULE
==================================================

Allow users to submit feedback about campus services.

Support:
- category
- rating
- text
- optional anonymous mode
- optional attachment

Admin:
- feedback list
- filters
- categories
- trends
- average ratings
- recent comments

Do not over-engineer feedback into an enterprise CRM.

==================================================
21. EMERGENCY ALERTS
==================================================

Emergency alerts must visually differ from ordinary notices.

Student:
- active emergency banner
- emergency notification
- emergency center

Alert fields:
- title
- message
- severity
- affected location
- audience
- start time
- expiration
- issuing administrator

Admin:
- create alert
- preview
- confirm
- publish
- deactivate
- view history

Use deliberate confirmation before publishing.

Emergency alerts must not be accidentally sent through a normal notice flow.

The interface must prioritize:
- urgency
- readability
- action
- affected area
- timestamp

==================================================
22. FILE CENTER
==================================================

Support:
- PDFs
- images
- documents
- notes

Views:
- recent
- shared with me
- my files
- department files
- chat files

File item:
- icon
- filename
- type
- uploader
- size
- date
- access state

Actions:
- preview
- download
- share
- rename where permitted
- delete where permitted

Do not hardcode storage implementation into the UI.

Create a file-storage abstraction.

Development:
- local storage can be used

Production:
- make the system compatible with object storage such as S3-compatible infrastructure

Validate:
- file type
- size
- permissions
- malicious upload risks

Never serve private files without authorization.

==================================================
23. NOTIFICATIONS
==================================================

Central notification center.

Categories:
- messages
- notices
- events
- complaints
- polls
- system
- emergency

Notification item:
- icon/avatar
- title
- description
- timestamp
- unread/read state
- deep link

Actions:
- mark read
- mark all read
- notification settings

Real-time notifications via Socket.IO.

==================================================
24. ACTIVITY
==================================================

Personal activity timeline:

- complaints
- event registrations
- poll participation
- feedback
- file uploads
- notices
- account activity

Show meaningful events only.

==================================================
25. PROFILE
==================================================

Profile:
- avatar
- name
- role
- institutional ID
- department
- year
- bio
- approved contact details

Edit profile.

Upload/update avatar.

==================================================
26. SETTINGS
==================================================

Settings sections:

ACCOUNT
- name
- email
- password

NOTIFICATIONS
- messages
- notices
- events
- complaints
- polls
- system

PRIVACY
- profile visibility
- online visibility
- messaging permissions
- read receipts

APPEARANCE
- light
- dark
- system

SECURITY
- sessions
- logout all devices

==================================================
27. ADMIN USER MANAGEMENT
==================================================

DataTable with:
- user
- role
- department
- status
- date joined
- last active

Features:
- search
- filters
- sorting
- pagination
- column visibility
- bulk selection

Actions:
- view
- edit
- disable
- enable
- role change
- reset access where appropriate

Clicking a user should open contextual detail through a Sheet/Drawer where appropriate.

==================================================
28. ADMIN NOTICE MANAGEMENT
==================================================

Views:
- published
- drafts
- scheduled
- expired

Actions:
- create
- edit
- duplicate
- publish
- unpublish where safe
- archive

==================================================
29. ADMIN EVENT MANAGEMENT
==================================================

Views:
- upcoming
- drafts
- past
- cancelled

Actions:
- create
- edit
- publish
- schedule
- cancel
- archive
- view registrations

==================================================
30. ADMIN POLL MANAGEMENT
==================================================

Views:
- active
- drafts
- scheduled
- closed

Actions:
- create
- edit
- duplicate
- close
- export results

==================================================
31. ADMIN FEEDBACK MANAGEMENT
==================================================

Support:
- search
- filters
- categories
- trend views
- detail panel
- export if appropriate

==================================================
32. ADMIN FILE MANAGEMENT
==================================================

Support:
- search
- type filter
- uploader
- department
- date
- size

Admin actions:
- view
- remove
- restrict
- inspect metadata

==================================================
33. ANALYTICS
==================================================

Analytics are an enhancement to the basic dashboard.

Only show metrics backed by real data.

Possible metrics:
- daily active users
- weekly active users
- messages/day
- notices published/read
- event registrations
- complaint volume
- complaint resolution time
- poll participation
- feedback volume

Use charts when they answer real questions.

Avoid:
- decorative pie charts
- fake growth percentages
- fake comparison periods
- excessive charts

Provide:
- date range
- filters
- empty states

==================================================
34. AUDIT LOGS
==================================================

Track important administrative actions.

Example:
ADMIN
published notice
at timestamp

ADMIN
changed complaint status

FACULTY
created event

ADMIN
disabled user

EMERGENCY ALERT
published

Fields:
- actor
- action
- entity
- timestamp
- metadata
- IP/device information where appropriate

Make logs immutable from normal application UI.

==================================================
35. DATABASE DESIGN
==================================================

Create a robust MongoDB schema.

Collections/models:

users
departments
conversations
messages
messageReactions
notices
noticeReads
events
eventRegistrations
complaints
feedback
polls
pollResponses
files
notifications
emergencyAlerts
auditLogs
sessions if required

Use indexes intentionally.

Important likely indexes:
- users email
- users institutional ID
- users department
- messages conversation + createdAt
- conversations members
- notices audience/category/publishedAt
- events date
- complaints status/category/department/createdAt
- notifications recipient/read/createdAt
- audit logs timestamp
- polls active/end date

Do not create excessive indexes blindly.

Use pagination for large collections.

Use cursor pagination where appropriate.

==================================================
36. API ARCHITECTURE
==================================================

Structure Node backend by domain.

Example:

src/
  config/
  middleware/
  auth/
  users/
  conversations/
  messages/
  notices/
  events/
  complaints/
  polls/
  feedback/
  files/
  notifications/
  emergency/
  analytics/
  audit/
  admin/

Within domains where useful:

controller/
service/
model/
repository/
validation/
routes/

Do not put business logic in route handlers.

Use centralized:
- error handling
- validation
- logging
- authentication
- authorization
- response formatting

Use request validation with a robust validation library.

==================================================
37. API CONVENTIONS
==================================================

Use predictable REST conventions.

Examples:

POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout

GET /api/users
GET /api/users/:id

GET /api/notices
POST /api/notices
GET /api/notices/:id
PATCH /api/notices/:id
DELETE /api/notices/:id

GET /api/events
POST /api/events
POST /api/events/:id/register

GET /api/complaints
POST /api/complaints
PATCH /api/complaints/:id/status

GET /api/conversations
POST /api/conversations

GET /api/conversations/:id/messages
POST /api/conversations/:id/messages

etc.

Do not expose internal database implementation details through the API.

==================================================
38. REAL-TIME ARCHITECTURE
==================================================

Use Socket.IO or an equally robust WebSocket implementation.

Real-time:
- messaging
- typing
- presence
- read receipts
- notifications
- complaint status updates where appropriate
- emergency alerts

Authentication of sockets is mandatory.

Do not trust client-provided user identity.

Verify session/token server-side.

Handle:
- reconnect
- disconnect
- duplicate events
- stale sessions
- optimistic UI reconciliation

==================================================
39. SECURITY
==================================================

Treat security seriously.

Implement:
- password hashing
- authentication middleware
- authorization middleware
- RBAC
- input validation
- output sanitization where needed
- rate limiting
- secure headers
- secure cookies
- protection against injection
- authorization for every private resource
- file upload validation
- safe error messages
- audit logging
- session invalidation

Do not store secrets in client-side source.

Use environment variables.

Provide .env.example.

Never commit:
- passwords
- API keys
- secrets
- production connection strings

==================================================
40. ACCESSIBILITY
==================================================

Target strong accessibility.

Requirements:
- semantic HTML
- keyboard navigation
- visible focus states
- correct aria labels
- accessible dialogs
- accessible forms
- accessible tables
- color contrast
- reduced motion support
- screen-reader-friendly status changes
- keyboard-accessible command menu

Do not use color as the only signal.

==================================================
41. RESPONSIVE DESIGN
==================================================

Design desktop-first where appropriate but fully support:
- desktop
- laptop
- tablet
- mobile

Desktop:
- persistent sidebar
- multi-column layouts
- data tables

Tablet:
- collapsed sidebar
- responsive content

Mobile:
- mobile navigation
- stacked layouts
- sheets/drawers
- cards/lists where tables become impractical

Messaging:
desktop = three-column
mobile = hierarchical navigation

Do not merely reduce widths.

==================================================
42. LOADING STATES
==================================================

Every async view must have a meaningful loading state.

Use skeletons that match the actual content.

Examples:
- dashboard skeleton
- table skeleton
- notice skeleton
- chat skeleton
- profile skeleton

Never leave the UI blank while data loads.

==================================================
43. EMPTY STATES
==================================================

Every collection needs a good empty state.

Examples:

"No conversations yet"
"No upcoming events"
"No complaints submitted"
"No notifications"
"No files found"

Provide:
- clear explanation
- relevant action if appropriate

Do not use generic:
"No data available."

==================================================
44. ERROR STATES
==================================================

Provide:
- inline validation
- API error messages
- permission errors
- not-found states
- network errors
- retry action

Example:

"Couldn't load your notices."
[Try again]

Never expose stack traces to users.

==================================================
45. TOASTS AND CONFIRMATIONS
==================================================

Use toast notifications for lightweight success/error feedback.

Examples:
- Complaint submitted
- Notice published
- Profile updated
- Message sent

Use dialogs for destructive/high-impact actions.

Emergency publication must use explicit confirmation.

Do not use modal dialogs for every simple action.

==================================================
46. MOTION
==================================================

Animation should communicate hierarchy and state.

Use:
- subtle page transitions
- dialog transitions
- sidebar transitions
- toast animation
- message arrival
- status changes
- upload progress

Do not use:
- excessive bouncing
- floating cards
- animated gradients
- parallax everywhere
- unnecessary motion

Respect prefers-reduced-motion.

==================================================
47. PERFORMANCE
==================================================

Optimize:
- route loading
- bundle size
- images
- database queries
- API payloads
- message pagination
- virtualized long message lists if required
- lazy loading
- caching
- server/client boundary

Use server components appropriately.

Do not make the entire app client-side by default.

Use client components only when interactivity requires them.

==================================================
48. FRONTEND STATE MANAGEMENT
==================================================

Use the simplest appropriate state strategy.

Do not introduce a large global state library unless justified.

Use:
- URL state for filters/search where appropriate
- React state for local UI
- server state/query layer for API data
- Socket.IO state for realtime updates

Keep domain state predictable.

==================================================
49. FORMS
==================================================

Standardize forms.

Use:
- shadcn Form
- controlled validation
- clear error messages
- loading states
- disabled states
- success state

Every form must have:
- labels
- validation
- helper text where necessary
- errors
- submission state
- cancellation path

==================================================
50. DATA TABLE DESIGN
==================================================

Admin tables are important.

Every major administrative table should consider:
- search
- filters
- sorting
- pagination
- selectable rows
- bulk actions
- column visibility
- row action menu
- responsive behavior

Do not overload tables with every possible field.

Show the information needed for the operational task.

Additional details can appear in a Sheet/Drawer.

==================================================
51. COMPONENT ARCHITECTURE
==================================================

Use:

components/
  ui/
  shared/
  domain/
  layouts/

Suggested shared components:

AppShell
Sidebar
Topbar
PageHeader
Breadcrumbs
CommandMenu
SearchInput
FilterBar
DataTable
Stat
StatusBadge
PriorityBadge
EmptyState
ErrorState
LoadingState
ActivityTimeline
ConfirmDialog
UserAvatar
OnlineIndicator
FileIcon
Pagination
ResponsiveContainer

Domain components:

messaging/
  ConversationList
  ConversationItem
  ChatHeader
  MessageList
  MessageGroup
  MessageBubble
  MessageComposer
  AttachmentPreview
  TypingIndicator

notices/
  NoticeList
  NoticeRow
  NoticeCard
  NoticeDetail
  NoticeEditor

events/
  EventList
  EventCard
  EventDetail
  RegistrationButton
  EventEditor

complaints/
  ComplaintTable
  ComplaintCard
  ComplaintDetail
  ComplaintTimeline
  ComplaintStatus
  ComplaintEditor

polls/
  PollCard
  PollDetail
  PollBuilder
  PollQuestion
  PollResults

etc.

==================================================
52. DESIGN TOKENS
==================================================

Do not scatter arbitrary Tailwind values.

Create:
- spacing scale
- typography scale
- semantic colors
- border colors
- radius tokens
- shadow tokens

Components must consume tokens.

Make global redesign possible without manually editing every screen.

==================================================
53. LANDING PAGE
==================================================

Build a premium landing page.

Hero:
Nexora Campus
One campus. One communication layer.

Supporting copy:
Centralized communication and engagement for modern educational institutes.

Primary CTA:
Sign in

Secondary CTA:
Explore platform

Sections:
1. Hero
2. Communication problem
3. Unified platform
4. Core capabilities
5. Product interface preview
6. Student/faculty/admin roles
7. How it works
8. Final CTA

Do not use:
- fake testimonials
- fake company logos
- fake metrics
- AI-generated students
- meaningless 3D graphics

Use real product UI as the visual storytelling mechanism.

The product itself should be the hero visual.

==================================================
54. PAGE-SPECIFIC UI PRINCIPLES
==================================================

LANDING:
More expressive.

AUTH:
Minimal and focused.

DASHBOARD:
Operational and personalized.

MESSAGING:
High information density.

NOTICES:
Editorial/information hierarchy.

EVENTS:
Discoverable but structured.

COMPLAINTS:
Workflow/status oriented.

POLLS:
Simple interaction.

FEEDBACK:
Lightweight.

FILES:
Utility-focused.

ADMIN:
Dense, precise, operational.

SETTINGS:
Quiet and structured.

==================================================
55. FUTURE SCOPE BOUNDARY
==================================================

The original project synopsis mentions future possibilities including:
- Android application
- voice/video calling
- end-to-end encryption
- cloud database
- AI chatbot
- QR-code login
- multi-language support

Do NOT implement these in the initial version unless specifically instructed.

Architect the system so they can be added later.

Especially:
- do not add an AI chatbot just because AI is mentioned in the synopsis
- do not add random AI features
- do not add video calls simply for visual impressiveness

Keep the MVP focused.

==================================================
56. INTERNATIONALIZATION READINESS
==================================================

The synopsis mentions future English/Hindi/Marathi support.

Initial UI:
English.

However:
- avoid hardcoding UI strings into complex components where practical
- structure copy so localization can be introduced later
- avoid building layouts that break with longer translations

Do not actually implement full multilingual support unless instructed.

==================================================
57. PROJECT STRUCTURE
==================================================

Prefer a clean monorepo if useful:

apps/
  web/
  api/

packages/
  ui/
  types/
  config/

OR a clean full-stack structure appropriate to the repository.

Before choosing architecture:
inspect the existing repository.

NEVER destroy existing useful work.

If an existing application exists:
- inspect first
- understand architecture
- preserve working functionality
- refactor incrementally

==================================================
58. DEVELOPMENT METHODOLOGY — MANDATORY PHASED EXECUTION
==================================================

DO NOT build the entire system in one pass.

Work in phases.

After each phase:
1. run checks
2. inspect implementation
3. fix issues
4. document completed work
5. verify acceptance criteria
6. only then continue

Never skip a phase just because another phase is easier.

==================================================
PHASE 0 — REPOSITORY AUDIT AND PROJECT PLAN
==================================================

Before coding:

Inspect:
- existing repository
- package.json
- Next.js version
- existing routes
- components
- styling
- configuration
- database code
- environment setup
- existing assets
- README
- scripts

Identify:
- what already exists
- what can be reused
- what needs refactoring
- what is missing

Create:
docs/architecture.md
docs/product-spec.md
docs/design-system.md
docs/implementation-plan.md

Output a concise implementation plan before making major changes.

Do not ask unnecessary questions when reasonable engineering decisions can be made.

==================================================
PHASE 1 — FOUNDATION
==================================================

Build:
- Next.js foundation
- TypeScript configuration
- Tailwind
- shadcn/ui setup
- base theme
- design tokens
- fonts
- global layout
- app shell
- sidebar
- topbar
- command palette
- theme switching
- responsive infrastructure

Create the component architecture.

Acceptance:
- app boots cleanly
- lint passes
- TypeScript passes
- responsive shell works
- light/dark mode works
- sidebar works
- command palette works

Do NOT implement all business modules yet.

==================================================
PHASE 2 — AUTHENTICATION AND AUTHORIZATION
==================================================

Implement:
- login
- registration
- logout
- password reset flow
- session handling
- RBAC
- protected routes
- protected API endpoints

Create:
- auth middleware
- role middleware
- user model
- authentication services

Acceptance:
- unauthenticated user cannot access app
- student cannot access admin
- faculty/admin permissions work
- session survives refresh
- logout works
- validation works
- errors are safe

==================================================
PHASE 3 — DATABASE AND API FOUNDATION
==================================================

Set up:
- MongoDB
- schemas
- indexes
- migrations/seeding strategy if required
- API conventions
- centralized errors
- validation
- logging

Implement foundational API modules.

Create seed data for:
- users
- departments
- sample notices
- sample events
- sample complaints
- sample polls
- sample conversations

Clearly mark seed data as development data.

==================================================
PHASE 4 — DASHBOARD AND CAMPUS CORE
==================================================

Build:
- student dashboard
- faculty dashboard
- admin dashboard
- notices
- events

Use real API data.

Implement:
- loading
- empty
- error
- responsive states

Acceptance:
All dashboard content comes from backend data rather than hardcoded fake production state.

==================================================
PHASE 5 — MESSAGING AND REAL-TIME SYSTEM
==================================================

Implement:
- conversations
- direct messages
- group messages
- messages
- presence
- typing
- unread counts
- read states
- attachments
- replies/reactions where practical
- real-time notifications

Set up Socket.IO correctly.

Test:
- two users messaging in real time
- reconnect
- unread state
- online state
- authorization

This phase is critical.

==================================================
PHASE 6 — COMPLAINTS AND SUPPORT
==================================================

Implement:
- complaint submission
- complaint list
- complaint detail
- status workflow
- assignment
- comments/updates
- attachments
- admin management

Build the full timeline experience.

Acceptance:
A student can submit a complaint and an authorized admin/faculty user can process it through the lifecycle.

==================================================
PHASE 7 — POLLS, FEEDBACK AND ENGAGEMENT
==================================================

Implement:
- polls
- voting
- survey responses
- duplicate vote prevention
- poll lifecycle
- feedback
- feedback administration

Acceptance:
A poll can be created, targeted, published, answered, closed and analyzed.

==================================================
PHASE 8 — PEOPLE, FILES AND NOTIFICATIONS
==================================================

Implement:
- people directory
- profile views
- file center
- notifications
- global search
- activity

Connect each to real backend data.

==================================================
PHASE 9 — EMERGENCY ALERT SYSTEM
==================================================

Implement:
- emergency creation
- admin confirmation
- alert publication
- real-time alert delivery
- active alerts
- expiration/deactivation
- alert history

Test:
- emergency alert appears immediately to connected users
- unauthorized users cannot create alerts
- alert cannot be accidentally triggered by normal notice workflow

==================================================
PHASE 10 — ADMINISTRATION
==================================================

Complete:
- user administration
- notices administration
- events administration
- complaints administration
- polls administration
- feedback administration
- file administration
- emergency administration
- audit logs
- settings

Use consistent enterprise data patterns.

==================================================
PHASE 11 — ANALYTICS AND REPORTING
==================================================

Implement meaningful analytics based on real data.

No invented numbers.

Use:
- charts
- filters
- date range
- trend views
- operational metrics

Add exports only where useful.

==================================================
PHASE 12 — SECURITY HARDENING
==================================================

Perform a security pass.

Check:
- auth
- RBAC
- cookies
- sessions
- rate limits
- input validation
- output handling
- file uploads
- private resources
- API authorization
- WebSocket authorization
- security headers
- secrets
- logging

Attempt unauthorized access to protected endpoints.

==================================================
PHASE 13 — RESPONSIVE/POLISH PASS
==================================================

Test:
- desktop
- laptop
- tablet
- mobile

Check:
- sidebar
- tables
- forms
- modals
- sheets
- messaging
- file uploads
- events
- notices
- complaints

Fix overflow and interaction issues.

==================================================
PHASE 14 — ACCESSIBILITY PASS
==================================================

Audit:
- keyboard
- focus
- labels
- contrast
- screen readers
- modal behavior
- command palette
- tables
- forms
- error states
- reduced motion

==================================================
PHASE 15 — PERFORMANCE PASS
==================================================

Measure and optimize:
- initial loading
- route transitions
- image size
- JS bundle
- database queries
- API latency
- chat history loading
- large tables
- notification polling/realtime

Avoid premature optimization.

Optimize bottlenecks that actually exist.

==================================================
PHASE 16 — QA AND FINAL PRODUCT PASS
==================================================

Create:
- unit tests
- integration tests
- API tests
- authentication tests
- RBAC tests
- realtime tests
- critical end-to-end flows

Critical flows:
1. register/login
2. student reads notice
3. student registers for event
4. student sends message
5. faculty receives message
6. student submits complaint
7. admin processes complaint
8. user answers poll
9. admin creates notice
10. admin creates emergency alert
11. notification is received
12. file is uploaded/shared
13. admin manages user

==================================================
59. ACCEPTANCE CRITERIA
==================================================

The project is not complete merely because all routes exist.

A feature is complete only when:

- UI exists
- UX is coherent
- API exists
- database model exists
- permissions exist
- validation exists
- loading state exists
- empty state exists
- error state exists
- responsive behavior works
- accessibility is considered
- core interaction works
- tests exist where appropriate

==================================================
60. QUALITY GATES
==================================================

After each phase run:

- npm/pnpm build
- TypeScript check
- ESLint
- relevant tests

Fix all:
- type errors
- lint errors
- broken imports
- runtime errors
- obvious accessibility errors
- responsive issues

Do not continue carrying known broken code into the next phase.

==================================================
61. NO HARDCODED BUSINESS DATA
==================================================

Do not hardcode:
- users
- messages
- notices
- events
- complaints
- poll responses
- statistics

Use:
frontend
    ↓
API
    ↓
MongoDB

Seed data is acceptable only for development/demo environments.

==================================================
62. ERROR HANDLING
==================================================

Backend:
Use centralized error handling.

Frontend:
Translate API states into user-friendly UI.

Never expose:
- MongoDB errors
- stack traces
- internal implementation details
- credentials
- secrets

==================================================
63. OBSERVABILITY
==================================================

Add structured server logging.

Log useful events:
- login attempts
- errors
- important admin actions
- emergency alerts
- major backend failures

Do not log passwords or sensitive tokens.

==================================================
64. DOCUMENTATION
==================================================

Maintain:

README.md

docs/
  architecture.md
  product-spec.md
  design-system.md
  api.md
  database.md
  realtime.md
  security.md
  testing.md
  implementation-plan.md

README must explain:
- project
- architecture
- setup
- environment variables
- development
- test commands
- build commands
- database setup
- seed data

==================================================
65. ENVIRONMENT VARIABLES
==================================================

Create:

.env.example

Include placeholders for:
- MongoDB
- auth/session secrets
- API URL
- frontend URL
- Socket URL if needed
- storage configuration
- optional email service

Never commit actual credentials.

==================================================
66. CODE QUALITY RULES
==================================================

Use TypeScript strictly.

Prefer:
- small modules
- typed functions
- meaningful names
- reusable components
- domain separation
- predictable APIs

Avoid:
- giant files
- giant components
- duplicated logic
- any types unless justified
- deeply nested conditionals
- business logic in presentation components
- database queries scattered across UI
- arbitrary global state

==================================================
67. UI CODE QUALITY
==================================================

Avoid giant JSX screens.

Break interfaces into logical components.

Example:

Bad:
Dashboard.tsx = 1500 lines

Good:

DashboardPage
    PageHeader
    QuickActions
    ImportantNotices
    UpcomingEvents
    ComplaintSummary
    ActivityTimeline

Each component should have a meaningful responsibility.

==================================================
68. RESPONSIVE COMPONENT STRATEGY
==================================================

Do not duplicate entire pages unnecessarily for mobile.

Prefer:
- responsive layout
- conditional component variants
- sheets/drawers
- collapsible sections

Use completely different components only when mobile interaction genuinely requires it.

==================================================
69. ICONOGRAPHY
==================================================

Use a consistent icon family.

Lucide icons are preferred if already integrated with shadcn.

Rules:
- consistent size
- semantic usage
- no icon overload
- do not put icons on every piece of text
- destructive actions can use warning/destructive icons

==================================================
70. TABLE VS CARD DECISION
==================================================

Use tables when users need:
- comparison
- scanning
- sorting
- filtering
- bulk management

Use cards/list layouts when users need:
- discovery
- content reading
- browsing

Examples:
Complaints admin = table
Users admin = table
Events = cards/list
Notices = list/editorial
Messages = communication layout

==================================================
71. FORM VS DRAWER VS PAGE
==================================================

Use page for:
- complex creation
- long workflows
- full content

Use drawer/sheet for:
- quick edit
- contextual detail
- short workflows

Use dialog for:
- confirmation
- destructive actions
- short focused interactions

Do not put large forms into tiny dialogs.

==================================================
72. PRODUCT COPY
==================================================

Use concise, professional product copy.

Avoid:
- marketing clichés
- excessive exclamation marks
- generic AI language
- "revolutionize"
- "game-changing"
- "next generation"
- "seamless ecosystem"
- "empower your campus" repeated everywhere

Use direct language.

Examples:

Good:
"View all campus notices."

Good:
"Submit a complaint and track its progress."

Bad:
"Experience the future of campus communication!"

==================================================
73. DEMO DATA
==================================================

Seed the application with realistic but clearly fictional data.

Create:
- fictional names
- departments
- events
- notices
- complaints

Do not use personal information from the project document as actual seeded application users.

Do not fabricate real institutional statistics.

==================================================
74. IMPLEMENTATION ORDER INSIDE EACH FEATURE
==================================================

For each feature:

1. Define data model
2. Define permissions
3. Define API contract
4. Implement backend
5. Implement validation
6. Implement frontend data layer
7. Implement UI
8. Implement loading/empty/error states
9. Implement responsive behavior
10. Implement tests
11. Perform visual polish
12. Verify accessibility

Do not build a beautiful frontend disconnected from the backend.

==================================================
75. AGENT WORKING STYLE
==================================================

You are expected to behave like a senior engineering team, not a code generator.

Before making significant changes:
- inspect existing implementation
- identify dependencies
- consider architectural consequences

During implementation:
- prefer incremental changes
- keep the application runnable
- avoid unnecessary rewrites
- reuse existing components
- keep APIs consistent

After implementation:
- test the feature
- inspect browser behavior if browser tooling exists
- fix visual defects
- fix runtime errors
- update documentation

==================================================
76. PHASE CHECKPOINT FORMAT
==================================================

At the end of every phase, produce:

PHASE:
[phase name]

COMPLETED:
- ...
- ...
- ...

FILES/AREAS CHANGED:
- ...

API CHANGES:
- ...

DATABASE CHANGES:
- ...

DESIGN SYSTEM CHANGES:
- ...

TESTS:
- ...

KNOWN ISSUES:
- ...

NEXT PHASE:
- ...

Do not claim a feature is complete if it is only visually scaffolded.

==================================================
77. IMPORTANT DESIGN DECISION
==================================================

The final application must feel like a cohesive product.

Every screen should share:
- same navigation
- same typography
- same spacing
- same controls
- same status language
- same button behavior
- same modal patterns
- same table patterns
- same loading states
- same empty states
- same notification behavior

The user should never feel like they moved into a different application.

==================================================
78. FINAL DEFINITION OF DONE
==================================================

The final Nexora Campus web application should provide:

PUBLIC:
- premium landing page
- authentication

STUDENT/FACULTY:
- dashboard
- messaging
- people directory
- notices
- events
- files
- polls
- feedback
- complaints
- emergency
- notifications
- activity
- profile
- settings

ADMIN:
- dashboard
- users
- notices
- events
- complaints
- polls
- feedback
- files
- emergency alerts
- analytics
- audit logs
- settings

SYSTEM:
- secure authentication
- RBAC
- MongoDB
- REST APIs
- real-time messaging
- real-time notifications
- validation
- authorization
- responsive design
- accessibility
- error/loading/empty states
- tests
- documentation
- environment configuration

==================================================
79. STARTING INSTRUCTION
==================================================

START WITH PHASE 0 ONLY.

Do not immediately generate the entire application.

First:
1. inspect the repository
2. understand existing code
3. produce the architecture assessment
4. identify reusable existing work
5. identify missing pieces
6. propose exact implementation structure
7. define design-system foundation
8. define database/API architecture
9. define phase plan

Then implement Phase 0 artifacts.

Once Phase 0 is validated, continue sequentially through the phases.

Never skip directly to Phase 12.

Never build everything in one giant operation.

The goal is not merely to finish quickly.

The goal is to produce a technically sound, visually exceptional, maintainable and demonstrable product.

FINAL PRINCIPLE:

Build Nexora like a real product organization would build it.

Use shadcn for engineering leverage.
Use shadcn blocks for structural acceleration.
Create a Nexora-specific design system on top.
Let information architecture drive the UI.
Let real workflows drive components.
Let the data model drive the backend.
Let usability drive interactions.
Let restraint drive visual design.

Do not chase visual novelty.

Build a product that looks deliberately designed.