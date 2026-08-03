# Database Schema — Task Manager MVP

## Overview

- **Database:** PostgreSQL 16
- **ORM:** Drizzle ORM
- **Naming Convention:** `snake_case` for all table and column names
- **Primary Key:** UUID v4 (`gen_random_uuid()`) for all primary entities
- **Timestamps:** All tables include `created_at` and `updated_at`
- **Soft Delete:** Primary entities use `deleted_at` (nullable timestamp) instead of hard delete
- **Auth Tables:** `sessions` and `verification_tokens` follow the Auth.js database adapter schema exactly

---

## Entity Relationship Diagram (Text)

```
users
  ├── sessions (many)
  ├── project_members (many)
  ├── tasks (many, as creator)
  ├── tasks (many, as assignee)
  ├── task_assignees (many, multi-assignee — post-MVP)
  ├── comments (many)
  ├── activity_logs (many, as actor)
  └── notifications (many)

projects
  ├── project_members (many)
  ├── tasks (many)
  ├── labels (many)
  └── activity_logs (many, project-level events)

tasks
  ├── subtasks (many, self-referential)
  ├── comments (many)
  ├── task_labels (many-to-many via join table)
  ├── attachments (many)
  └── activity_logs (many)

labels
  └── task_labels (many-to-many via join table)
```

---

## Tables

### `users`
Stores user account data.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Primary key |
| `email` | `varchar(255)` | NOT NULL, UNIQUE | Login email |
| `email_verified_at` | `timestamptz` | NULLABLE | Email verification timestamp |
| `password_hash` | `varchar(255)` | NULLABLE | bcrypt hash (null if OAuth only) |
| `name` | `varchar(100)` | NOT NULL | Display name |
| `avatar_url` | `text` | NULLABLE | Profile photo URL |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Registration timestamp |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | Last update timestamp |
| `deleted_at` | `timestamptz` | NULLABLE | Soft delete marker |

**Indexes:**
- `idx_users_email` UNIQUE ON `email` WHERE `deleted_at IS NULL`

---

### `sessions`
Auth.js database adapter sessions (required when using database session strategy).

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Primary key |
| `session_token` | `varchar(255)` | NOT NULL, UNIQUE | Opaque session token sent as a cookie |
| `user_id` | `uuid` | NOT NULL, FK → users.id | Session owner |
| `expires` | `timestamptz` | NOT NULL | Session expiry time |

**Indexes:**
- `idx_sessions_session_token` UNIQUE ON `session_token`
- `idx_sessions_user_id` ON `user_id`

---

### `verification_tokens`
One-time tokens used by Auth.js for email verification and magic-link sign-in.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `identifier` | `varchar(255)` | NOT NULL | Email address or user identifier |
| `token` | `varchar(255)` | NOT NULL, UNIQUE | One-time token (hashed) |
| `expires` | `timestamptz` | NOT NULL | Token expiry time |

**Constraints:**
- PRIMARY KEY (`identifier`, `token`)

> **Note:** If using JWT session strategy (stateless), these two tables are not required. Document the chosen strategy in `.env.example` via `NEXTAUTH_SESSION_STRATEGY=database|jwt`.

---

### `oauth_accounts`
Stores OAuth accounts linked to a user (Google, GitHub, etc.).

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | `uuid` | PK | Primary key |
| `user_id` | `uuid` | NOT NULL, FK → users.id | Account owner |
| `provider` | `varchar(50)` | NOT NULL | e.g. "google", "github" |
| `provider_account_id` | `varchar(255)` | NOT NULL | ID from the provider |
| `access_token` | `text` | NULLABLE | Encrypted access token |
| `refresh_token` | `text` | NULLABLE | Encrypted refresh token |
| `expires_at` | `timestamptz` | NULLABLE | Token expiry |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |

**Constraints:**
- UNIQUE (`provider`, `provider_account_id`)

---

### `projects`
Represents a workspace/project that contains tasks.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | `uuid` | PK | Primary key |
| `name` | `varchar(100)` | NOT NULL | Project name |
| `description` | `text` | NULLABLE | Project description |
| `color` | `varchar(7)` | NOT NULL, DEFAULT '#4f46e5' | Hex color for visual identity |
| `icon` | `varchar(50)` | NULLABLE | Icon name (e.g. "folder", "rocket") |
| `owner_id` | `uuid` | NOT NULL, FK → users.id | Project creator |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |
| `deleted_at` | `timestamptz` | NULLABLE | Soft delete |

**Indexes:**
- `idx_projects_owner_id` ON `owner_id`

---

