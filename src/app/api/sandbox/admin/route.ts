import { NextResponse } from "next/server";
import { listEvents, resetSandbox, ensureHydrated, flushPersist } from "@/lib/sandbox/store";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Sandbox admin (WS-A/WS-F): shared-secret gate (SANDBOX_ADMIN_SECRET, dev fallback).
 * GET  ?secret=…            → the raw event log (feeds the business dashboard)
 * POST {secret, action:"reset"} → wipe + restore seed state exactly
 * TODO-FOUNDER: real auth before anything beyond a closed test.
 */
const SECRET = process.env.SANDBOX_ADMIN_SECRET ?? "kindled-admin";

export async function GET(request: Request): Promise<NextResponse> {
  await ensureHydrated();
  const rl = rateLimit(request, "sandbox-admin", { max: 20, windowMs: 10 * 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== SECRET) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  return NextResponse.json({ events: listEvents() });
}

export async function POST(request: Request): Promise<NextResponse> {
  await ensureHydrated();
  const rl = rateLimit(request, "sandbox-admin", { max: 20, windowMs: 10 * 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  let body: { secret?: string; action?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    await flushPersist();
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }
  if (body.secret !== SECRET) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  if (body.action === "reset") {
    resetSandbox();
    await flushPersist();
    return NextResponse.json({ ok: true, reset: true });
  }
  await flushPersist();
  return NextResponse.json({ error: "Unknown action" }, { status: 422 });
}
