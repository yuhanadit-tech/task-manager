import { z } from "zod";

export const inviteSchema = z.object({
  email: z
    .string()
    .email("Must be a valid email address")
    .max(255, "Email must be 255 characters or less"),
  role: z.enum(["admin", "member"]).default("member"),
});

export type InviteInput = z.infer<typeof inviteSchema>;
