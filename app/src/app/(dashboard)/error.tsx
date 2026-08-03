"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Dashboard render error", { digest: error.digest });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
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
