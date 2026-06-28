/**
 * AI Reveal Service
 *
 * Submits a video generation job to the configured provider (Kling by default)
 * and persists a RevealTask row so the frontend can poll for completion.
 *
 * Environment variables required (server-side only):
 *   KLING_API_KEY   — Kling AI API key from platform.klingai.com
 *   KLING_API_BASE  — optional override, defaults to https://api.klingai.com
 *
 * To swap to Runway, set REVEAL_PROVIDER=runway and RUNWAY_API_KEY.
 */

import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";

// RevealTask model exists in schema.prisma but the generated Prisma client won't
// know about it until `prisma migrate dev` has been run against a live database.
// We declare a minimal typed shim here so the service compiles correctly; at
// runtime Prisma's dynamic client will resolve the model.
interface RevealTaskDelegate {
  create(args: {
    data: {
      potId: string; providerTaskId: string; provider: string;
      prompt: string; status: string;
    };
    select: { id: boolean; providerTaskId: boolean; provider: boolean };
  }): Promise<{ id: string; providerTaskId: string; provider: string }>;
  findUnique(args: {
    where: { id: string };
    select: Record<string, boolean>;
  }): Promise<{
    id: string; potId: string; providerTaskId: string; provider: string;
    status: string; videoUrl: string | null; errorPayload: string | null;
  } | null>;
  update(args: {
    where: { id: string };
    data: Record<string, string | null>;
  }): Promise<unknown>;
}

const revealTaskDelegate = (db as unknown as { revealTask: RevealTaskDelegate }).revealTask;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PotRevealInput {
  potId: string;
  title: string;
  /** Total amount raised, in pounds */
  amountRaised: number;
  /** Number of contributors */
  contributorCount: number;
  /** Primary item name from the pot, if available */
  primaryItem?: string;
  /** Item category for tone — e.g. "ELECTRONICS", "TRAVEL" */
  category?: string;
}

