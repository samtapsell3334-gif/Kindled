"use client";

import { useCallback, useState } from "react";

interface BloomState { x: number; y: number; key: number }

/**
 * useBloom — haptic-style visual feedback. Call `trigger(x, y)` (screen coords)
 * on a satisfying action and render `bloom` somewhere fixed; a soft amber radial
 * flash blooms out from the point and fades. Pointer-events-none, self-clearing.
 */
export function useBloom() {
  const [state, setState] = useState<BloomState | null>(null);

  const trigger = useCallback((x: number, y: number) => {
    setState({ x, y, key: Date.now() });
    window.setTimeout(() => setState((s) => (s && s.x === x && s.y === y ? null : s)), 720);
  }, []);

  const bloom = state ? (
    <div
      key={state.key}
      className="lux-bloom pointer-events-none fixed z-[60]"
      style={{
        left: state.x,
        top: state.y,
        width: 460,
        height: 460,
        transform: "translate(-50%, -50%)",
        background: "radial-gradient(circle, rgba(255,184,0,0.30) 0%, rgba(255,184,0,0.10) 35%, transparent 68%)",
      }}
    />
  ) : null;

  return { bloom, trigger };
}
