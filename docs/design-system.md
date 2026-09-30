# Nexora Campus — Design System Specification

## 1. Design Philosophy

Nexora Campus is an operational platform built for educational institutions. The design language takes inspiration from high-craft tools like **Linear**, **Notion**, and high-density enterprise software.

### Core Principles
1. **Calm & Restrained**: Muted, harmonious colors instead of high-saturation neon gradients.
2. **Information Dense**: Displays complex academic workflows, tables, and messaging streams without wasted space.
3. **Intentional Hierarchy**: Typography and subtle contrast define importance, not giant decorative elements.
4. **Accessible by Default**: Meets WCAG 2.1 AA standards for contrast (4.5:1 text, 3:1 UI elements), full keyboard navigation, and `prefers-reduced-motion` compliance.
5. **Zero Frivolous Novelty**: No decorative blob shapes, no AI-generated stock photos, no gratuitous glassmorphism.

---

## 2. Token Architecture

### 2.1 Color Palette (Tailwind & CSS Variables)

```css
:root {
  /* Foundation Neutrals (Zinc/Slate tailored) */
  --background: 240 5% 96%;           /* #F4F4F5 Clean Off-White */
  --foreground: 240 10% 10%;          /* #18181B High-contrast Charcoal */
  --card: 0 0% 100%;                  /* #FFFFFF Pure Card Surface */
  --card-foreground: 240 10% 10%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 10%;

  /* Brand / Primary (Deep Slate Indigo) */
  --primary: 222 47% 20%;             /* #1B2A4A Authoritative Institutional Navy */
  --primary-foreground: 210 40% 98%;
  --primary-hover: 222 47% 15%;

  /* Secondary & Muted */
  --secondary: 240 5% 92%;
  --secondary-foreground: 240 6% 20%;
  --muted: 240 5% 93%;
  --muted-foreground: 240 4% 45%;      /* #71717A Neutral Subtext */

  /* Borders & Dividers */
  --border: 240 6% 88%;               /* #E4E4E7 Crisp hairline borders */
  --input: 240 6% 88%;
  --ring: 222 47% 20%;

  /* Semantic Feedback */
  --success: 142 71% 40%;             /* #16A34A Verified / Completed */
  --success-foreground: 0 0% 100%;
  --warning: 38 92% 50%;              /* #EAB308 Under Review / Pending */
  --warning-foreground: 48 96% 15%;
  --destructive: 0 84% 60%;          /* #EF4444 Rejected / High Severity */
  --destructive-foreground: 0 0% 100%;
  --info: 217 91% 60%;                /* #3B82F6 Information / General */
  --info-foreground: 0 0% 100%;

  /* Emergency State (Uncompromising High Visibility) */
  --emergency: 0 72% 51%;             /* #DC2626 Critical Campus Alert */
  --emergency-foreground: 0 0% 100%;

  /* Radius tokens */
  --radius: 0.5rem;                   /* 8px Default Roundedness */
}

.dark {
  --background: 240 10% 4%;           /* #09090B Deep Black-Gray */
  --foreground: 240 5% 96%;           /* #F4F4F5 Clean Light Gray */
  --card: 240 10% 7%;                 /* #121215 Subtle Card Surface */
  --card-foreground: 240 5% 96%;
  --popover: 240 10% 7%;
  --popover-foreground: 240 5% 96%;

  --primary: 217 91% 60%;             /* Crisp Electric Indigo Accent */
  --primary-foreground: 222 47% 11%;

  --secondary: 240 6% 15%;
  --secondary-foreground: 240 5% 90%;
  --muted: 240 6% 14%;
  --muted-foreground: 240 5% 65%;

  --border: 240 6% 18%;               /* #27272A Controlled Dark Border */
  --input: 240 6% 18%;
  --ring: 217 91% 60%;
}
```

### 2.2 Typography Scale

