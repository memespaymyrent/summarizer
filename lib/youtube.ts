import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

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

// Fetch transcript using Python script
async function fetchTranscriptViaPython(
  videoId: string
): Promise<{ success: boolean; transcript?: string; error?: string }> {
  const scriptPath = path.join(process.cwd(), "scripts", "get_transcript.py");

  try {
    const { stdout, stderr } = await execAsync(
      `python3 "${scriptPath}" "${videoId}"`,
      { timeout: 30000 }
    );

    if (stderr && !stderr.includes("Warning")) {
      console.error("Python script stderr:", stderr);
    }

    const result = JSON.parse(stdout.trim());
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch transcript";
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
      fetchTranscriptViaPython(videoId),
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
