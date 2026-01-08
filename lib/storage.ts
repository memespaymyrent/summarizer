export interface HistoryEntry {
  id: string;
  urls: string[];
  titles: string[];
  summary: string;
  timestamp: number;
}

const STORAGE_KEY = "summarizer_history";

// Generate a unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get all history entries
export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Save a new entry to history
export function saveToHistory(
  urls: string[],
  titles: string[],
  summary: string
): HistoryEntry {
  const entry: HistoryEntry = {
    id: generateId(),
    urls,
    titles,
    summary,
    timestamp: Date.now(),
  };

  const history = getHistory();
  history.unshift(entry); // Add to beginning

  // Keep only last 50 entries to prevent localStorage from getting too large
  const trimmed = history.slice(0, 50);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage might be full, remove oldest entries
    const smaller = trimmed.slice(0, 25);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(smaller));
  }

  return entry;
}

// Delete a specific entry from history
export function deleteFromHistory(id: string): void {
  const history = getHistory();
  const filtered = history.filter((entry) => entry.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

// Check if a URL was already summarized (for duplicate detection)
export function isUrlInHistory(url: string): boolean {
  const history = getHistory();
  return history.some((entry) => entry.urls.includes(url));
}

// Get display title for a history entry (first video title or count)
export function getEntryDisplayTitle(entry: HistoryEntry): string {
  if (entry.titles.length === 1) {
    return entry.titles[0];
  }
  return `${entry.titles[0]} (+${entry.titles.length - 1} more)`;
}
