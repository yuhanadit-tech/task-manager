import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { acceptInvite } from "@/services/member.service";
import type { ApiResponse } from "@/types/user";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ token: string }>;
}

// ---------------------------------------------------------------------------
// GET /api/invites/[token] — accept an invite
// ---------------------------------------------------------------------------
export async function GET(_req: Request, { params }: RouteParams): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { data: null, error: "Unauthorized" } satisfies ApiResponse<null>,
      { status: 401 }
    );
  }

  const { token } = await params;
  const db = getDb();

  try {
    const invite = await acceptInvite(db, token, session.user.id);
    return Response.json({ data: invite, error: null } satisfies ApiResponse<typeof invite>);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to accept invite";
    return Response.json(
      { data: null, error: message } satisfies ApiResponse<null>,
      { status: 400 }
    );
  }
}
