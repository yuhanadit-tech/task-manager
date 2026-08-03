"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { inviteSchema, type InviteInput } from "@/lib/validations/invite";
import type { ApiResponse } from "@/types/user";

// Form input type (role has a default, so it's optional from the form's perspective)
type InviteFormValues = z.input<typeof inviteSchema>;

interface InviteFormProps {
  projectId: string;
  onSuccess?: () => void;
}

export function InviteForm({ projectId, onSuccess }: InviteFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues, unknown, InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "member" },
  });

  async function onSubmit(data: InviteInput) {
    setServerError(null);
    setSuccessMsg(null);

    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json: ApiResponse<unknown> = await res.json();

    if (!res.ok || json.error) {
      setServerError(json.error ?? "Failed to send invite.");
      return;
    }

    setSuccessMsg(`Invite sent to ${data.email}`);
    reset();
    onSuccess?.();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      {serverError && (
        <p
          role="alert"
          className="text-sm text-[#dc2626] bg-red-50 border border-red-200 rounded-md p-3"
        >
          {serverError}
        </p>
      )}
      {successMsg && (
        <p
          role="status"
          className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3"
        >
          {successMsg}
        </p>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="email"
            placeholder="colleague@example.com"
            className="w-full rounded-md border border-[#ced4da] px-3 py-2 text-sm text-[#1a1a2e] placeholder-[#adb5bd] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
            {...register("email")}
          />
          {errors.email && (
            <p role="alert" className="text-xs text-[#dc2626] mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <select
          className="rounded-md border border-[#ced4da] px-3 py-2 text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
          {...register("role")}
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338ca] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {isSubmitting ? "Sending…" : "Invite"}
        </button>
      </div>
    </form>
  );
}
