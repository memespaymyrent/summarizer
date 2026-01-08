"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface SummaryProps {
  titles: string[];
  urls: string[];
  summary: string;
  timestamp: number;
  onRetry?: () => void;
  isError?: boolean;
}

export default function Summary({
  titles,
  urls,
  summary,
  timestamp,
  onRetry,
  isError,
}: SummaryProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const displayTitle =
    titles.length === 1
      ? titles[0]
      : `${titles[0]} (+${titles.length - 1} more)`;

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg bg-[var(--card)] p-6">
        <div className="text-[var(--error)]">{summary}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 rounded-lg bg-[var(--primary)] px-4 py-2 text-white hover:bg-[var(--primary-hover)]"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl rounded-lg bg-[var(--card)] p-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-medium text-[var(--foreground)]">{displayTitle}</h3>
          <span className="text-sm text-[var(--muted)]">
            {formatTime(timestamp)}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-1 text-sm text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]"
          aria-label="Copy summary"
        >
          {copied ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Summary text */}
      <div className="prose prose-invert prose-sm max-w-none text-[var(--foreground)]">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="mb-3 list-disc pl-5">{children}</ul>,
            ol: ({ children }) => <ol className="mb-3 list-decimal pl-5">{children}</ol>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold text-[var(--foreground)]">{children}</strong>,
            h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
            h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h3>,
          }}
        >
          {summary}
        </ReactMarkdown>
      </div>

      {/* Source videos */}
      {urls.length > 0 && (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <p className="text-xs text-[var(--muted)] mb-2">Sources:</p>
          <div className="flex flex-wrap gap-2">
            {urls.map((url, index) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--primary)] hover:underline"
              >
                {titles[index] || `Video ${index + 1}`}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
