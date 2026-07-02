import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { fetchLinkPreview } from "@/lib/sandbox/link-fetch";
import { suggestionsFor } from "@/lib/sandbox/complements";

/** Paste-a-link wish builder endpoint (v11 WS-3). SSRF guards live in link-fetch. */
export async function POST(request: Request): Promise<NextResponse> {
  const rl = rateLimit(request, "link-preview", { max: 30, windowMs: 10 * 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  let body: { url?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }
  if (typeof body.url !== "string" || body.url.length > 2048) {
    return NextResponse.json({ error: "Invalid link" }, { status: 422 });
  }
  try {
    const preview = await fetchLinkPreview(body.url);
    return NextResponse.json({ preview, suggestions: suggestionsFor(preview.title) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't fetch that link" }, { status: 422 });
  }
}
