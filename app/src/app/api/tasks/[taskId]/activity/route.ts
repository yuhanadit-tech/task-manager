import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listActivity } from "@/services/activity.service";
import { getTask } from "@/services/task.service";
import { getUserRoleInProject } from "@/services/project.service";
import type { ApiResponse } from "@/types/user";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ taskId: string }>;
}

// ---------------------------------------------------------------------------
// GET /api/tasks/[taskId]/activity
// ---------------------------------------------------------------------------
export async function GET(_req: Request, { params }: RouteParams): Promise<Response> {
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

  const activity = await listActivity(db, taskId);
  return Response.json({ data: activity, error: null } satisfies ApiResponse<typeof activity>);
}
