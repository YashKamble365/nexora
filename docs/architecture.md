# Nexora Campus — System Architecture Document

## 1. Executive Architecture Overview

Nexora Campus is an enterprise-grade digital communication and operations platform for educational institutions. The platform replaces fragmented, asynchronous communication channels (physical notice boards, unmoderated chat groups, manual paper complaints) with a unified, real-time, role-governed digital grid.

### Architectural Principles
1. **Separation of Concerns**: Strict boundary between presentation, domain orchestration, data persistence, and real-time state.
2. **Server-Authoritative Security**: No security, role, or tenancy decisions delegated to client state.
3. **Resilient Real-time Fabric**: WebSocket/Socket.IO with graceful reconnection, optimistic UI reconciliation, and fallback querying.
4. **Data Integrity & Traceability**: Immutable audit logs for compliance-critical events (emergency alerts, disciplinary complaints, role elevations).
5. **Operational Restraint**: High information density, predictable latency (<100ms API, <50ms socket event dispatch), zero unnecessary dependencies.

---

## 2. Technology Stack & Topology

```
+--------------------------------------------------------------------------+
|                            Client Tier                                   |
|   Next.js App Router (React 19 / TypeScript / Tailwind CSS / shadcn/ui)  |
+--------------------+--------------------------------+--------------------+
                     | HTTP / REST (Cookies / JSON)   | WebSockets / WSS
                     v                                v
+--------------------+--------------------------------+--------------------+
|                         Application Tier                                 |
|          Node.js + Express / TypeScript Domain Services                  |
|                                                                          |
|  +----------------+  +-----------------+  +----------------------------+ |
|  | Auth & RBAC    |  | REST Endpoints  |  | Socket.IO Gateway          | |
|  | (JWT / Argon2) |  | (Zod Validated) |  | (Presence, Chat, Alerts)   | |
|  +----------------+  +-----------------+  +----------------------------+ |
|  +---------------------------------------------------------------------+ |
|  | Shared Domain Services (Complaints, Notices, Events, Audit)        | |
|  +---------------------------------------------------------------------+ |
+--------------------+--------------------------------+--------------------+
                     | Mongoose ODM                   | Storage Interface
                     v                                v
+--------------------+--------------+   +-------------+--------------------+
|          Persistence Tier         |   |          Storage Tier            |
|          MongoDB Multi-Index      |   | Local / S3-Compatible Storage    |
+-----------------------------------+   +----------------------------------+
```

### Component Breakdown

| Tier | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Shell & UI** | Next.js (App Router), React 19, TypeScript | Server-rendered initial load, client-side real-time routing, accessible design system |
| **Styling & Components**| Tailwind CSS v4, shadcn/ui primitives, Radix UI | Consistent tokenized design, keyboard-navigable UI |
| **Realtime Gateway** | Node.js, Socket.IO v4, TypeScript | Bi-directional pub/sub for messages, typing, presence, emergency broadcast |
| **API Server** | Express / Node.js HTTP Service | RESTful domain controllers, Zod request validation, centralized error handling |
| **Persistence** | MongoDB (v7+) with Mongoose ODM | Document store with compound indexes, cursor pagination, and ACID transactions |
| **File Abstraction** | Storage Provider Interface (Local Disk / S3) | Stream-based file upload with MIME verification and RBAC download gating |

---

## 3. Monorepo Repository Structure

The workspace is organized as an enterprise workspace with clean domain separation:

```text
nexora/
├── apps/
│   ├── web/                        # Next.js Frontend Application
│   │   ├── app/                    # App Router routes
│   │   │   ├── (auth)/             # Auth layouts & screens (login, register)
│   │   │   ├── (dashboard)/        # Authenticated application shell
│   │   │   │   ├── app/            # Student & Faculty workspace
│   │   │   │   └── admin/          # Institutional admin command center
│   │   │   └── page.tsx            # Premium public landing page
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn primitives
│   │   │   ├── shared/             # Reusable enterprise primitives
│   │   │   └── domain/             # Feature-specific components
│   │   ├── hooks/                  # Client hooks (sockets, auth, keyboard)
│   │   └── lib/                    # Client API client, token utils
│   │
│   └── server/                     # Node.js Backend & Realtime Gateway
│       ├── src/
│       │   ├── config/             # Environment, DB, logger configuration
│       │   ├── middleware/         # Auth, RBAC, Rate-limit, Error handling
│       │   ├── modules/            # Domain-driven backend modules
│       │   │   ├── auth/           # Login, registration, token refresh
│       │   │   ├── users/          # Profiles, directory, roles
│       │   │   ├── conversations/  # Chat threads, members
│       │   │   ├── messages/       # Message persistence & reactions
│       │   │   ├── notices/        # Campus notices, target audiences
│       │   │   ├── events/         # Event schedules, registrations
│       │   │   ├── complaints/     # Lifecycle issue tracking & audit
│       │   │   ├── polls/          # Poll creation, voting, analytics
│       │   │   ├── feedback/       # Anonymous/signed service reviews
│       │   │   ├── files/          # Storage abstraction & access control
│       │   │   ├── emergency/      # Broadcast emergency alerts
│       │   │   ├── notifications/  # User notification delivery
│       │   │   ├── audit/          # Immutable administrative trail
│       │   │   └── analytics/      # Aggregated institutional metrics
│       │   ├── realtime/           # Socket.IO handlers, rooms, auth
│       │   └── index.ts            # HTTP & Socket bootstrapper
│       └── package.json
│
├── packages/
│   ├── types/                      # Shared TypeScript models & DTOs
│   │   ├── src/
│   │   │   ├── auth.ts
│   │   │   ├── user.ts
│   │   │   ├── chat.ts
│   │   │   ├── notice.ts
│   │   │   ├── event.ts
│   │   │   ├── complaint.ts
│   │   │   └── emergency.ts
│   │   └── package.json
│   │
│   └── config/                     # Shared ESLint, TS, Prettier configs
│
├── docs/                           # Architectural, design, and plan specs
├── .agents/                        # Antigravity skill definitions
├── package.json                    # Workspace root
└── README.md
```

