import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { updateProjectSchema } from "@/lib/validations/project";
import {
  getProjectByIdForUser,
  updateProject,
  deleteProject,
  getUserRoleInProject,
} from "@/services/project.service";
import type { ApiResponse } from "@/types/user";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

// ---------------------------------------------------------------------------
// GET /api/projects/[projectId]
// ---------------------------------------------------------------------------
export async function GET(_req: Request, { params }: RouteParams): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" } satisfies ApiResponse<null>, {
      status: 401,
    });
  }

  const { projectId } = await params;
  const db = getDb();
  const project = await getProjectByIdForUser(db, projectId, session.user.id);

  if (!project) {
    return Response.json(
      { data: null, error: "Project not found" } satisfies ApiResponse<null>,
      { status: 404 }
    );
  }

  return Response.json({ data: project, error: null } satisfies ApiResponse<typeof project>);
}

// ---------------------------------------------------------------------------
// PATCH /api/projects/[projectId]
// ---------------------------------------------------------------------------
export async function PATCH(req: Request, { params }: RouteParams): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" } satisfies ApiResponse<null>, {
      status: 401,
    });
  }

  const { projectId } = await params;
  const db = getDb();

  const role = await getUserRoleInProject(db, projectId, session.user.id);
  if (!role || role === "member") {
    return Response.json({ data: null, error: "Forbidden" } satisfies ApiResponse<null>, {
      status: 403,
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ data: null, error: "Invalid JSON body" } satisfies ApiResponse<null>, {
      status: 400,
    });
  }

  const result = updateProjectSchema.safeParse(body);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return Response.json(
      { data: null, error: firstIssue?.message ?? "Validation failed" } satisfies ApiResponse<null>,
      { status: 400 }
    );
  }

  const updated = await updateProject(db, projectId, result.data);
  if (!updated) {
    return Response.json(
      { data: null, error: "Project not found" } satisfies ApiResponse<null>,
      { status: 404 }
    );
  }

  return Response.json({ data: updated, error: null } satisfies ApiResponse<typeof updated>);
}

// ---------------------------------------------------------------------------
// DELETE /api/projects/[projectId]
// ---------------------------------------------------------------------------
export async function DELETE(_req: Request, { params }: RouteParams): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" } satisfies ApiResponse<null>, {
      status: 401,
    });
  }

  const { projectId } = await params;
  const db = getDb();

  const role = await getUserRoleInProject(db, projectId, session.user.id);
  if (role !== "owner") {
    return Response.json({ data: null, error: "Forbidden" } satisfies ApiResponse<null>, {
      status: 403,
    });
  }

  const deleted = await deleteProject(db, projectId, session.user.id);
  if (!deleted) {
    return Response.json(
      { data: null, error: "Project not found" } satisfies ApiResponse<null>,
      { status: 404 }
    );
  }

  return Response.json({ data: { id: deleted.id }, error: null });
}
