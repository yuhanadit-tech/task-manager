import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { createTaskSchema } from "@/lib/validations/task";
import { listTasks, createTask } from "@/services/task.service";
import { getUserRoleInProject } from "@/services/project.service";
import type { ApiResponse } from "@/types/user";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

// ---------------------------------------------------------------------------
// GET /api/projects/[projectId]/tasks — list tasks
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

  const taskList = await listTasks(db, projectId);
  return Response.json({ data: taskList, error: null } satisfies ApiResponse<typeof taskList>);
}

// ---------------------------------------------------------------------------
// POST /api/projects/[projectId]/tasks — create a task
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

  const result = createTaskSchema.safeParse(body);
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

  const task = await createTask(db, projectId, session.user.id, result.data);
  return Response.json(
    { data: task, error: null } satisfies ApiResponse<typeof task>,
    { status: 201 }
  );
}
