import Anthropic from "@anthropic-ai/sdk";
import { VideoInfo } from "./youtube";

const anthropic = new Anthropic();

const API_ERRORS: Record<number, string> = {
  429: "API quota exceeded - time to add more credits at console.anthropic.com",
  401: "Invalid API key - check your ANTHROPIC_API_KEY",
  400: "Bad request - transcript may be too long",
};

export interface SummaryResult {
  success: boolean;
  summary?: string;
  error?: string;
}

export async function generateSummary(videos: VideoInfo[]): Promise<SummaryResult> {
  if (videos.length === 0) {
    return { success: false, error: "No videos to summarize" };
  }

  try {
    const videoList = videos
      .map((v, i) => `[Video ${i + 1}: "${v.title}"]\n${v.transcript}`)
      .join("\n\n---\n\n");

    const content = `Here ${videos.length === 1 ? "is the transcript from a YouTube video" : `are transcripts from ${videos.length} YouTube videos`}:

${videoList}

Please provide a concise summary. Focus on the key points and main takeaways.${videos.length > 1 ? " At the end, list the source videos." : ""}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { success: false, error: "No text in response" };
    }

    return { success: true, summary: textBlock.text };
  } catch (error) {
    if (error instanceof Anthropic.APIError && API_ERRORS[error.status]) {
      return { success: false, error: API_ERRORS[error.status] };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate summary",
    };
  }
}
