import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { users, sessions, verificationTokens, accounts } from "@/lib/db/schema";
import { loginSchema } from "@/lib/validations/auth";

// Auth.js configuration — db adapter initialized lazily inside handlers
// so DATABASE_URL is not evaluated at build time.
function buildAuthConfig() {
  // Dynamic import of db to avoid module-evaluation-time crash on missing DATABASE_URL
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getDb } = require("@/lib/db") as { getDb: () => import("drizzle-orm/neon-http").NeonHttpDatabase };
  const db = getDb();

  return {
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
      accountsTable: accounts,
    }),
    session: {
      strategy: "database" as const,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    providers: [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID!,
        clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      }),
      Credentials({
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const { email, password } = parsed.data;

          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user || !user.passwordHash) return null;

          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? "",
            image: user.image,
          };
        },
      }),
    ],
    callbacks: {
      async session({ session, user }: { session: import("next-auth").Session; user: import("next-auth").User }) {
        if (session.user && user?.id) {
          // user.id is always set in database session strategy
          session.user.id = user.id;
        }
        return session;
      },
    },
    pages: {
      signIn: "/login",
      error: "/login",
    },
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth(buildAuthConfig());
