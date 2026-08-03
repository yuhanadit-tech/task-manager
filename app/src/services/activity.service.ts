import { eq, desc } from "drizzle-orm";
import type { DbInstance } from "@/lib/db";
import { activityLogs, users } from "@/lib/db/schema";
import type { NewActivityLog } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create an activity log entry. */
export async function logActivity(
  db: DbInstance,
  entry: Omit<NewActivityLog, "id" | "createdAt">
) {
  const [log] = await db
    .insert(activityLogs)
    .values(entry)
    .returning({ id: activityLogs.id });

  if (!log) {
    logger.warn("Failed to write activity log", {
      taskId: entry.taskId,
      action: entry.action,
    });
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** List activity log entries for a task, newest first. */
export async function listActivity(db: DbInstance, taskId: string) {
  return db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      entityType: activityLogs.entityType,
      oldValue: activityLogs.oldValue,
      newValue: activityLogs.newValue,
      createdAt: activityLogs.createdAt,
      actor: {
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      },
    })
    .from(activityLogs)
    .innerJoin(users, eq(users.id, activityLogs.actorId))
    .where(eq(activityLogs.taskId, taskId))
    .orderBy(desc(activityLogs.createdAt));
}
