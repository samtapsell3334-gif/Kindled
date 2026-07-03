"use client";

/**
 * v14 — the persona benefits section. Replaces the old two-column
 * "AudienceSplit" bullets with a three-tab switcher (contributor / receiver
 * / parent), positioned high on the page directly under the hero. Every
 * icon here is hand-authored (simple geometric SVG, ember/structure duotone)
 * — no lucide/stock icon pack, per the brief.
 *
 * Copywriting rule: no bare absolute claims ("0%", "there will be 0") —
 * qualitative framing only ("never", "no more"), so nothing here is a
 * falsifiable promise one edge case can break.
 */

import { useRef, useState } from "react";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import { DRAW, CREDIT } from "@/content/claims";
import { DrawMicrocopy } from "@/components/DrawMicrocopy";

type PersonaKey = "contributor" | "receiver" | "parent";

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
      {children}
    </svg>
  );
}

const NoGuessIcon = () => (
  <Icon>
    <path d="M6 15 15 6h9a2 2 0 0 1 2 2v9l-9 9a2 2 0 0 1-2.8 0L6 17.8a2 2 0 0 1 0-2.8Z" stroke="var(--ember)" strokeWidth="1.75" strokeLinejoin="round" />
    <circle cx="21" cy="11" r="1.6" fill="var(--ember)" />
    <path d="M12.5 19.5 15 22l5.5-5.5" stroke="var(--structure)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);
const NoDoubleIcon = () => (
  <Icon>
    <rect x="5" y="13" width="13" height="13" rx="2" stroke="var(--structure)" strokeOpacity="0.35" strokeWidth="1.75" />
    <rect x="14" y="6" width="13" height="13" rx="2" fill="var(--card)" stroke="var(--ember)" strokeWidth="1.75" />
    <path d="M18 12.5 20.3 14.8 24.5 10.5" stroke="var(--ember)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);
const NoChaseIcon = () => (
  <Icon>
    <path d="M5 9a3 3 0 0 1 3-3h16a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H14l-5.5 4.5V21H8a3 3 0 0 1-3-3Z" stroke="var(--structure)" strokeWidth="1.75" strokeLinejoin="round" />
    <path d="M11 13.5 14 16.5l7-7" stroke="var(--ember)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);
const FlexGiveIcon = () => (
  <Icon>
    <circle cx="16" cy="10" r="5" stroke="var(--ember)" strokeWidth="1.75" />
    <path d="M16 15v5" stroke="var(--structure)" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M8 25a5 5 0 0 1 5-5M24 25a5 5 0 0 0-5-5" stroke="var(--structure)" strokeWidth="1.75" strokeLinecap="round" />
    <circle cx="8" cy="26" r="1.6" fill="var(--structure)" />
    <circle cx="24" cy="26" r="1.6" fill="var(--structure)" />
    <circle cx="16" cy="27" r="1.6" fill="var(--ember)" />
  </Icon>
);
const RevealIcon = () => (
  <Icon>
    <rect x="8" y="15" width="16" height="11" rx="1.5" stroke="var(--ember)" strokeWidth="1.75" />
    <path d="M8 19.5h16M16 15v11" stroke="var(--ember)" strokeWidth="1.5" />
    <path d="M16 6v3M11 8l1.6 1.6M21 8l-1.6 1.6" stroke="var(--structure)" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M16 15c-1.6-1.8-1.6-4.5 0-4.5s1.6 2.7 0 4.5Z" fill="var(--ember-soft)" stroke="var(--ember)" strokeWidth="1.2" />
  </Icon>
);
const ExactFitIcon = () => (
  <Icon>
    <rect x="6" y="12" width="20" height="14" rx="1.5" stroke="var(--structure)" strokeWidth="1.75" />
    <path d="M6 17.5h20" stroke="var(--structure)" strokeWidth="1.5" />
    <circle cx="23" cy="10" r="5" fill="var(--card)" stroke="var(--ember)" strokeWidth="1.75" />
    <path d="M20.8 10 22.3 11.5 25.2 8.5" stroke="var(--ember)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);
const NoReturnIcon = () => (
  <Icon>
    <rect x="7" y="8" width="15" height="15" rx="1.5" stroke="var(--structure)" strokeWidth="1.75" />
    <path d="M11.5 15.5 14.5 18.5 19 13" stroke="var(--ember)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M23 22a5 5 0 1 0-2-9.4" stroke="var(--structure)" strokeOpacity="0.4" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M8 8 24 24" stroke="var(--structure)" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />
  </Icon>
);
const GrowIcon = () => (
  <Icon>
    <rect x="6" y="19" width="5" height="7" rx="1" stroke="var(--structure)" strokeOpacity="0.5" strokeWidth="1.75" />
    <rect x="13.5" y="14" width="5" height="12" rx="1" stroke="var(--structure)" strokeWidth="1.75" />
    <rect x="21" y="8" width="5" height="18" rx="1" stroke="var(--ember)" strokeWidth="1.75" />
    <path d="M23.5 3v3M20.7 5.3l1.8 1.8M26.3 5.3l-1.8 1.8" stroke="var(--ember)" strokeWidth="1.5" strokeLinecap="round" />
  </Icon>
);
const TogetherIcon = () => (
  <Icon>
    <circle cx="13" cy="16" r="8" stroke="var(--structure)" strokeWidth="1.75" />
    <circle cx="20" cy="16" r="8" stroke="var(--ember)" strokeWidth="1.75" />
    <path d="M16 13.3c1.2-1.4 3.2-1 3.2 1 0 2-3.2 3.7-3.2 3.7s-3.2-1.7-3.2-3.7c0-2 2-2.4 3.2-1Z" fill="var(--ember-soft)" stroke="var(--ember)" strokeWidth="1" />
  </Icon>
);
const CarryForwardIcon = () => (
  <Icon>
    <path d="M8 11a9 9 0 1 1-1.8 6.4" stroke="var(--ember)" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M8 6v5h5" stroke="var(--ember)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16" cy="17" r="2" fill="var(--structure)" />
  </Icon>
);
const SealedIcon = () => (
  <Icon>
    <rect x="6" y="13" width="20" height="13" rx="1.5" stroke="var(--structure)" strokeWidth="1.75" />
    <path d="M6 18h20" stroke="var(--structure)" strokeWidth="1.5" />
    <circle cx="16" cy="18" r="4.5" fill="var(--ember-soft)" stroke="var(--ember)" strokeWidth="1.5" />
    <path d="M16 15.8v4.4M14.3 17l1.7-1.2 1.7 1.2" stroke="var(--ember)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);
const YouKnowBestIcon = () => (
  <Icon>
    <rect x="8" y="6" width="16" height="20" rx="2" stroke="var(--structure)" strokeWidth="1.75" />
    <path d="M12 4h8v4h-8z" fill="var(--card)" stroke="var(--structure)" strokeWidth="1.5" />
    <path d="M11.5 14.5 13.5 16.5 17 12.5" stroke="var(--ember)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.5 21h9" stroke="var(--structure)" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />
  </Icon>
);
const ShareIcon = () => (
  <Icon>
    <circle cx="9" cy="16" r="3.2" stroke="var(--ember)" strokeWidth="1.75" />
    <circle cx="23" cy="8" r="3.2" stroke="var(--structure)" strokeWidth="1.75" />
    <circle cx="23" cy="24" r="3.2" stroke="var(--structure)" strokeWidth="1.75" />
    <path d="M11.8 14.5 20.2 9.5M11.8 17.5 20.2 22.5" stroke="var(--structure)" strokeOpacity="0.5" strokeWidth="1.5" />
  </Icon>
);
const CalmIcon = () => (
  <Icon>
    <rect x="6" y="8" width="20" height="17" rx="2" stroke="var(--structure)" strokeWidth="1.75" />
    <path d="M6 13h20" stroke="var(--structure)" strokeWidth="1.5" />
    <path d="M11 6v4M21 6v4" stroke="var(--structure)" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M11.5 19 14 21.5 20 15.5" stroke="var(--ember)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);
const GetRightIcon = () => (
  <Icon>
    <path d="M16 5 25 8.5V16c0 6-4 9.5-9 11-5-1.5-9-5-9-11V8.5Z" stroke="var(--ember)" strokeWidth="1.75" strokeLinejoin="round" />
    <path d="M12 16 15 19l6-7" stroke="var(--structure)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);

interface Pillar {
  icon: () => React.ReactElement;
  title: string;
  desc: string;
  caption?: string;
}

const CONTRIBUTOR_PILLARS: Pillar[] = [
  { icon: NoGuessIcon, title: "No more guessing.", desc: "Know exactly what to get — no “what do you actually want?” texts, no gift card nobody's excited about." },
  { icon: NoDoubleIcon, title: "Never double up.", desc: "See what's already covered before you buy, so nothing's wasted and nothing's duplicated.", caption: "3 in 5 Brits have received an unwanted gift (Finder UK, 2025)." },
  { icon: NoChaseIcon, title: "No chasing, ever.", desc: "One link replaces the group chat, the spreadsheet, and the “has everyone paid yet?” messages." },
  { icon: FlexGiveIcon, title: "Give exactly what fits.", desc: "Any amount, any way — paste a link and buy something outright, chip in what suits your budget, or help build toward something bigger. No overspending to compensate for not knowing what to get.", caption: "Mintel: the pressure to get the right gift pushes people past what they meant to spend." },
  { icon: RevealIcon, title: "The reveal makes it worth it.", desc: "The surprise stays completely intact until one emotional moment on the day — your message or video included." },
];

const RECEIVER_PILLARS: Pillar[] = [
  { icon: ExactFitIcon, title: "Exactly what you wanted, not what was left.", desc: "No more drawers of things that missed the mark." },
  { icon: NoReturnIcon, title: "Never explain, never return.", desc: "No awkward “what do you want” conversations, no receipts, no returns queue." },
  { icon: GrowIcon, title: "Bigger things become possible.", desc: "Instead of a handful of smaller gifts that don't quite land, get a real step closer to something that actually matters to you." },
  { icon: TogetherIcon, title: "Built with the people who love you.", desc: "Combine with family, a partner, or friends for joint wishes that mean more together." },
  { icon: CarryForwardIcon, title: "Keep the momentum going.", desc: "Carry a wish forward across occasions — two birthdays and two Christmases pooled together can fund something genuinely life-changing." },
  { icon: SealedIcon, title: "Still a total surprise.", desc: "The reveal is real: sealed until the moment, with the people who love you showing up in it." },
];

const PARENT_PILLARS: Pillar[] = [
  { icon: YouKnowBestIcon, title: "You know them best.", desc: "Build their list yourself — the things you know they'll actually love or need." },
  { icon: ShareIcon, title: "Share it, skip the duplicates.", desc: "Grandparents, aunts, uncles and friends see exactly what's still needed before they buy." },
  { icon: CalmIcon, title: "No last-minute panic calls.", desc: "Nobody's guessing, nobody's texting you at 9pm on Christmas Eve." },
  { icon: GetRightIcon, title: "They get it right, every time.", desc: "Because you chose it, and everyone knew what was already covered." },
];

const TABS: { key: PersonaKey; label: string; pillars: Pillar[] }[] = [
  { key: "contributor", label: "I'm chipping in", pillars: CONTRIBUTOR_PILLARS },
  { key: "receiver", label: "It's for me", pillars: RECEIVER_PILLARS },
  { key: "parent", label: "I'm a parent", pillars: PARENT_PILLARS },
];

export function PersonaBenefits() {
  const [active, setActive] = useState<PersonaKey>("contributor");
  const reduce = useReducedMotion();
  const tab = TABS.find((t) => t.key === active)!;
  const sectionRef = useRef<HTMLDivElement>(null);
  // Scroll-triggered stagger-in for the pillar cards, once, on first entry
  // into the viewport (proven useInView pattern, matching the rest of this
  // page — framer's own whileInView prop fights the tab-switch
  // AnimatePresence and leaves cards stuck mid-fade, so this drives it by
  // hand instead).
  const sectionInView = useInView(sectionRef, { once: true, margin: "-60px" });

  return (
    <section id="families" className="bg-[#fdf9f5] py-24 px-5" ref={sectionRef}>
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700 mb-3">Made for how you actually give</p>
          <h2 style={{ fontFamily: "var(--font-display)" }} className="text-[34px] md:text-[46px] font-bold text-stone-900 leading-[1.1]">
            Whichever side you&apos;re on
          </h2>
        </div>

        {/* Persona pill switcher */}
        <div className="mb-10 flex justify-center">
          <div role="tablist" aria-label="Choose your perspective" className="inline-flex flex-wrap justify-center gap-1.5 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-sm">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={active === t.key}
                onClick={() => setActive(t.key)}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-[14px] font-bold transition-colors",
                  active === t.key ? "cta-primary" : "text-stone-500 hover:text-stone-800"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={reduce ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? {} : { opacity: 0, y: -10 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tab.pillars.map((p, i) => (
                <PillarCard key={p.title} pillar={p} index={i} reduce={!!reduce} inView={sectionInView} />
              ))}
            </div>

            {active === "contributor" && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-stone-200 bg-white/70 px-4 py-3">
                  <p className="text-[13px] text-stone-600">
                    Earn {CREDIT.line}, toward your own wishes.<sup>*</sup>
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-white/70 px-4 py-3">
                  <p className="text-[13px] text-stone-600">
                    Every contribution enters the {DRAW.name} of {DRAW.amount}.<sup>*</sup>
                  </p>
                </div>
                <p className="sm:col-span-2 text-[11px] text-stone-600">
                  <sup>*</sup> <DrawMicrocopy />
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function PillarCard({ pillar, index, reduce, inView }: { pillar: Pillar; index: number; reduce: boolean; inView: boolean }) {
  const Icon = pillar.icon;
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={reduce || inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 340, damping: 30, delay: index * 0.04 }}
      className="h-full rounded-2xl border border-stone-200 bg-white p-5"
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ember-soft)]">
        <Icon />
      </div>
      <h3 className="text-[15px] font-bold text-stone-800 mb-1.5 leading-snug">{pillar.title}</h3>
      <p className="text-[13px] text-stone-500 leading-relaxed">{pillar.desc}</p>
      {pillar.caption && <p className="mt-2.5 text-[11px] italic text-stone-600 leading-relaxed">{pillar.caption}</p>}
    </motion.div>
  );
}

function cn(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}
