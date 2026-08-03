import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(500, "Title must be 500 characters or less"),
  description: z.unknown().optional(),
  status: z
    .enum(["backlog", "todo", "in_progress", "in_review", "done"])
    .default("backlog"),
  priority: z.enum(["urgent", "high", "medium", "low", "none"]).default("none"),
  assigneeId: z.string().uuid("Invalid assignee ID").optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD").optional(),
  sortOrder: z.number().default(0),
});

export const updateTaskSchema = createTaskSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const assignTaskSchema = z.object({
  assigneeId: z.string().uuid("Invalid assignee ID").nullable(),
});

export const reorderTaskSchema = z.object({
  sortOrder: z.number(),
  status: z
    .enum(["backlog", "todo", "in_progress", "in_review", "done"])
    .optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type AssignTaskInput = z.infer<typeof assignTaskSchema>;
export type ReorderTaskInput = z.infer<typeof reorderTaskSchema>;
