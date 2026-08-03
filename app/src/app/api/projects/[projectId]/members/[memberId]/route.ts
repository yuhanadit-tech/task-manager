import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { z } from "zod";
import { updateMemberRole, removeMember } from "@/services/member.service";
import { getUserRoleInProject } from "@/services/project.service";
import type { ApiResponse } from "@/types/user";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ projectId: string; memberId: string }>;
}

const updateRoleSchema = z.object({
  role: z.enum(["admin", "member"]),
});

// ---------------------------------------------------------------------------
// PATCH /api/projects/[projectId]/members/[memberId] — update member role
// ---------------------------------------------------------------------------
export async function PATCH(req: Request, { params }: RouteParams): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { data: null, error: "Unauthorized" } satisfies ApiResponse<null>,
      { status: 401 }
    );
  }

  const { projectId, memberId } = await params;
  const db = getDb();

  const actorRole = await getUserRoleInProject(db, projectId, session.user.id);
  if (!actorRole || actorRole === "member") {
    return Response.json(
      { data: null, error: "Forbidden" } satisfies ApiResponse<null>,
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { data: null, error: "Invalid JSON body" } satisfies ApiResponse<null>,
      { status: 400 }
    );
  }

  const result = updateRoleSchema.safeParse(body);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return Response.json(
      {
        data: null,
        error: firstIssue?.message ?? "Validation failed",
      } satisfies ApiResponse<null>,
      { status: 400 }
    );
  }

  try {
    const updated = await updateMemberRole(db, projectId, memberId, result.data.role);
    return Response.json({ data: updated, error: null } satisfies ApiResponse<typeof updated>);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update role";
    return Response.json(
      { data: null, error: message } satisfies ApiResponse<null>,
      { status: 400 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/projects/[projectId]/members/[memberId] — remove member
// ---------------------------------------------------------------------------
export async function DELETE(_req: Request, { params }: RouteParams): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { data: null, error: "Unauthorized" } satisfies ApiResponse<null>,
      { status: 401 }
    );
  }

  const { projectId, memberId } = await params;
  const db = getDb();

  const actorRole = await getUserRoleInProject(db, projectId, session.user.id);
  if (!actorRole || actorRole === "member") {
    return Response.json(
      { data: null, error: "Forbidden" } satisfies ApiResponse<null>,
      { status: 403 }
    );
  }

  try {
    await removeMember(db, projectId, memberId);
    return Response.json({ data: { id: memberId }, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove member";
    return Response.json(
      { data: null, error: message } satisfies ApiResponse<null>,
      { status: 400 }
    );
  }
}
