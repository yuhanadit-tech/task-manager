import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getMyTasks } from "@/services/my-tasks.service";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { MyTasksClient } from "./MyTasksClient";

export default async function MyTasksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login" as Route);

  const db = getDb();
  const tasks = await getMyTasks(db, session.user.id);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a2e]">My Tasks</h1>
        <p className="text-sm text-[#6c757d] mt-0.5">
          {tasks.length === 0
            ? "No tasks assigned to you"
            : `${tasks.length} task${tasks.length === 1 ? "" : "s"} assigned to you`}
        </p>
      </div>

      <MyTasksClient tasks={tasks} />
    </div>
  );
}
