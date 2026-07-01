import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

/**
 * Client-upload token broker for Kindle Memories (Vercel Blob).
 *
 * The browser calls `upload(...)` from `@vercel/blob/client`, which hits this route
 * to mint a short-lived, scoped upload token; the blob then goes browser → Blob store
 * directly (nothing transits our server). The object pathname embeds the
 * contribution_id (`kindle/{contributionId}/{id}`) so the Memory stays authorisable
 * and linkable back to its contribution.
 *
 * Requires BLOB_READ_WRITE_TOKEN (auto-injected on Vercel once a Blob store exists;
 * pull locally with `vercel env pull .env.local`). Until then the client falls back
 * to a local preview URL — see src/lib/media-service.ts.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: (pathname) =>
        Promise.resolve({
          allowedContentTypes: ["video/webm", "video/mp4", "audio/webm", "audio/mp4", "audio/ogg"],
          maximumSizeInBytes: 25 * 1024 * 1024, // Memories are ≤30s; 25MB is a generous ceiling
          addRandomSuffix: true, // unguessable URL suffix — Memories are unlisted, not enumerable
          tokenPayload: JSON.stringify({ pathname }),
        }),
      onUploadCompleted: ({ blob }) => {
        // Fires only on a public deployment (Vercel can't call back to localhost).
        // TODO(persistence): when the DB layer lands, save blob.url onto the
        // Contribution row keyed by the contribution_id in the pathname.
        void blob;
        return Promise.resolve();
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload authorisation failed." },
      { status: 400 },
    );
  }
}