export interface RevealTaskResult {
  taskId: string;
  providerTaskId: string;
  provider: string;
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(input: PotRevealInput): string {
  const item = input.primaryItem ?? input.title;
  const amount = `£${input.amountRaised.toFixed(0)}`;
  const people = input.contributorCount;

  // Category-tuned hero object — what literally explodes out of the box.
  const categoryHero: Record<string, string> = {
    ELECTRONICS: "a glowing tech gadget",
    TRAVEL: "a sun-soaked dream destination with palm trees and a plane ticket",
    EXPERIENCES: "tickets and fireworks for an unforgettable experience",
    HOME_GARDEN: "a cosy dream-home upgrade",
    SPORTS_OUTDOORS: "sports gear bursting into an epic outdoor adventure",
    FASHION: "a head-turning fashion statement",
    TOYS_GAMES: "an avalanche of toys and games",
  };
  const hero = categoryHero[input.category ?? ""] ?? "the dream gift";

  // Viral, creator-style social reveal: punchy hook, explosive payoff, feel-good
  // ending built to be screenshotted and shared. Vertical 9:16, energetic.
  return [
    `Vertical 9:16 social-media reveal video, energetic content-creator style, designed to go viral.`,
    `Opens on a teasing close-up of a wrapped gift box that suddenly bursts open in an explosion of confetti, sparks and golden light, revealing ${hero} representing "${item}".`,
    `Bold kinetic typography slams onto the screen: "${amount} RAISED" then "by ${people} people who love you", with playful pop-style captions and emoji-free motion graphics.`,
    `Quick punchy cuts, screen shakes on the beat, rising celebratory energy, hearts and stars flying, a wholesome feel-good payoff that makes you smile.`,
    `Bright, saturated, joyful colour grade, warm amber and pink and gold tones, lens flares, high frame rate, polished and shareable.`,
  ].join(" ");
}

// ─── Provider: Kling ──────────────────────────────────────────────────────────

async function submitKling(prompt: string): Promise<string> {
  const apiKey = process.env.KLING_API_KEY;
  if (!apiKey) throw new AppError("KLING_API_KEY is not configured.", 500);

  const base = process.env.KLING_API_BASE ?? "https://api.klingai.com";

  const res = await fetch(`${base}/v1/videos/text2video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "kling-v1",
      prompt,
      negative_prompt: "blurry, low quality, text overlay errors, watermark",
      cfg_scale: 0.5,
      mode: "std",
      duration: "5",
      aspect_ratio: "9:16",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new AppError(`Kling submission failed (${res.status}): ${body}`, 502);
  }

  const json = (await res.json()) as { data?: { task_id?: string } };
  const providerTaskId = json.data?.task_id;
  if (!providerTaskId) throw new AppError("Kling response missing task_id.", 502);

  return providerTaskId;
}

// ─── Provider: Runway ─────────────────────────────────────────────────────────

async function submitRunway(prompt: string): Promise<string> {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) throw new AppError("RUNWAY_API_KEY is not configured.", 500);

  const res = await fetch("https://api.runwayml.com/v1/image_to_video", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Runway-Version": "2024-11-06",
    },
    body: JSON.stringify({
      promptText: prompt,
      model: "gen3a_turbo",
      duration: 5,
      ratio: "768:1280",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new AppError(`Runway submission failed (${res.status}): ${body}`, 502);
  }

  const json = (await res.json()) as { id?: string };
  const providerTaskId = json.id;
  if (!providerTaskId) throw new AppError("Runway response missing task id.", 502);

  return providerTaskId;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Submits a video generation job for `pot` and saves a RevealTask row.
 * Returns the internal task ID for the frontend to poll against.
 */
export async function requestRevealVideo(
  input: PotRevealInput,
): Promise<RevealTaskResult> {
  const provider = (process.env.REVEAL_PROVIDER ?? "kling").toLowerCase();
  const prompt = buildPrompt(input);

  let providerTaskId: string;
  if (provider === "runway") {
    providerTaskId = await submitRunway(prompt);
  } else {
    providerTaskId = await submitKling(prompt);
  }

  const task = await revealTaskDelegate.create({
    data: {
      potId: input.potId,
      providerTaskId,
      provider,
      prompt,
      status: "PENDING",
    },
    select: { id: true, providerTaskId: true, provider: true },
  });

  return {
    taskId: task.id,
    providerTaskId: task.providerTaskId,
    provider: task.provider,
  };
}

// ─── Status polling helpers ───────────────────────────────────────────────────

export interface RevealPollResult {
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  videoUrl: string | null;
  error: string | null;
}

async function pollKling(providerTaskId: string): Promise<RevealPollResult> {
  const apiKey = process.env.KLING_API_KEY!;
  const base = process.env.KLING_API_BASE ?? "https://api.klingai.com";

  const res = await fetch(`${base}/v1/videos/text2video/${providerTaskId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new AppError(`Kling poll failed (${res.status})`, 502);

  const json = (await res.json()) as {
    data?: {
      task_status?: string;
      task_result?: { videos?: { url?: string }[] };
    };
  };

  const providerStatus = json.data?.task_status ?? "";
  const videoUrl = json.data?.task_result?.videos?.[0]?.url ?? null;

  const statusMap: Record<string, RevealPollResult["status"]> = {
    submitted: "PENDING",
    processing: "PROCESSING",
    succeed:    "COMPLETED",
    failed:     "FAILED",
  };

  return {
    status: statusMap[providerStatus] ?? "PENDING",
    videoUrl,
    error: providerStatus === "failed" ? "Provider reported failure" : null,
  };
}

async function pollRunway(providerTaskId: string): Promise<RevealPollResult> {
  const apiKey = process.env.RUNWAY_API_KEY!;

  const res = await fetch(`https://api.runwayml.com/v1/tasks/${providerTaskId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Runway-Version": "2024-11-06",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new AppError(`Runway poll failed (${res.status})`, 502);

  const json = (await res.json()) as {
    status?: string;
    output?: string[];
    failure?: string;
  };

  const statusMap: Record<string, RevealPollResult["status"]> = {
    PENDING:   "PENDING",
    RUNNING:   "PROCESSING",
    SUCCEEDED: "COMPLETED",
    FAILED:    "FAILED",
    CANCELLED: "FAILED",
  };

  return {
    status: statusMap[json.status ?? ""] ?? "PENDING",
    videoUrl: json.output?.[0] ?? null,
    error: json.failure ?? null,
  };
}

/**
 * Polls the provider for the current task status, updates the DB row,
 * and — on COMPLETED — writes `revealVideoUrl` back to the Pot record.
 */
export async function syncRevealTask(taskId: string): Promise<RevealPollResult> {
  const task = await revealTaskDelegate.findUnique({
    where: { id: taskId },
    select: { id: true, potId: true, providerTaskId: true, provider: true, status: true },
  });

  if (!task) throw new AppError("RevealTask not found.", 404);

  // Don't re-poll terminal states.
  if (task.status === "COMPLETED" || task.status === "FAILED") {
    const final = await revealTaskDelegate.findUnique({
      where: { id: taskId },
      select: { status: true, videoUrl: true, errorPayload: true },
    });
    return {
      status: final!.status as RevealPollResult["status"],
      videoUrl: final!.videoUrl,
      error: final!.errorPayload,
    };
  }

  const result =
    task.provider === "runway"
      ? await pollRunway(task.providerTaskId)
      : await pollKling(task.providerTaskId);

  if (result.status === "COMPLETED" && result.videoUrl) {
    // Sequential writes — $transaction requires PrismaPromise which our shim can't guarantee.
    // Both writes are idempotent so the race window is acceptable.
    await revealTaskDelegate.update({
      where: { id: taskId },
      data: { status: "COMPLETED", videoUrl: result.videoUrl },
    });
    // revealVideoUrl is not yet in the Prisma-generated types; cast via the
    // same pattern used in the request route's dbExt shim.
    await (db.pot as unknown as {
      update(a: { where: { id: string }; data: { revealVideoUrl: string } }): Promise<unknown>;
    }).update({
      where: { id: task.potId },
      data: { revealVideoUrl: result.videoUrl },
    });
  } else if (result.status === "FAILED") {
    await revealTaskDelegate.update({
      where: { id: taskId },
      data: { status: "FAILED", errorPayload: result.error },
    });
  } else {
    // Map PENDING/PROCESSING to schema enum
    const nextStatus = result.status === "PROCESSING" ? "PROCESSING" : "PENDING";
    await revealTaskDelegate.update({
      where: { id: taskId },
      data: { status: nextStatus },
    });
  }

  return result;
}
