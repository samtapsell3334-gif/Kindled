import { createHmac, timingSafeEqual } from "crypto";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "";

/**
 * Verifies an HMAC-SHA256 webhook signature sent in the `x-kindling-signature` header.
 * Uses timingSafeEqual to prevent timing-based attacks.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader || !WEBHOOK_SECRET) return false;

  const expected = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(`sha256=${expected}`, "utf8");
  const receivedBuf = Buffer.from(signatureHeader, "utf8");

  if (expectedBuf.length !== receivedBuf.length) return false;

  return timingSafeEqual(expectedBuf, receivedBuf);
}
