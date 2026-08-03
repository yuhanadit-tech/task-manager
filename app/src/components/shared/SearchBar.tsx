"use client";

import { useState, useCallback } from "react";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
}

export function SearchBar({
  placeholder = "Search…",
  onSearch,
  debounceMs = 300,
}: SearchBarProps) {
  const [value, setValue] = useState("");
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setValue(q);

      if (timer) clearTimeout(timer);
      const t = setTimeout(() => onSearch(q), debounceMs);
      setTimer(t);
    },
    [timer, onSearch, debounceMs]
  );

  return (
    <div className="relative">
      <span
        className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#adb5bd]"
        aria-hidden="true"
      >
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-md border border-[#ced4da] pl-9 pr-3 py-2 text-sm text-[#1a1a2e] placeholder-[#adb5bd] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
      />
    </div>
  );
}
