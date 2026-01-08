"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import UrlInput from "@/components/UrlInput";
import Summary from "@/components/Summary";
import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import {
  HistoryEntry,
  getHistory,
  saveToHistory,
  deleteFromHistory,
  isUrlInHistory,
} from "@/lib/storage";

interface SummaryItem {
  id: string;
  titles: string[];
  summary: string;
  timestamp: number;
  isError?: boolean;
  urls?: string[];
}

interface ToastState {
  message: string;
  type: "error" | "success";
}

export default function Home() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pendingUrls, setPendingUrls] = useState<string[] | null>(null);

  // Load history on mount
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const showToast = (message: string, type: "error" | "success") => {
    setToast({ message, type });
  };

  const handleSubmit = useCallback(
    async (urls: string[]) => {
      // Check for duplicates in current session
      const existingUrls = summaries.flatMap((s) => s.urls || []);
      const duplicates = urls.filter(
        (url) => existingUrls.includes(url) || isUrlInHistory(url)
      );

      if (duplicates.length > 0) {
        showToast("This video has already been summarized", "error");
        return;
      }

      setLoading(true);
      setPendingUrls(urls);

      try {
        const response = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Show error summary with retry option
          setSummaries((prev) => [
            ...prev,
            {
              id: `error-${Date.now()}`,
              titles: ["Error"],
              summary: data.error || "Failed to generate summary",
              timestamp: Date.now(),
              isError: true,
              urls,
            },
          ]);

          if (data.skipped && data.skipped.length > 0) {
            showToast(
              `Skipped ${data.skipped.length} video(s) without captions`,
              "error"
            );
          }
        } else {
          // Success - add summary and save to history
          const titles = data.videos.map(
            (v: { title: string }) => v.title
          );
          const newSummary: SummaryItem = {
            id: `summary-${Date.now()}`,
            titles,
            summary: data.summary,
            timestamp: Date.now(),
            urls,
          };

          setSummaries((prev) => [...prev, newSummary]);

          // Save to history
          const entry = saveToHistory(urls, titles, data.summary);
          setHistory((prev) => [entry, ...prev]);

          // Notify about skipped videos
          if (data.skipped && data.skipped.length > 0) {
            showToast(
              `Skipped ${data.skipped.length} video(s): ${data.skipped[0].reason}`,
              "error"
            );
          }
        }
      } catch (error) {
        setSummaries((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            titles: ["Error"],
            summary: "Network error. Please check your connection.",
            timestamp: Date.now(),
            isError: true,
            urls,
          },
        ]);
      } finally {
        setLoading(false);
        setPendingUrls(null);
      }
    },
    [summaries]
  );

  const handleRetry = (urls: string[]) => {
    handleSubmit(urls);
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    // Add the selected history entry to current view
    const exists = summaries.some(
      (s) => s.summary === entry.summary && s.timestamp === entry.timestamp
    );

    if (!exists) {
      setSummaries((prev) => [
        ...prev,
        {
          id: entry.id,
          titles: entry.titles,
          summary: entry.summary,
          timestamp: entry.timestamp,
          urls: entry.urls,
        },
      ]);
    }
  };

  const handleHistoryDelete = (id: string) => {
    deleteFromHistory(id);
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
  };

  const existingUrls = summaries.flatMap((s) => s.urls || []);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar
        history={history}
        onSelect={handleHistorySelect}
        onDelete={handleHistoryDelete}
      />

      {/* Main content */}
      <main className="flex flex-1 flex-col">
        {/* Header with title */}
        <div className="border-b border-[var(--border)] bg-[var(--background)] p-4">
          <div className="mx-auto max-w-3xl mb-4 flex items-center justify-center gap-3">
            <svg
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="2" y="2" width="20" height="20" rx="4" fill="#3b82f6"/>
              <path d="M10 7L17 12L10 17V7Z" fill="white"/>
            </svg>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Summarizer</h1>
          </div>
          <UrlInput
            onSubmit={handleSubmit}
            disabled={loading}
            existingUrls={existingUrls}
          />
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-4">
          {summaries.length === 0 && !loading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-[var(--muted)]">
                Paste a YouTube URL to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {summaries.map((item) => (
                <Summary
                  key={item.id}
                  titles={item.titles}
                  urls={item.urls || []}
                  summary={item.summary}
                  timestamp={item.timestamp}
                  isError={item.isError}
                  onRetry={
                    item.isError && item.urls
                      ? () => handleRetry(item.urls!)
                      : undefined
                  }
                />
              ))}
              {loading && <Spinner />}
            </div>
          )}
        </div>
      </main>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
