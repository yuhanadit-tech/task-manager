# Architecture — Task Manager MVP

## Overview

The Task Manager MVP uses a **Modular Monolith** architecture (a single deployable unit organized by domain/feature). This approach was chosen for MVP iteration speed while maintaining a clear separation of concerns, making it straightforward to extract individual domains into microservices in the future.

---

## Tech Stack

| Layer | Technology | Version (min) | Reason |
|---|---|---|---|
| Frontend | Next.js (App Router) | 15.x | Built-in SSR/SSG, file-based routing, React Server Components |
| Styling | Tailwind CSS | 3.x | Utility-first, rapid prototyping, consistent design tokens |
| UI Components | shadcn/ui | latest | Accessible, unstyled-by-default, built on Radix UI |
| State Management | Zustand | 5.x | Lightweight, no boilerplate, selector pattern |
| Backend | Next.js API Routes (Route Handlers) | 15.x | Collocated with frontend, avoids the overhead of a separate service in MVP |
| ORM | Drizzle ORM | 0.x | Type-safe, schema-first, file-based migrations, performance close to raw SQL |
| Database | PostgreSQL | 16.x | ACID compliant, JSON support, mature ecosystem |
| Authentication | NextAuth.js v5 (Auth.js) | 5.x | Built-in OAuth + Credentials, session/JWT, first-class Next.js integration |
| Validation | Zod | 3.x | Runtime + compile-time validation, shared between frontend and backend |
| Email | Resend | latest | Developer-friendly API, reliable deliverability |
| File Storage | Vercel Blob / Cloudflare R2 | — | Task file attachments, S3-compatible |
| Hosting | Vercel | — | Zero-config Next.js deploy, edge functions |
| Database Hosting | Neon / Supabase (PostgreSQL) | — | Serverless PostgreSQL, per-environment branching |

---

## Folder Structure

```
task-manager/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard overview
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx          # List all projects
│   │   │   │   └── [projectId]/
│   │   │   │       ├── page.tsx      # Project board view
│   │   │   │       └── settings/page.tsx
│   │   │   └── tasks/
│   │   │       ├── page.tsx          # My Tasks (flat list)
│   │   │       └── [taskId]/page.tsx # Task detail
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── projects/
│   │       │   ├── route.ts          # GET list, POST create
│   │       │   └── [projectId]/
│   │       │       ├── route.ts      # GET detail, PATCH, DELETE
│   │       │       └── members/route.ts
│   │       └── tasks/
│   │           ├── route.ts          # GET list (filtered), POST create
│   │           └── [taskId]/
│   │               ├── route.ts      # GET, PATCH, DELETE
│   │               ├── comments/route.ts
│   │               └── attachments/route.ts
│   ├── components/
│   │   ├── ui/                       # shadcn/ui generated components
│   │   ├── layout/                   # Sidebar, Navbar, PageHeader
│   │   ├── project/                  # ProjectCard, ProjectForm, MemberList
│   │   ├── task/                     # TaskCard, TaskForm, KanbanBoard, TaskDetail
│   │   └── shared/                   # Avatar, Badge, DatePicker, PriorityBadge
│   ├── lib/
│   │   ├── auth.ts                   # NextAuth config
│   │   ├── db/
│   │   │   ├── index.ts              # Drizzle client instance
│   │   │   ├── schema.ts             # All table schemas (single source of truth)
│   │   │   └── migrations/           # Drizzle generated migrations
│   │   ├── validations/              # Zod schemas (shared FE/BE)
│   │   │   ├── project.ts
│   │   │   └── task.ts
│   │   └── utils.ts                  # Helper functions (cn, formatDate, etc.)
│   ├── services/                     # Business logic layer (pure functions)
│   │   ├── project.service.ts
│   │   ├── task.service.ts
│   │   └── notification.service.ts
│   ├── stores/                       # Zustand stores (client state)
│   │   ├── task.store.ts
│   │   └── ui.store.ts               # Sidebar open/close, active view, etc.
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-tasks.ts
│   │   └── use-projects.ts
│   └── types/                        # TypeScript types & interfaces
│       ├── task.ts
│       ├── project.ts
│       └── user.ts
├── public/
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── .env.local                        # NOT committed to git
├── .env.example                      # Env variable template (committed)
└── package.json
```

---

## Data Flow Between Services

### 1. Authentication Flow

```
Browser → POST /api/auth/signin
       → NextAuth.js validates credentials/OAuth
       → Query DB (users table)
       → Set session cookie (JWT / database session)
       → Redirect to /dashboard
```

### 2. Create Task Flow

```
Client (TaskForm)
  → Zustand action: addTask(optimistic update)
  → POST /api/tasks
     → Route Handler validates request (Zod)
     → task.service.ts: createTask()
       → Drizzle INSERT into tasks table
       → Drizzle INSERT into activity_logs
       → notification.service.ts: notifyAssignees()
          → Resend API (email)
     → Return created task (JSON)
  → Zustand update: replace optimistic entry with real data
  → UI reflects final state
```

### 3. Kanban Board Update (Drag & Drop)

```
Client (KanbanBoard)
  → onDragEnd event
  → Zustand: moveTask(taskId, newStatus) — optimistic
  → PATCH /api/tasks/[taskId] { status: newStatus }
     → task.service.ts: updateTaskStatus()
       → Drizzle UPDATE tasks SET status = ?
       → Drizzle INSERT activity_logs
     → Return updated task
  → Zustand: confirm update or rollback on error
```

### 4. Real-time Updates (Post-MVP, architecture ready)

```
Simple polling every 30 seconds (MVP)
→ Future: WebSocket / Server-Sent Events via Vercel Edge
```

---

## Technical Decisions

### Modular Monolith vs Microservices
- **Chosen:** Modular Monolith
- **Reason:** MVP requires iteration speed. Microservices add infrastructure overhead (service discovery, inter-service auth, distributed tracing) that is disproportionate at this scale.
- **Exit strategy:** The `services/` layer is designed to be stateless so individual services can be extracted into dedicated deployments when needed.

### Next.js App Router + Route Handlers vs Dedicated Backend (Express/Fastify)
- **Chosen:** Next.js Route Handlers
- **Reason:** Eliminates CORS setup, enables shared TypeScript types between FE and BE, single repository, single deployment. Sufficient for MVP load.
- **Trade-off:** Less flexible for long-running jobs. Mitigation: async tasks handled via a job queue (BullMQ/Trigger.dev) in a later phase.

### Drizzle ORM vs Prisma
- **Chosen:** Drizzle ORM
- **Reason:** Schema is defined in plain TypeScript (not a separate DSL), smaller bundle size, transparent query builder (easy to debug), better query performance with no extra query engine layer.
- **Trade-off:** Smaller ecosystem than Prisma, fewer plugins and generators.

### Zustand vs React Query (TanStack Query)
- **Chosen:** Zustand for client state + React Query for server state
- **Reason:** React Query handles caching, background refetching, and stale-while-revalidate for server data. Zustand handles UI state (sidebar, modals, drag state) that does not need to be synced with the server.

### PostgreSQL vs SQLite/MySQL
- **Chosen:** PostgreSQL
- **Reason:** JSONB support for flexible metadata, native full-text search, row-level security (for multi-tenancy), and a mature serverless hosting ecosystem (Neon, Supabase).

### Auth.js (NextAuth v5) vs Custom JWT
- **Chosen:** Auth.js
- **Reason:** Handles OAuth providers, CSRF protection, session rotation, and token refresh out-of-the-box. Custom JWT implementations are prone to cryptographic errors.
