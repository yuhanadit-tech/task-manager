"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/lib/db/schema";

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-blue-100 text-blue-700",
  none: "bg-[#f3f4f6] text-[#6c757d]",
};

interface TaskCardProps {
  task: Task;
  isDragOverlay?: boolean;
  onDeleted?: () => void;
  onUpdated?: (task: Task) => void;
}

export function TaskCard({ task, isDragOverlay = false, onDeleted, onUpdated }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityStyle = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.none;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white border border-[#e9ecef] rounded-lg p-3 cursor-grab active:cursor-grabbing select-none transition-shadow ${
        isDragging ? "opacity-40 shadow-lg" : "hover:shadow-sm hover:border-[#ced4da]"
      } ${isDragOverlay ? "shadow-lg rotate-1" : ""}`}
      onClick={(e) => {
        // Only open detail if not dragging
        if (!isDragging && onUpdated && !isDragOverlay) {
          e.stopPropagation();
          // Handled by parent column's modal
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onDeleted) {
          // keyboard delete not implemented here — handled in modal
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
    >
      <p className="text-sm text-[#1a1a2e] line-clamp-2 mb-2">{task.title}</p>

      <div className="flex items-center justify-between gap-2">
        {task.priority !== "none" && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${priorityStyle}`}>
            {task.priority}
          </span>
        )}
        {task.dueDate && (
          <span className="text-[10px] text-[#adb5bd] ml-auto">{task.dueDate}</span>
        )}
      </div>
    </div>
  );
}
