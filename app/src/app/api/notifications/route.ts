import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listNotifications } from "@/services/notification.service";
import type { ApiResponse } from "@/types/user";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/notifications — list notifications for current user
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
  const notifs = await listNotifications(db, session.user.id);
  return Response.json({ data: notifs, error: null } satisfies ApiResponse<typeof notifs>);
}