### `project_members`
Many-to-many relationship between users and projects, with roles.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | `uuid` | PK | Primary key |
| `project_id` | `uuid` | NOT NULL, FK → projects.id | Related project |
| `user_id` | `uuid` | NOT NULL, FK → users.id | Member |
| `role` | `varchar(20)` | NOT NULL, DEFAULT 'member' | `owner` \| `admin` \| `member` |
| `joined_at` | `timestamptz` | NOT NULL, DEFAULT now() | Join timestamp |

**Constraints:**
- UNIQUE (`project_id`, `user_id`)

**Indexes:**
- `idx_project_members_project_id` ON `project_id`
- `idx_project_members_user_id` ON `user_id`

---

### `project_invites`
Invitation tokens for joining a project.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | `uuid` | PK | Primary key |
| `project_id` | `uuid` | NOT NULL, FK → projects.id | Target project |
| `invited_by` | `uuid` | NOT NULL, FK → users.id | Inviter |
| `email` | `varchar(255)` | NOT NULL | Invited email address |
| `role` | `varchar(20)` | NOT NULL, DEFAULT 'member' | Role to be granted |
| `token` | `varchar(255)` | NOT NULL, UNIQUE | Unique token (UUID or secure random) |
| `expires_at` | `timestamptz` | NOT NULL | Token expiry (7 days from created) |
| `accepted_at` | `timestamptz` | NULLABLE | Acceptance timestamp |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |

**Indexes:**
- `idx_project_invites_token` — implied by UNIQUE constraint on `token`
- `idx_project_invites_email` ON `email` WHERE `accepted_at IS NULL` — for listing pending invites per email

---

### `tasks`
Primary entity — represents a single unit of work.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | `uuid` | PK | Primary key |
| `project_id` | `uuid` | NOT NULL, FK → projects.id | Parent project |
| `parent_task_id` | `uuid` | NULLABLE, FK → tasks.id | For subtasks (self-referential) |
| `title` | `varchar(500)` | NOT NULL | Task title |
| `description` | `jsonb` | NULLABLE | Rich text content (Tiptap JSON) |
| `status` | `varchar(20)` | NOT NULL, DEFAULT 'backlog' | `backlog`\|`todo`\|`in_progress`\|`in_review`\|`done` |
| `priority` | `varchar(10)` | NOT NULL, DEFAULT 'none' | `urgent`\|`high`\|`medium`\|`low`\|`none` |
| `assignee_id` | `uuid` | NULLABLE, FK → users.id | Primary assigned user (single-assignee MVP; see Design Notes) |
| `creator_id` | `uuid` | NOT NULL, FK → users.id | Task creator |
| `due_date` | `date` | NULLABLE | Deadline (date only, no time) |
| `sort_order` | `float8` | NOT NULL, DEFAULT 0 | Order within a kanban column |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |
| `deleted_at` | `timestamptz` | NULLABLE | Soft delete |

**Check Constraints:**
- `chk_tasks_status` CHECK (status IN ('backlog', 'todo', 'in_progress', 'in_review', 'done'))
- `chk_tasks_priority` CHECK (priority IN ('urgent', 'high', 'medium', 'low', 'none'))

**Indexes:**
- `idx_tasks_project_id` ON `project_id` WHERE `deleted_at IS NULL`
- `idx_tasks_assignee_id` ON `assignee_id` WHERE `deleted_at IS NULL`
- `idx_tasks_status` ON (`project_id`, `status`) WHERE `deleted_at IS NULL`
- `idx_tasks_due_date` ON `due_date` WHERE `deleted_at IS NULL AND due_date IS NOT NULL`

---

### `labels`
Colored labels per project for task categorization.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | `uuid` | PK | Primary key |
| `project_id` | `uuid` | NOT NULL, FK → projects.id | Owning project |
| `name` | `varchar(50)` | NOT NULL | Label name |
| `color` | `varchar(7)` | NOT NULL | Hex color |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |

**Constraints:**
- UNIQUE (`project_id`, `name`)

---

### `task_labels`
Many-to-many join table between tasks and labels.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `task_id` | `uuid` | NOT NULL, FK → tasks.id | Task |
| `label_id` | `uuid` | NOT NULL, FK → labels.id | Label |

**Constraints:**
- PRIMARY KEY (`task_id`, `label_id`)

---

### `comments`
Comments on a task.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | `uuid` | PK | Primary key |
| `task_id` | `uuid` | NOT NULL, FK → tasks.id | Related task |
| `author_id` | `uuid` | NOT NULL, FK → users.id | Comment author |
| `content` | `jsonb` | NOT NULL | Rich text content (Tiptap JSON) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |
| `deleted_at` | `timestamptz` | NULLABLE | Soft delete |

