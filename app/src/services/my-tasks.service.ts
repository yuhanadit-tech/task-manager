import { eq, and, isNull, asc, desc } from "drizzle-orm";
import type { DbInstance } from "@/lib/db";
import { tasks, projects, projectMembers } from "@/lib/db/schema";

/** Return all non-deleted tasks assigned to the given user, with project info. */
export async function getMyTasks(db: DbInstance, userId: string) {
  return db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      sortOrder: tasks.sortOrder,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      projectId: tasks.projectId,
      projectName: projects.name,
      projectColor: projects.color,
    })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .innerJoin(
      projectMembers,
      and(
        eq(projectMembers.projectId, tasks.projectId),
        eq(projectMembers.userId, userId)
      )
    )
    .where(and(eq(tasks.assigneeId, userId), isNull(tasks.deletedAt)))
    .orderBy(asc(tasks.dueDate), desc(tasks.createdAt));
}
