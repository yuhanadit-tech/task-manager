import { eq, and, isNull, desc, sql } from "drizzle-orm";
import type { DbInstance } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

export type NotificationType =
  | "assigned"
  | "commented"
  | "mentioned"
  | "due_soon"
  | "status_changed";

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create a notification for a user. Silently fails — never throw. */
export async function createNotification(
  db: DbInstance,
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown>
) {
  try {
    await db.insert(notifications).values({ userId, type, payload });
    logger.info("Notification created", { userId, type });
  } catch (err) {
    logger.error("Failed to create notification", {
      userId,
      type,
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

/** Mark a single notification as read. */
export async function markAsRead(
  db: DbInstance,
  notificationId: string,
  userId: string
) {
  const now = new Date().toISOString();

  await db
    .update(notifications)
    .set({ readAt: now })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId),
        isNull(notifications.readAt)
      )
    );
}

/** Mark all unread notifications for a user as read. */
export async function markAllRead(db: DbInstance, userId: string) {
  const now = new Date().toISOString();

  await db
    .update(notifications)
    .set({ readAt: now })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** List the 50 most recent notifications for a user. */
export async function listNotifications(db: DbInstance, userId: string) {
  return db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        sql`${notifications.expiresAt} > now()`
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}
