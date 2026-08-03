import { eq, and } from "drizzle-orm";
import type { DbInstance } from "@/lib/db";
import { labels, taskLabels } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** List all labels for a project. */
export async function listLabels(db: DbInstance, projectId: string) {
  return db
    .select()
    .from(labels)
    .where(eq(labels.projectId, projectId));
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create a label for a project. */
export async function createLabel(
  db: DbInstance,
  projectId: string,
  name: string,
  color: string
) {
  const [label] = await db
    .insert(labels)
    .values({ projectId, name, color })
    .returning();

  if (!label) throw new Error("Failed to create label");

  logger.info("Label created", { projectId, name });
  return label;
}

/** Delete a label (also cascades via FK to task_labels). */
export async function deleteLabel(db: DbInstance, labelId: string) {
  const [deleted] = await db
    .delete(labels)
    .where(eq(labels.id, labelId))
    .returning({ id: labels.id });

  if (!deleted) throw new Error("Label not found");

  logger.info("Label deleted", { labelId });
  return deleted;
}

/** Add a label to a task (idempotent — ignore conflict on duplicate). */
export async function addLabelToTask(
  db: DbInstance,
  taskId: string,
  labelId: string
) {
  await db
    .insert(taskLabels)
    .values({ taskId, labelId })
    .onConflictDoNothing();

  logger.info("Label added to task", { taskId, labelId });
}

/** Remove a label from a task. */
export async function removeLabelFromTask(
  db: DbInstance,
  taskId: string,
  labelId: string
) {
  await db
    .delete(taskLabels)
    .where(and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId)));

  logger.info("Label removed from task", { taskId, labelId });
}
