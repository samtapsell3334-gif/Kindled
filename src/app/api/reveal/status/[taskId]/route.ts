import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { syncRevealTask } from "@/lib/ai-reveal";
import { handleApiError, AppError } from "@/lib/errors";

/**
 * GET /api/reveal/status/:taskId
 *
 * Polls the AI provider for the current generation status and reflects
 * the result back to the UI. The frontend should poll every 4–6 seconds
 * while status is PENDING or PROCESSING, then stop when COMPLETED or FAILED.
 *
 * Response shape:
 *   { data: { status, videoUrl, error } }
 *
 * status values: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
 * videoUrl: string | null  — populated only when status = COMPLETED
 * error:    string | null  — populated only when status = FAILED
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params;
    if (!taskId) throw new AppError("Missing taskId.", 400);

    const result = await syncRevealTask(taskId);

    // Add Cache-Control so CDN / Next.js edge doesn't cache the in-flight response.
    return NextResponse.json(
      { data: result },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (err) {
    return handleApiError(err);
  }
}
