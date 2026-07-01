"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X } from "lucide-react";

/**
 * DemoWaitlistPill — a floating, dismissible waitlist capture for the demo, so a
 * visitor deep in the product can convert without scrolling to the bottom. The demo
 * is the *secondary* action; this keeps the primary one (join the waitlist) one tap
 * away. Sits above the demo's bottom tab bar.
 */
export function DemoWaitlistPill() {
  const [dismissed, setDismissed] = useState(false);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-[88px] z-40 flex justify-center px-4 pointer-events-none"
        >
          <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-amber-200 bg-white/95 py-1.5 pl-4 pr-1.5 shadow-xl backdrop-blur-sm">
            <span className="text-[12px] font-medium text-stone-500">Like what you see?</span>
            <Link
              href="/#waitlist"
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3.5 py-1.5 text-[12px] font-bold text-stone-900 transition-transform hover:scale-105 active:scale-95"
            >
              <Flame className="h-3.5 w-3.5" />
              Reserve your spot
            </Link>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss waitlist prompt"
              className="flex h-6 w-6 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
