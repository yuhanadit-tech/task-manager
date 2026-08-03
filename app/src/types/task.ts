// Types for Task entity
export type TaskStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done";

export type TaskPriority = "urgent" | "high" | "medium" | "low" | "none";

export interface Task {
  id: string;
  projectId: string;
  parentTaskId: string | null;
  title: string;
  description: unknown | null; // Tiptap JSON
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  creatorId: string;
  dueDate: string | null; // ISO date string
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: unknown;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  parentTaskId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: unknown;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
  sortOrder?: number;
}
