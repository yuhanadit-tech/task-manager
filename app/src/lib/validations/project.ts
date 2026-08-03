import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be 100 characters or less"),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex code (e.g. #4f46e5)")
    .default("#4f46e5"),
  icon: z.string().max(50).optional(),
});

export const updateProjectSchema = createProjectSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
