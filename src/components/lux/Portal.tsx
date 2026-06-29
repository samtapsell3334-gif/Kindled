"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Portal — renders children into document.body. Essential for fixed overlays
 * (slide-over sheets, celebration modals, blooms) so a transformed/blurred
 * ancestor can't trap their `position: fixed` in a local containing block.
 */
export function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
