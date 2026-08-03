import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { markAsRead } from "@/services/notification.service";
import type { ApiResponse } from "@/types/user";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// POST /api/notifications/[id]/read — mark notification as read
// ---------------------------------------------------------------------------
export async function POST(_req: Request, { params }: RouteParams): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { data: null, error: "Unauthorized" } satisfies ApiResponse<null>,
      { status: 401 }
    );
  }

  const { id } = await params;
  const db = getDb();

  await markAsRead(db, id, session.user.id);
  return Response.json({ data: { id }, error: null });
}
