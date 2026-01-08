import { NextRequest, NextResponse } from "next/server";
import {
  fetchMultipleTranscripts,
  isValidYouTubeUrl,
  VideoInfo,
} from "@/lib/youtube";
import { generateSummary } from "@/lib/claude";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { urls } = body as { urls: string[] };

    // Validate input
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "Please provide at least one YouTube URL" },
        { status: 400 }
      );
    }

    if (urls.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 videos allowed per request" },
        { status: 400 }
      );
    }

    // Validate all URLs
    const invalidUrls = urls.filter((url) => !isValidYouTubeUrl(url));
    if (invalidUrls.length > 0) {
      return NextResponse.json(
        { error: `Invalid YouTube URL: ${invalidUrls[0]}` },
        { status: 400 }
      );
    }

    // Fetch transcripts for all videos
    const results = await fetchMultipleTranscripts(urls);

    // Separate successful and failed fetches
    const successful: VideoInfo[] = [];
    const skipped: { url: string; reason: string }[] = [];

    results.forEach((result, index) => {
      if (result.success && result.video) {
        successful.push(result.video);
      } else {
        skipped.push({
          url: urls[index],
          reason: result.error || "Unknown error",
        });
      }
    });

    // If all videos failed, return error
    if (successful.length === 0) {
      return NextResponse.json(
        {
          error: "Could not fetch transcripts for any of the provided videos",
          skipped,
        },
        { status: 400 }
      );
    }

    // Generate summary
    const summaryResult = await generateSummary(successful);

    if (!summaryResult.success) {
      return NextResponse.json(
        { error: summaryResult.error || "Failed to generate summary" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      summary: summaryResult.summary,
      videos: successful.map((v) => ({ id: v.id, title: v.title, url: v.url })),
      skipped: skipped.length > 0 ? skipped : undefined,
    });
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
