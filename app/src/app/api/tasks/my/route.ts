import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getMyTasks } from "@/services/my-tasks.service";
import type { ApiResponse } from "@/types/user";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/tasks/my — return tasks assigned to the current user
// ---------------------------------------------------------------------------
export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { data: null, error: "Unauthorized" } satisfies ApiResponse<null>,
      { status: 401 }
    );
  }

  const db = getDb();
  const taskList = await getMyTasks(db, session.user.id);
  return Response.json({ data: taskList, error: null } satisfies ApiResponse<typeof taskList>);
}
