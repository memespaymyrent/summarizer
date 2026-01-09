import { getSubtitles, getVideoDetails } from "youtube-caption-extractor";

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
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/|^)([a-zA-Z0-9_-]{11})(?:$|[?&])/
  );
  return match ? match[1] : null;
}

// Validate if a string is a valid YouTube URL
export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}

// Fetch transcript for a single video
export async function fetchTranscript(url: string): Promise<TranscriptResult> {
  const videoId = extractVideoId(url);

  if (!videoId) {
    return { success: false, error: "Invalid YouTube URL" };
  }

  try {
    const [subtitles, videoDetails] = await Promise.all([
      getSubtitles({ videoID: videoId, lang: "en" }),
      getVideoDetails({ videoID: videoId }).catch(() => null),
    ]);

    if (!subtitles || subtitles.length === 0) {
      return { success: false, error: "No captions available for this video" };
    }

    const transcript = subtitles
      .map((sub) => sub.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (!transcript) {
      return { success: false, error: "No captions available for this video" };
    }

    return {
      success: true,
      video: {
        id: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title: videoDetails?.title || `Video ${videoId}`,
        transcript,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch transcript",
    };
  }
}

// Fetch transcripts for multiple videos in parallel
export async function fetchMultipleTranscripts(urls: string[]): Promise<TranscriptResult[]> {
  return Promise.all(urls.map(fetchTranscript));
}
