import { eq, and, isNull, asc, desc } from "drizzle-orm";
import type { DbInstance } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  AssignTaskInput,
  ReorderTaskInput,
} from "@/lib/validations/task";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** List all non-deleted tasks for a project, ordered by sort_order. */
export async function listTasks(db: DbInstance, projectId: string) {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), isNull(tasks.deletedAt)))
    .orderBy(asc(tasks.sortOrder), desc(tasks.createdAt));
}

/** Get a single non-deleted task. */
export async function getTask(db: DbInstance, taskId: string) {
  const [row] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
    .limit(1);

  return row ?? null;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create a new task in a project. */
export async function createTask(
  db: DbInstance,
  projectId: string,
  creatorId: string,
  input: CreateTaskInput
) {
  const [task] = await db
    .insert(tasks)
    .values({
      projectId,
      creatorId,
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      priority: input.priority,
      assigneeId: input.assigneeId ?? null,
      dueDate: input.dueDate ?? null,
      sortOrder: input.sortOrder,
    })
    .returning();

  if (!task) throw new Error("Failed to create task");

  logger.info("Task created", { taskId: task.id, projectId, creatorId });
  return task;
}

/** Update task fields. */
export async function updateTask(
  db: DbInstance,
  taskId: string,
  input: UpdateTaskInput
) {
  const now = new Date().toISOString();

  const [updated] = await db
    .update(tasks)
    .set({ ...input, updatedAt: now })
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
    .returning();

  if (!updated) return null;

  logger.info("Task updated", { taskId });
  return updated;
}

/** Soft-delete a task. */
export async function deleteTask(db: DbInstance, taskId: string, actorId: string) {
  const now = new Date().toISOString();

  const [deleted] = await db
    .update(tasks)
    .set({ deletedAt: now, updatedAt: now })
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
    .returning({ id: tasks.id });

  if (!deleted) return null;

  logger.info("Task soft-deleted", { taskId, actorId });
  return deleted;
}

/** Assign (or unassign) a task. */
export async function assignTask(
  db: DbInstance,
  taskId: string,
  input: AssignTaskInput
) {
  const now = new Date().toISOString();

  const [updated] = await db
    .update(tasks)
    .set({ assigneeId: input.assigneeId, updatedAt: now })
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
    .returning();

  if (!updated) return null;

  logger.info("Task assigned", { taskId, assigneeId: input.assigneeId });
  return updated;
}

/** Update sort order (and optionally status) for drag-and-drop reorder. */
export async function reorderTask(
  db: DbInstance,
  taskId: string,
  input: ReorderTaskInput
) {
  const now = new Date().toISOString();

  const updateValues: Partial<typeof tasks.$inferInsert> = {
    sortOrder: input.sortOrder,
    updatedAt: now,
  };

  if (input.status !== undefined) {
    updateValues.status = input.status;
  }

  const [updated] = await db
    .update(tasks)
    .set(updateValues)
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
    .returning();

  if (!updated) return null;

  logger.info("Task reordered", { taskId, sortOrder: input.sortOrder });
  return updated;
}
