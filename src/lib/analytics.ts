/**
 * Analytics — lightweight, privacy-respecting funnel events (P4.4).
 *
 * Consent-gated per PECR: events fire ONLY when the visitor accepted optional
 * cookies in the consent banner (`kindled-consent === "all"`); otherwise track()
 * is a silent no-op. No third-party SDK, no cookies of its own, no user ids —
 * just named funnel events with a session-scoped random id, sent via
 * sendBeacon so they survive navigation.
 *
 * Event schema (documented in REVIEW.md):
 *   { event: string, props?: Record<string, string | number | boolean>,
 *     ts: number, path: string, session: string }
 *
 * Canonical event names:
 *   waitlist_viewed · waitlist_submitted · demo_opened · pot_chip_in_started ·
 *   pot_chip_in_completed · reveal_viewed · stack_chosen · catalogue_item_circled ·
 *   parent_approval_action · would_you_rather_interaction · investor_unlocked
 */

const CONSENT_KEY = "kindled-consent";
const SESSION_KEY = "kindled-session";

function hasConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "all";
  } catch {
    return false;
  }
}

function sessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/** Fire a funnel event. No-ops server-side and without consent. Never throws. */
export function track(event: string, props?: Record<string, string | number | boolean>): void {
  if (typeof window === "undefined" || !hasConsent()) return;
  try {
    const body = JSON.stringify({
      event,
      ...(props ? { props } : {}),
      ts: Date.now(),
      path: window.location.pathname,
      session: sessionId(),
    });
    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/api/track", body);
    } else {
      void fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
    }
  } catch {
    /* analytics must never break the product */
  }
}
