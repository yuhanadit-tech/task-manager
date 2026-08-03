const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-blue-100 text-blue-700",
  none: "bg-[#f3f4f6] text-[#6c757d]",
};

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

interface TaskListItemProps {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectName: string;
  projectColor: string;
}

export function TaskListItem({
  title,
  status,
  priority,
  dueDate,
  projectName,
  projectColor,
}: TaskListItemProps) {
  const priorityStyle = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.none;
  const isOverdue = dueDate && new Date(dueDate) < new Date();

  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#e9ecef] last:border-0">
      {/* Project color dot */}
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: projectColor }}
        aria-hidden="true"
      />

      {/* Title + project */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#1a1a2e] truncate">{title}</p>
        <p className="text-xs text-[#adb5bd] mt-0.5">{projectName}</p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {priority !== "none" && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${priorityStyle}`}>
            {priority}
          </span>
        )}

        <span className="text-xs text-[#6c757d] capitalize">
          {STATUS_LABELS[status] ?? status}
        </span>

        {dueDate && (
          <span
            className={`text-xs ${
              isOverdue ? "text-[#dc2626] font-medium" : "text-[#adb5bd]"
            }`}
          >
            {dueDate}
          </span>
        )}
      </div>
    </div>
  );
}
