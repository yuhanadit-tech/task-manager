import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { registerSchema } from "@/lib/validations/auth";
import type { ApiResponse } from "@/types/user";

// Dynamic route — no static pre-rendering
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ data: null, error: "Invalid JSON body" } satisfies ApiResponse<null>, {
      status: 400,
    });
  }

  const result = registerSchema.safeParse(body);
  if (!result.success) {
    // Zod v4: issues (not errors)
    const firstIssue = result.error.issues[0];
    return Response.json(
      { data: null, error: firstIssue?.message ?? "Validation failed" } satisfies ApiResponse<null>,
      { status: 400 }
    );
  }

  const { name, email, password } = result.data;

  // Check existing user
  const db = getDb();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return Response.json(
      { data: null, error: "An account with this email already exists" } satisfies ApiResponse<null>,
      { status: 409 }
    );
  }

  // Hash password — cost factor 12 per PRD security requirements
  const passwordHash = await bcrypt.hash(password, 12);

  const [newUser] = await db
    .insert(users)
    .values({ name, email, passwordHash })
    .returning({ id: users.id, email: users.email, name: users.name });

  return Response.json(
    { data: newUser, error: null } satisfies ApiResponse<typeof newUser>,
    { status: 201 }
  );
}
