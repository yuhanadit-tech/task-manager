import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listProjectsByUser } from "@/services/project.service";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { NewProjectButton } from "@/components/project/NewProjectButton";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login" as Route);

  const db = getDb();
  const projects = await listProjectsByUser(db, session.user.id);
  const recentProjects = projects.slice(0, 6);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a1a2e]">
          Welcome, {session.user?.name ?? session.user?.email}
        </h1>
        <p className="text-[#6c757d] mt-1 text-sm">Here&apos;s what&apos;s happening across your projects.</p>
      </div>

      {/* Recent projects */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-[#1a1a2e]">Your projects</h2>
        <div className="flex items-center gap-3">
          {projects.length > 0 && (
            <Link
              href={"/projects" as Route}
              className="text-sm text-[#4f46e5] hover:underline"
            >
              View all
            </Link>
          )}
          <NewProjectButton />
        </div>
      </div>

      {recentProjects.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#e9ecef] rounded-xl">
          <p className="text-[#6c757d] font-medium mb-1">No projects yet</p>
          <p className="text-sm text-[#adb5bd] mb-4">
            Create a project to start managing your team&apos;s work
          </p>
          <NewProjectButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentProjects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}` as Route}>
              <div className="bg-white border border-[#e9ecef] rounded-xl p-5 hover:border-[#ced4da] hover:shadow-sm transition-all cursor-pointer group">
                <div
                  className="h-1.5 w-10 rounded-full mb-4"
                  style={{ backgroundColor: project.color }}
                  aria-hidden="true"
                />
                <h3 className="font-semibold text-[#1a1a2e] truncate group-hover:text-[#4f46e5] transition-colors">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-sm text-[#6c757d] mt-1 line-clamp-2">{project.description}</p>
                )}
                <span className="text-xs text-[#adb5bd] capitalize mt-3 block">{project.role}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
