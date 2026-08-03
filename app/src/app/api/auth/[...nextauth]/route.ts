import { handlers } from "@/lib/auth";

// This route is fully dynamic — never statically pre-rendered
export const dynamic = "force-dynamic";

export const { GET, POST } = handlers;
