import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { DbInstance } from "@/lib/db";
import { projectMembers, projectInvites, users } from "@/lib/db/schema";
import type { InviteInput } from "@/lib/validations/invite";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** List all non-deleted members of a project with their user info. */
export async function listMembers(db: DbInstance, projectId: string) {
  return db
    .select({
      id: projectMembers.id,
      role: projectMembers.role,
      joinedAt: projectMembers.joinedAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(projectMembers)
    .innerJoin(users, eq(users.id, projectMembers.userId))
    .where(eq(projectMembers.projectId, projectId));
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Invite a user by email to a project. Creates an invite token valid 7 days. */
export async function inviteMember(
  db: DbInstance,
  projectId: string,
  invitedBy: string,
  input: InviteInput
) {
  // Check if already a member (find user by email first)
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existingUser) {
    const [existingMember] = await db
      .select({ id: projectMembers.id })
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, existingUser.id)
        )
      )
      .limit(1);

    if (existingMember) {
      throw new Error("User is already a member of this project");
    }
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [invite] = await db
    .insert(projectInvites)
    .values({
      projectId,
      invitedBy,
      email: input.email,
      role: input.role,
      token,
      expiresAt,
    })
    .returning();

  logger.info("Invite created", { projectId, email: input.email });
  return invite;
}

/**
 * Accept an invite by token.
 * If the accepting user's email matches the invite, add them as a project member.
 */
export async function acceptInvite(db: DbInstance, token: string, userId: string) {
  const [invite] = await db
    .select()
    .from(projectInvites)
    .where(eq(projectInvites.token, token))
    .limit(1);

  if (!invite) throw new Error("Invite not found");
  if (invite.acceptedAt) throw new Error("Invite already accepted");
  if (new Date(invite.expiresAt) < new Date()) throw new Error("Invite has expired");

  // Verify user email matches invite email
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new Error("User not found");
  if (user.email !== invite.email) throw new Error("Invite email does not match your account");

  // Add member
  await db.insert(projectMembers).values({
    projectId: invite.projectId,
    userId,
    role: invite.role as "owner" | "admin" | "member",
  });

  // Mark invite accepted
  const now = new Date().toISOString();
  const [updated] = await db
    .update(projectInvites)
    .set({ acceptedAt: now })
    .where(eq(projectInvites.token, token))
    .returning();

  logger.info("Invite accepted", { projectId: invite.projectId, userId });
  return updated;
}

/** Remove a member from a project. Owners cannot be removed. */
export async function removeMember(
  db: DbInstance,
  projectId: string,
  memberId: string
) {
  const [member] = await db
    .select({ role: projectMembers.role })
    .from(projectMembers)
    .where(
      and(eq(projectMembers.id, memberId), eq(projectMembers.projectId, projectId))
    )
    .limit(1);

  if (!member) throw new Error("Member not found");
  if (member.role === "owner") throw new Error("Cannot remove the project owner");

  await db
    .delete(projectMembers)
    .where(
      and(eq(projectMembers.id, memberId), eq(projectMembers.projectId, projectId))
    );

  logger.info("Member removed", { projectId, memberId });
}

/** Update a member's role. Cannot change the owner's role. */
export async function updateMemberRole(
  db: DbInstance,
  projectId: string,
  memberId: string,
  role: "admin" | "member"
) {
  const [existing] = await db
    .select({ role: projectMembers.role })
    .from(projectMembers)
    .where(
      and(eq(projectMembers.id, memberId), eq(projectMembers.projectId, projectId))
    )
    .limit(1);

  if (!existing) throw new Error("Member not found");
  if (existing.role === "owner") throw new Error("Cannot change the owner's role");

  const [updated] = await db
    .update(projectMembers)
    .set({ role })
    .where(
      and(eq(projectMembers.id, memberId), eq(projectMembers.projectId, projectId))
    )
    .returning();

  logger.info("Member role updated", { projectId, memberId, role });
  return updated;
}
