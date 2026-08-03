"use client";

import { useState, useEffect, useRef } from "react";
import type { ApiResponse } from "@/types/user";

interface Notification {
  id: string;
  type: string;
  payload: unknown;
  readAt: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  assigned: "You were assigned a task",
  commented: "New comment on your task",
  mentioned: "You were mentioned",
  due_soon: "Task due soon",
  status_changed: "Task status changed",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/notifications");
      const json: ApiResponse<Notification[]> = await res.json();
      if (json.data) setNotifications(json.data);
    }
    load();
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unread = notifications.filter((n) => !n.readAt);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label={`Notifications${unread.length > 0 ? ` (${unread.length} unread)` : ""}`}
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-[#6c757d] hover:text-[#1a1a2e] transition-colors"
      >
        🔔
        {unread.length > 0 && (
          <span
            className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[#dc2626] text-white text-[9px] font-bold flex items-center justify-center"
            aria-hidden="true"
          >
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-80 bg-white border border-[#e9ecef] rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e9ecef] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1a1a2e]">Notifications</h3>
            {unread.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/notifications", { method: "DELETE" });
                  setNotifications((prev) =>
                    prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
                  );
                }}
                className="text-xs text-[#4f46e5] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <ul className="max-h-72 overflow-y-auto divide-y divide-[#f3f4f6]">
            {notifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-xs text-[#adb5bd]">
                No notifications
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className={`px-4 py-3 text-sm cursor-pointer hover:bg-[#f7f8fa] transition-colors ${
                    !n.readAt ? "bg-[#ede9fe]/20" : ""
                  }`}
                  onClick={() => !n.readAt && markRead(n.id)}
                  onKeyDown={(e) => e.key === "Enter" && !n.readAt && markRead(n.id)}
                  role="button"
                  tabIndex={0}
                >
                  <p className="text-[#1a1a2e] font-medium">
                    {TYPE_LABELS[n.type] ?? n.type}
                    {!n.readAt && (
                      <span className="ml-2 h-1.5 w-1.5 rounded-full bg-[#4f46e5] inline-block" />
                    )}
                  </p>
                  <p className="text-[10px] text-[#adb5bd] mt-0.5">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
