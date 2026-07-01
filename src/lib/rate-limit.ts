/**
 * Minimal in-memory rate limiter for the gated endpoints (investor PIN, sandbox
 * admin). Keyed by client IP (x-forwarded-for on Vercel). Serverless caveat,
 * stated honestly: the map is per-lambda, so limits reset on cold starts — this
 * raises the cost of casual brute-forcing rather than guaranteeing a global
 * ceiling. A durable store (once Postgres lands) upgrades it to a hard limit.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  request: Request,
  scope: string,
  { max, windowMs }: { max: number; windowMs: number },
): { ok: boolean; retryAfterSec: number } {
  const ip = (request.headers.get("x-forwarded-for") ?? "local").split(",")[0]!.trim();
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  b.count++;
  if (b.count > max) return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  return { ok: true, retryAfterSec: 0 };
}
