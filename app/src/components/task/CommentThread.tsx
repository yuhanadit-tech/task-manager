"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { commentSchema, type CommentInput } from "@/lib/validations/comment";
import type { ApiResponse } from "@/types/user";

interface Comment {
  id: string;
  content: unknown;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    avatarUrl: string | null;
  };
}

interface CommentThreadProps {
  taskId: string;
  initialComments: Comment[];
  currentUserId: string;
}

export function CommentThread({ taskId, initialComments, currentUserId }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentInput>({
    resolver: zodResolver(commentSchema),
  });

  async function onSubmit(data: CommentInput) {
    setServerError(null);

    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json: ApiResponse<Comment> = await res.json();

    if (!res.ok || json.error) {
      setServerError(json.error ?? "Failed to post comment.");
      return;
    }

    if (json.data) {
      setComments((prev) => [json.data!, ...prev]);
    }
    reset();
  }

  async function handleDelete(commentId: string) {
    const res = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  }

  return (
    <div className="space-y-4">
      {/* Add comment form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-2">
        <textarea
          rows={3}
          placeholder="Add a comment…"
          className="w-full rounded-md border border-[#ced4da] px-3 py-2 text-sm text-[#1a1a2e] placeholder-[#adb5bd] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent resize-none"
          {...register("content")}
        />
        {errors.content && (
          <p role="alert" className="text-xs text-[#dc2626]">
            {errors.content.message}
          </p>
        )}
        {serverError && (
          <p role="alert" className="text-xs text-[#dc2626]">
            {serverError}
          </p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-[#4f46e5] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4338ca] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Posting…" : "Post comment"}
          </button>
        </div>
      </form>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-center text-xs text-[#adb5bd] py-4">No comments yet</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const name = c.author.name ?? c.author.email;
            const initials = name.slice(0, 2).toUpperCase();
            const avatarSrc = c.author.image ?? c.author.avatarUrl;
            const isOwn = c.author.id === currentUserId;

            return (
              <li key={c.id} className="flex gap-3">
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarSrc}
                    alt={name}
                    className="h-7 w-7 rounded-full object-cover flex-shrink-0 mt-0.5"
                  />
                ) : (
                  <span className="h-7 w-7 rounded-full bg-[#4f46e5] flex items-center justify-center text-[10px] font-medium text-white flex-shrink-0 mt-0.5">
                    {initials}
                  </span>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#1a1a2e]">{name}</span>
                    <span className="text-[10px] text-[#adb5bd]">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                    {isOwn && (
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="text-[10px] text-[#adb5bd] hover:text-[#dc2626] ml-auto transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-[#374151] mt-0.5">
                    {typeof c.content === "string" ? c.content : JSON.stringify(c.content)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
