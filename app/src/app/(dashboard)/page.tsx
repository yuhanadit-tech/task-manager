import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Route } from "next";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login" as Route);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#1a1a2e]">Dashboard</h1>
      <p className="text-[#6c757d] mt-2">Welcome, {session.user?.name ?? session.user?.email}</p>
    </div>
  );
}
