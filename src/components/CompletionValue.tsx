"use client";

import { motion } from "framer-motion";
import { Flame, Sparkles, ArrowRight, Wallet } from "lucide-react";
import { splitCommission } from "@/lib/catalog-service";
import { VH_BOUNCE, LUX_EASE } from "@/lib/motion";

/**
 * CompletionValue — the viral prompt shown right after a contribution. It reflects the
 * amount back to the giver and turns their good deed into the top of the K-loop:
 * "you contributed £X → unlock cashback → start your own Fire".
 */
export function CompletionValue({
  amount,
  onStartOwn,
}: { amount: number; onStartOwn: () => void }) {
  // Cashback headline uses the user's ring-fenced Spark-Balance share of a 5% partner commission.
  const userSharePct = splitCommission(5).userBonus; // 3%

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: LUX_EASE }}
      className="font-outfit overflow-hidden rounded-[24px] bg-[#0f172a] p-6 text-center vh-lift-lg"
    >
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#f59e0b]">
        <Sparkles className="h-7 w-7 text-[#0f172a]" />
      </div>
      <p className="text-[13px] text-[#fdf6e3]/60">You&apos;ve contributed</p>
      <p className="font-editorial text-[40px] font-semibold leading-none text-[#fdf6e3]">£{amount.toLocaleString()}</p>

      <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-[#f59e0b]/[0.1] px-4 py-3 text-left">
        <Wallet className="h-5 w-5 shrink-0 text-[#f59e0b]" />
        <p className="text-[12px] leading-snug text-[#fdf6e3]/85">
          Start your own Fire and you unlock <span className="font-bold text-[#f59e0b]">{userSharePct}% back</span> in Spark Balance on every contribution — ring-fenced to your goals.
        </p>
      </div>

      <p className="mt-4 font-editorial text-[19px] font-semibold leading-tight text-[#fdf6e3]">Why wait?</p>
      <p className="mt-1 text-[13px] leading-relaxed text-[#fdf6e3]/55">
        You just made someone&apos;s milestone happen. Start your own and let the people who love you do the same.
      </p>

      <motion.button
        whileTap={{ scale: 0.96 }}
        transition={VH_BOUNCE}
        onClick={onStartOwn}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#ff6b6b] py-4 text-[15px] font-bold text-white vh-lift"
      >
        <Flame className="h-4 w-4" /> Start your own Milestone Fire <ArrowRight className="h-4 w-4" />
      </motion.button>
      <p className="mt-2.5 text-[11px] text-[#fdf6e3]/40">Free forever · 2-minute setup</p>
    </motion.div>
  );
}
