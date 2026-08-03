import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listProjectsByUser } from "@/services/project.service";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { ProjectCard } from "@/components/project/ProjectCard";
import { NewProjectButton } from "@/components/project/NewProjectButton";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login" as Route);

  const db = getDb();
  const projects = await listProjectsByUser(db, session.user.id);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Projects</h1>
          <p className="text-sm text-[#6c757d] mt-0.5">
            {projects.length === 0
              ? "No projects yet — create your first one"
              : `${projects.length} project${projects.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <NewProjectButton />
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#e9ecef] rounded-xl">
          <p className="text-[#6c757d] font-medium mb-1">No projects yet</p>
          <p className="text-sm text-[#adb5bd] mb-4">
            Create a project to start managing your team&apos;s work
          </p>
          <NewProjectButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}` as Route}>
              <ProjectCard project={project} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
