# Design — Task Manager MVP

## UI/UX Flow

### 1. Onboarding Flow

```
Landing Page (/)
  → "Get Started" CTA
  → Register (/register)  ←→  Login (/login)
      ↓
  Onboarding: Create First Project (modal/wizard, 1 step)
      ↓
  Dashboard (/dashboard)
```

### 2. Core User Flows

#### A. Project Management
```
Dashboard → "New Project" button
  → Modal: Project Name + Description + Color
  → Redirect to /projects/[projectId]
  → Empty board view with "Add your first task" prompt
```

#### B. Task Creation
```
Board view → "+" button in column / "New Task" button
  → Inline form (quick create): Title only
  → Click task card → TaskDetail side panel opens
     → Fill in: Assignee, Due Date, Priority, Labels, Description, Subtasks
```

#### C. Task Management (Kanban)
```
Board View:
  Backlog | Todo | In Progress | In Review | Done

  Drag & drop between columns → updates status
  Click column header → collapse/expand
  Filter bar (top): Assignee, Priority, Due Date, Label
```

#### D. My Tasks View
```
/tasks → Flat list of all tasks assigned to the current user
  Group by: Project / Priority / Due Date
  View toggle: List | Board
```

#### E. Notifications
```
Bell icon (navbar) → Notification dropdown
  → Assigned to task
  → Mentioned in comment
  → Task due date approaching (1 day before)
  → Task status changed
```

---

## Design System

### Color Palette

```css
/* Base */
--color-background:    #ffffff;
--color-surface:       #f8f9fa;
--color-surface-raised:#f1f3f5;
--color-border:        #e9ecef;
--color-border-strong: #ced4da;

/* Text */
--color-text-primary:  #1a1a2e;
--color-text-secondary:#6c757d;
--color-text-muted:    #adb5bd;
--color-text-inverse:  #ffffff;

/* Brand */
--color-primary:       #4f46e5;   /* Indigo */
--color-primary-hover: #4338ca;
--color-primary-light: #eef2ff;

/* Status */
--color-success:       #16a34a;
--color-warning:       #d97706;
--color-danger:        #dc2626;
--color-info:          #0891b2;

/* Priority */
--color-priority-urgent: #be123c;  /* rose-700 — distinct from --color-danger */
--color-priority-high:   #ea580c;
--color-priority-medium: #ca8a04;
--color-priority-low:    #16a34a;
--color-priority-none:   #6c757d;

/* Task Status */
--color-status-backlog:     #6c757d;
--color-status-todo:        #3b82f6;
--color-status-in-progress: #f59e0b;
--color-status-in-review:   #8b5cf6;
--color-status-done:        #10b981;
```

### Typography

```css
/* Font Family */
--font-sans: "Inter", -apple-system, "Segoe UI", system-ui, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", monospace;

/* Scale */
--text-xs:   0.75rem;   /* 12px — labels, badges */
--text-sm:   0.875rem;  /* 14px — secondary text, tables */
--text-base: 1rem;      /* 16px — body default */
--text-lg:   1.125rem;  /* 18px — card titles */
--text-xl:   1.25rem;   /* 20px — page section headers */
--text-2xl:  1.5rem;    /* 24px — page titles */
--text-3xl:  1.875rem;  /* 30px — dashboard hero */

/* Weight */
--font-normal:   400;
--font-medium:   500;
--font-semibold: 600;
--font-bold:     700;
```

### Spacing Scale

Uses Tailwind default spacing (4px base unit):
`4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 64px`

### Border Radius

```css
--radius-sm:   0.25rem;  /* 4px  — badges, tags */
--radius-md:   0.5rem;   /* 8px  — cards, inputs */
--radius-lg:   0.75rem;  /* 12px — modals, panels */
--radius-full: 9999px;   /* avatars, pills */
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08);
```

---

## Empty & Error States

### Empty States

| Scenario | Component | Headline | CTA |
|---|---|---|---|
| New project, no tasks | `EmptyState` (centered, full board) | "No tasks yet" | "Create your first task" button |
| Filter returns no results | `EmptyState` (inline, within board) | "No tasks match your filters" | "Clear filters" link |
| My Tasks — nothing assigned | `EmptyState` | "You have no tasks assigned" | "Browse projects" link |
| Notification list empty | `EmptyState` (small) | "You're all caught up" | — |

> When all columns are empty on first load, display a single full-width `EmptyState` centered across the board area rather than 5 empty columns. This reduces visual noise and improves the perceived onboarding experience.

### Error States

All components that fetch or mutate data must handle the following states consistently:

