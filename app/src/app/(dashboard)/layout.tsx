import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Route } from "next";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth();
  if (!session) redirect("/login" as Route);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Placeholder layout — full AppShell built in later tasks */}
      <main>{children}</main>
    </div>
  );
}
