"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { LUX_EASE } from "@/lib/motion";
import { Portal } from "@/components/lux/Portal";

/**
 * GlassSelect — replaces standard dropdowns. Opens as a glassmorphism bottom
 * Slide-Over Sheet on mobile and an Elegant Popover on desktop. Monochrome Luxe:
 * charcoal glass, hairline borders, sharp corners, Electric-Amber selection.
 */
export function GlassSelect({
  label,
  value,
  options,
  onChange,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(true);

  const openMenu = () => {
    setSheet(typeof window !== "undefined" && !window.matchMedia("(min-width: 640px)").matches);
    setOpen(true);
  };
  const pick = (opt: string) => { onChange(opt); setOpen(false); };

  return (
    <div className="relative flex-1">
      <button
        onClick={openMenu}
        className="flex w-full items-center justify-between gap-1 border border-[rgba(10,10,10,0.14)] bg-[#f5f5f5] px-3 py-2.5 text-left transition-colors hover:border-[#0a0a0a]/40"
      >
        <span className="min-w-0">
          <span className="block text-[8px] font-semibold uppercase tracking-[0.2em] text-[#0a0a0a]/40">{label}</span>
          <span className="block truncate text-[12px] font-semibold tracking-tight text-[#0a0a0a]">{value}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#0a0a0a]/40 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      <Portal>
        <AnimatePresence>
          {open && sheet && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: LUX_EASE }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-[70] bg-[#0a0a0a]/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ duration: 0.5, ease: LUX_EASE }}
                className="fixed inset-x-0 bottom-0 z-[71] border-t border-[rgba(245,245,245,0.14)] bg-[#0a0a0a]/85 px-5 pb-8 pt-3 backdrop-blur-2xl"
              >
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#f5f5f5]/20" />
                <p className="font-editorial mb-3 text-[20px] font-medium text-[#f5f5f5]">{label}</p>
                <div className="space-y-0.5">
                  {options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => pick(opt)}
                      className={`flex w-full items-center justify-between border-b border-[rgba(245,245,245,0.08)] py-3 text-left text-[14px] tracking-tight transition-colors ${opt === value ? "text-[#ffb800]" : "text-[#f5f5f5]/80"}`}
                    >
                      {opt}
                      {opt === value && <Check className="h-4 w-4 text-[#ffb800]" strokeWidth={2.5} />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </Portal>

      <AnimatePresence>
        {open && !sheet && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: LUX_EASE }}
              className="absolute left-0 right-0 z-50 mt-1 border border-[rgba(245,245,245,0.14)] bg-[#0a0a0a]/85 p-1 backdrop-blur-2xl"
            >
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => pick(opt)}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-[13px] tracking-tight transition-colors hover:bg-[#f5f5f5]/[0.06] ${opt === value ? "text-[#ffb800]" : "text-[#f5f5f5]/80"}`}
                >
                  {opt}
                  {opt === value && <Check className="h-3.5 w-3.5 text-[#ffb800]" strokeWidth={2.5} />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
