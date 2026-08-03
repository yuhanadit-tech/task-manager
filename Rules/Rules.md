# Rules — Task Manager MVP

## Core Principles

1. **Correctness first** — Code that is correct is more important than code that is written quickly
2. **Simplicity** — The simplest solution that meets the requirement is the best solution
3. **Consistency** — Being consistently wrong is better than being inconsistently right
4. **Explicit over implicit** — Write code intent clearly; avoid "magic" that is not obvious

---

## Coding Convention

### TypeScript

```ts
// ✅ Use explicit return types for all public / exported functions
export function getTaskById(id: string): Promise<Task | null> { ... }

// ✅ Use interfaces for data/API contracts
interface CreateTaskInput {
  title: string;
  projectId: string;
  priority?: Priority;
}

// ✅ Use type aliases for union types, utility types, and primitive branding
type TaskStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done";
type UserId = string & { readonly _brand: "UserId" };

// ❌ Avoid `any` — use `unknown` and type narrowing instead
function parseResponse(data: unknown): Task { ... }

// ❌ Avoid non-null assertion (!) unless fully justified with a comment
const task = map.get(id)!; // BAD — could be null

// ✅ Use optional chaining and nullish coalescing
const name = user?.profile?.name ?? "Anonymous";
```

### Naming

| Entity | Convention | Example |
|---|---|---|
| Variable / Function | camelCase | `taskList`, `createTask()` |
| Constant (module-level) | SCREAMING_SNAKE_CASE | `MAX_TASK_TITLE_LENGTH` |
| React Component | PascalCase | `TaskCard`, `KanbanBoard` |
| Type / Interface | PascalCase | `TaskStatus`, `CreateTaskInput` |
| Enum | PascalCase + PascalCase members | `Priority.High` |
| File (component) | PascalCase.tsx | `TaskCard.tsx` |
| File (non-component) | kebab-case.ts | `task.service.ts`, `use-tasks.ts` |
| Database table | snake_case plural | `tasks`, `project_members` |
| Database column | snake_case | `assignee_id`, `created_at` |
| API Route param | camelCase in URL | `/api/tasks/[taskId]` |
| CSS class (Tailwind) | Tailwind utilities | — |

### File & Folder

- One component per file — do not combine multiple primary components in a single file
- Components used only within a single parent → place them in a subfolder of that parent
- Import order within every file:
  1. Node.js built-ins
  2. External packages (react, next, drizzle, etc.)
  3. Internal — absolute paths (`@/lib/...`, `@/components/...`)
  4. Relative imports (`./`, `../`)
  5. Type-only imports (`import type { ... }`)

### React / Next.js

```tsx
// ✅ Server Component by default — NO "use client" unless required
// app/tasks/page.tsx — Server Component
export default async function TasksPage() {
  const tasks = await getMyTasks(); // directly from DB
  return <TaskList tasks={tasks} />;
}

// ✅ Separate data fetching (server) from interactivity (client)
// components/task/TaskList.tsx — Server Component
export function TaskList({ tasks }: { tasks: Task[] }) {
  return tasks.map(task => <TaskCard key={task.id} task={task} />);
}

// components/task/TaskCard.tsx — Client Component (needs interactivity)
"use client";
export function TaskCard({ task }: { task: Task }) { ... }

// ✅ Explicit props interface for all components
interface TaskCardProps {
  task: Task;
  onStatusChange?: (status: TaskStatus) => void;
}

// ❌ Avoid prop drilling more than 2 levels deep — use Zustand or Context
```

### API Route Handlers

```ts
// ✅ Consistent response structure
type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
};

// ✅ Always validate input with Zod before touching the DB
export async function POST(req: Request) {
  const body = await req.json();
  const result = CreateTaskSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { data: null, error: result.error.message },
      { status: 400 }
    );
  }
  // ...
}

// ✅ Always check authentication and authorization
export async function PATCH(req: Request, { params }: { params: { taskId: string } }) {
  const session = await auth();
  if (!session) return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const canEdit = await userCanEditTask(session.user.id, params.taskId);
  if (!canEdit) return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  // ...
}
```

### Database / Drizzle

