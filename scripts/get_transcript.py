#!/usr/bin/env python3
"""
Fetch YouTube transcript and output as JSON.
Usage: python3 get_transcript.py VIDEO_ID
"""
import sys
import json
import warnings

# Suppress SSL warnings
warnings.filterwarnings("ignore")

from youtube_transcript_api import YouTubeTranscriptApi

def get_transcript(video_id: str) -> dict:
    try:
        api = YouTubeTranscriptApi()
        transcript = api.fetch(video_id)
        segments = list(transcript)

        # Combine all text
        full_text = " ".join([s.text for s in segments])

        return {
            "success": True,
            "transcript": full_text,
            "segments": len(segments)
        }
    except Exception as e:
        error_msg = str(e)
        if "No transcripts were found" in error_msg or "TranscriptsDisabled" in str(type(e).__name__):
            error_msg = "No captions available for this video"
        elif "VideoUnavailable" in str(type(e).__name__):
            error_msg = "Video not found or unavailable"

        return {
            "success": False,
            "error": error_msg
        }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"success": False, "error": "Usage: get_transcript.py VIDEO_ID"}))
        sys.exit(1)

    video_id = sys.argv[1]
    result = get_transcript(video_id)
    print(json.dumps(result))
