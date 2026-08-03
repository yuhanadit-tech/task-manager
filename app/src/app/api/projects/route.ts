import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { createProjectSchema } from "@/lib/validations/project";
import { listProjectsByUser, createProject } from "@/services/project.service";
import type { ApiResponse } from "@/types/user";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/projects — list projects for current user
// ---------------------------------------------------------------------------
export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" } satisfies ApiResponse<null>, {
      status: 401,
    });
  }

  const db = getDb();
  const data = await listProjectsByUser(db, session.user.id);
  return Response.json({ data, error: null } satisfies ApiResponse<typeof data>);
}

// ---------------------------------------------------------------------------
// POST /api/projects — create a new project
// ---------------------------------------------------------------------------
export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" } satisfies ApiResponse<null>, {
      status: 401,
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ data: null, error: "Invalid JSON body" } satisfies ApiResponse<null>, {
      status: 400,
    });
  }

  const result = createProjectSchema.safeParse(body);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return Response.json(
      { data: null, error: firstIssue?.message ?? "Validation failed" } satisfies ApiResponse<null>,
      { status: 400 }
    );
  }

  const db = getDb();
  const project = await createProject(db, session.user.id, result.data);
  return Response.json({ data: project, error: null } satisfies ApiResponse<typeof project>, {
    status: 201,
  });
}
