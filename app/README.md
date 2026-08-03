# Task Manager

A team-based task management web application built with Next.js 16, Drizzle ORM, PostgreSQL (Neon), and Auth.js v5.

## Features

- **Projects** — create, update, soft-delete projects with colour coding
- **Team Members** — invite by email, accept invite token, manage roles (owner/admin/member)
- **Tasks** — full CRUD with status, priority, due dates, sort order
- **Kanban Board** — drag-and-drop columns (To Do / In Progress / In Review / Done)
- **My Tasks** — flat list of tasks assigned to you with status/priority filters
- **Comments** — threaded comments on tasks, author-only delete
- **Activity Log** — timeline of all task events
- **Labels** — create coloured labels, attach to tasks
- **Search** — debounced search bar component
- **Notifications** — in-app bell with unread count, mark-as-read
- **Email** — Resend-powered invite and task-assignment emails

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL (Neon serverless) |
| ORM | Drizzle ORM |
| Auth | Auth.js v5 (NextAuth) — Google + Credentials |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Email | Resend |
| Forms | react-hook-form + Zod |
| Package Manager | pnpm 11 |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 11 (`npm install -g pnpm`)
- A Neon (or compatible PostgreSQL) database
- Auth.js secret (`openssl rand -base64 32`)
- (Optional) Google OAuth credentials
- (Optional) Resend API key

### Setup

1. **Clone and navigate**
   ```bash
   cd projects/task-manager/app
   ```

2. **Copy environment variables**
   ```bash
   cp .env.example .env.local
   ```

3. **Fill in `.env.local`** — see [Environment Variables](#environment-variables) below.

4. **Install dependencies**
   ```bash
   pnpm install --ignore-scripts
   ```

5. **Push schema to database**
   ```bash
   pnpm db:push
   ```

6. **Start development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Neon) |
| `AUTH_SECRET` | ✅ | Random 32-byte secret (`openssl rand -base64 32`) |
| `AUTH_URL` | ✅ | Base URL of the app (e.g. `http://localhost:3000`) |
| `AUTH_GOOGLE_ID` | Optional | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Optional | Google OAuth client secret |
| `RESEND_API_KEY` | Optional | Resend API key for email sending |
| `EMAIL_FROM` | Optional | Sender address (e.g. `noreply@yourdomain.com`) |

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start development server (Turbopack) |
| `pnpm build` | Build for production |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Run ESLint with auto-fix |
| `pnpm format` | Run Prettier |
| `pnpm typecheck` | Run TypeScript type check |
| `pnpm db:generate` | Generate Drizzle migration files |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:push` | Push schema directly (dev only) |
| `pnpm db:studio` | Open Drizzle Studio |

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login + register pages
│   ├── (dashboard)/     # Protected pages (projects, my-tasks)
│   └── api/             # API route handlers
├── components/
│   ├── kanban/          # KanbanBoard, KanbanColumn, TaskCard, TaskDetailModal
│   ├── project/         # ProjectCard, ProjectForm, MemberList, InviteForm
│   ├── task/            # TaskListItem, TaskFilters, CommentThread, ActivityFeed, Labels
│   └── shared/          # SearchBar, NotificationBell
├── lib/
│   ├── auth.ts          # Auth.js configuration
│   ├── db/              # Drizzle schema + migrations
│   ├── email.ts         # Resend email helpers
│   ├── logger.ts        # Structured JSON logger
│   ├── utils.ts         # Utility helpers
│   └── validations/     # Zod schemas
├── services/            # Business logic (project, task, member, etc.)
├── types/               # TypeScript type declarations
└── proxy.ts             # Route protection (Next.js 16)
```

## CI/CD

GitHub Actions runs lint + typecheck + build on every push to `main` and on pull requests.
See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
