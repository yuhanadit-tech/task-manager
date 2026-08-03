import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { z } from "zod";
import { listLabels, createLabel } from "@/services/label.service";
import { getUserRoleInProject } from "@/services/project.service";
import type { ApiResponse } from "@/types/user";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

const createLabelSchema = z.object({
  name: z
    .string()
    .min(1, "Label name is required")
    .max(50, "Label name must be 50 characters or less"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex code")
    .default("#6b7280"),
});

// ---------------------------------------------------------------------------
// GET /api/projects/[projectId]/labels
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

  const labelList = await listLabels(db, projectId);
  return Response.json({ data: labelList, error: null } satisfies ApiResponse<typeof labelList>);
}

// ---------------------------------------------------------------------------
// POST /api/projects/[projectId]/labels
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
  if (!role || role === "member") {
    return Response.json(
      { data: null, error: "Forbidden" } satisfies ApiResponse<null>,
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

  const result = createLabelSchema.safeParse(body);
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

  try {
    const label = await createLabel(db, projectId, result.data.name, result.data.color);
    return Response.json(
      { data: label, error: null } satisfies ApiResponse<typeof label>,
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create label";
    return Response.json(
      { data: null, error: message } satisfies ApiResponse<null>,
      { status: 409 }
    );
  }
}
