"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import { TaskDetailModal } from "./TaskDetailModal";
import type { Task } from "@/lib/db/schema";

interface KanbanColumnProps {
  status: string;
  label: string;
  tasks: Task[];
  projectId: string;
  onTaskCreated: (task: Task) => void;
  onTaskDeleted: (id: string) => void;
  onTaskUpdated: (task: Task) => void;
}

export function KanbanColumn({
  status,
  label,
  tasks,
  projectId,
  onTaskCreated,
  onTaskDeleted,
  onTaskUpdated,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const [showNewTask, setShowNewTask] = useState(false);

  return (
    <div className="flex-shrink-0 w-72">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#1a1a2e]">{label}</span>
          <span className="text-xs text-[#adb5bd] bg-[#f3f4f6] px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          aria-label={`Add task to ${label}`}
          onClick={() => setShowNewTask(true)}
          className="text-[#adb5bd] hover:text-[#4f46e5] transition-colors text-lg leading-none"
        >
          +
        </button>
      </div>

      {/* Droppable task list */}
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`min-h-24 space-y-2 rounded-xl p-2 transition-colors ${
            isOver ? "bg-[#ede9fe]/40" : "bg-[#f7f8fa]"
          }`}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDeleted={() => onTaskDeleted(task.id)}
              onUpdated={onTaskUpdated}
            />
          ))}

          {tasks.length === 0 && (
            <p className="text-center text-xs text-[#adb5bd] py-6">Drop tasks here</p>
          )}
        </div>
      </SortableContext>

      {/* New task modal */}
      {showNewTask && (
        <TaskDetailModal
          projectId={projectId}
          defaultStatus={status}
          onClose={() => setShowNewTask(false)}
          onSaved={(task) => {
            onTaskCreated(task);
            setShowNewTask(false);
          }}
        />
      )}
    </div>
  );
}
