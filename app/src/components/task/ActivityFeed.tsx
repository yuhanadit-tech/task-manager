const ACTION_LABELS: Record<string, string> = {
  created: "created this task",
  updated: "updated this task",
  status_changed: "changed status",
  assigned: "assigned this task",
  unassigned: "unassigned this task",
  priority_changed: "changed priority",
  due_date_changed: "changed due date",
  comment_added: "added a comment",
  deleted: "deleted this task",
};

interface ActivityEntry {
  id: string;
  action: string;
  entityType: string;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string;
  actor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface ActivityFeedProps {
  entries: ActivityEntry[];
}

export function ActivityFeed({ entries }: ActivityFeedProps) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-xs text-[#adb5bd] py-4">No activity yet</p>
    );
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => {
        const name = entry.actor.name ?? entry.actor.email;
        const actionLabel = ACTION_LABELS[entry.action] ?? entry.action;

        return (
          <li key={entry.id} className="flex items-start gap-2">
            {/* Timeline dot */}
            <span className="mt-1.5 h-2 w-2 rounded-full bg-[#e5e7eb] flex-shrink-0" aria-hidden="true" />

            <div>
              <p className="text-xs text-[#374151]">
                <span className="font-medium">{name}</span>{" "}
                {actionLabel}
                {entry.newValue != null && (
                  <span className="text-[#6c757d]">
                    {" "}
                    → {typeof entry.newValue === "string"
                      ? entry.newValue
                      : JSON.stringify(entry.newValue)}
                  </span>
                )}
              </p>
              <p className="text-[10px] text-[#adb5bd] mt-0.5">
                {new Date(entry.createdAt).toLocaleString()}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
