"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log correlation ID only — never expose stack trace to UI
    logger.error("Auth route error", { digest: error.digest });
  }, [error]);

  return (
    <div className="text-center py-8">
      <h2 className="text-lg font-semibold text-[#1a1a2e] mb-2">Something went wrong</h2>
      <p className="text-sm text-[#6c757d] mb-4">An unexpected error occurred. Please try again.</p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-medium bg-[#4f46e5] text-white rounded-md hover:bg-[#4338ca] transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
