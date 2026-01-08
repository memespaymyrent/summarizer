"use client";

import { useState, KeyboardEvent } from "react";

interface UrlInputProps {
  onSubmit: (urls: string[]) => void;
  disabled?: boolean;
  existingUrls?: string[];
}

export default function UrlInput({
  onSubmit,
  disabled,
  existingUrls = [],
}: UrlInputProps) {
  const [urls, setUrls] = useState<string[]>([""]);
  const maxUrls = 5;

  const handleChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const addUrl = () => {
    if (urls.length < maxUrls) {
      setUrls([...urls, ""]);
    }
  };

  const removeUrl = (index: number) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      setUrls(newUrls);
    } else {
      setUrls([""]);
    }
  };

  const handleSubmit = () => {
    const validUrls = urls.map((u) => u.trim()).filter((u) => u.length > 0);
    if (validUrls.length > 0 && !disabled) {
      onSubmit(validUrls);
      setUrls([""]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !disabled) {
      handleSubmit();
    }
  };

  const filledCount = urls.filter((u) => u.trim().length > 0).length;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 rounded-lg bg-[var(--card)] p-4">
      {urls.map((url, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste YouTube URL"
            disabled={disabled}
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--primary)] focus:outline-none disabled:opacity-50"
          />
          {urls.length > 1 && (
            <button
              onClick={() => removeUrl(index)}
              disabled={disabled}
              className="rounded p-2 text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)] disabled:opacity-50"
              aria-label="Remove URL"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      ))}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {urls.length < maxUrls && (
            <button
              onClick={addUrl}
              disabled={disabled}
              className="flex items-center gap-1 rounded px-3 py-1 text-sm text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)] disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add URL
            </button>
          )}
          <span className="text-sm text-[var(--muted)]">
            {filledCount}/{maxUrls} videos
          </span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={disabled || filledCount === 0}
          className="rounded-lg bg-[var(--primary)] px-6 py-2 font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Summarize
        </button>
      </div>
    </div>
  );
}
