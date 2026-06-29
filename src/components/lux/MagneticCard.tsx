"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { LUX_EASE } from "@/lib/motion";

/**
 * MagneticCard — a card that subtly tilts toward the cursor and lifts 5px on
 * hover, with a soft natural drop-shadow. Pointer-driven 3D tilt; gracefully
 * inert on touch devices (no hover, no tilt). Monochrome-Luxe interaction.
 */
export function MagneticCard({
  children,
  className,
  href,
  onClick,
  rel,
  target,
  maxTilt = 6,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  rel?: string;
  target?: string;
  /** Maximum tilt in degrees at the card edges. */
  maxTilt?: number;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 220, damping: 22, mass: 0.4 });
  const sy = useSpring(py, { stiffness: 220, damping: 22, mass: 0.4 });
  const rotateY = useTransform(sx, [0, 1], [-maxTilt, maxTilt]);
  const rotateX = useTransform(sy, [0, 1], [maxTilt, -maxTilt]);

  const handleMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const reset = () => { px.set(0.5); py.set(0.5); };

  const Tag = (href ? motion.a : motion.div) as typeof motion.div;
  return (
    <Tag
      ref={ref}
      {...(href ? { href, rel, target } : {})}
      {...(onClick ? { onClick } : {})}
      {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className={className}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", transformPerspective: 900 }}
      initial={{ y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.4, ease: LUX_EASE } }}
      whileTap={{ scale: 0.985 }}
    >
      {children}
    </Tag>
  );
}
