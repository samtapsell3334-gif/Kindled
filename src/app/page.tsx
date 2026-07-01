"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  Flame, Lock, Star, Users, Trophy, Check,
  Sparkles, Shield, Share2, ArrowRight, Menu, X, Gift,
  Heart, RefreshCw, ChevronRight,
} from "lucide-react";
import { WaitlistForm } from "@/components/WaitlistForm";

// ─── Static data ──────────────────────────────────────────────────────────────

const EMBERS = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: `${4 + (i * 4.3) % 92}%`,
  size: `${2 + (i * 0.9) % 3.5}px`,
  dur: `${3 + (i * 0.55) % 4}s`,
  delay: `${(i * 0.32) % 3.5}s`,
  drift: `${-18 + (i * 7.3) % 36}px`,
}));

const MARQUEE_ITEMS = [
  "No duplicate gifts — ever",
  "Magical reveals on the big day",
  "Chip in any amount",
  "Gifts stay secret until the big day",
  "£2,500 quarterly draw",
  "Star charts for kids",
  "One link. Unlimited contributors.",
  "2 minutes to set up",
  "2% credit back",
  "Free to start",
];

const STEPS = [
  {
    n: "01",
    icon: Flame,
    title: "Start your pot",
    desc: "Add what you actually want — paste links from any shop, pick from the catalogue, or create custom goals. Takes under 2 minutes.",
    grad: "from-amber-400 to-orange-500",
    shadow: "rgba(251,146,60,0.35)",
    bg: "from-amber-50 to-orange-50",
    border: "border-amber-100",
  },
  {
    n: "02",
    icon: Share2,
    title: "Share one link",
    desc: "Send a single link to everyone — family, friends, colleagues abroad. They chip in any amount, no app download, no account needed.",
    grad: "from-orange-400 to-rose-500",
    shadow: "rgba(244,63,94,0.3)",
    bg: "from-orange-50 to-rose-50",
    border: "border-rose-100",
  },
  {
    n: "03",
    icon: Sparkles,
    title: "The magical reveal",
    desc: "On the big day, an animated reveal shows exactly what was funded and who made it happen. Tears are practically guaranteed.",
    grad: "from-[#ff6b6b] to-[#f59e0b]",
    shadow: "rgba(255,107,107,0.35)",
    bg: "from-rose-50 to-amber-50",
    border: "border-rose-100",
  },
];

const FEATURES = [
  {
    icon: Lock,
    title: "Surprise-proof secrets",
    desc: "Billy sees zero progress until reveal day. Contributors can chat, but the gift stays completely hidden.",
    color: "text-[#ff6b6b]",
    bg: "bg-rose-50",
    border: "border-rose-100",
    glow: "rgba(255,107,107,0.12)",
  },
  {
    icon: Users,
    title: "Unlimited contributors",
    desc: "Anyone with the link can chip in — no app download, no account, no friction whatsoever.",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    glow: "rgba(217,119,6,0.12)",
  },
  {
    icon: Star,
    title: "Star chart for kids",
    desc: "Turn good behaviour into gift momentum. Stars earned through chores unlock reward goals.",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
    glow: "rgba(234,88,12,0.12)",
  },
  {
    icon: RefreshCw,
    title: "Carry-over balances",
    desc: "Incomplete birthday goals carry to Christmas seamlessly. Nothing is ever lost or wasted.",
    color: "text-[#ff6b6b]",
    bg: "bg-rose-50",
    border: "border-rose-100",
    glow: "rgba(255,107,107,0.12)",
  },
  {
    icon: Shield,
    title: "Parent dashboard",
    desc: "Event dates, catalogue browsing with virtual marker pens, gift approvals — full family control.",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    glow: "rgba(217,119,6,0.12)",
  },
  {
    icon: Trophy,
    title: "A little extra: prize draw",
    desc: "On top of it all, every contributor is entered into our quarterly £2,500 prize draw — free entry route, no purchase necessary.",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
    glow: "rgba(234,88,12,0.12)",
  },
];

