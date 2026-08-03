"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Route } from "next";
import { createProjectSchema, type CreateProjectInput } from "@/lib/validations/project";
import type { ApiResponse } from "@/types/user";

// Form uses the zod *input* shape (color is optional before default is applied)
type CreateProjectFormValues = z.input<typeof createProjectSchema>;

const PRESET_COLORS = [
  "#4f46e5", // indigo
  "#0891b2", // cyan
  "#16a34a", // green
  "#d97706", // amber
  "#dc2626", // red
  "#7c3aed", // violet
  "#db2777", // pink
  "#0284c7", // sky
];

interface ProjectFormProps {
  onSuccess?: () => void;
}

export function ProjectForm({ onSuccess }: ProjectFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormValues, unknown, CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { color: "#4f46e5" },
  });

  const selectedColor = watch("color");

  async function onSubmit(data: CreateProjectInput) {
    setServerError(null);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json: ApiResponse<{ id: string }> = await res.json();

    if (!res.ok || json.error) {
      setServerError(json.error ?? "Failed to create project.");
      return;
    }

    onSuccess?.();
    router.push(`/projects/${json.data!.id}` as Route);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && (
        <p role="alert" className="text-sm text-[#dc2626] bg-red-50 border border-red-200 rounded-md p-3">
          {serverError}
        </p>
      )}

      <div>
        <label htmlFor="proj-name" className="block text-sm font-medium text-[#1a1a2e] mb-1">
          Project name <span aria-hidden="true" className="text-[#dc2626]">*</span>
        </label>
        <input
          id="proj-name"
          type="text"
          className="w-full rounded-md border border-[#ced4da] px-3 py-2 text-sm text-[#1a1a2e] placeholder-[#adb5bd] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
          placeholder="My awesome project"
          {...register("name")}
        />
        {errors.name && (
          <p role="alert" className="text-xs text-[#dc2626] mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="proj-desc" className="block text-sm font-medium text-[#1a1a2e] mb-1">
          Description <span className="text-[#adb5bd] font-normal">(optional)</span>
        </label>
        <textarea
          id="proj-desc"
          rows={2}
          className="w-full rounded-md border border-[#ced4da] px-3 py-2 text-sm text-[#1a1a2e] placeholder-[#adb5bd] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent resize-none"
          placeholder="What is this project about?"
          {...register("description")}
        />
        {errors.description && (
          <p role="alert" className="text-xs text-[#dc2626] mt-1">{errors.description.message}</p>
        )}
      </div>

      <div>
        <span className="block text-sm font-medium text-[#1a1a2e] mb-2">Color</span>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Select color ${color}`}
              aria-pressed={selectedColor === color}
              onClick={() => setValue("color", color, { shouldValidate: true })}
              className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#4f46e5]"
              style={{
                backgroundColor: color,
                borderColor: selectedColor === color ? "#1a1a2e" : "transparent",
              }}
            />
          ))}
        </div>
        <input type="hidden" {...register("color")} />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338ca] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? "Creating…" : "Create project"}
      </button>
    </form>
  );
}
