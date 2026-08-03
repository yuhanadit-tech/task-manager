import { eq, and, isNull, desc } from "drizzle-orm";
import type { DbInstance } from "@/lib/db";
import { comments, users } from "@/lib/db/schema";
import type { CommentInput } from "@/lib/validations/comment";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** List all non-deleted comments for a task, newest first. */
export async function listComments(db: DbInstance, taskId: string) {
  return db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      author: {
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.authorId))
    .where(and(eq(comments.taskId, taskId), isNull(comments.deletedAt)))
    .orderBy(desc(comments.createdAt));
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Add a comment to a task. Content is stored as plain text in a jsonb field. */
export async function addComment(
  db: DbInstance,
  taskId: string,
  authorId: string,
  input: CommentInput
) {
  const [comment] = await db
    .insert(comments)
    .values({
      taskId,
      authorId,
      content: input.content, // stored as plain text in jsonb
    })
    .returning();

  if (!comment) throw new Error("Failed to add comment");

  logger.info("Comment added", { taskId, authorId });
  return comment;
}

/** Soft-delete a comment — only the author may delete their own comment. */
export async function deleteComment(
  db: DbInstance,
  commentId: string,
  authorId: string
) {
  const now = new Date().toISOString();

  const [deleted] = await db
    .update(comments)
    .set({ deletedAt: now })
    .where(
      and(
        eq(comments.id, commentId),
        eq(comments.authorId, authorId),
        isNull(comments.deletedAt)
      )
    )
    .returning({ id: comments.id });

  if (!deleted) throw new Error("Comment not found or you do not have permission to delete it");

  logger.info("Comment deleted", { commentId, authorId });
  return deleted;
}
