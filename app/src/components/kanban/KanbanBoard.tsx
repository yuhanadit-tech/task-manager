"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import type { Task } from "@/lib/db/schema";

const COLUMN_ORDER = ["todo", "in_progress", "in_review", "done"] as const;

type ColumnStatus = (typeof COLUMN_ORDER)[number];

const COLUMN_LABELS: Record<ColumnStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

interface KanbanBoardProps {
  projectId: string;
  initialTasks: Task[];
}

export function KanbanBoard({ projectId, initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const getColumnTasks = useCallback(
    (status: ColumnStatus) => tasks.filter((t) => t.status === status),
    [tasks]
  );

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const draggedTask = tasks.find((t) => t.id === active.id);
    if (!draggedTask) return;

    // Determine target column — over.id can be a column status or a task id
    const targetStatus = COLUMN_ORDER.includes(over.id as ColumnStatus)
      ? (over.id as ColumnStatus)
      : tasks.find((t) => t.id === over.id)?.status;

    if (!targetStatus || targetStatus === draggedTask.status) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === draggedTask.id ? { ...t, status: targetStatus } : t))
    );

    // Persist via API
    try {
      await fetch(`/api/projects/${projectId}/tasks/${draggedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
    } catch {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) =>
          t.id === draggedTask.id ? { ...t, status: draggedTask.status } : t
        )
      );
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMN_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            label={COLUMN_LABELS[status]}
            tasks={getColumnTasks(status)}
            projectId={projectId}
            onTaskCreated={(task) => setTasks((prev) => [task, ...prev])}
            onTaskDeleted={(id) =>
              setTasks((prev) => prev.filter((t) => t.id !== id))
            }
            onTaskUpdated={(updated) =>
              setTasks((prev) =>
                prev.map((t) => (t.id === updated.id ? updated : t))
              )
            }
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragOverlay />}
      </DragOverlay>
    </DndContext>
  );
}
