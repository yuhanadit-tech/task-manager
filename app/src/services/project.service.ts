import { eq, and, isNull, desc } from "drizzle-orm";
import type { DbInstance } from "@/lib/db";
import { projects, projectMembers } from "@/lib/db/schema";
import type { CreateProjectInput, UpdateProjectInput } from "@/lib/validations/project";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** List all projects a user is a member of (excludes soft-deleted). */
export async function listProjectsByUser(db: DbInstance, userId: string) {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      color: projects.color,
      icon: projects.icon,
      ownerId: projects.ownerId,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      role: projectMembers.role,
    })
    .from(projects)
    .innerJoin(
      projectMembers,
      and(
        eq(projectMembers.projectId, projects.id),
        eq(projectMembers.userId, userId)
      )
    )
    .where(isNull(projects.deletedAt))
    .orderBy(desc(projects.createdAt));
}

/** Get a single project — only if the requesting user is a member. */
export async function getProjectByIdForUser(
  db: DbInstance,
  projectId: string,
  userId: string
) {
  const [row] = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      color: projects.color,
      icon: projects.icon,
      ownerId: projects.ownerId,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      role: projectMembers.role,
    })
    .from(projects)
    .innerJoin(
      projectMembers,
      and(
        eq(projectMembers.projectId, projects.id),
        eq(projectMembers.userId, userId)
      )
    )
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
    .limit(1);

  return row ?? null;
}

/** Check if a user is a member of a project (returns role or null). */
export async function getUserRoleInProject(
  db: DbInstance,
  projectId: string,
  userId: string
): Promise<"owner" | "admin" | "member" | null> {
  const [row] = await db
    .select({ role: projectMembers.role })
    .from(projectMembers)
    .where(
      and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId))
    )
    .limit(1);

  return (row?.role as "owner" | "admin" | "member" | null) ?? null;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create a new project and automatically add the creator as owner. */
export async function createProject(
  db: DbInstance,
  ownerId: string,
  input: CreateProjectInput
) {
  const [project] = await db
    .insert(projects)
    .values({
      name: input.name,
      description: input.description ?? null,
      color: input.color,
      icon: input.icon ?? null,
      ownerId,
    })
    .returning();

  if (!project) throw new Error("Failed to create project");

  // Add creator as owner member
  await db.insert(projectMembers).values({
    projectId: project.id,
    userId: ownerId,
    role: "owner",
  });

  logger.info("Project created", { projectId: project.id, ownerId });
  return project;
}

/** Update project fields — only owner or admin may do this. */
export async function updateProject(
  db: DbInstance,
  projectId: string,
  input: UpdateProjectInput
) {
  const now = new Date().toISOString();

  const [updated] = await db
    .update(projects)
    .set({ ...input, updatedAt: now })
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
    .returning();

  if (!updated) return null;

  logger.info("Project updated", { projectId });
  return updated;
}

/** Soft-delete a project — only the owner may do this. */
export async function deleteProject(db: DbInstance, projectId: string, actorId: string) {
  const now = new Date().toISOString();

  const [deleted] = await db
    .update(projects)
    .set({ deletedAt: now, updatedAt: now })
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
    .returning({ id: projects.id });

  if (!deleted) return null;

  logger.info("Project soft-deleted", { projectId, actorId });
  return deleted;
}
