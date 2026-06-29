"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { glideUp, staggerParent, luxTransition, LUX_EASE } from "@/lib/motion";

/**
 * Reveal — a single element that glides up into view on scroll with the
 * Monochrome-Luxe easing. Deliberate, never snappy.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: { children: ReactNode; className?: string; delay?: number; as?: "div" | "section" | "li" | "article" }) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ ...luxTransition, delay }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * RevealGroup — staggers a set of children into view with the "Staggered Glide"
 * effect. Wrap each child in <RevealItem>.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
}: { children: ReactNode; className?: string; stagger?: number }) {
  return (
    <motion.div
      className={className}
      variants={staggerParent(stagger)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={glideUp}>
      {children}
    </motion.div>
  );
}

export { LUX_EASE };
