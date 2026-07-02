/**
 * Waitlist persistence (v9.2). Signups are upserted on email (re-registering
 * is a silent success — no "already subscribed" leak), and a missing or
 * failing database never breaks the user-facing request: the CTA must always
 * feel like it worked, and the error lands in the server log for the founder.
 */

export async function saveWaitlistSignup(email: string, source: string): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.warn("[waitlist] DATABASE_URL not set — signup not persisted:", email);
    return;
  }
  try {
    const { db } = await import("@/lib/db");
    await db.waitlistSignup.upsert({
      where: { email: email.toLowerCase() },
      create: { email: email.toLowerCase(), source },
      update: {}, // duplicate: keep the original source + timestamp
    });
  } catch (e) {
    console.error("[waitlist] persist failed:", e);
  }
}
