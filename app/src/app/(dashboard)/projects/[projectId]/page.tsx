import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getProjectByIdForUser } from "@/services/project.service";
import { redirect, notFound } from "next/navigation";
import type { Route } from "next";

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectBoardPage({ params }: ProjectPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login" as Route);

  const { projectId } = await params;
  const db = getDb();
  const project = await getProjectByIdForUser(db, projectId, session.user.id);

  if (!project) notFound();

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        {/* Color dot */}
        <span
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: project.color }}
          aria-hidden="true"
        />
        <h1 className="text-2xl font-bold text-[#1a1a2e]">{project.name}</h1>
        {project.description && (
          <p className="text-sm text-[#6c757d] ml-1">{project.description}</p>
        )}
      </div>

      {/* Kanban board placeholder — built in TASK 07 */}
      <div className="border border-dashed border-[#e9ecef] rounded-xl py-20 text-center">
        <p className="text-[#adb5bd] text-sm">Kanban board coming in TASK 07</p>
      </div>
    </div>
  );
}
