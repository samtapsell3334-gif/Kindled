"use client";

import { useState } from "react";
import { Flame, Compass, Gift, User, Plus, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { PotCard } from "@/components/pots/PotCard";
import type { PotCardData } from "@/types/pots";

// ─── Mock data — four scenarios ───────────────────────────────────────────────
//
//  1. Mountain Bike   — LIVE_FEED     — normal progress card
//  2. PS5 Bundle      — UNDER_THE_TREE, isLocked:true  — receiver sees Christmas gift box + snow
//  3. Sony Camera     — UNDER_THE_TREE, isLocked:false — contributor sees real progress + banner
//  4. Spa Weekend     — WRAPPED_UP,    isLocked:true  — receiver sees birthday gift box + confetti
//
// isLocked is computed server-side (caller = owner + before eventDate).
// Here it is hardcoded per scenario for dashboard demo purposes.

const MOCK_POTS: PotCardData[] = [
  {
    id: "pot_bike",
    title: "Mountain Bike",
    emoji: "🚵",
    raised: 320,
    goal: 650,
    event: { label: "Ongoing", date: "Anytime", isoDate: "2027-01-01T00:00:00Z" },
    contributors: 7,
    accentGradient: "bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400",
    mode: "LIVE_FEED",
    isLocked: false,
    recipientName: "",
    boosterEntries: 0,
    tributes: [],
  },
  {
    id: "pot_ps5",
    title: "PS5 Game Bundle",
    emoji: "🎮",
    raised: 95,
    goal: 120,
    event: { label: "Christmas", date: "Dec 25", isoDate: "2026-12-25T08:00:00Z" },
    contributors: 4,
    accentGradient: "bg-gradient-to-r from-red-700 via-amber-500 to-red-600",
    mode: "UNDER_THE_TREE",
    isLocked: true,           // receiver view: Christmas gift box + snow + countdown
    recipientName: "Sam",
    boosterEntries: 5,
    tributes: [
      { id: "t1", contributorName: "Mum", avatarEmoji: "👩",
        message: "So proud of you — enjoy every second!", recordedAt: "2026-12-20T10:00:00Z" },
      { id: "t2", contributorName: "Dad", avatarEmoji: "👨",
        message: "Happy Christmas, you deserve it.", recordedAt: "2026-12-21T11:00:00Z" },
      { id: "t3", contributorName: "Sarah", avatarEmoji: "👩‍🦰",
        message: "Can't believe you're this old already 😂",
        videoUrl: "mock://sarah-tribute.mp4", recordedAt: "2026-12-22T09:00:00Z" },
      { id: "t4", contributorName: "Jake", avatarEmoji: "🧔",
        message: "Get on FIFA tonight!", recordedAt: "2026-12-23T14:00:00Z" },
    ],
  },
  {
    id: "pot_camera",
    title: "Sony A7 IV Camera",
    emoji: "📷",
    raised: 310,
    goal: 900,
    event: { label: "Christmas", date: "Dec 25", isoDate: "2026-12-25T00:00:00Z" },
    contributors: 6,
    accentGradient: "bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400",
    mode: "UNDER_THE_TREE",
    isLocked: false,          // contributor view: real progress + urgent banner
    recipientName: "Billy",
    boosterEntries: 0,
    tributes: [],
  },
  {
    id: "pot_spa",
    title: "Spa Weekend Break",
    emoji: "🛁",
    raised: 180,
    goal: 350,
    event: { label: "Birthday", date: "Feb 14", isoDate: "2027-02-14T00:00:00Z" },
    contributors: 5,
    accentGradient: "bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-500",
    mode: "WRAPPED_UP",
    isLocked: true,           // receiver view: birthday gift box + confetti + countdown
    recipientName: "Emma",
    boosterEntries: 3,
    tributes: [
      { id: "s1", contributorName: "Lucy",  avatarEmoji: "👩‍🦳",
        message: "You deserve this so much. Relax!", recordedAt: "2027-02-10T10:00:00Z" },
      { id: "s2", contributorName: "Tom",   avatarEmoji: "👱",
        message: "Happy Birthday! Go enjoy it.",
        videoUrl: "mock://tom-tribute.mp4", recordedAt: "2027-02-11T12:00:00Z" },
      { id: "s3", contributorName: "Priya", avatarEmoji: "👩‍🦱",
        message: "Can't wait to hear all about it 🧖",  recordedAt: "2027-02-12T09:00:00Z" },
    ],
  },
];

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabId = "pots" | "explore" | "give" | "profile";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "pots",    label: "My Pots",  icon: Flame   },
  { id: "explore", label: "Explore",  icon: Compass },
  { id: "give",    label: "Give",     icon: Gift    },
  { id: "profile", label: "Profile",  icon: User    },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProfileArea() {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-stone-900 shadow-md shadow-amber-900/30">
            ST
          </div>
          <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-stone-950 bg-emerald-400" />
        </div>
        <div>
          <p className="text-[13px] font-semibold leading-tight text-stone-100">Sam Tapsell</p>
          <p className="text-[11px] leading-tight text-stone-500">
            Wallet: <span className="font-medium text-amber-400">£12.40</span>
          </p>
        </div>
      </div>

      <button
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-stone-800/80 text-stone-400 transition-colors hover:bg-stone-700 active:scale-95"
      >
        <Bell className="h-[18px] w-[18px]" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400" aria-label="Unread notifications" />
      </button>
    </div>
  );
}

