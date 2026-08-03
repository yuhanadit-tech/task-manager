# Database Schema — Task Manager MVP

## Overview

- **Database:** PostgreSQL 16
- **ORM:** Drizzle ORM
- **Naming Convention:** `snake_case` for all table and column names
- **Primary Key:** UUID v4 (`gen_random_uuid()`) for all primary entities
- **Timestamps:** All tables include `created_at` and `updated_at`
- **Soft Delete:** Primary entities use `deleted_at` (nullable timestamp) instead of hard delete

---

## Entity Relationship Diagram (Text)

```
users
  ├── project_members (many)
  ├── tasks (many, as creator)
  ├── tasks (many, as assignee)
  ├── comments (many)
  ├── activity_logs (many)
  └── notifications (many)

projects
  ├── project_members (many)
  ├── tasks (many)
  └── labels (many)

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
| `assignee_id` | `uuid` | NULLABLE, FK → users.id | Assigned user |
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
| `file_size` | `int4` | NOT NULL | File size in bytes |
| `mime_type` | `varchar(100)` | NOT NULL | MIME type |
| `storage_key` | `text` | NOT NULL | Path/key in object storage |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |

---

### `activity_logs`
Audit trail of all task changes.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | `uuid` | PK | Primary key |
| `task_id` | `uuid` | NOT NULL, FK → tasks.id | Related task |
| `actor_id` | `uuid` | NOT NULL, FK → users.id | User who performed the action |
| `action` | `varchar(50)` | NOT NULL | e.g. `created`, `status_changed`, `assigned` |
| `old_value` | `jsonb` | NULLABLE | Value before the change |
| `new_value` | `jsonb` | NULLABLE | Value after the change |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Event timestamp |

**Indexes:**
- `idx_activity_logs_task_id` ON `task_id`

---

### `notifications`
In-app notifications for each user.

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | `uuid` | PK | Primary key |
| `user_id` | `uuid` | NOT NULL, FK → users.id | Notification recipient |
| `type` | `varchar(50)` | NOT NULL | `assigned`\|`commented`\|`mentioned`\|`due_soon` |
| `payload` | `jsonb` | NOT NULL | Context data (task id, actor name, etc.) |
| `read_at` | `timestamptz` | NULLABLE | Read timestamp (null = unread) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |

**Indexes:**
- `idx_notifications_user_id` ON (`user_id`, `read_at`) WHERE `read_at IS NULL`

---

## Design Notes

1. **`sort_order` uses float:** Allows inserting between two items without reordering the entire list (a simple LexoRank technique). Values are re-normalized only when the gap becomes too small (< 0.001).

2. **`description` as JSONB:** Stores Tiptap output as structured JSON, which is more portable and queryable than raw HTML.

3. **Soft delete via `deleted_at`:** Preserves referential integrity and enables data recovery. All production queries must include `WHERE deleted_at IS NULL`.

4. **No cascade delete:** Foreign keys without `ON DELETE CASCADE` prevent accidental data loss. Deletion must be performed explicitly from the application layer.
