"use client";

import { HistoryEntry, getEntryDisplayTitle } from "@/lib/storage";

interface SidebarProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({
  history,
  onSelect,
  onDelete,
}: SidebarProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-[var(--border)] bg-[var(--background)]">
      <div className="border-b border-[var(--border)] p-4">
        <h2 className="font-semibold text-[var(--foreground)]">History</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="p-4 text-sm text-[var(--muted)]">
            No summaries yet
          </div>
        ) : (
          <ul>
            {history.map((entry) => (
              <li
                key={entry.id}
                className="group relative border-b border-[var(--border)]"
              >
                <button
                  onClick={() => onSelect(entry)}
                  className="w-full p-3 text-left hover:bg-[var(--card-hover)]"
                >
                  <div className="truncate text-sm font-medium text-[var(--foreground)]">
                    {getEntryDisplayTitle(entry)}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {formatDate(entry.timestamp)}
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(entry.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--muted)] opacity-0 hover:bg-[var(--card)] hover:text-[var(--error)] group-hover:opacity-100"
                  aria-label="Delete entry"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