function TabBar({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  return (
    <div className="flex items-center gap-1 px-3 pb-3">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium",
              "transition-all duration-150 active:scale-95",
              isActive ? "bg-amber-400/12 text-amber-400" : "text-stone-500 hover:text-stone-300",
            )}
          >
            <Icon className={cn("h-5 w-5 transition-transform duration-150", isActive && "scale-110")} aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function CreatePotFab() {
  return (
    <button
      aria-label="Create new pot"
      className={cn(
        "fixed right-4 bottom-6 z-40",
        "flex h-14 w-14 items-center justify-center rounded-full",
        "bg-gradient-to-br from-amber-400 to-orange-500",
        "shadow-lg shadow-amber-900/40 transition-transform duration-150 active:scale-95",
      )}
    >
      <Plus className="h-6 w-6 text-stone-900" strokeWidth={2.5} aria-hidden />
    </button>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-baseline justify-between px-4 pb-1">
      <h2 className="text-[17px] font-bold tracking-tight text-stone-100">{title}</h2>
      <span className="text-[12px] font-medium text-stone-500">
        {count} {count === 1 ? "pot" : "pots"}
      </span>
    </div>
  );
}

function ModeLegend() {
  return (
    <div className="mx-4 mb-4 flex flex-wrap gap-2">
      {[
        { dot: "bg-emerald-400", label: "Live Feed" },
        { dot: "bg-red-500",    label: "Under the Tree" },
        { dot: "bg-violet-400", label: "Wrapped Up" },
      ].map(({ dot, label }) => (
        <span key={label} className="flex items-center gap-1.5 rounded-full bg-stone-800 px-2.5 py-1 text-[10px] font-medium text-stone-400">
          <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
          {label}
        </span>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
      <span className="text-5xl" aria-hidden>🔥</span>
      <p className="text-[15px] font-semibold text-stone-300">No pots yet</p>
      <p className="text-[13px] text-stone-500">Create your first Kindling pot to get started.</p>
    </div>
  );
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-8 py-20 text-center">
      <p className="text-[15px] font-semibold text-stone-400">{label}</p>
      <p className="text-[13px] text-stone-600">Coming soon</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PotsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("pots");

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-stone-800/60 bg-stone-950/90 backdrop-blur-md">
        <ProfileArea />
        <TabBar active={activeTab} onChange={setActiveTab} />
      </header>

      <main className="min-h-[calc(100dvh-132px)] pb-28">
        {activeTab === "pots" && (
          <>
            <div className="pt-4 pb-2">
              <SectionHeader title="Active Pots" count={MOCK_POTS.length} />
            </div>

            <ModeLegend />

            {MOCK_POTS.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="flex flex-col gap-3 px-4">
                {MOCK_POTS.map((pot) => (
                  <PotCard key={pot.id} pot={pot} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "explore" && <PlaceholderTab label="Explore pots" />}
        {activeTab === "give"    && <PlaceholderTab label="Give to a friend" />}
        {activeTab === "profile" && <PlaceholderTab label="Your profile" />}
      </main>

      {activeTab === "pots" && <CreatePotFab />}
    </>
  );
}
