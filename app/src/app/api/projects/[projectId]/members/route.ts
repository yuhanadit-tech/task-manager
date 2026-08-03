import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { inviteSchema } from "@/lib/validations/invite";
import { listMembers, inviteMember } from "@/services/member.service";
import { getUserRoleInProject } from "@/services/project.service";
import type { ApiResponse } from "@/types/user";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

// ---------------------------------------------------------------------------
// GET /api/projects/[projectId]/members — list members
// ---------------------------------------------------------------------------
export async function GET(_req: Request, { params }: RouteParams): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { data: null, error: "Unauthorized" } satisfies ApiResponse<null>,
      { status: 401 }
    );
  }

  const { projectId } = await params;
  const db = getDb();

  const role = await getUserRoleInProject(db, projectId, session.user.id);
  if (!role) {
    return Response.json(
      { data: null, error: "Not a member of this project" } satisfies ApiResponse<null>,
      { status: 403 }
    );
  }

  const members = await listMembers(db, projectId);
  return Response.json({ data: members, error: null } satisfies ApiResponse<typeof members>);
}

// ---------------------------------------------------------------------------
// POST /api/projects/[projectId]/members — invite a member
// ---------------------------------------------------------------------------
export async function POST(req: Request, { params }: RouteParams): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { data: null, error: "Unauthorized" } satisfies ApiResponse<null>,
      { status: 401 }
    );
  }

  const { projectId } = await params;
  const db = getDb();

  const role = await getUserRoleInProject(db, projectId, session.user.id);
  if (!role || role === "member") {
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

  const result = inviteSchema.safeParse(body);
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
    const invite = await inviteMember(db, projectId, session.user.id, result.data);
    return Response.json(
      { data: invite, error: null } satisfies ApiResponse<typeof invite>,
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to invite member";
    return Response.json(
      { data: null, error: message } satisfies ApiResponse<null>,
      { status: 409 }
    );
  }
}
