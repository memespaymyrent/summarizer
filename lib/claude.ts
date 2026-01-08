import Anthropic from "@anthropic-ai/sdk";
import { VideoInfo } from "./youtube";

const anthropic = new Anthropic();

export interface SummaryResult {
  success: boolean;
  summary?: string;
  error?: string;
}

// Generate a concise summary from video transcripts
export async function generateSummary(
  videos: VideoInfo[]
): Promise<SummaryResult> {
  if (videos.length === 0) {
    return {
      success: false,
      error: "No videos to summarize",
    };
  }

  try {
    const isSingleVideo = videos.length === 1;

    // Build the prompt based on single vs multiple videos
    let content: string;

    if (isSingleVideo) {
      content = `Here is the transcript from a YouTube video titled "${videos[0].title}":

${videos[0].transcript}

Please provide a concise summary of this video. Focus on the key points and main takeaways. Keep it brief but informative.`;
    } else {
      // Multiple videos - create a combined report
      const videoContents = videos
        .map(
          (video, index) =>
            `[Video ${index + 1}: "${video.title}"]\n${video.transcript}`
        )
        .join("\n\n---\n\n");

      content = `Here are transcripts from ${videos.length} YouTube videos:

${videoContents}

Please provide a concise, cohesive summary that combines the key information from all these videos. Focus on the main points and takeaways. At the end, list the source videos.`;
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content,
        },
      ],
    });

    // Extract text from the response
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return {
        success: false,
        error: "No text in response",
      };
    }

    return {
      success: true,
      summary: textBlock.text,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate summary";
    return {
      success: false,
      error: message,
    };
  }
}