Font Stack: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`.

| Style Level | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | 2.25rem (36px) | 700 Bold | 1.15 | Public Landing Page Hero only |
| **Page Title** | 1.5rem (24px) | 600 SemiBold | 1.25 | Screen headers (`/app/messages`, `/admin/users`) |
| **Section Title** | 1.125rem (18px) | 600 SemiBold | 1.35 | Widget headers, modal titles, card groups |
| **Card Title** | 1.0rem (16px) | 600 SemiBold | 1.4 | Notice titles, complaint subjects, event cards |
| **Body (Default)** | 0.875rem (14px) | 400 Regular | 1.5 | Primary message body, notice description, forms |
| **Body Small** | 0.8125rem (13px) | 400 Regular | 1.45 | Secondary details, metadata, table data |
| **Caption / Label**| 0.75rem (12px) | 500 Medium | 1.3 | Timestamps, status badges, input field labels |
| **Code / Monospace**| 0.8125rem (13px) | 500 Medium | 1.4 | IDs (`CMP-2026-081`), roll numbers, audit keys |

---

## 3. Component Layering Architecture

To maintain consistency and modularity, components are partitioned into 3 distinct tiers:

```text
┌─────────────────────────────────────────────────────────────┐
│ Tier 3: Domain Components (components/domain/)               │
│ Feature-specific logic (e.g. MessageComposer, ComplaintCard)│
└──────────────────────────────┬──────────────────────────────┘
                               │ consumes
┌──────────────────────────────▼──────────────────────────────┐
│ Tier 2: Shared Components (components/shared/)              │
│ AppShell, PageHeader, DataTable, StatusBadge, PriorityBadge │
└──────────────────────────────┬──────────────────────────────┘
                               │ consumes
┌──────────────────────────────▼──────────────────────────────┐
│ Tier 1: UI Primitives (components/ui/)                      │
│ shadcn/ui base primitives: Button, Dialog, Input, Table     │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Tier 1: shadcn/ui Primitives (`components/ui/`)
- Pure Radix UI wrappers styled with Tailwind.
- Examples: `button.tsx`, `dialog.tsx`, `input.tsx`, `dropdown-menu.tsx`, `badge.tsx`, `command.tsx`, `sheet.tsx`, `skeleton.tsx`, `tabs.tsx`.

### 3.2 Tier 2: Nexora Shared Primitives (`components/shared/`)
- Reusable UI compositions standardizing application behavior:
  - `AppShell`: Persistent desktop sidebar, top header, responsive container.
  - `PageHeader`: Standardized title, breadcrumbs, action buttons.
  - `DataTable`: TanStack Table wrapper with search, sort, pagination, column visibility.
  - `StatusBadge`: Maps complaint/notice statuses to semantic colors with consistent dots.
  - `PriorityBadge`: Maps `LOW`, `MEDIUM`, `HIGH`, `URGENT` to clean badges.
  - `EmptyState`: Clean illustrated or typographic state when collections are empty.
  - `CommandMenu`: Global `Cmd+K` palette implementation.
  - `ConfirmDialog`: Two-step modal for destructive actions and emergency publication.

### 3.3 Tier 3: Domain Components (`components/domain/`)
- `messaging/`: `ConversationList`, `MessageBubble`, `MessageComposer`, `TypingIndicator`, `AttachmentPreview`.
- `complaints/`: `ComplaintTimeline`, `ComplaintStatusPicker`, `ComplaintAssigneeSelect`.
- `notices/`: `NoticeRow`, `NoticeEditor`, `NoticePriorityTag`.
- `events/`: `EventCard`, `EventRegistrationButton`, `EventAttendeeList`.
- `polls/`: `PollCard`, `PollLiveResults`, `PollOptionRadio`.

---

## 4. Layout & Responsive Breakpoints

| Device Category | Viewport Width | Sidebar Behavior | Layout Adjustments |
| :--- | :--- | :--- | :--- |
| **Mobile** | `< 768px` | Collapsed to Sheet / Bottom Nav | Single column, stacked cards, drawer for forms |
| **Tablet** | `768px - 1024px` | Icon-only collapsed sidebar (64px) | 2-column grids, horizontal scroll for tables |
| **Desktop** | `> 1024px` | Expanded sidebar (260px) | Full 3-column chat, dense data tables, side-by-side forms |

### Messaging Layout Adaptations
- **Desktop (`>= 1024px`)**: Full 3 columns side by side:
  - Left: 320px (Conversation list)
  - Center: flex-1 (Chat stream and composer)
  - Right: 280px (Participant list, shared files)
- **Mobile (`< 768px`)**: Single view with back navigation:
  - Root: Conversation list
  - Active: Message stream with sticky top bar and back arrow.

---

## 5. Motion & Accessibility Guidelines

- **Transitions**: 150ms - 200ms ease-out for hover, popover reveals, and drawer slides.
- **Focus Rings**: `ring-2 ring-primary ring-offset-2` on all focusable inputs and buttons.
- **Reduced Motion**: All animations wrapped with `@media (prefers-reduced-motion: reduce) { animation: none; transition: none; }`.
