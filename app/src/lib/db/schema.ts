import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  date,
  doublePrecision,
  primaryKey,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Timestamp with timezone, Date mode (required by @auth/drizzle-adapter)
const tstz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
// Timestamp with timezone, string mode (for application-level timestamps)
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "string" });

// ---------------------------------------------------------------------------
// users  — columns match @auth/drizzle-adapter DefaultPostgresUsersTable exactly
// (emailVerified, image, name, email are required by the adapter)
// Additional app columns are appended after.
// ---------------------------------------------------------------------------
export const users = pgTable(
  "users",
  {
    // Auth.js required columns
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: tstz("email_verified"),
    image: text("image"),
    // App-specific extra columns
    passwordHash: varchar("password_hash", { length: 255 }),
    avatarUrl: text("avatar_url"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
    deletedAt: timestamptz("deleted_at"),
  },
  (t) => [uniqueIndex("idx_users_email").on(t.email).where(sql`${t.deletedAt} IS NULL`)]
);

// ---------------------------------------------------------------------------
// accounts  — exact shape required by @auth/drizzle-adapter
// ---------------------------------------------------------------------------
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(),
    provider: varchar("provider", { length: 50 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 50 }),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
);

// ---------------------------------------------------------------------------
// sessions  (Auth.js database adapter)
// ---------------------------------------------------------------------------
export const sessions = pgTable(
  "sessions",
  {
    sessionToken: varchar("session_token", { length: 255 }).notNull().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: tstz("expires").notNull(),
  },
  (t) => [index("idx_sessions_user_id").on(t.userId)]
);

// ---------------------------------------------------------------------------
// verification_tokens  (Auth.js)
// ---------------------------------------------------------------------------
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: tstz("expires").notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

// ---------------------------------------------------------------------------
// projects
// ---------------------------------------------------------------------------
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 7 }).notNull().default("#4f46e5"),
    icon: varchar("icon", { length: 50 }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
    deletedAt: timestamptz("deleted_at"),
  },
  (t) => [index("idx_projects_owner_id").on(t.ownerId)]
);

// ---------------------------------------------------------------------------
// project_members
// ---------------------------------------------------------------------------
export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: varchar("role", { length: 20 }).notNull().default("member"),
    joinedAt: timestamptz("joined_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_project_members").on(t.projectId, t.userId),
    index("idx_project_members_project_id").on(t.projectId),
    index("idx_project_members_user_id").on(t.userId),
    check("chk_project_members_role", sql`${t.role} IN ('owner', 'admin', 'member')`),
  ]
);

// ---------------------------------------------------------------------------
// project_invites
// ---------------------------------------------------------------------------
export const projectInvites = pgTable(
  "project_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id),
    email: varchar("email", { length: 255 }).notNull(),
    role: varchar("role", { length: 20 }).notNull().default("member"),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamptz("expires_at").notNull(),
    acceptedAt: timestamptz("accepted_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_project_invites_email").on(t.email).where(sql`${t.acceptedAt} IS NULL`),
  ]
);

// ---------------------------------------------------------------------------
// tasks
// ---------------------------------------------------------------------------
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    parentTaskId: uuid("parent_task_id"),
    title: varchar("title", { length: 500 }).notNull(),
    description: jsonb("description"),
    status: varchar("status", { length: 20 }).notNull().default("backlog"),
    priority: varchar("priority", { length: 10 }).notNull().default("none"),
    assigneeId: uuid("assignee_id").references(() => users.id),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => users.id),
    dueDate: date("due_date"),
    sortOrder: doublePrecision("sort_order").notNull().default(0),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
    deletedAt: timestamptz("deleted_at"),
  },
  (t) => [
    index("idx_tasks_project_id").on(t.projectId).where(sql`${t.deletedAt} IS NULL`),
    index("idx_tasks_assignee_id").on(t.assigneeId).where(sql`${t.deletedAt} IS NULL`),
    index("idx_tasks_status").on(t.projectId, t.status).where(sql`${t.deletedAt} IS NULL`),
    index("idx_tasks_due_date")
      .on(t.dueDate)
      .where(sql`${t.deletedAt} IS NULL AND ${t.dueDate} IS NOT NULL`),
    check(
      "chk_tasks_status",
      sql`${t.status} IN ('backlog', 'todo', 'in_progress', 'in_review', 'done')`
    ),
    check(
      "chk_tasks_priority",
      sql`${t.priority} IN ('urgent', 'high', 'medium', 'low', 'none')`
    ),
  ]
);

// ---------------------------------------------------------------------------
// labels
// ---------------------------------------------------------------------------
export const labels = pgTable(
  "labels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    name: varchar("name", { length: 50 }).notNull(),
    color: varchar("color", { length: 7 }).notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uq_labels_project_name").on(t.projectId, t.name)]
);

// ---------------------------------------------------------------------------
// task_labels  (many-to-many join)
// ---------------------------------------------------------------------------
export const taskLabels = pgTable(
  "task_labels",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id),
    labelId: uuid("label_id")
      .notNull()
      .references(() => labels.id),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.labelId] })]
);

// ---------------------------------------------------------------------------
// comments
// ---------------------------------------------------------------------------
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    content: jsonb("content").notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
    deletedAt: timestamptz("deleted_at"),
  },
  (t) => [index("idx_comments_task_id").on(t.taskId).where(sql`${t.deletedAt} IS NULL`)]
);

// ---------------------------------------------------------------------------
// attachments
// ---------------------------------------------------------------------------
export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => users.id),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  storageKey: text("storage_key").notNull(),
  createdAt: timestamptz("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// activity_logs
// ---------------------------------------------------------------------------
export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").references(() => tasks.id),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    entityType: varchar("entity_type", { length: 10 }).notNull(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id),
    action: varchar("action", { length: 50 }).notNull(),
    oldValue: jsonb("old_value"),
    newValue: jsonb("new_value"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_activity_logs_task_id").on(t.taskId).where(sql`${t.taskId} IS NOT NULL`),
    index("idx_activity_logs_project_id").on(t.projectId),
    check(
      "chk_activity_entity_type",
      sql`${t.entityType} IN ('task', 'project')`
    ),
    check(
      "chk_activity_task_ref",
      sql`${t.entityType} = 'project' OR ${t.taskId} IS NOT NULL`
    ),
  ]
);

// ---------------------------------------------------------------------------
// notifications
// ---------------------------------------------------------------------------
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 50 }).notNull(),
    payload: jsonb("payload").notNull(),
    readAt: timestamptz("read_at"),
    expiresAt: timestamptz("expires_at")
      .notNull()
      .default(sql`now() + INTERVAL '90 days'`),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_notifications_user_id")
      .on(t.userId, t.readAt)
      .where(sql`${t.readAt} IS NULL`),
    index("idx_notifications_expires_at").on(t.expiresAt),
    check(
      "chk_notifications_type",
      sql`${t.type} IN ('assigned', 'commented', 'mentioned', 'due_soon', 'status_changed')`
    ),
  ]
);

// ---------------------------------------------------------------------------
// Type exports — inferred from schema
// ---------------------------------------------------------------------------
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type ProjectMember = typeof projectMembers.$inferSelect;
export type NewProjectMember = typeof projectMembers.$inferInsert;

export type ProjectInvite = typeof projectInvites.$inferSelect;
export type NewProjectInvite = typeof projectInvites.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type Label = typeof labels.$inferSelect;
export type NewLabel = typeof labels.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
