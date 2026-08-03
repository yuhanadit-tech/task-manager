import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { deleteComment } from "@/services/comment.service";
import type { ApiResponse } from "@/types/user";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ taskId: string; commentId: string }>;
}

// ---------------------------------------------------------------------------
// DELETE /api/tasks/[taskId]/comments/[commentId]
// ---------------------------------------------------------------------------
export async function DELETE(_req: Request, { params }: RouteParams): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { data: null, error: "Unauthorized" } satisfies ApiResponse<null>,
      { status: 401 }
    );
  }

  const { commentId } = await params;
  const db = getDb();

  try {
    const deleted = await deleteComment(db, commentId, session.user.id);
    return Response.json({ data: { id: deleted.id }, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete comment";
    return Response.json(
      { data: null, error: message } satisfies ApiResponse<null>,
      { status: 400 }
    );
  }
}
