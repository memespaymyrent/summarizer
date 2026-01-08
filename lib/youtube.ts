import { YtTranscript } from "yt-transcript";

export interface VideoInfo {
  id: string;
  url: string;
  title: string;
  transcript: string;
}

export interface TranscriptResult {
  success: boolean;
  video?: VideoInfo;
  error?: string;
}

// Extract video ID from various YouTube URL formats
export function extractVideoId(url: string): string | null {
  const patterns = [
    // Standard watch URL: youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // Short URL: youtu.be/VIDEO_ID
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // Embed URL: youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    // Shorts URL: youtube.com/shorts/VIDEO_ID
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    // Live URL: youtube.com/live/VIDEO_ID
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    // Just the video ID
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Validate if a string is a valid YouTube URL
export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}

// Fetch video title using oEmbed API (no API key needed)
async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (!response.ok) {
      return `Video ${videoId}`;
    }
    const data = await response.json();
    return data.title || `Video ${videoId}`;
  } catch {
    return `Video ${videoId}`;
  }
}

// Fetch transcript using yt-transcript library
async function fetchTranscriptViaLib(
  videoId: string
): Promise<{ success: boolean; transcript?: string; error?: string }> {
  try {
    const ytTranscript = new YtTranscript({ videoId });
    const transcript = await ytTranscript.getTranscript();

    if (!transcript || transcript.length === 0) {
      return {
        success: false,
        error: "No captions available for this video",
      };
    }

    // Combine all text segments, filtering out any undefined/null text
    const fullText = transcript
      .map((segment) => segment?.text ?? "")
      .filter((text) => text.length > 0)
      .join(" ");

    if (!fullText) {
      return {
        success: false,
        error: "No captions available for this video",
      };
    }

    return {
      success: true,
      transcript: fullText,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch transcript";

    // Provide friendlier error messages
    if (message.includes("Video unavailable") || message.includes("private")) {
      return { success: false, error: "Video not found or unavailable" };
    }
    if (message.includes("No captions") || message.includes("transcript")) {
      return { success: false, error: "No captions available for this video" };
    }

    return {
      success: false,
      error: message,
    };
  }
}

// Fetch transcript for a single video
export async function fetchTranscript(url: string): Promise<TranscriptResult> {
  const videoId = extractVideoId(url);

  if (!videoId) {
    return {
      success: false,
      error: "Invalid YouTube URL",
    };
  }

  try {
    // Fetch title and transcript in parallel
    const [title, transcriptResult] = await Promise.all([
      fetchVideoTitle(videoId),
      fetchTranscriptViaLib(videoId),
    ]);

    if (!transcriptResult.success) {
      return {
        success: false,
        error: transcriptResult.error || "Failed to fetch transcript",
      };
    }

    return {
      success: true,
      video: {
        id: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title,
        transcript: transcriptResult.transcript || "",
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch transcript";
    return {
      success: false,
      error: message,
    };
  }
}

// Fetch transcripts for multiple videos in parallel
export async function fetchMultipleTranscripts(
  urls: string[]
): Promise<TranscriptResult[]> {
  return Promise.all(urls.map((url) => fetchTranscript(url)));
}
