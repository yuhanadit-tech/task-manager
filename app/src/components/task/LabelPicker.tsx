"use client";

import { LabelBadge } from "./LabelBadge";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface LabelPickerProps {
  labels: Label[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function LabelPicker({ labels, selectedIds, onChange }: LabelPickerProps) {
  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  if (labels.length === 0) {
    return <p className="text-xs text-[#adb5bd]">No labels for this project</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <button
          key={label.id}
          type="button"
          aria-pressed={selectedIds.includes(label.id)}
          onClick={() => toggle(label.id)}
          className={`rounded-full border-2 transition-opacity ${
            selectedIds.includes(label.id)
              ? "opacity-100 border-[#1a1a2e]"
              : "opacity-60 border-transparent hover:opacity-80"
          }`}
        >
          <LabelBadge name={label.name} color={label.color} />
        </button>
      ))}
    </div>
  );
}