```ts
// ✅ All queries must exclude soft-deleted records
const tasks = await db.select().from(tasks)
  .where(and(eq(tasks.projectId, projectId), isNull(tasks.deletedAt)));

// ✅ Use transactions for operations that require atomicity
await db.transaction(async (tx) => {
  await tx.insert(tasks).values(newTask);
  await tx.insert(activityLogs).values(logEntry);
});

// ✅ Select specific columns — avoid SELECT *
const { id, title, status } = await db
  .select({ id: tasks.id, title: tasks.title, status: tasks.status })
  .from(tasks)
  .where(eq(tasks.id, taskId))
  .get();

// ❌ NEVER interpolate directly into a query string — use parameterized queries (Drizzle does this automatically)
```

---

## Style Guide

### Formatting

- **Formatter:** Prettier with the following configuration:
  ```json
  {
    "semi": true,
    "singleQuote": false,
    "tabWidth": 2,
    "trailingComma": "es5",
    "printWidth": 100
  }
  ```
- **Linter:** ESLint with `eslint-config-next` + `@typescript-eslint/recommended`
- Formatting and linting run automatically via a pre-commit hook (Husky + lint-staged)

### Tailwind CSS

```tsx
// ✅ Use the `cn()` utility (clsx + tailwind-merge) for conditional classes
import { cn } from "@/lib/utils";

<div className={cn(
  "rounded-md border p-4",
  isOverdue && "border-red-500 bg-red-50",
  isSelected && "ring-2 ring-primary"
)} />

// ✅ Extract long Tailwind class lists into components or variants
// Use shadcn/ui variants via cva() for reusable components

// ❌ Avoid inline styles except for dynamic values that Tailwind cannot handle
// ❌ Avoid @apply in custom CSS — prefer Tailwind component classes
```

---

## Constraints for AI and Contributors

### Allowed

- Add P0/P1 features already defined in the PRD
- Refactor code that violates these conventions while preserving functionality
- Add database indexes if a query clearly requires them
- Add stricter Zod validation
- Write unit tests and integration tests

### Not Allowed

- ❌ **Do not change the database schema without creating a Drizzle migration file**
- ❌ **Do not drop columns from the schema** — always soft delete or deprecate first
- ❌ **Do not hardcode secrets, API keys, or credentials** in code — use `process.env`
- ❌ **Do not bypass Zod validation** by casting with `as unknown as T`
- ❌ **Do not skip authentication / authorization checks** in API routes
- ❌ **Do not log sensitive data** (passwords, tokens, PII) — see Logging Rules
- ❌ **Do not bind services to `0.0.0.0`** in local development — use `127.0.0.1`
- ❌ **Do not install new packages without reviewing** their dependencies and license
- ❌ **Do not add P2/Post-MVP features** until all P0 items are complete and verified
- ❌ **Do not change core schema types** (`TaskStatus`, `Priority`) without updating every usage and adding a DB migration

### Logging Rules

```ts
// ✅ Log events that are useful for debugging
logger.info("Task created", { taskId: task.id, projectId: task.projectId, actorId });

// ❌ NEVER log sensitive data
logger.info("User logged in", { email: user.email, password }); // WRONG — never log passwords
logger.debug("API response", { body: fullResponse }); // WRONG — may contain tokens

// ✅ Hash or mask sensitive data if it must be logged
logger.warn("Login failed", { email: maskEmail(user.email) });
```

### Commit Convention

Format: `<type>(<scope>): <description>`

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Refactor without functional change |
| `style` | Formatting, whitespace (not CSS) |
| `test` | Adding or modifying tests |
| `docs` | Documentation changes |
| `chore` | Dependency updates, tooling |
| `db` | Schema changes or migrations |

Examples:
```
feat(task): add drag-and-drop status update on kanban board
fix(auth): handle expired invite token with proper 410 response
db(tasks): add index on assignee_id for my-tasks query performance
```

### Pull Request Rules

1. PRs must have a clear description (what changed and why)
2. Every PR must pass CI (lint, typecheck, test) before merging
3. No `console.log` left in production code
4. A database migration must be included if the schema changed
5. Breaking changes must be discussed before implementation
