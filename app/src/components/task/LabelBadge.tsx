interface LabelBadgeProps {
  name: string;
  color: string;
}

export function LabelBadge({ name, color }: LabelBadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  );
}
