# Task Manager — App

A team-based task management web application built with Next.js 15, Drizzle ORM, PostgreSQL, and Auth.js.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM
- **Auth:** Auth.js v5 (NextAuth)
- **Email:** Resend
- **Package Manager:** pnpm

## Getting Started

1. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in all required values in `.env.local`
3. Install dependencies:
   ```bash
   pnpm install --ignore-scripts
   ```
4. Run database migrations:
   ```bash
   pnpm db:migrate
   ```
5. Start dev server:
   ```bash
   pnpm dev
   ```

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start development server (Turbopack) |
| `pnpm build` | Build for production |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Run Prettier |
| `pnpm typecheck` | Run TypeScript type check |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:studio` | Open Drizzle Studio |
