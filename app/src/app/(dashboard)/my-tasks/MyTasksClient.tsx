"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { TaskListItem } from "@/components/task/TaskListItem";
import { TaskFilters } from "@/components/task/TaskFilters";

interface MyTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string;
  projectName: string;
  projectColor: string;
}

interface MyTasksClientProps {
  tasks: MyTask[];
}

export function MyTasksClient({ tasks }: MyTasksClientProps) {
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const filtered = tasks.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-4">
        <TaskFilters
          status={statusFilter}
          priority={priorityFilter}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#e9ecef] rounded-xl">
          <p className="text-[#6c757d] font-medium mb-1">No tasks found</p>
          <p className="text-sm text-[#adb5bd]">
            {tasks.length === 0
              ? "Tasks assigned to you will appear here"
              : "Try adjusting your filters"}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#e9ecef] rounded-xl divide-y divide-[#e9ecef] overflow-hidden">
          {filtered.map((task) => (
            <Link
              key={task.id}
              href={`/projects/${task.projectId}` as Route}
              className="block hover:bg-[#f7f8fa] transition-colors px-4"
            >
              <TaskListItem
                id={task.id}
                title={task.title}
                status={task.status}
                priority={task.priority}
                dueDate={task.dueDate}
                projectName={task.projectName}
                projectColor={task.projectColor}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
