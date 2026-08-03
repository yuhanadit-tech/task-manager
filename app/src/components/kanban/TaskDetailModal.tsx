"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validations/task";
import type { Task } from "@/lib/db/schema";
import type { ApiResponse } from "@/types/user";

// Form input type (fields with defaults are optional in input)
type TaskFormValues = z.input<typeof createTaskSchema>;

interface TaskDetailModalProps {
  projectId: string;
  task?: Task; // if provided, editing; otherwise creating
  defaultStatus?: string;
  onClose: () => void;
  onSaved: (task: Task) => void;
}

export function TaskDetailModal({
  projectId,
  task,
  defaultStatus = "todo",
  onClose,
  onSaved,
}: TaskDetailModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = !!task;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues, unknown, CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: task?.title ?? "",
      status: (task?.status as CreateTaskInput["status"]) ?? (defaultStatus as CreateTaskInput["status"]),
      priority: (task?.priority as CreateTaskInput["priority"]) ?? "none",
      dueDate: task?.dueDate ?? undefined,
      sortOrder: task?.sortOrder ?? 0,
    },
  });

  async function onSubmit(data: CreateTaskInput) {
    setServerError(null);

    const url = isEditing
      ? `/api/projects/${projectId}/tasks/${task!.id}`
      : `/api/projects/${projectId}/tasks`;
    const method = isEditing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json: ApiResponse<Task> = await res.json();

    if (!res.ok || json.error) {
      setServerError(json.error ?? "Failed to save task.");
      return;
    }

    onSaved(json.data!);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 id="task-modal-title" className="text-lg font-bold text-[#1a1a2e]">
            {isEditing ? "Edit Task" : "New Task"}
          </h2>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="text-[#6c757d] hover:text-[#1a1a2e] transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {serverError && (
            <p
              role="alert"
              className="text-sm text-[#dc2626] bg-red-50 border border-red-200 rounded-md p-3"
            >
              {serverError}
            </p>
          )}

          <div>
            <label
              htmlFor="task-title"
              className="block text-sm font-medium text-[#1a1a2e] mb-1"
            >
              Title <span aria-hidden="true" className="text-[#dc2626]">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              className="w-full rounded-md border border-[#ced4da] px-3 py-2 text-sm text-[#1a1a2e] placeholder-[#adb5bd] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              placeholder="What needs to be done?"
              {...register("title")}
            />
            {errors.title && (
              <p role="alert" className="text-xs text-[#dc2626] mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="task-status"
                className="block text-sm font-medium text-[#1a1a2e] mb-1"
              >
                Status
              </label>
              <select
                id="task-status"
                className="w-full rounded-md border border-[#ced4da] px-3 py-2 text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
                {...register("status")}
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="task-priority"
                className="block text-sm font-medium text-[#1a1a2e] mb-1"
              >
                Priority
              </label>
              <select
                id="task-priority"
                className="w-full rounded-md border border-[#ced4da] px-3 py-2 text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
                {...register("priority")}
              >
                <option value="none">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="task-due"
              className="block text-sm font-medium text-[#1a1a2e] mb-1"
            >
              Due date
            </label>
            <input
              id="task-due"
              type="date"
              className="w-full rounded-md border border-[#ced4da] px-3 py-2 text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              {...register("dueDate")}
            />
            {errors.dueDate && (
              <p role="alert" className="text-xs text-[#dc2626] mt-1">
                {errors.dueDate.message}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-[#ced4da] px-4 py-2 text-sm font-medium text-[#1a1a2e] hover:bg-[#f7f8fa] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-md bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338ca] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
