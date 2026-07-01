"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Heart, Copy, Check, ChevronRight, SkipForward, Gift, Flame, User, Trophy, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FundingBar } from "@/components/pots/FundingBar";
import type { GiftingMode, VideoTribute } from "@/types/pots";

// ─── Types & constants ────────────────────────────────────────────────────────

interface UnwrapCeremonyProps {
  potTitle: string;
  raised: number;
  goal: number;
  mode: GiftingMode;
  tributes: VideoTribute[];
  boosterEntries?: number;
  onClose: () => void;
}

type Phase = "preload" | "spinning" | "mosaic" | "tributes" | "splash";

const TRIBUTE_DURATION_MS = 4000;

// Seasonal theme tokens
interface SeasonTheme {
  GiftIcon: LucideIcon;
  giftIconColor: string;
  giftLabel: string;
  glowClass: string;
  boxGradient: string;
  accentFrom: string;
  accentTo: string;
  particleColors: string[];
  sliderTrack: string;
  sliderKnob: string;
  boosterBg: string;
}

function getTheme(mode: GiftingMode): SeasonTheme {
  if (mode === "WRAPPED_UP") {
    return {
      GiftIcon: Gift,
      giftIconColor: "text-violet-300",
      giftLabel: "Birthday gift",
      glowClass: "animate-gift-glow-plum",
      boxGradient: "from-violet-700/30 to-fuchsia-800/20",
      accentFrom: "from-violet-500",
      accentTo: "to-fuchsia-500",
      particleColors: ["#a78bfa","#f0abfc","#e879f9","#c084fc","#f9a8d4","#818cf8"],
      sliderTrack: "bg-gradient-to-r from-violet-900 to-fuchsia-600",
      sliderKnob: "bg-gradient-to-br from-violet-400 to-fuchsia-400",
      boosterBg: "from-violet-900/60 to-fuchsia-900/40 border-violet-500/30",
    };
  }
  return {
    GiftIcon: Gift,
    giftIconColor: "text-amber-400",
    giftLabel: "Christmas gift",
    glowClass: "animate-gift-glow",
    boxGradient: "from-red-800/30 to-amber-700/20",
    accentFrom: "from-amber-400",
    accentTo: "to-orange-500",
    particleColors: ["#fbbf24","#fb923c","#f59e0b","#fcd34d","#ef4444","#f97316"],
    sliderTrack: "bg-gradient-to-r from-stone-800 to-amber-600",
    sliderKnob: "bg-gradient-to-br from-amber-400 to-orange-400",
    boosterBg: "from-amber-900/60 to-orange-900/40 border-amber-500/30",
  };
}

// ─── Explosion particles ──────────────────────────────────────────────────────

interface Particle { id: number; tx: string; ty: string; size: number; color: string; delay: number }

function makeParticles(colors: string[], count = 36): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 360 + Math.random() * 10;
    const dist = 80 + Math.random() * 200;
    const rad = (angle * Math.PI) / 180;
    return {
      id: i,
      color: colors[i % colors.length]!,
      tx: `translateX(${Math.cos(rad) * dist}px)`,
      ty: `translateY(${Math.sin(rad) * dist}px)`,
      size: 5 + Math.floor(Math.random() * 10),
      delay: Math.random() * 0.2,
    };
  });
}

// ─── Phase 1: Preload — ignition slider ──────────────────────────────────────

interface IgnitionSliderProps {
  theme: SeasonTheme;
  onIgnite: () => void;
}

function IgnitionSlider({ theme, onIgnite }: IgnitionSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0); // 0–1
  const isDragging = useRef(false);
  const fired = useRef(false);

  function getRelativeX(clientX: number): number {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }

  function onStart(clientX: number) {
    isDragging.current = true;
    setProgress(getRelativeX(clientX));
  }
  function onMove(clientX: number) {
    if (!isDragging.current) return;
    const p = getRelativeX(clientX);
    setProgress(p);
    if (p >= 0.85 && !fired.current) {
      fired.current = true;
      onIgnite();
    }
  }
  function onEnd() { isDragging.current = false; if (!fired.current) setProgress(0); }

  return (
    <div className="w-full px-6">
      <p className="mb-4 text-center text-[12px] font-medium text-stone-500">
        Slide to ignite your reveal
      </p>

      {/* Track */}
      <div
        ref={trackRef}
        className={cn("relative h-14 w-full cursor-pointer select-none rounded-full", theme.sliderTrack)}
        onMouseDown={(e) => onStart(e.clientX)}
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        onTouchStart={(e) => onStart(e.touches[0]?.clientX ?? 0)}
        onTouchMove={(e) => onMove(e.touches[0]?.clientX ?? 0)}
        onTouchEnd={onEnd}
        role="slider"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Ignition slider"
      >
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full opacity-60 transition-none"
          style={{ width: `${progress * 100}%`, background: "rgba(251,191,36,0.25)" }}
        />

        {/* Track label */}
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <Flame className="h-3.5 w-3.5 text-white/40" />
          <span className="text-[13px] font-bold tracking-widest text-white/40 select-none">
            S L I D E &nbsp; T O &nbsp; I G N I T E
          </span>
        </div>

        {/* Knob */}
        <div
          className={cn(
            "animate-knob-pulse absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center",
            "rounded-full shadow-lg transition-none",
            theme.sliderKnob,
          )}
          style={{ left: `calc(${progress * 100}% - ${progress * 48}px)` }}
        >
          <ChevronRight className="h-6 w-6 text-stone-900" strokeWidth={3} />
        </div>
      </div>
    </div>
  );
}