---

## 4. Authentication & Authorization (RBAC)

### 4.1 Token & Session Strategy
- **Access Tokens**: Short-lived JWTs (15 minutes expiry) stored in memory or secure HTTP-only cookies.
- **Refresh Tokens**: Long-lived cryptographic random tokens (7 days expiry) stored in secure, `HttpOnly`, `SameSite=Strict` cookies, hashed in the database with revocation support.
- **Password Security**: Argon2id or bcrypt (cost factor >= 12).
- **Session Revocation**: User model maintains `tokenVersion` or active session IDs; revoking all devices increments `tokenVersion`.

### 4.2 Role Hierarchy & Enforcement

```
           [SUPER_ADMIN]
                 │
           [ADMINISTRATOR]
                 │
          [FACULTY MEMBER]
                 │
             [STUDENT]
```

Permissions are declared statically as granular capabilities (`notices:create`, `complaints:assign`, `emergency:publish`) and resolved via an authorization guard middleware:

```typescript
export function requirePermissions(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user.role;
    const hasPermission = permissions.every(p => ROLE_PERMISSIONS[userRole]?.includes(p));
    if (!hasPermission) {
      throw new ForbiddenError('Insufficient permissions for this operation');
    }
    next();
  };
}
```

---

## 5. Real-Time Communication Architecture

### 5.1 Socket.IO Connection Lifecycle
1. **Handshake Authentication**: Socket.IO connection requires auth token passed via cookie or handshake query. Invalid tokens are rejected at connection time.
2. **Room Architecture**:
   - `user:{userId}` — Personal channel for direct notifications, unread counts, emergency alerts.
   - `conversation:{conversationId}` — Active chat channel for messages, typing indicators, read receipts.
   - `campus:announcements` — Global channel for instantaneous emergency alerts and campus notices.
   - `dept:{departmentId}` — Departmental broadcasts for faculty/students.

### 5.2 Realtime Event Contract

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `message:send` | Client -> Server | `{ conversationId, content, attachments, replyToId }` | Send chat message |
| `message:new` | Server -> Client | `MessageDTO` | Broadcast to conversation room |
| `message:read` | Client -> Server | `{ conversationId, messageId }` | Mark message read |
| `typing:start` | Client -> Server | `{ conversationId }` | Broadcast typing status |
| `user:presence`| Server -> Client | `{ userId, status: 'online' \| 'offline' }` | Presence broadcast |
| `emergency:broadcast` | Server -> Client | `EmergencyAlertDTO` | Critical priority override |

---

## 6. Database & Persistence Layer

### 6.1 Database Engine
- **Engine**: MongoDB 7.0+
- **Driver / ODM**: Mongoose 8+
- **Connection**: Connection pooling (minPoolSize: 10, maxPoolSize: 50).

### 6.2 Key Indexes
- `User`: `{ email: 1 }` (unique), `{ institutionalId: 1 }` (unique), `{ department: 1, role: 1 }`
- `Message`: `{ conversationId: 1, createdAt: -1 }` (compound for fast timeline paging)
- `Conversation`: `{ participants: 1, updatedAt: -1 }`
- `Notice`: `{ audience: 1, status: 1, publishedAt: -1 }`, `{ expiresAt: 1 }` (TTL or query filter)
- `Complaint`: `{ status: 1, department: 1, createdAt: -1 }`, `{ submittedBy: 1 }`
- `AuditLog`: `{ createdAt: -1 }`, `{ actorId: 1, action: 1 }`

---

## 7. Storage Abstraction

```typescript
export interface StorageProvider {
  upload(file: Express.Multer.File, path: string): Promise<{ url: string; key: string }>;
  downloadStream(key: string): Promise<NodeJS.ReadableStream>;
  delete(key: string): Promise<void>;
}
```
- Development: Local disk storage provider (`/uploads`) guarded by Express authentication route.
- Production: S3-compatible provider (AWS S3, MinIO, or Cloudflare R2).
- Security: Direct public access disabled. File downloads stream through authenticated route checking permission against the associated document.