**Indexes:**
- `idx_comments_task_id` ON `task_id` WHERE `deleted_at IS NULL`

---

### `attachments`
File attachments on a task.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | `uuid` | PK | Primary key |
| `task_id` | `uuid` | NOT NULL, FK → tasks.id | Related task |
| `uploaded_by` | `uuid` | NOT NULL, FK → users.id | Uploader |
| `file_name` | `varchar(255)` | NOT NULL | Original file name |
| `file_size` | `int4` | NOT NULL | File size in bytes (max enforced at API: 10 MB per file) |
| `mime_type` | `varchar(100)` | NOT NULL | MIME type |
| `storage_key` | `text` | NOT NULL | Path/key in object storage |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |

---

### `activity_logs`
Audit trail of all task and project-level changes.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | `uuid` | PK | Primary key |
| `task_id` | `uuid` | NULLABLE, FK → tasks.id | Related task (null for project-level events) |
| `project_id` | `uuid` | NOT NULL, FK → projects.id | Related project (always set) |
| `entity_type` | `varchar(10)` | NOT NULL | `'task'` \| `'project'` |
| `actor_id` | `uuid` | NOT NULL, FK → users.id | User who performed the action |
| `action` | `varchar(50)` | NOT NULL | e.g. `created`, `status_changed`, `assigned`, `member_invited`, `member_removed` |
| `old_value` | `jsonb` | NULLABLE | Value before the change |
| `new_value` | `jsonb` | NULLABLE | Value after the change |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Event timestamp |

**Check Constraints:**
- `chk_activity_entity_type` CHECK (entity_type IN ('task', 'project'))
- `chk_activity_task_ref` CHECK (entity_type = 'project' OR task_id IS NOT NULL)

**Indexes:**
- `idx_activity_logs_task_id` ON `task_id` WHERE `task_id IS NOT NULL`
- `idx_activity_logs_project_id` ON `project_id`

---

### `notifications`
In-app notifications for each user.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | `uuid` | PK | Primary key |
| `user_id` | `uuid` | NOT NULL, FK → users.id | Notification recipient |
| `type` | `varchar(50)` | NOT NULL | `assigned`\|`commented`\|`mentioned`\|`due_soon`\|`status_changed` |
| `payload` | `jsonb` | NOT NULL | Context data (task id, actor name, etc.) |
| `read_at` | `timestamptz` | NULLABLE | Read timestamp (null = unread) |
| `expires_at` | `timestamptz` | NOT NULL | Auto-cleanup threshold (DEFAULT now() + INTERVAL '90 days') |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |

**Check Constraints:**
- `chk_notifications_type` CHECK (type IN ('assigned', 'commented', 'mentioned', 'due_soon', 'status_changed'))

**Indexes:**
- `idx_notifications_user_id` ON (`user_id`, `read_at`) WHERE `read_at IS NULL`
- `idx_notifications_expires_at` ON `expires_at` — used by cleanup job

---

## Design Notes

1. **`sort_order` uses float:** Allows inserting between two items without reordering the entire list (a simple LexoRank technique). Values are re-normalized only when the gap becomes too small (< 0.001).

2. **`description` as JSONB:** Stores Tiptap output as structured JSON, which is more portable and queryable than raw HTML.

3. **Soft delete via `deleted_at`:** Preserves referential integrity and enables data recovery. All production queries must include `WHERE deleted_at IS NULL`.

4. **No cascade delete:** Foreign keys without `ON DELETE CASCADE` prevent accidental data loss. Deletion must be performed explicitly from the application layer. Soft-deleting a project must cascade soft-delete to all child tasks at the application layer.

5. **Single assignee (MVP):** `tasks.assignee_id` supports one assignee. Multi-assignee requires a `task_assignees` join table (`task_id`, `user_id`, `assigned_at`) — defer to post-MVP to avoid premature schema complexity.

6. **Notification TTL:** `notifications.expires_at` defaults to 90 days from creation. A scheduled cleanup job (pg_cron or application-level cron) should run weekly: `DELETE FROM notifications WHERE expires_at < now()`.

7. **File upload limits:** Maximum 10 MB per file, 50 MB total per task. Enforced at the API route handler level before writing to object storage. `file_size` uses `int4` (max ~2.1 GB), sufficient for this constraint.

8. **`users.name` is a single display name field.** OAuth providers return `given_name` + `family_name` separately — concatenate on import. If first/last name sorting is needed post-MVP, add `first_name` and `last_name` columns via migration and deprecate `name`.