// Illustrative scenarios — the everyday moments Kindled is being built for.
// NOT customer reviews: Kindled is pre-launch, so nothing here is attributed to a
// real person (avoids presenting invented reviews as genuine — DMCC Act 2024).
const SCENARIOS = [
  {
    quote: "No more three copies of the same book at every birthday — everyone chips into the gifts that actually get used, and the reveal is the bit that brings the happy tears.",
    persona: "The parent done with duplicate gifts",
    color: "bg-[#ff6b6b]",
  },
  {
    quote: "Living far away, sending cash always felt impersonal. Chipping into a real goal means being part of the celebration, even from another country.",
    persona: "The relative who lives abroad",
    color: "bg-amber-500",
  },
  {
    quote: "A star chart turns good behaviour into gift momentum — a goal earned along the way and fully funded by the big day.",
    persona: "The family using star charts",
    color: "bg-orange-500",
  },
  {
    quote: "Watching someone discover who came together to make their gift happen — that shared moment is the whole point.",
    persona: "The friend who wants it to feel special",
    color: "bg-rose-500",
  },
  {
    quote: "Set up in a couple of minutes, one link shared, and the family chips in over the week — coordination without the awkward money chat.",
    persona: "The organiser of the group gift",
    color: "bg-amber-600",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cn(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

function Reveal({
  children,
  delay = 0,
  className = "",
  from = "bottom",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  from?: "bottom" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const initial =
    from === "left" ? { opacity: 0, x: -40 } :
    from === "right" ? { opacity: 0, x: 40 } :
    { opacity: 0, y: 36 };
  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#070300]/90 backdrop-blur-2xl border-b border-white/[0.06] shadow-2xl shadow-black/40"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
            <Flame className="h-4 w-4 text-stone-900" strokeWidth={2.5} />
          </div>
          <span
            style={{ fontFamily: "var(--font-display)" }}
            className="text-[20px] font-bold tracking-tight text-white"
          >
            Kindled
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {[["How it works", "#how"], ["Features", "#features"], ["For families", "#families"]].map(([l, h]) => (
            <a key={l} href={h} className="text-[13px] font-medium text-white/50 hover:text-white transition-colors duration-200">
              {l}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/pots/demo"
            className="hidden md:flex items-center gap-1 text-[13px] font-medium text-white/50 hover:text-white transition-colors duration-200"
          >
            Live demo
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/#waitlist"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-[13px] font-bold text-stone-900 shadow-lg shadow-amber-500/25 transition-all hover:scale-105 hover:shadow-amber-500/50 active:scale-[0.97]"
          >
            Reserve your spot
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-white backdrop-blur-sm"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/8 bg-[#070300]/95 backdrop-blur-2xl md:hidden"
          >
            <div className="flex flex-col gap-0.5 px-5 py-4">
              {[["How it works", "#how"], ["Features", "#features"], ["For families", "#families"], ["Live demo", "/pots/demo"]].map(([l, h]) => (
                <a
                  key={l}
                  href={h}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-[15px] font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                >
                  {l}
                </a>
              ))}
              <Link
                href="/#waitlist"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-3 text-[15px] font-bold text-stone-900"
              >
                Reserve your spot <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const cardsY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen items-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 100% 70% at 50% 80%, #1a0800 0%, #0a0400 45%, #000 100%)",
      }}
    >
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 h-[600px] w-[900px] rounded-full bg-amber-600/[0.08] blur-[140px]" />
        <div className="absolute left-[20%] top-[30%] h-[300px] w-[400px] rounded-full bg-orange-500/[0.06] blur-[100px]" />
        <div className="absolute right-[15%] bottom-[20%] h-[250px] w-[350px] rounded-full bg-rose-600/[0.05] blur-[80px]" />
      </div>

      {/* Embers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {EMBERS.map((e) => (
          <span
            key={e.id}
            className="absolute rounded-full bg-amber-400/60"
            style={{
              left: e.left,
              bottom: 0,
              width: e.size,
              height: e.size,
              animation: `ember-rise ${e.dur} ${e.delay} ease-out infinite`,
              "--sx": e.drift,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Grain overlay */}
      <div className="grain pointer-events-none absolute inset-0 opacity-50" />

      <motion.div
        style={{ opacity: heroOpacity }}
        className="relative mx-auto w-full max-w-6xl px-5 pt-28 pb-20"
      >
        <motion.div style={{ y: heroY }} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/8 px-4 py-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-300/90">
                Group gifting for families — finally
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontFamily: "var(--font-display)" }}
              className="text-[52px] md:text-[68px] font-bold leading-[1.05] tracking-tight text-white"
            >
              Gifts they&apos;ll{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #f43f5e 100%)",
                }}
              >
                actually love
              </span>
              .{" "}Every time.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-[500px] text-[17px] leading-relaxed text-white/50"
            >
              The gifts they&apos;ll actually love, funded by everyone who loves them. Share one link, family chip in any amount, and reveal it all together on the big day.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                href="#waitlist"
                className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-4 text-[15px] font-bold text-stone-900 shadow-2xl transition-all hover:scale-105 hover:-translate-y-0.5 active:scale-[0.97]"
                style={{ boxShadow: "0 8px 32px rgba(251,146,60,0.45)" }}
              >
                <Flame className="h-5 w-5" />
                Reserve your spot
              </Link>
              <Link
                href="/pots/demo"
                className="flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-4 text-[15px] font-medium text-white/70 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"
              >
                See a live pot
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="mt-6 flex flex-wrap gap-x-5 gap-y-2"
            >
              {["Free to set up", "No app needed to contribute", "Works on any device"].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 shrink-0 text-amber-400" strokeWidth={2.5} />
                  <span className="text-[12px] text-white/35">{t}</span>
                </div>
              ))}
            </motion.div>

            {/* Mobile product proof — the real pot, shown only on small screens */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 lg:hidden"
            >
              <div
                className="relative mx-auto w-full max-w-[330px] overflow-hidden rounded-2xl"
                style={{
                  background: "linear-gradient(145deg, #1a0800, #0d0400)",
                  boxShadow: "0 0 0 1px rgba(251,146,60,0.2), 0 24px 60px rgba(251,146,60,0.22), 0 8px 24px rgba(0,0,0,0.7)",
                }}
              >
                <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-500" />
                <div className="p-5">
                  <div className="mb-4 flex items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/15">
                      <Flame className="h-5 w-5 text-amber-400" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-widest text-amber-400/60">Billy&apos;s Christmas pot</p>
                      <p className="text-[15px] font-bold leading-tight text-white">PlayStation 5</p>
                    </div>
                  </div>
                  <p className="text-[30px] font-bold text-white">£450</p>
                  <div className="mt-2.5 h-2 rounded-full bg-white/8">
                    <motion.div
                      initial={{ width: "0%" }}
                      whileInView={{ width: "78%" }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[11px] text-white/35">£351 raised</p>
                    <p className="text-[12px] font-bold text-amber-400">78%</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      {["bg-[#ff6b6b]", "bg-rose-400", "bg-orange-400", "bg-amber-400", "bg-amber-500"].map((c, i) => (
                        <div key={i} className={`h-5 w-5 rounded-full border-[1.5px] border-[#0d0400] ${c}`} />
                      ))}
                    </div>
                    <p className="text-[11px] text-white/35">+9 chipped in</p>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <Lock className="h-3 w-3 shrink-0 text-white/20" />
                    <p className="text-[9px] italic text-white/25">Progress hidden from Billy until reveal day</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Floating product cards */}
          <motion.div style={{ y: cardsY }} className="relative hidden lg:block h-[520px]">
            {/* Background card */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotate: 10 }}
              animate={{ opacity: 1, x: 0, rotate: 10 }}
              transition={{ delay: 0.45, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-4 top-4 w-[190px] rounded-2xl border border-white/8 bg-white/[0.04] p-3.5 backdrop-blur-sm"
              style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.5)" }}
            >
              <div className="h-1 w-full rounded-full bg-gradient-to-r from-[#ff6b6b] to-[#f59e0b] mb-3" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-1">Holiday Fund</p>
              <p className="text-[22px] font-bold text-white">£800</p>
              <div className="mt-2 h-1.5 rounded-full bg-white/8">
                <div className="h-full w-[45%] rounded-full bg-gradient-to-r from-[#ff6b6b] to-[#f59e0b]" />
              </div>
              <p className="mt-1.5 text-[10px] text-white/30">£360 raised · 8 contributors</p>
            </motion.div>

            {/* Main hero card */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.25, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-8 top-20 z-10 w-[240px] rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #1a0800, #0d0400)",
                boxShadow: "0 0 0 1px rgba(251,146,60,0.2), 0 32px 80px rgba(251,146,60,0.25), 0 8px 32px rgba(0,0,0,0.7)",
              }}
            >
              <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-500" />
              <div className="p-4">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/20">
                    <Flame className="h-5 w-5 text-amber-400" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-amber-400/60">Billy&apos;s Christmas pot</p>
                    <p className="text-[14px] font-bold text-white leading-tight">PlayStation 5</p>
                  </div>
                </div>
                <p className="text-[28px] font-bold text-white">£450</p>
                <div className="mt-2.5 h-2 rounded-full bg-white/8">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "78%" }}
                    transition={{ delay: 0.9, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                  />
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-[10px] text-white/35">£351 raised</p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    className="text-[11px] font-bold text-amber-400"
                  >
                    78%
                  </motion.p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {["bg-[#ff6b6b]", "bg-rose-400", "bg-orange-400", "bg-amber-400", "bg-amber-500"].map((c, i) => (
                      <div key={i} className={`h-5 w-5 rounded-full border-[1.5px] border-[#0d0400] ${c}`} />
                    ))}
                  </div>
                  <p className="text-[10px] text-white/35">+9 contributors</p>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-white/20 shrink-0" />
                  <p className="text-[9px] text-white/20 italic">Progress hidden from Billy until reveal day</p>
                </div>
              </div>
            </motion.div>

            {/* Bottom card — claimed */}
            <motion.div
              initial={{ opacity: 0, x: -40, rotate: -5 }}
              animate={{ opacity: 1, x: 0, rotate: -5 }}
              transition={{ delay: 0.6, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 bottom-16 w-[180px] rounded-2xl border border-amber-400/15 bg-amber-950/40 p-3.5 backdrop-blur-sm"
              style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.12)" }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500">
                  <Check className="h-3 w-3 text-stone-900" strokeWidth={3} />
                </div>
                <p className="text-[10px] font-bold text-amber-400">Goal reached!</p>
              </div>
              <p className="text-[12px] font-semibold text-white/80">LEGO Technic Set</p>
              <p className="text-[10px] text-white/30 mt-0.5">£85 · 5 contributors</p>
            </motion.div>

            {/* Star badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1, duration: 0.5, type: "spring", stiffness: 400, damping: 24 }}
              className="absolute right-2 bottom-28 z-20 flex items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-2.5 py-1.5 backdrop-blur-sm"
            >
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <p className="text-[10px] font-bold text-amber-300">Grandma just chipped in £20</p>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Fade to white */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#fdf9f5] to-transparent" />
    </section>
  );
}

// ─── Marquee ──────────────────────────────────────────────────────────────────

function MarqueeBand() {
  const reduce = useReducedMotion();
  return (
    <div className="overflow-hidden border-y border-stone-200/70 bg-white py-3.5">
      <motion.div
        {...(reduce ? {} : { animate: { x: ["0%", "-50%"] }, transition: { duration: 28, ease: "linear" as const, repeat: Infinity } })}
        className="flex w-max"
      >
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((text, i) => (
          <div key={i} className="flex shrink-0 items-center gap-3 px-8">
            <Flame className="h-3 w-3 shrink-0 text-amber-500" />
            <span className="whitespace-nowrap text-[12px] font-medium text-stone-400">{text}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Problem ──────────────────────────────────────────────────────────────────

function Problem() {
  return (
    <section className="bg-[#fdf9f5] py-24 px-5">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center mb-14">
          <p className="text-[11px] font-bold uppercase tracking-widest text-rose-500 mb-3">The problem with gift giving</p>
          <h2
            style={{ fontFamily: "var(--font-display)" }}
            className="text-[38px] md:text-[52px] font-bold text-stone-900 leading-[1.1]"
          >
            £3.2 billion wasted every year
            <br />
            <span className="text-stone-400">on gifts nobody wanted.</span>
          </h2>
          <p className="mt-5 max-w-[560px] mx-auto text-[16px] text-stone-500 leading-relaxed">
            Families mean well. But without coordination, birthdays and Christmases end up full of duplicates, wrong sizes, and things that gather dust.
          </p>
        </Reveal>

        {/* TODO(founder): verify these survey citations are accurate before launch. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              stat: "1 in 5",
              label: "physical gifts is a duplicate",
              desc: "Someone already bought the same thing — and nobody knows until it's too late.",
              color: "text-rose-600",
              bg: "bg-rose-50",
              border: "border-rose-100",
              source: "YouGov UK Gift Buying Survey, 2023",
            },
            {
              stat: "£3.2bn",
              label: "spent on unwanted UK gifts each year",
              desc: "That's money families spent on things immediately returned, regifted, or thrown away.",
              color: "text-amber-600",
              bg: "bg-amber-50",
              border: "border-amber-100",
              source: "OnePoll / Halifax survey, 2023",
            },
            {
              stat: "1 in 4",
              label: "gifts end up unused, regifted, or returned",
              desc: "Money and effort wasted on both sides — because nobody coordinated.",
              color: "text-orange-600",
              bg: "bg-orange-50",
              border: "border-orange-100",
              source: "OnePoll / Halifax survey, 2023",
            },
          ].map((item, i) => (
            <Reveal key={item.stat} delay={i * 0.12}>
              <div className={cn("rounded-2xl border p-6 h-full", item.bg, item.border)}>
                <p className={cn("text-[42px] font-bold leading-none mb-2", item.color)}>{item.stat}</p>
                <p className="text-[15px] font-semibold text-stone-700 mb-2">{item.label}</p>
                <p className="text-[13px] text-stone-500 leading-relaxed">{item.desc}</p>
                <p className="mt-3 text-[10px] italic text-stone-400">Source: {item.source}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Reveal preview (WS6) ─────────────────────────────────────────────────────
// A lightweight, looping "reveal" preview — CSS/Framer only (no heavy video).
// Respects prefers-reduced-motion: shows the funded end-state statically.

function RevealPreview() {
  const reduce = useReducedMotion();
  const barLoop = reduce
    ? { width: "100%" as const }
    : { width: ["0%", "100%", "100%", "0%"] };
  const barTransition = reduce
    ? { duration: 0 }
    : { duration: 5, times: [0, 0.5, 0.85, 1], repeat: Infinity, ease: "easeInOut" as const };
  const popLoop = reduce ? { opacity: 1, scale: 1 } : { opacity: [0, 0, 1, 1, 0], scale: [0.6, 0.6, 1, 1, 0.9] };
  const popTransition = reduce ? { duration: 0 } : { duration: 5, times: [0, 0.5, 0.6, 0.85, 1], repeat: Infinity };

  return (
    <section
      className="relative overflow-hidden px-5 py-24"
      style={{ background: "radial-gradient(ellipse 90% 60% at 50% 30%, #1a0800 0%, #0a0400 55%, #050200 100%)" }}
    >
      <div className="relative mx-auto max-w-2xl text-center">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-amber-400">The magic moment</p>
        <h2 style={{ fontFamily: "var(--font-display)" }} className="text-[34px] font-bold leading-tight text-white md:text-[46px]">
          The reveal is the bit they remember
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/50">
          When the goal is funded, everyone gathers for the reveal — the gift, who chipped in, and a fair few happy tears.
        </p>

        <div
          className="relative mx-auto mt-10 w-full max-w-[340px] overflow-hidden rounded-3xl border border-white/10 p-6"
          style={{ background: "linear-gradient(145deg, #1a0800, #0d0400)", boxShadow: "0 24px 60px rgba(251,146,60,0.2)" }}
          aria-label="A preview of a Kindled reveal reaching its goal"
        >
          <div className="mb-4 flex items-center justify-center gap-2">
            <Gift className="h-5 w-5 text-amber-400" />
            <span className="text-[13px] font-bold text-white">Billy&apos;s birthday pot</span>
          </div>
          <p className="mb-2 text-[34px] font-black text-white" style={{ fontFamily: "var(--font-display)" }}>£800</p>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" animate={barLoop} transition={barTransition} />
          </div>
          <motion.div
            animate={popLoop}
            transition={popTransition}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-[13px] font-black text-stone-900"
          >
            <Sparkles className="h-4 w-4" /> Fully funded!
          </motion.div>
        </div>

        <div className="mt-8">
          <Link href="/pots/demo" className="inline-flex items-center gap-2 text-[14px] font-semibold text-amber-400 hover:text-amber-300">
            Watch a full reveal in the demo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section id="how" className="bg-white py-28 px-5">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center mb-16">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-3">How Kindled works</p>
          <h2
            style={{ fontFamily: "var(--font-display)" }}
            className="text-[38px] md:text-[52px] font-bold text-stone-900 leading-[1.1]"
          >
            Three steps to gifting magic
          </h2>
          <p className="mt-4 text-[16px] text-stone-500 max-w-[480px] mx-auto leading-relaxed">
            From wishlist to tearful reveal. No confusion, no duplicates, no awkward conversations about money.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[22%] right-[22%] h-px bg-gradient-to-r from-amber-200 via-orange-200 to-rose-200" />

          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={i * 0.15}>
              <div className="flex flex-col items-center text-center">
                {/* Number + icon */}
                <div className="relative mb-5">
                  <div
                    className={cn(
                      "flex h-24 w-24 items-center justify-center rounded-2xl shadow-xl bg-gradient-to-br",
                      step.grad,
                    )}
                    style={{ boxShadow: `0 12px 36px ${step.shadow}` }}
                  >
                    <step.icon className="h-10 w-10 text-white" strokeWidth={1.75} />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-[10px] font-black text-white">
                    {i + 1}
                  </div>
                </div>
                <h3
                  style={{ fontFamily: "var(--font-display)" }}
                  className="text-[22px] font-bold text-stone-900 mb-2"
                >
                  {step.title}
                </h3>
                <p className="text-[14px] text-stone-500 leading-relaxed">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Demo CTA */}
        <Reveal delay={0.3} className="mt-14 text-center">
          <Link
            href="/pots/demo"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-7 py-4 text-[15px] font-bold text-stone-900 shadow-xl transition-all hover:scale-105 hover:-translate-y-0.5 active:scale-[0.97]"
            style={{ boxShadow: "0 8px 32px rgba(251,146,60,0.4)" }}
          >
            <Flame className="h-5 w-5" />
            See a live pot
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-[12px] text-stone-400">No sign-up needed to explore the demo</p>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function Features() {
  return (
    <section id="features" className="bg-[#fdf9f5] py-28 px-5">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center mb-16">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-3">Everything you need</p>
          <h2
            style={{ fontFamily: "var(--font-display)" }}
            className="text-[38px] md:text-[52px] font-bold text-stone-900 leading-[1.1]"
          >
            Built for real families
          </h2>
          <p className="mt-4 text-[16px] text-stone-500 max-w-[500px] mx-auto leading-relaxed">
            Every feature designed around how families actually give — and how kids actually get excited about gifts.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -4, boxShadow: `0 12px 40px ${f.glow}` }}
                transition={{ duration: 0.25 }}
                className={cn(
                  "h-full rounded-2xl border p-5 transition-colors cursor-default",
                  f.bg,
                  f.border
                )}
              >
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm mb-4")}>
                  <f.icon className={cn("h-5 w-5", f.color)} strokeWidth={1.75} />
                </div>
                <h3 className="text-[16px] font-bold text-stone-800 mb-1.5">{f.title}</h3>
                <p className="text-[13px] text-stone-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Audience split ───────────────────────────────────────────────────────────

function AudienceSplit() {
  return (
    <section id="families" className="bg-white py-28 px-5">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center mb-16">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-3">Who Kindled is for</p>
          <h2
            style={{ fontFamily: "var(--font-display)" }}
            className="text-[38px] md:text-[52px] font-bold text-stone-900 leading-[1.1]"
          >
            Works for everyone involved
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Families */}
          <Reveal from="left">
            <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-8 h-full">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-300/40">
                <Gift className="h-7 w-7 text-white" strokeWidth={1.5} />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-2">For families & receivers</p>
              <h3 style={{ fontFamily: "var(--font-display)" }} className="text-[28px] font-bold text-stone-900 mb-3 leading-tight">
                Your wishlist.<br />Your rules.
              </h3>
              <p className="text-[14px] text-stone-600 leading-relaxed mb-6">
                Set up your pot in 2 minutes. Add anything — from any shop. Kids get star charts and parent controls. Every gift stays secret until you trigger the reveal.
              </p>
              <div className="space-y-2.5">
                {[
                  "Add items from any website by pasting a link",
                  "Star chart mode turns chores into gift momentum",
                  "Gifts stay hidden from you until reveal day",
                  "Incomplete goals carry over to the next occasion",
                  "Full parent controls and event scheduling",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-400">
                      <Check className="h-2.5 w-2.5 text-stone-900" strokeWidth={3} />
                    </div>
                    <p className="text-[13px] text-stone-700">{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Contributors */}
          <Reveal from="right" delay={0.1}>
            <div id="contributors" className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 to-orange-50 p-8 h-full">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff6b6b] to-[#f59e0b] shadow-lg shadow-rose-300/40">
                <Heart className="h-7 w-7 text-white" strokeWidth={1.5} />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#ff6b6b] mb-2">For contributors</p>
              <h3 style={{ fontFamily: "var(--font-display)" }} className="text-[28px] font-bold text-stone-900 mb-3 leading-tight">
                Give meaningfully.<br />Get rewarded.
              </h3>
              <p className="text-[14px] text-stone-600 leading-relaxed mb-6">
                Chip in any amount you like — from £5 to £500. No account needed. Every contribution enters you into our £2,500 quarterly draw, plus earns 2% back in credit.
              </p>
              <div className="space-y-2.5">
                {[
                  "Chip in any amount — no minimum, no account required",
                  "Automatic entry to the £2,500 prize draw (free entry route available)",
                  "Earn 2% back in credit on catalogue purchases",
                  "Buy smaller items outright if you prefer",
                  "See who else contributed in the reveal",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#ff6b6b]">
                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                    </div>
                    <p className="text-[13px] text-stone-700">{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function Stats() {
  return (
    <section
      className="py-24 px-5"
      style={{ background: "linear-gradient(135deg, #0a0400 0%, #150800 50%, #0a0400 100%)" }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 flex justify-center overflow-hidden">
        <div className="h-[300px] w-[600px] rounded-full bg-amber-500/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <Reveal className="text-center mb-14">
          <h2
            style={{ fontFamily: "var(--font-display)" }}
            className="text-[38px] md:text-[48px] font-bold text-white leading-[1.1]"
          >
            Kindled, by the numbers
          </h2>
          {/* Product facts only — no research stats dressed up as data. */}
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "To set up your first pot", display: "2 min" },
            { label: "Chip in any amount, from a fiver", display: "£5+" },
            { label: "Quarterly prize draw · free entry · terms apply", display: "£2,500" },
            { label: "Back in credit on catalogue purchases", display: "2%" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1}>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-5 text-center backdrop-blur-sm">
                <p
                  style={{ fontFamily: "var(--font-display)" }}
                  className="text-[36px] md:text-[42px] font-bold text-amber-400 leading-none mb-2"
                >
                  {s.display}
                </p>
                <p className="text-[12px] text-white/40 leading-snug">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function Testimonials() {
  const reduce = useReducedMotion();
  return (
    <section className="bg-[#fdf9f5] py-28 px-5 overflow-hidden">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center mb-14">
          <p className="text-[11px] font-bold uppercase tracking-widest text-rose-500 mb-3">The moments we&apos;re building for</p>
          <h2
            style={{ fontFamily: "var(--font-display)" }}
            className="text-[38px] md:text-[52px] font-bold text-stone-900 leading-[1.1]"
          >
            Tears at the reveal.<br />That&apos;s the goal.
          </h2>
          <p className="mx-auto mt-4 max-w-[460px] text-[15px] leading-relaxed text-stone-500">
            Kindled is launching soon, so these aren&apos;t customer reviews yet — they&apos;re the everyday moments we&apos;re building Kindled to create.
          </p>
        </Reveal>

        {/* Illustrative scenarios (not reviews) */}
        <div className="relative">
          <motion.div
            {...(reduce ? {} : { animate: { x: ["0%", "-50%"] }, transition: { duration: 40, ease: "linear" as const, repeat: Infinity } })}
            className="flex w-max gap-5"
            aria-label="Illustrative scenarios"
          >
            {[...SCENARIOS, ...SCENARIOS].map((t, i) => (
              <figure
                key={i}
                aria-hidden={i >= SCENARIOS.length}
                className="w-[300px] shrink-0 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
              >
                <p className="mb-4 inline-block rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                  Illustrative
                </p>
                <blockquote className="text-[13px] leading-relaxed text-stone-600 mb-5">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="flex items-center gap-3">
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", t.color)}>
                    <Heart className="h-4 w-4 text-white" fill="currentColor" />
                  </span>
                  <span className="text-[13px] font-semibold text-stone-700">{t.persona}</span>
                </figcaption>
              </figure>
            ))}
          </motion.div>
          {/* Edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#fdf9f5] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#fdf9f5] to-transparent" />
        </div>
      </div>
    </section>
  );
}

// ─── How the money works ──────────────────────────────────────────────────────
// Trust section. Every claim here must be literally true: Kindled uses Stripe
// (see CLAUDE.md), never stores full card details, and pots carry over. The
// specifics still to be confirmed (fund custody, payout timing, refunds,
// safeguarding of held funds) are intentionally NOT asserted here — they live in
// /terms with [TODO] markers for legal, and we link there instead of guessing.

function HowMoneyWorks() {
  const points = [
    {
      icon: Shield,
      title: "Collected securely by Stripe",
      body: "When someone chips in, the payment is handled by Stripe — the same infrastructure trusted by millions of businesses. We never see or store full card numbers.",
    },
    {
      icon: Gift,
      title: "Every penny goes to the goal",
      body: "Contributions are tracked against the pot's goal so the family can watch it grow — or, on a surprise pot, it stays hidden from the recipient until reveal day.",
    },
    {
      icon: RefreshCw,
      title: "Nothing is wasted if it falls short",
      body: "If a pot isn't fully funded by the big day, the family keeps what was raised — or carries the balance over to the next occasion. No pressure, no lost money.",
    },
    {
      icon: Lock,
      title: "Private by design",
      body: "Payment data is encrypted in transit, and a recipient never sees who gave what — or how much — until the reveal.",
    },
  ];

  return (
    <section id="money" className="scroll-mt-24 bg-white py-28 px-5">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mb-12 text-center">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-amber-600">Where does your money go?</p>
          <h2 style={{ fontFamily: "var(--font-display)" }} className="text-[38px] font-bold leading-[1.1] text-stone-900 md:text-[52px]">
            How the money works
          </h2>
          <p className="mx-auto mt-4 max-w-[520px] text-[16px] leading-relaxed text-stone-500">
            Chipping in should feel as safe as it feels good. Here&apos;s exactly what happens when you give.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {points.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <div className="flex h-full gap-4 rounded-2xl border border-stone-200 bg-[#fdf9f5] p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
                  <p.icon className="h-5 w-5 text-white" strokeWidth={2} />
                </span>
                <div>
                  <h3 className="text-[16px] font-bold text-stone-900">{p.title}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-stone-600">{p.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-8 text-center">
          <p className="text-[14px] text-stone-500">
            Full detail on how funds are held, paid out, and refunded is in our{" "}
            <Link href="/terms#how-money" className="font-semibold text-stone-800 underline underline-offset-2 hover:text-stone-900">
              Terms
            </Link>
            . No account needed to chip in.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section id="waitlist" className="scroll-mt-24 bg-white py-32 px-5">
      <Reveal className="mx-auto max-w-2xl text-center">
        <div className="relative inline-block">
          {/* Glow */}
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-amber-400/20 blur-3xl scale-150" />
          <div className="relative rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-10 md:p-14">
            <div className="mb-5 flex justify-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, #fbbf24, #f97316)",
                  boxShadow: "0 12px 40px rgba(251,146,60,0.5)",
                }}
              >
                <Flame className="h-8 w-8 text-stone-900" strokeWidth={1.75} />
              </div>
            </div>

            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-amber-600">
              Kindled is launching soon
            </p>
            <h2
              style={{ fontFamily: "var(--font-display)" }}
              className="text-[36px] md:text-[48px] font-bold text-stone-900 leading-[1.1] mb-4"
            >
              Reserve your spot
            </h2>
            <p className="text-[16px] text-stone-500 leading-relaxed mb-7 max-w-[400px] mx-auto">
              Be one of our first families. Join the waitlist and we&apos;ll invite you in as soon as your spot opens up.
            </p>

            <WaitlistForm variant="light" />

            <p className="mt-6 text-[13px] text-stone-500">
              Just want a look first?{" "}
              <Link href="/pots/demo" className="font-semibold text-stone-700 underline underline-offset-2 hover:text-stone-900">
                See a live pot
              </Link>
              .
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
              {["Free forever", "No credit card", "Works on any device"].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.5} />
                  <span className="text-[12px] text-stone-500">{t}</span>
                </div>
              ))}
            </div>

            {/* Payment-security trust strip */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-amber-100/70 pt-6">
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-stone-400" strokeWidth={2} />
                <span className="text-[12px] text-stone-500">
                  Payments secured by <span className="font-semibold text-stone-700">Stripe</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-stone-400" strokeWidth={2} />
                <span className="text-[12px] text-stone-500">Your gift stays private until reveal day</span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white px-5 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-5 md:flex-row">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
            <Flame className="h-3.5 w-3.5 text-stone-900" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: "var(--font-display)" }} className="text-[18px] font-bold text-stone-900">
            Kindled
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {(["How it works|#how-it-works", "Features|#features", "Live demo|/pots/demo", "Privacy|/privacy", "Terms|/terms", "Contact|/contact", "Investors|/investor"] as const).map((item) => {
            const [l, h] = item.split("|");
            return (
              <Link key={l} href={h!} className="text-[13px] text-stone-400 hover:text-stone-700 transition-colors">
                {l}
              </Link>
            );
          })}
        </div>
        <p className="text-[12px] text-stone-400">Made with love in the UK · © 2026 Kindled. All rights reserved.</p>
      </div>
      <p className="mx-auto mt-6 max-w-5xl text-center text-[11px] leading-relaxed text-stone-400">
        Prize draw: 18+, UK residents only. No purchase necessary — a free entry route and full{" "}
        <Link href="/terms#prize-draw" className="underline underline-offset-2 hover:text-stone-600">terms</Link> apply.
      </p>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <Nav />
      <Hero />
      <MarqueeBand />
      <Problem />
      <RevealPreview />
      <HowItWorks />
      <HowMoneyWorks />
      <AudienceSplit />
      <Features />
      <Stats />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </>
  );
}