| State | Visual Treatment |
|---|---|
| Loading | `Skeleton` placeholder matching component shape |
| Fetch error | Inline `ErrorMessage` with "Something went wrong. Try again." + retry button |
| Mutation error (e.g. save failed) | Toast notification (top-right, auto-dismiss 4s) with error message |
| Network offline | Persistent banner at top of page: "You appear to be offline. Changes will sync when reconnected." |

**Standard components:**
- `ErrorMessage` — inline error block with icon + message + optional retry action
- `Toast` — ephemeral notification for mutation feedback (success and error)
- Every route group must have an `error.tsx` (Next.js App Router error boundary) that renders a generic "Something went wrong" page and logs the error server-side. Client Components with risky operations must be wrapped in a React `ErrorBoundary`.

---

## UI Components

### Layout Components

| Component | Description |
|---|---|
| `AppShell` | Root layout with sidebar + main content area |
| `Sidebar` | Main navigation, collapsible, project list |
| `TopBar` | Global search, notifications, user avatar |
| `PageHeader` | Page title + breadcrumb + action buttons |

### Task Components

| Component | Main Props | Description |
|---|---|---|
| `TaskCard` | `task`, `onDrag`, `onClick` | Card displayed on the kanban board |
| `TaskDetail` | `taskId`, `onClose` | Side panel showing task detail |
| `TaskForm` | `projectId`, `initialData`, `onSubmit` | Form for creating/editing a task |
| `KanbanBoard` | `projectId`, `tasks` | Drag-and-drop board container |
| `KanbanColumn` | `status`, `tasks` | A single column on the board |
| `SubtaskList` | `taskId`, `subtasks` | Subtask checklist inside TaskDetail |
| `CommentThread` | `taskId`, `comments` | Comment thread inside TaskDetail |
| `PriorityBadge` | `priority` | Color-coded priority badge |
| `StatusBadge` | `status` | Color-coded status badge |

### Project Components

| Component | Description |
|---|---|
| `ProjectCard` | Project summary card on the dashboard |
| `ProjectForm` | Modal for creating/editing a project |
| `MemberList` | Member list + invite UI |
| `ProjectSettings` | Project settings panel |

### Shared / Primitive Components

| Component | Description |
|---|---|
| `Avatar` | User avatar with initials fallback |
| `AvatarGroup` | Stacked multiple avatars |
| `DatePicker` | Calendar date picker |
| `CommandMenu` | Global search (Cmd+K) |
| `EmptyState` | Placeholder when a list is empty |
| `ConfirmDialog` | Confirmation dialog for destructive actions |
| `Tooltip` | Hover tooltip |
| `Skeleton` | Loading skeleton placeholder |

---

## Technical Design Decisions

### Server Components vs Client Components
- **Default:** Server Components for all pages (data fetched on the server, no JS shipped to the client)
- **Client Components** only for: interactivity (forms, drag-and-drop, modals), Zustand store consumers, and components that depend on browser APIs
- Marking: `"use client"` only at the necessary boundary, not at the page level

### Data Fetching Strategy
- **Server Components:** `fetch()` directly to the database via Drizzle (server-side, no network hop)
- **Client-side mutations:** `fetch` to API Route Handlers
- **Optimistic updates:** Zustand store is updated before the API response for a responsive UX, with rollback on error

### Drag and Drop
- Library: `@dnd-kit/core` + `@dnd-kit/sortable`
- Reason: Accessible by default (keyboard DnD), headless (no forced styling), actively maintained, compatible with React 18+
- Rejected alternative: `react-beautiful-dnd` (deprecated/unmaintained)

### Form Handling
- Library: React Hook Form + Zod resolver
- Reason: Minimal re-renders, validation schema centralized in Zod (shared with backend), automatic TypeScript inference from the schema

### Rich Text Editor (Task Description)
- Library: Tiptap (headless, based on ProseMirror)
- Reason: Extensible, accessible, supports Markdown shortcuts, outputs as JSON (portable) or HTML

### Accessibility (a11y)
- All interactive elements must have an accessible name
- Correct focus management in modals and side panels
- Full keyboard navigation on the Kanban board
- Minimum color contrast WCAG AA (4.5:1 for normal text)
- `aria-live` regions for dynamic status updates

### Responsive Design
- **Mobile-first** breakpoints: `sm` (640px) | `md` (768px) | `lg` (1024px) | `xl` (1280px)
- Mobile: Sidebar becomes a bottom sheet / hamburger menu
- Tablet: Sidebar collapsible (icon-only mode)
- Desktop: Full sidebar with labels
- Kanban board: horizontal scroll on mobile, full board on desktop
