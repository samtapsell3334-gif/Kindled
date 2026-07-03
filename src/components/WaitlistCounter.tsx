"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

const THRESHOLD = 50;

/**
 * Threshold-gated social-proof counter (v16.2). Pulls the real, live count
 * from /api/waitlist/count (no caching) on every mount. Below 50 genuine
 * sign-ups, a small number undercuts momentum more than it builds it — so
 * qualitative framing shows instead until the real count earns the numeric
 * claim. The exact live count is used once shown; never rounded, never
 * invented, never a stale cached figure.
 */
export function WaitlistCounter({ className = "" }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/waitlist/count", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { count?: number }) => { if (!cancelled && typeof d.count === "number") setCount(d.count); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const showCount = count !== null && count >= THRESHOLD;

  return (
    <p className={className}>
      <Users className="mr-1.5 -mt-0.5 inline h-3.5 w-3.5" strokeWidth={2} />
      {showCount ? `Join ${count}+ families already on the list` : "Be one of our founding families"}
    </p>
  );
}