// ─── Phase 2: Spinning — slot machine counter ─────────────────────────────────

function SlotCounter({ raised, onDone }: { raised: number; onDone: () => void }) {
  const [display, setDisplay] = useState(0);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const duration = 2600;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic: fast start, slow finish
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.floor(eased * raised));

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplay(raised);
        setLocked(true);
        setTimeout(onDone, 700);
      }
    }

    requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-[13px] font-medium uppercase tracking-widest text-stone-500">
        Total raised
      </p>

      <div
        className={cn(
          "font-mono text-[64px] font-black leading-none tracking-tight",
          locked ? "animate-digit-lock text-amber-400" : "text-stone-300",
        )}
      >
        £{display.toLocaleString()}
      </div>

      {/* Blurred contributor silhouettes */}
      <div className="mt-2 flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-800 blur-[3px]"
          >
            <User className="h-5 w-5 text-stone-500" />
          </div>
        ))}
      </div>

      <p className="text-[12px] text-stone-600">Tallying contributions…</p>
    </div>
  );
}

// ─── Phase 3: Mosaic explosion ────────────────────────────────────────────────

interface MosaicProps {
  tributes: VideoTribute[];
  particles: Particle[];
  onDone: () => void;
}

function MosaicExplosion({ tributes, particles, onDone }: MosaicProps) {
  const [flownIn, setFlownIn] = useState(false);
  const [productVisible, setProductVisible] = useState(false);
  const [shaking, setShaking] = useState(true);

  // Each avatar starts at a random off-screen position
  const startOffsets = useMemo(
    () =>
      tributes.map((_, i) => {
        const angle = (i / tributes.length) * 360;
        const rad = (angle * Math.PI) / 180;
        return {
          x: `${Math.cos(rad) * 400}px`,
          y: `${Math.sin(rad) * 400}px`,
        };
      }),
    [tributes],
  );

  useEffect(() => {
    const t1 = setTimeout(() => setShaking(false), 620);
    const t2 = setTimeout(() => setFlownIn(true), 300);
    const t3 = setTimeout(() => setProductVisible(true), 1000);
    const t4 = setTimeout(onDone, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("flex w-full flex-col items-center gap-6", shaking && "animate-shake")}>
      {/* Particle burst */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {particles.map((p) => (
          <span
            key={p.id}
            className="animate-particle absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              background: p.color,
              "--tx": p.tx,
              "--ty": p.ty,
              animationDelay: `${p.delay}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Product image (frosted → revealed) */}
      <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-stone-800/60">
        <Gift
          className="h-14 w-14 text-amber-300 transition-all duration-1000"
          strokeWidth={1.2}
          style={{ filter: productVisible ? "blur(0)" : "blur(12px)", opacity: productVisible ? 1 : 0.3 }}
        />
      </div>

      <p className="flex items-center gap-1.5 text-[16px] font-bold text-stone-100">
        <Gift className="h-4 w-4 text-amber-300" /> It&apos;s yours!
      </p>

      {/* Avatar mosaic */}
      <div className="grid grid-cols-4 gap-3">
        {tributes.map((t, i) => (
          <div
            key={t.id}
            className="avatar-fly flex flex-col items-center gap-1"
            style={{
              transform: flownIn
                ? "translate(0,0)"
                : `translate(${startOffsets[i]?.x ?? "0px"}, ${startOffsets[i]?.y ?? "0px"})`,
              opacity: flownIn ? 1 : 0,
            }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-800 text-[15px] font-bold text-amber-300 shadow-md">
              {t.contributorName.charAt(0)}
            </div>
            <span className="text-[9px] text-stone-500 text-center leading-tight max-w-[48px] truncate">
              {t.contributorName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Phase 4: Tribute showreel ────────────────────────────────────────────────

function TributeShowreel({
  tributes,
  onDone,
}: {
  tributes: VideoTribute[];
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [key, setKey] = useState(0);

  const advance = useCallback(() => {
    if (index + 1 >= tributes.length) {
      onDone();
    } else {
      setIndex((i) => i + 1);
      setKey((k) => k + 1);
    }
  }, [index, tributes.length, onDone]);

  useEffect(() => {
    const id = setTimeout(advance, TRIBUTE_DURATION_MS);
    return () => clearTimeout(id);
  }, [key, advance]);

  const tribute = tributes[index];
  if (!tribute) return null;

  const isVideo = Boolean(tribute.videoUrl);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-stone-500">
          <Heart className="h-3 w-3" /> Messages from your people
        </p>
        <button
          onClick={advance}
          className="flex items-center gap-1 text-[11px] text-stone-600 active:text-stone-400"
        >
          Skip <SkipForward className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Card */}
      <div
        key={tribute.id}
        className="animate-scale-in overflow-hidden rounded-2xl border border-stone-800 bg-stone-900"
      >
        {isVideo ? (
          <div className="relative flex h-52 items-center justify-center bg-stone-800">
            <span className="text-5xl font-bold text-amber-300">{tribute.contributorName.charAt(0)}</span>
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/90 shadow-lg">
                <div className="ml-1 h-0 w-0 border-y-[8px] border-l-[14px] border-y-transparent border-l-stone-900" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[140px] items-center justify-center p-6">
            <p className="text-center text-[16px] leading-relaxed text-stone-200">
              &ldquo;{tribute.message}&rdquo;
            </p>
          </div>
        )}

        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-800 text-[12px] font-bold text-amber-300">
              {tribute.contributorName.charAt(0)}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-stone-200">{tribute.contributorName}</p>
              {!isVideo && (
                <p className="text-[11px] text-stone-500">Text tribute</p>
              )}
            </div>
          </div>
        </div>

        {/* Auto-progress bar */}
        <div className="h-[3px] w-full overflow-hidden bg-stone-800">
          <div
            key={key}
            className="animate-tribute-bar h-full bg-amber-400"
            style={{ "--tribute-dur": `${TRIBUTE_DURATION_MS}ms` } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5">
        {tributes.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === index ? "w-4 bg-amber-400" : "w-1.5 bg-stone-700",
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Phase 5: Splash ─────────────────────────────────────────────────────────

function SplashScreen({
  potTitle,
  raised,
  goal,
  boosterEntries,
  theme,
  onClose,
}: {
  potTitle: string;
  raised: number;
  goal: number;
  boosterEntries: number;
  theme: SeasonTheme;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function handleThankYou() {
    const msg = `Thank you all so much for my ${potTitle} — I'm genuinely overwhelmed by your generosity!`;
    void navigator.clipboard.writeText(msg).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Balance summary */}
      <div className="animate-fade-up rounded-2xl border border-stone-800 bg-stone-900 p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          Final balance
        </p>
        <FundingBar raised={raised} goal={goal} />
      </div>

      {/* Booster draw notice */}
      {boosterEntries > 0 && (
        <div
          className={cn(
            "animate-fade-up rounded-2xl border bg-gradient-to-br p-4",
            theme.boosterBg,
          )}
          style={{ animationDelay: "0.12s" }}
        >
          <div className="flex items-start gap-3">
            <Trophy className="h-6 w-6 shrink-0 text-amber-400" strokeWidth={1.5} />
            <div>
              <p className="text-[13px] font-bold">
                <span className="animate-gold-shimmer">
                  Prize draw entry!
                </span>
              </p>
              <p className="mt-1 text-[12px] leading-snug text-stone-300">
                You&apos;ve earned{" "}
                <span className="font-bold text-amber-400">{boosterEntries} entries</span> into
                the{" "}
                <span className="font-semibold text-stone-200">£2,500 quarterly prize draw</span>.
                There&apos;s a free entry route — no purchase necessary. Good luck!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Say Thanks CTA */}
      <div
        className="animate-fade-up"
        style={{ animationDelay: "0.24s" }}
      >
        <button
          onClick={handleThankYou}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-2xl py-4",
            "bg-gradient-to-r text-[15px] font-bold text-stone-900",
            "shadow-lg transition-transform active:scale-95",
            theme.accentFrom,
            theme.accentTo,
            "shadow-amber-900/40",
          )}
        >
          {copied ? (
            <>
              <Check className="h-5 w-5" aria-hidden />
              Copied to clipboard!
            </>
          ) : (
            <>
              <Heart className="h-5 w-5 fill-stone-900" aria-hidden />
              Say Thank You
              <Copy className="h-4 w-4 opacity-70" aria-hidden />
            </>
          )}
        </button>
        <p className="mt-2 text-center text-[11px] text-stone-600">
          Copies a message to paste straight into your group chat
        </p>
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="text-center text-[12px] text-stone-600 underline underline-offset-2 active:text-stone-400"
      >
        Close
      </button>
    </div>
  );
}

// ─── Root ceremony orchestrator ───────────────────────────────────────────────

export function UnwrapCeremony({
  potTitle,
  raised,
  goal,
  mode,
  tributes,
  boosterEntries = 5,
  onClose,
}: UnwrapCeremonyProps) {
  const [phase, setPhase] = useState<Phase>("preload");
  const theme = useMemo(() => getTheme(mode), [mode]);
  const particles = useMemo(() => makeParticles(theme.particleColors), [theme]);

  function advance(to: Phase) { setPhase(to); }

  // Keyboard shortcut: Escape to close from splash
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && phase === "splash") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-stone-950">
      {/* Phase-specific scroll container */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-10">

        {/* ── Phase 1: Preload / ignition slider ── */}
        {phase === "preload" && (
          <div className="flex w-full max-w-sm flex-col items-center gap-8">
            <div
              className={cn(
                "flex h-40 w-40 items-center justify-center rounded-3xl",
                "bg-gradient-to-br border-2 border-white/10",
                theme.boxGradient, theme.glowClass,
              )}
            >
              <theme.GiftIcon className={cn("h-20 w-20", theme.giftIconColor)} strokeWidth={1.2} aria-label={theme.giftLabel} />
            </div>

            <div className="text-center">
              <h1 className="text-[22px] font-bold text-stone-100">{potTitle}</h1>
              <p className="mt-1 text-[14px] text-stone-400">
                Your people went all out. Ready to see?
              </p>
            </div>

            {/* Blurred slot reels teaser */}
            <div className="flex gap-3 opacity-60">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex h-16 w-14 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl bg-stone-900 blur-[2px]">
                  <span className="text-xs text-stone-500 font-mono">£</span>
                  <span className="font-mono text-xl font-bold text-stone-300">
                    {["X","X","X","X"][i]}
                  </span>
                </div>
              ))}
            </div>

            <IgnitionSlider theme={theme} onIgnite={() => advance("spinning")} />
          </div>
        )}

        {/* ── Phase 2: Slot machine spin ── */}
        {phase === "spinning" && (
          <div className="flex w-full max-w-sm flex-col items-center gap-8">
            <SlotCounter raised={raised} onDone={() => advance("mosaic")} />
          </div>
        )}

        {/* ── Phase 3: Mosaic explosion ── */}
        {phase === "mosaic" && (
          <div className="relative flex w-full max-w-sm flex-col items-center gap-6">
            <MosaicExplosion
              tributes={tributes.length > 0 ? tributes : [
                { id: "anon", contributorName: "Anonymous",
                  message: "With love!", recordedAt: new Date().toISOString() },
              ]}
              particles={particles}
              onDone={() => advance(tributes.length > 0 ? "tributes" : "splash")}
            />
          </div>
        )}

        {/* ── Phase 4: Tribute showreel ── */}
        {phase === "tributes" && (
          <div className="w-full max-w-sm">
            <TributeShowreel
              tributes={tributes}
              onDone={() => advance("splash")}
            />
          </div>
        )}

        {/* ── Phase 5: Splash ── */}
        {phase === "splash" && (
          <div className="w-full max-w-sm pb-4">
            <div className="animate-fade-up mb-5 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-amber-400" strokeWidth={1.2} aria-hidden />
              <h1 className="mt-2 text-[22px] font-bold text-stone-100">
                Your {potTitle}!
              </h1>
              <p className="mt-1 text-[13px] text-stone-400">
                Here&apos;s the full picture
              </p>
            </div>

            <SplashScreen
              potTitle={potTitle}
              raised={raised}
              goal={goal}
              boosterEntries={boosterEntries}
              theme={theme}
              onClose={onClose}
            />
          </div>
        )}
      </div>

      {/* Phase indicator dots */}
      <div className="flex justify-center gap-1.5 pb-5">
        {(["preload","spinning","mosaic","tributes","splash"] as Phase[]).map((p) => (
          <span
            key={p}
            className={cn(
              "h-1 rounded-full transition-all duration-400",
              phase === p ? "w-6 bg-amber-400" : "w-1.5 bg-stone-700",
            )}
          />
        ))}
      </div>
    </div>
  );
}
