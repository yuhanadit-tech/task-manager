import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { z } from "zod";
import { addLabelToTask, removeLabelFromTask } from "@/services/label.service";
import { getTask } from "@/services/task.service";
import { getUserRoleInProject } from "@/services/project.service";
import type { ApiResponse } from "@/types/user";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ taskId: string }>;
}

const labelActionSchema = z.object({
  labelId: z.string().uuid("Invalid label ID"),
});

// ---------------------------------------------------------------------------
// POST /api/tasks/[taskId]/labels — add label to task
// ---------------------------------------------------------------------------
export async function POST(req: Request, { params }: RouteParams): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { data: null, error: "Unauthorized" } satisfies ApiResponse<null>,
      { status: 401 }
    );
  }

  const { taskId } = await params;
  const db = getDb();

  const task = await getTask(db, taskId);
  if (!task) {
    return Response.json(
      { data: null, error: "Task not found" } satisfies ApiResponse<null>,
      { status: 404 }
    );
  }

  const role = await getUserRoleInProject(db, task.projectId, session.user.id);
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

  const result = labelActionSchema.safeParse(body);
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

  await addLabelToTask(db, taskId, result.data.labelId);
  return Response.json(
    { data: { taskId, labelId: result.data.labelId }, error: null },
    { status: 201 }
  );
}

// ---------------------------------------------------------------------------
// DELETE /api/tasks/[taskId]/labels — remove label from task
// ---------------------------------------------------------------------------
export async function DELETE(req: Request, { params }: RouteParams): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { data: null, error: "Unauthorized" } satisfies ApiResponse<null>,
      { status: 401 }
    );
  }

  const { taskId } = await params;
  const db = getDb();

  const task = await getTask(db, taskId);
  if (!task) {
    return Response.json(
      { data: null, error: "Task not found" } satisfies ApiResponse<null>,
      { status: 404 }
    );
  }

  const role = await getUserRoleInProject(db, task.projectId, session.user.id);
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

  const result = labelActionSchema.safeParse(body);
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

  await removeLabelFromTask(db, taskId, result.data.labelId);
  return Response.json({ data: { taskId, labelId: result.data.labelId }, error: null });
}
