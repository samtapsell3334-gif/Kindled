/**
 * Motion tokens — the single source of truth for Kindled's "Monochrome Luxe"
 * animation language. Every Framer Motion transition should pull from here so the
 * whole app shares one Apple-grade easing curve and cadence.
 */

import type { Transition, Variants } from "framer-motion";

/** The signature high-end easing curve (Apple / premium SaaS feel). */
export const LUX_EASE = [0.22, 1, 0.36, 1] as const;

/** Standard duration for deliberate, non-snappy motion. */
export const LUX_DURATION = 0.6;

/** Drop-in transition for almost everything. */
export const luxTransition: Transition = { duration: LUX_DURATION, ease: LUX_EASE };

/** A slightly quicker variant for micro-interactions (taps, toggles). */
export const luxTransitionFast: Transition = { duration: 0.32, ease: LUX_EASE };

/**
 * Reveal-on-scroll: a slow, deliberate "glide" up into place. Pair with
 * `whileInView` + `viewport={{ once: true }}`.
 */
export const glideUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: luxTransition },
};

/** Parent container that staggers its children's glide-in. */
export const staggerParent = (stagger = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

/** Props for a standalone reveal element (no parent orchestration). */
export const revealOnScroll = {
  initial: "hidden" as const,
  whileInView: "show" as const,
  viewport: { once: true, margin: "0px 0px -60px 0px" },
  variants: glideUp,
};

// ─── Vibrant Heritage — playful, tactile motion ──────────────────────────────

/** Bouncy spring for "pop" appearances and button presses. */
export const VH_BOUNCE: Transition = { type: "spring", stiffness: 480, damping: 16, mass: 0.7 };

/** Pop-in on appear — element scales up past 1 then settles (overshoot). */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: VH_BOUNCE },
};

/** Drop-in props for a button that bounces on press. */
export const bounceTap = { whileTap: { scale: 0.92 }, transition: VH_BOUNCE } as const;
