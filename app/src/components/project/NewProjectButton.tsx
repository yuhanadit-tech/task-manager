"use client";

import { useState } from "react";
import { ProjectForm } from "./ProjectForm";

export function NewProjectButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338ca] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2 transition-colors"
      >
        + New Project
      </button>

      {/* Modal */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-project-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 id="new-project-title" className="text-lg font-bold text-[#1a1a2e]">
                New Project
              </h2>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setOpen(false)}
                className="text-[#6c757d] hover:text-[#1a1a2e] transition-colors"
              >
                ✕
              </button>
            </div>

            <ProjectForm onSuccess={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
