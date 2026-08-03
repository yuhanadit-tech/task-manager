import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { updateTaskSchema } from "@/lib/validations/task";
import { getTask, updateTask, deleteTask } from "@/services/task.service";
import { getUserRoleInProject } from "@/services/project.service";
import type { ApiResponse } from "@/types/user";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ projectId: string; taskId: string }>;
}

// ---------------------------------------------------------------------------
// GET /api/projects/[projectId]/tasks/[taskId]
// ---------------------------------------------------------------------------
export async function GET(_req: Request, { params }: RouteParams): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { data: null, error: "Unauthorized" } satisfies ApiResponse<null>,
      { status: 401 }
    );
  }

  const { projectId, taskId } = await params;
  const db = getDb();

  const role = await getUserRoleInProject(db, projectId, session.user.id);
  if (!role) {
    return Response.json(
      { data: null, error: "Not a member of this project" } satisfies ApiResponse<null>,
      { status: 403 }
    );
  }

  const task = await getTask(db, taskId);
  if (!task || task.projectId !== projectId) {
    return Response.json(
      { data: null, error: "Task not found" } satisfies ApiResponse<null>,
      { status: 404 }
    );
  }

  return Response.json({ data: task, error: null } satisfies ApiResponse<typeof task>);
}

// ---------------------------------------------------------------------------
// PATCH /api/projects/[projectId]/tasks/[taskId]
// ---------------------------------------------------------------------------
export async function PATCH(req: Request, { params }: RouteParams): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { data: null, error: "Unauthorized" } satisfies ApiResponse<null>,
      { status: 401 }
    );
  }

  const { projectId, taskId } = await params;
  const db = getDb();

  const role = await getUserRoleInProject(db, projectId, session.user.id);
  if (!role) {
    return Response.json(
      { data: null, error: "Not a member of this project" } satisfies ApiResponse<null>,
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

  const result = updateTaskSchema.safeParse(body);
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

  const updated = await updateTask(db, taskId, result.data);
  if (!updated) {
    return Response.json(
      { data: null, error: "Task not found" } satisfies ApiResponse<null>,
      { status: 404 }
    );
  }

  return Response.json({ data: updated, error: null } satisfies ApiResponse<typeof updated>);
}

// ---------------------------------------------------------------------------
// DELETE /api/projects/[projectId]/tasks/[taskId]
// ---------------------------------------------------------------------------
export async function DELETE(_req: Request, { params }: RouteParams): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { data: null, error: "Unauthorized" } satisfies ApiResponse<null>,
      { status: 401 }
    );
  }

  const { projectId, taskId } = await params;
  const db = getDb();

  const role = await getUserRoleInProject(db, projectId, session.user.id);
  if (!role) {
    return Response.json(
      { data: null, error: "Not a member of this project" } satisfies ApiResponse<null>,
      { status: 403 }
    );
  }

  const deleted = await deleteTask(db, taskId, session.user.id);
  if (!deleted) {
    return Response.json(
      { data: null, error: "Task not found" } satisfies ApiResponse<null>,
      { status: 404 }
    );
  }

  return Response.json({ data: { id: deleted.id }, error: null });
}
