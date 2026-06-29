"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2, Check, Lock, Plus, Users, ChevronUp, ChevronDown, ChevronRight,
  Play, X, Zap,
  ShoppingBag, RefreshCw, CreditCard, Gift, Flame,
  Package, Leaf, ShieldCheck, Sparkles, Star, Link2,
  Landmark, Radio, Wrench, Trophy, Wallet, Eye,
  Bike, Cake, TreePine, PenLine, Waves, Castle,
  AlertCircle, Copy, TrendingUp, Info, CircleEllipsis, CalendarDays, Gamepad2,
  Heart, Home,
  Plane, UserPlus, TrendingDown, ExternalLink,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { projectCumulative, goalProgress, timeToGoal, MILESTONE_PROFILES, type JointContributor, type GiftingEvent, type MilestoneCategory } from "@/lib/cumulative-projection";
import { trackingDecorator, getRetailer, priceDrop, AFFILIATE_LINK_REL, AFFILIATE_DISCLOSURE } from "@/lib/catalog-service";
import { StarChart } from "@/components/StarChart";
import { MagneticCard } from "@/components/lux/MagneticCard";
import { Reveal } from "@/components/lux/Reveal";
import { VibrantCatalogue } from "@/components/vh/VibrantCatalogue";
import { LUX_EASE, VH_BOUNCE } from "@/lib/motion";
import { FundingBar } from "@/components/pots/FundingBar";
import { CountdownTimer } from "@/components/pots/CountdownTimer";
import { cn } from "@/lib/utils";
import type { GiftingMode } from "@/types/pots";
import { GiftingImpactPanel } from "@/components/GiftingImpactPanel";
import { FirstKindlersCTA } from "@/components/FirstKindlersCTA";
import { GeneratedReveal } from "@/components/GeneratedReveal";
import { InvestorWarRoom } from "@/components/InvestorWarRoom";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface MemoryCard {
  id: string;
  name: string;
  message: string;
  rot: number;
  delay: number;
  hasVideo?: boolean;
}

interface DemoPot {
  id: string;
  title: string;
  image?: string;
  goal: number;
  raised: number;
  mode: GiftingMode;
  continuous: boolean;
  eventLabel: string;
  eventDate: string;
  eventIso: string;
  contributors: number;
  boosterEntries: number;
  accentGradient: string;
  tributes: MemoryCard[];
  // Parent Knows Best / checklist pots
  tag?: string;
  isClaimed?: boolean;
  claimedBy?: string;
  claimedNote?: string;
  /** Secondary "stack to the next event" line shown beneath covered pots. */
  stackNote?: string;
  /** True for checklist/"Mum Knows Best" items — hidden from receiver & contributor views. */
  isChecklist?: boolean;
}


interface CatalogItem {
  id: string;
  name: string;
  image: string;
  price: number;
  tag: string;
  tagColor: string;
  glowColor: string;
  category: string;
  hearts: number;
  brand?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEED DATA
// ═══════════════════════════════════════════════════════════════════════════════

const INITIAL_POTS: DemoPot[] = [
  {
    id: "p1", title: "Super-Fast Mountain Bike",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80",
    goal: 450, raised: 310, mode: "LIVE_FEED", continuous: true,
    eventLabel: "Ongoing", eventDate: "Anytime", eventIso: "2027-01-01T00:00:00Z",
    contributors: 7, boosterEntries: 0,
    accentGradient: "from-emerald-500 via-teal-400 to-cyan-400",
    tributes: [],
    stackNote: "Next up: Birthday 2027 — stack balance to unlock an even larger milestone",
  },
  {
    id: "p2", title: "LEGO Star Wars Millennium Falcon",
    image: "https://images.unsplash.com/photo-1608889476518-738c9b1dcb40?w=400&h=400&fit=crop&q=80",
    goal: 730, raised: 730, mode: "UNDER_THE_TREE", continuous: true,
    eventLabel: "Christmas", eventDate: "Dec 25", eventIso: "2026-12-25T08:00:00Z",
    contributors: 9, boosterEntries: 8,
    accentGradient: "from-red-700 via-amber-500 to-red-600",
    tributes: [
      { id: "t1", name: "Grandma Jean", rot: -4, delay: 0,
        message: "Happy Christmas sweetheart! We knew you wanted this forever. Build it with love!", hasVideo: true },
      { id: "t2", name: "Uncle Pete", rot: 3, delay: 120,
        message: "7541 pieces... good luck! Happy Christmas mate, enjoy every single one!" },
      { id: "t3", name: "Dad", rot: -2, delay: 240,
        message: "Merry Christmas! Build it before New Year's — I'll time you!", hasVideo: true },
      { id: "t4", name: "The School Crew", rot: 2, delay: 360,
        message: "Happy Christmas from all of us! Can't wait to see it finished!" },
    ],
    stackNote: "Next up: 11th Birthday in 2027 — stack balance to unlock an even larger milestone",
  },
  {
    id: "p3", title: "Retro Arcade Cabinet",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop&q=80",
    goal: 250, raised: 80, mode: "LIVE_FEED", continuous: true,
    eventLabel: "Ongoing", eventDate: "Anytime", eventIso: "2027-01-01T00:00:00Z",
    contributors: 3, boosterEntries: 0,
    accentGradient: "from-fuchsia-500 via-purple-400 to-indigo-500",
    tributes: [],
    stackNote: "Next up: Christmas 2026 — stack balance to unlock an even larger milestone",
  },
  {
    id: "p4", title: "Cosy Log Burner",
    image: "https://images.unsplash.com/photo-1482881497185-d4a9ddbe4151?w=400&h=400&fit=crop&q=80",
    goal: 800, raised: 425, mode: "WRAPPED_UP", continuous: false,
    eventLabel: "Birthday", eventDate: "Jun 28", eventIso: "2026-06-28T10:00:00Z",
    contributors: 5, boosterEntries: 3,
    accentGradient: "from-violet-500 via-fuchsia-400 to-pink-500",
    tributes: [
      { id: "b1", name: "The Kids", rot: -3, delay: 0,
        message: "Mum, you are always cold — this one's for you! Cosy nights ahead.", hasVideo: true },
      { id: "b2", name: "Auntie Claire", rot: 4, delay: 140,
        message: "You've wanted one of these for years! Enjoy every warm evening." },
      { id: "b3", name: "Work Crew", rot: -1, delay: 260,
        message: "From all of us — you deserve every cosy moment!", hasVideo: true },
    ],
    stackNote: "Next up: Christmas 2026 — stack balance to unlock an even larger milestone",
  },
];

const CHECKLIST_POTS: DemoPot[] = [
  {
    id: "cl1", title: "LEGO Space Shuttle Explorer", isChecklist: true,
    goal: 25, raised: 25, mode: "LIVE_FEED", continuous: false,
    eventLabel: "Christmas", eventDate: "Dec 25", eventIso: "2026-12-25T08:00:00Z",
    contributors: 1, boosterEntries: 0,
    accentGradient: "from-emerald-400 to-teal-500",
    tributes: [],
    tag: "Grandma Linda",
    isClaimed: true, claimedBy: "Grandma Linda",
    claimedNote: "Shipped directly from Amazon · Arrives Dec 23",
  },
  {
    id: "cl2", title: "Adventure Book Series (x3)", isChecklist: true,
    goal: 15, raised: 15, mode: "LIVE_FEED", continuous: false,
    eventLabel: "Christmas", eventDate: "Dec 25", eventIso: "2026-12-25T08:00:00Z",
    contributors: 1, boosterEntries: 0,
    accentGradient: "from-sky-400 to-blue-500",
    tributes: [],
    tag: "Uncle Steve",
    isClaimed: true, claimedBy: "Uncle Steve",
    claimedNote: "Bringing to the party in person",
  },
  {
    id: "cl3", title: "Marvel Action Figure Set", isChecklist: true,
    goal: 18, raised: 0, mode: "LIVE_FEED", continuous: false,
    eventLabel: "Christmas", eventDate: "Dec 25", eventIso: "2026-12-25T08:00:00Z",
    contributors: 0, boosterEntries: 0,
    accentGradient: "from-rose-400 to-red-500",
    tributes: [],
    tag: "Mum Knows Best",
    isClaimed: false,
  },
];

const CATALOGUE: CatalogItem[] = [
  // ── Tech ──
  { id: "c1",  brand: "Nintendo",  name: "Switch OLED Console",             category: "Tech",        hearts: 847, price: 319,    tag: "Most Circled",  tagColor: "bg-red-100 text-red-600",       glowColor: "#ef4444", image: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=500&h=500&fit=crop&q=85" },
  { id: "c2",  brand: "Apple",     name: "iPhone 16 Pro 128GB",             category: "Tech",        hearts: 1204,price: 1199,   tag: "Dream Gift",    tagColor: "bg-violet-100 text-violet-600", glowColor: "#8b5cf6", image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&h=500&fit=crop&q=85" },
  { id: "c3",  brand: "Apple",     name: "AirPods Pro (3rd Gen)",           category: "Tech",        hearts: 932, price: 249,    tag: "Trending",      tagColor: "bg-emerald-100 text-emerald-600",glowColor: "#10b981", image: "https://images.unsplash.com/photo-1588423771073-b8903fead714?w=500&h=500&fit=crop&q=85" },
  { id: "c4",  brand: "Apple",     name: "iPad 11th Gen 256GB",             category: "Tech",        hearts: 761, price: 399,    tag: "Bestseller",    tagColor: "bg-amber-100 text-amber-600",   glowColor: "#f59e0b", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop&q=85" },
  { id: "c5",  brand: "Meta",      name: "Quest 3S VR Headset",             category: "Tech",        hearts: 589, price: 299,    tag: "High Intent",   tagColor: "bg-fuchsia-100 text-fuchsia-600",glowColor: "#d946ef", image: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=500&h=500&fit=crop&q=85" },
  { id: "c6",  brand: "Sony",      name: "WH-1000XM6 Headphones",          category: "Tech",        hearts: 674, price: 379,    tag: "Fan Fave",      tagColor: "bg-sky-100 text-sky-600",       glowColor: "#0ea5e9", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop&q=85" },
  { id: "c7",  brand: "Amazon",    name: "Kindle Paperwhite 16GB",          category: "Tech",        hearts: 412, price: 149,    tag: "For Readers",   tagColor: "bg-teal-100 text-teal-600",     glowColor: "#14b8a6", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&h=500&fit=crop&q=85" },
  { id: "c8",  brand: "GoPro",     name: "HERO13 Black Action Camera",      category: "Tech",        hearts: 508, price: 399,    tag: "New",           tagColor: "bg-rose-100 text-rose-600",     glowColor: "#f43f5e", image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop&q=85" },
  // ── Gaming ──
  { id: "c9",  brand: "Sony",      name: "PlayStation 5 Slim",              category: "Gaming",      hearts: 1538,price: 449,    tag: "Must Have",     tagColor: "bg-blue-100 text-blue-600",     glowColor: "#3b82f6", image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&h=500&fit=crop&q=85" },
  { id: "c10", brand: "Microsoft", name: "Xbox Series X",                   category: "Gaming",      hearts: 1021,price: 449,    tag: "Trending",      tagColor: "bg-green-100 text-green-600",   glowColor: "#22c55e", image: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=500&h=500&fit=crop&q=85" },
  { id: "c11", brand: "Valve",     name: "Steam Deck OLED 1TB",             category: "Gaming",      hearts: 724, price: 599,    tag: "For Gamers",    tagColor: "bg-indigo-100 text-indigo-600", glowColor: "#6366f1", image: "https://images.unsplash.com/photo-1640955014216-75201056c829?w=500&h=500&fit=crop&q=85" },
  { id: "c12", brand: "Razer",     name: "BlackShark V2 Pro Headset",       category: "Gaming",      hearts: 387, price: 119,    tag: "Pro Pick",      tagColor: "bg-lime-100 text-lime-600",     glowColor: "#84cc16", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop&q=85" },
  { id: "c13", brand: "Nintendo",  name: "Mario Kart Live Circuit",         category: "Gaming",      hearts: 469, price: 99,     tag: "Family Fave",   tagColor: "bg-yellow-100 text-yellow-600", glowColor: "#eab308", image: "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=500&h=500&fit=crop&q=85" },
  // ── Toys ──
  { id: "c14", brand: "LEGO",      name: "Star Wars Millennium Falcon",     category: "Toys",        hearts: 2113,price: 649,    tag: "Icon",          tagColor: "bg-amber-100 text-amber-600",   glowColor: "#f59e0b", image: "https://images.unsplash.com/photo-1608889476518-738c9b1dcb40?w=500&h=500&fit=crop&q=85" },
  { id: "c15", brand: "LEGO",      name: "Technic Lamborghini Urus ST-X",  category: "Toys",        hearts: 1087,price: 349,    tag: "Build It",      tagColor: "bg-orange-100 text-orange-600", glowColor: "#f97316", image: "https://images.unsplash.com/photo-1560961911-ba7ef651a56c?w=500&h=500&fit=crop&q=85" },
  { id: "c16", brand: "LEGO",      name: "Harry Potter Hogwarts Castle",    category: "Toys",        hearts: 1456,price: 549,    tag: "Magical",       tagColor: "bg-violet-100 text-violet-600", glowColor: "#8b5cf6", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&h=500&fit=crop&q=85" },
  { id: "c17", brand: "LEGO",      name: "Ideas Tree House 3-in-1",         category: "Toys",        hearts: 876, price: 229,    tag: "Fan Fave",      tagColor: "bg-emerald-100 text-emerald-600",glowColor: "#10b981", image: "https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=500&h=500&fit=crop&q=85" },
  { id: "c18", brand: "Hot Wheels",name: "Ultimate Garage Playset",         category: "Toys",        hearts: 643, price: 89,     tag: "Bestseller",    tagColor: "bg-red-100 text-red-600",       glowColor: "#ef4444", image: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=500&h=500&fit=crop&q=85" },
  { id: "c19", brand: "Scalextric", name: "Track Day Championship Set",     category: "Toys",        hearts: 512, price: 129,    tag: "Nostalgic",     tagColor: "bg-sky-100 text-sky-600",       glowColor: "#0ea5e9", image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=500&h=500&fit=crop&q=85" },
  // ── Sport ──
  { id: "c20", brand: "Trek",       name: "Marlin 5 Mountain Bike",         category: "Sport",       hearts: 934, price: 699,    tag: "Milestone",     tagColor: "bg-teal-100 text-teal-600",     glowColor: "#14b8a6", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop&q=85" },
  { id: "c21", brand: "Segway",     name: "Ninebot MAX Electric Scooter",   category: "Sport",       hearts: 827, price: 549,    tag: "Trending",      tagColor: "bg-emerald-100 text-emerald-600",glowColor: "#10b981", image: "https://images.unsplash.com/photo-1591123120675-6f7f1aae0e38?w=500&h=500&fit=crop&q=85" },
  { id: "c22", brand: "Nike",       name: "Mercurial Vapor 16 Elite",       category: "Sport",       hearts: 711, price: 219,    tag: "Pro Pick",      tagColor: "bg-orange-100 text-orange-600", glowColor: "#f97316", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop&q=85" },
  { id: "c23", brand: "Surftech",   name: "Learn to Surf Foam Board",       category: "Sport",       hearts: 389, price: 299,    tag: "Adventure",     tagColor: "bg-blue-100 text-blue-600",     glowColor: "#3b82f6", image: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=500&h=500&fit=crop&q=85" },
  { id: "c24", brand: "Bowflex",    name: "SelectTech 552 Dumbbells",       category: "Sport",       hearts: 476, price: 349,    tag: "Home Gym",      tagColor: "bg-rose-100 text-rose-600",     glowColor: "#f43f5e", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=500&fit=crop&q=85" },
  // ── Home ──
  { id: "c25", brand: "Charnwood",  name: "Cosy Log Burner — Beacon S4",    category: "Home",        hearts: 1232,price: 799,    tag: "Milestone",     tagColor: "bg-amber-100 text-amber-600",   glowColor: "#f59e0b", image: "https://images.unsplash.com/photo-1482881497185-d4a9ddbe4151?w=500&h=500&fit=crop&q=85" },
  { id: "c26", brand: "Dyson",      name: "V15 Detect Cordless Hoover",     category: "Home",        hearts: 884, price: 599,    tag: "Bestseller",    tagColor: "bg-violet-100 text-violet-600", glowColor: "#8b5cf6", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500&h=500&fit=crop&q=85" },
  { id: "c27", brand: "KitchenAid", name: "Artisan Stand Mixer 4.8L",       category: "Home",        hearts: 1063,price: 499,    tag: "Dream Kitchen", tagColor: "bg-rose-100 text-rose-600",     glowColor: "#f43f5e", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=500&fit=crop&q=85" },
  { id: "c28", brand: "DFS",        name: "Corner Sofa — Slate Grey",       category: "Home",        hearts: 1578,price: 1299,   tag: "Family Win",    tagColor: "bg-stone-200 text-stone-700",   glowColor: "#78716c", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=500&fit=crop&q=85" },
  { id: "c29", brand: "Nespresso",  name: "Vertuo Next Coffee Machine",     category: "Home",        hearts: 743, price: 149,    tag: "For Coffee Fans",tagColor: "bg-amber-100 text-amber-600",  glowColor: "#f59e0b", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&h=500&fit=crop&q=85" },
  // ── Experiences ──
  { id: "c30", brand: "Merlin",     name: "Alton Towers 2-Day Short Break", category: "Experiences", hearts: 1847,price: 249,    tag: "Memory Maker",  tagColor: "bg-fuchsia-100 text-fuchsia-600",glowColor: "#d946ef", image: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=500&h=500&fit=crop&q=85" },
  { id: "c31", brand: "EDF",        name: "London Eye Family (4 tickets)",  category: "Experiences", hearts: 965, price: 89,     tag: "London Icon",   tagColor: "bg-sky-100 text-sky-600",       glowColor: "#0ea5e9", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=500&h=500&fit=crop&q=85" },
  { id: "c32", brand: "Virgin Exp", name: "Supercar Driving Experience",    category: "Experiences", hearts: 1234,price: 189,    tag: "Bucket List",   tagColor: "bg-red-100 text-red-600",       glowColor: "#ef4444", image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&h=500&fit=crop&q=85" },
  { id: "c33", brand: "Hotel",      name: "Spa Day for Two — 5-Star",       category: "Experiences", hearts: 876, price: 169,    tag: "Ultimate Treat",tagColor: "bg-pink-100 text-pink-600",     glowColor: "#ec4899", image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&h=500&fit=crop&q=85" },
  { id: "c34", brand: "Waitrose",   name: "Hamper — Luxury Christmas",      category: "Experiences", hearts: 623, price: 125,    tag: "Crowd Pleaser", tagColor: "bg-emerald-100 text-emerald-600",glowColor: "#10b981", image: "https://images.unsplash.com/photo-1543258103-a62bdc069871?w=500&h=500&fit=crop&q=85" },
  { id: "c60", brand: "Merlin",     name: "Hot Air Balloon Flight",         category: "Experiences", hearts: 1432,price: 199,    tag: "Bucket List",   tagColor: "bg-fuchsia-100 text-fuchsia-600",glowColor: "#d946ef", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop&q=85" },
  { id: "c61", brand: "Restaurant", name: "Michelin Star Dinner for Two",   category: "Experiences", hearts: 987, price: 249,    tag: "Unforgettable", tagColor: "bg-rose-100 text-rose-600",     glowColor: "#f43f5e", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&h=500&fit=crop&q=85" },
  { id: "c62", brand: "Skydive",    name: "Tandem Skydive Experience",      category: "Experiences", hearts: 1134,price: 299,    tag: "Adrenaline",    tagColor: "bg-orange-100 text-orange-600", glowColor: "#f97316", image: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=500&h=500&fit=crop&q=85" },
  { id: "c63", brand: "F1",         name: "Formula 1 Grand Prix Ticket",    category: "Experiences", hearts: 2341,price: 599,    tag: "Once in Life",  tagColor: "bg-red-100 text-red-600",       glowColor: "#ef4444", image: "https://images.unsplash.com/photo-1541773367-e27d9e58f9b6?w=500&h=500&fit=crop&q=85" },
  // ── Tech extras ──
  { id: "c35", brand: "DJI",        name: "Mini 4 Pro Drone Fly More",      category: "Tech",        hearts: 743, price: 759,    tag: "Sky High",      tagColor: "bg-sky-100 text-sky-600",       glowColor: "#0ea5e9", image: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=500&h=500&fit=crop&q=85" },
  { id: "c36", brand: "Samsung",    name: "Galaxy S25 Ultra 256GB",         category: "Tech",        hearts: 891, price: 1249,   tag: "Flagship",      tagColor: "bg-violet-100 text-violet-600", glowColor: "#8b5cf6", image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&h=500&fit=crop&q=85" },
  { id: "c37", brand: "Apple",      name: "Watch Series 10 45mm",           category: "Tech",        hearts: 634, price: 429,    tag: "Wearable",      tagColor: "bg-stone-200 text-stone-700",   glowColor: "#78716c", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop&q=85" },
  { id: "c38", brand: "Polaroid",   name: "Now+ Instant Camera Gen 2",      category: "Tech",        hearts: 512, price: 119,    tag: "Film Fun",      tagColor: "bg-pink-100 text-pink-600",     glowColor: "#ec4899", image: "https://images.unsplash.com/photo-1520390138845-fd2d229dd553?w=500&h=500&fit=crop&q=85" },
  { id: "c39", brand: "Marshall",   name: "Stanmore III Bluetooth Speaker", category: "Tech",        hearts: 461, price: 399,    tag: "Sound",         tagColor: "bg-stone-200 text-stone-700",   glowColor: "#78716c", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop&q=85" },
  { id: "c40", brand: "Sonos",      name: "Era 300 Spatial Audio Speaker",  category: "Tech",        hearts: 387, price: 449,    tag: "Premium Sound", tagColor: "bg-amber-100 text-amber-600",   glowColor: "#f59e0b", image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&h=500&fit=crop&q=85" },
  // ── Gaming extras ──
  { id: "c41", brand: "Custom",     name: "RTX 4070 Gaming PC Build",       category: "Gaming",      hearts: 1842,price: 1499,   tag: "Ultimate Rig",  tagColor: "bg-violet-100 text-violet-600", glowColor: "#8b5cf6", image: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=500&h=500&fit=crop&q=85" },
  { id: "c42", brand: "Herman Miller",name:"Aeron Gaming Chair",            category: "Gaming",      hearts: 934, price: 1195,   tag: "Pro Setup",     tagColor: "bg-emerald-100 text-emerald-600",glowColor: "#10b981", image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=500&h=500&fit=crop&q=85" },
  { id: "c43", brand: "Pokémon",    name: "TCG Scarlet & Violet Elite Box", category: "Gaming",      hearts: 876, price: 54,     tag: "Collector",     tagColor: "bg-yellow-100 text-yellow-600", glowColor: "#eab308", image: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=500&h=500&fit=crop&q=85" },
  { id: "c44", brand: "Samsung",    name: "Odyssey OLED G8 34\" Monitor",   category: "Gaming",      hearts: 612, price: 799,    tag: "4K OLED",       tagColor: "bg-blue-100 text-blue-600",     glowColor: "#3b82f6", image: "https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=500&h=500&fit=crop&q=85" },
  // ── Toys extras ──
  { id: "c45", brand: "Barbie",     name: "DreamHouse 2024 Edition",        category: "Toys",        hearts: 1241,price: 199,    tag: "Best Seller",   tagColor: "bg-pink-100 text-pink-600",     glowColor: "#ec4899", image: "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=500&h=500&fit=crop&q=85" },
  { id: "c46", brand: "LEGO",       name: "City Police Station 2024",       category: "Toys",        hearts: 743, price: 179,    tag: "City Life",     tagColor: "bg-blue-100 text-blue-600",     glowColor: "#3b82f6", image: "https://images.unsplash.com/photo-1498084393753-b411b2d26b34?w=500&h=500&fit=crop&q=85" },
  { id: "c47", brand: "Nerf",       name: "Hyper Rush 50 Blaster",          category: "Toys",        hearts: 567, price: 59,     tag: "Battle Ready",  tagColor: "bg-orange-100 text-orange-600", glowColor: "#f97316", image: "https://images.unsplash.com/photo-1558618047-f6fa2a2affe5?w=500&h=500&fit=crop&q=85" },
  { id: "c48", brand: "Ravensburger",name:"3D Puzzle — Eiffel Tower 216pc", category: "Toys",        hearts: 423, price: 49,     tag: "Brain Boost",   tagColor: "bg-teal-100 text-teal-600",     glowColor: "#14b8a6", image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=500&h=500&fit=crop&q=85" },
  { id: "c49", brand: "LEGO",       name: "Icons Botanical — Wild Flowers", category: "Toys",        hearts: 654, price: 199,    tag: "Display Piece", tagColor: "bg-emerald-100 text-emerald-600",glowColor: "#10b981", image: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=500&h=500&fit=crop&q=85" },
  // ── Sport extras ──
  { id: "c50", brand: "Red Paddle", name: "Inflatable SUP Paddleboard 10'8",category: "Sport",       hearts: 512, price: 599,    tag: "Summer Vibes",  tagColor: "bg-cyan-100 text-cyan-600",     glowColor: "#06b6d4", image: "https://images.unsplash.com/photo-1530870110042-98b2cb110834?w=500&h=500&fit=crop&q=85" },
  { id: "c51", brand: "Wilson",     name: "Blade 100L v9 Tennis Racket",    category: "Sport",       hearts: 487, price: 229,    tag: "Game Changer",  tagColor: "bg-lime-100 text-lime-600",     glowColor: "#84cc16", image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=500&h=500&fit=crop&q=85" },
  { id: "c52", brand: "Peloton",    name: "Bike+ Smart Indoor Cycle",       category: "Sport",       hearts: 1567,price: 1799,   tag: "Milestone",     tagColor: "bg-red-100 text-red-600",       glowColor: "#ef4444", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=500&fit=crop&q=85" },
  { id: "c53", brand: "Coleman",    name: "Camping Starter Bundle",         category: "Sport",       hearts: 423, price: 299,    tag: "Great Outdoors",tagColor: "bg-green-100 text-green-600",   glowColor: "#22c55e", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500&h=500&fit=crop&q=85" },
  // ── Home extras ──
  { id: "c55", brand: "Ninja",      name: "Double Stack XL Air Fryer",      category: "Home",        hearts: 1234,price: 199,    tag: "Kitchen Must",  tagColor: "bg-stone-200 text-stone-700",   glowColor: "#78716c", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&h=500&fit=crop&q=85" },
  { id: "c56", brand: "Weber",      name: "Master-Touch 57cm Charcoal BBQ", category: "Home",        hearts: 723, price: 399,    tag: "Summer Essential",tagColor: "bg-orange-100 text-orange-600",glowColor: "#f97316", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&h=500&fit=crop&q=85" },
  { id: "c57", brand: "Philips Hue",name: "Colour Ambiance Starter Kit",   category: "Home",        hearts: 543, price: 179,    tag: "Smart Home",    tagColor: "bg-violet-100 text-violet-600", glowColor: "#8b5cf6", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&h=500&fit=crop&q=85" },
  { id: "c58", brand: "Sage",       name: "Barista Express Bean-to-Cup",    category: "Home",        hearts: 1087,price: 649,    tag: "Coffee Lover",  tagColor: "bg-amber-100 text-amber-600",   glowColor: "#f59e0b", image: "https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=500&h=500&fit=crop&q=85" },
  { id: "c59", brand: "Smeg",       name: "50s Retro Pastel Toaster + Kettle",category: "Home",     hearts: 876, price: 249,    tag: "Retro Style",   tagColor: "bg-pink-100 text-pink-600",     glowColor: "#ec4899", image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=500&h=500&fit=crop&q=85" },
  // ── Fashion & Beauty ──
  { id: "c65", brand: "Nike",       name: "Air Jordan 1 High OG Retro",     category: "Fashion",     hearts: 1543,price: 169,    tag: "Streetwear",    tagColor: "bg-red-100 text-red-600",       glowColor: "#ef4444", image: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=500&h=500&fit=crop&q=85" },
  { id: "c66", brand: "Ray-Ban",    name: "Aviator Classic Gold",           category: "Fashion",     hearts: 876, price: 169,    tag: "Timeless",      tagColor: "bg-amber-100 text-amber-600",   glowColor: "#f59e0b", image: "https://images.unsplash.com/photo-1473496169904-658ba7574b0d?w=500&h=500&fit=crop&q=85" },
  { id: "c67", brand: "Levi's",     name: "Oversized Sherpa Trucker Jacket",category: "Fashion",     hearts: 654, price: 199,    tag: "Cosy Fit",      tagColor: "bg-stone-200 text-stone-700",   glowColor: "#78716c", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop&q=85" },
  { id: "c68", brand: "Michael Kors",name:"Jet Set Travel Tote",            category: "Fashion",     hearts: 712, price: 279,    tag: "Designer",      tagColor: "bg-rose-100 text-rose-600",     glowColor: "#f43f5e", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=500&fit=crop&q=85" },
  { id: "c69", brand: "Jo Malone",  name: "London Cologne Discovery Set",   category: "Fashion",     hearts: 543, price: 209,    tag: "Luxury Scent",  tagColor: "bg-stone-200 text-stone-700",   glowColor: "#78716c", image: "https://images.unsplash.com/photo-1541643600914-78b084683702?w=500&h=500&fit=crop&q=85" },
  { id: "c70", brand: "Dyson",      name: "Airwrap Complete Long Edition",  category: "Fashion",     hearts: 2134,price: 479,    tag: "Must Have",     tagColor: "bg-fuchsia-100 text-fuchsia-600",glowColor: "#d946ef", image: "https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=500&h=500&fit=crop&q=85" },
  { id: "c71", brand: "Charlotte T",name: "Pillow Talk Beauty Bundle",      category: "Fashion",     hearts: 987, price: 159,    tag: "Glow Up",       tagColor: "bg-pink-100 text-pink-600",     glowColor: "#ec4899", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&h=500&fit=crop&q=85" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PRE-COMPUTED PARTICLES (avoid hydration mismatch)
// ═══════════════════════════════════════════════════════════════════════════════

const SNOW = Array.from({ length: 16 }, (_, i) => ({
  id: i, left: `${5 + (i * 347) % 90}%`,
  dur: `${2.2 + (i * 0.17) % 1.6}s`, delay: `${(i * 0.23) % 2.8}s`,
  sx: `${-8 + (i * 31) % 16}px`, drift: `${4 + (i * 11) % 12}px`, size: 3 + (i % 3),
}));

const CONFETTI_P = Array.from({ length: 18 }, (_, i) => {
  const cols = ["bg-violet-400","bg-pink-400","bg-fuchsia-400","bg-purple-400","bg-rose-400","bg-amber-400"];
  return { id: i, left: `${3 + (i * 293) % 94}%`, dur: `${1.8 + (i * 0.19) % 1.4}s`,
    delay: `${(i * 0.21) % 2.5}s`, rot: `${180 + (i * 73) % 540}deg`,
    color: cols[i % cols.length]!, w: 4 + (i % 4), h: 6 + (i % 5) };
});

// Ascending light-leak bubbles — birthday seasonal backdrop
const BUBBLES_P = Array.from({ length: 12 }, (_, i) => ({
  id: i, left: `${4 + (i * 211) % 92}%`,
  dur: `${2.6 + (i * 0.27) % 2.2}s`, delay: `${(i * 0.31) % 2.6}s`,
  size: 6 + (i % 5) * 2,
  color: ["#f0abfc","#a78bfa","#fbbf24","#f9a8d4","#818cf8"][i % 5]!,
}));




// ═══════════════════════════════════════════════════════════════════════════════
// 3D TILT HOOK
// ═══════════════════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════════════════════

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed bottom-24 left-1/2 z-50 animate-bounce-in-up">
      <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-500 px-5 py-3 shadow-xl shadow-emerald-900/50">
        <Check className="h-4 w-4 shrink-0 text-white" strokeWidth={2.5} />
        <span className="text-[13px] font-bold text-white">{message}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECEIVER SIGN-UP MODAL (contributor → create your own list)
// ═══════════════════════════════════════════════════════════════════════════════

function ReceiverSignUpModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [isParent, setIsParent] = useState(false);
  const [starChart, setStarChart] = useState(false);
  const [catalogueCircle, setCatalogueCircle] = useState(false);
  const [starValue, setStarValue] = useState("5");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalSteps = isParent ? 4 : 3;

  const handleNext = () => setStep((s) => Math.min(s + 1, totalSteps));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, birthday, type: "receiver-from-contributor", isParent, starChart, catalogueCircle, starValue }),
      });
    } catch { /* silent */ }
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 340, damping: 38 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-t-3xl bg-[#0a0a0a] border-t border-[#ffb800]/20 px-5 pt-5 pb-10 shadow-2xl"
        >
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />

          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-6 text-center"
            >
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#ffb800] to-[#f59e0b] flex items-center justify-center shadow-lg shadow-[#ffb800]/30">
                <Flame className="h-8 w-8 text-white" />
              </div>
              <p className="font-editorial text-[22px] font-semibold text-[#ffb800]">Your spot is reserved</p>
              <p className="text-[13px] text-white/60 leading-relaxed">We&apos;ll send your invitation to <span className="text-[#ffb800] font-semibold">{email}</span> as soon as your list is ready.</p>
              <motion.button whileTap={{ scale: 0.95 }} onClick={onClose}
                className="mt-2 rounded-xl bg-[#ffb800]/20 border border-[#ffb800]/30 px-6 py-2.5 text-[13px] font-semibold text-[#ffb800]">
                Done
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-5">
              {/* Header + step dots */}
              <div>
                <p className="font-editorial text-[20px] font-semibold text-white leading-tight">Create my own fire</p>
                <p className="mt-1 text-[12px] text-white/50">Step {step} of {totalSteps}</p>
                <div className="mt-3 flex gap-1.5">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-[#ffb800]" : "bg-white/15"}`} />
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-3">
                    <p className="text-[13px] font-semibold text-white/70">Your details</p>
                    <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] text-white placeholder:text-white/30 focus:border-[#ffb800]/60 focus:outline-none" />
                    <input type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] text-white placeholder:text-white/30 focus:border-[#ffb800]/60 focus:outline-none" />
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleNext}
                      disabled={!name.trim() || !email.trim()}
                      className="w-full rounded-xl bg-gradient-to-r from-[#ffb800] to-[#ffb800] py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-[#ffb800]/30 disabled:opacity-40">
                      Next
                    </motion.button>
                  </motion.div>
                )}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-3">
                    <p className="text-[13px] font-semibold text-white/70">Your milestone date</p>
                    <p className="text-[12px] text-white/40">We&apos;ll build your reveal countdown around this date.</p>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium text-white/50">Birthday (or main event date)</label>
                      <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] text-white focus:border-[#ffb800]/60 focus:outline-none" />
                    </div>
                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.97 }} onClick={handleBack}
                        className="flex-1 rounded-xl border border-white/10 py-3 text-[14px] font-semibold text-white/60">
                        Back
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={handleNext}
                        className="flex-[2] rounded-xl bg-gradient-to-r from-[#ffb800] to-[#ffb800] py-3 text-[15px] font-semibold text-white shadow-lg disabled:opacity-40">
                        Next
                      </motion.button>
                    </div>
                  </motion.div>
                )}
                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-3">
                    <p className="text-[13px] font-semibold text-white/70">Who is this list for?</p>
                    <button type="button" onClick={() => setIsParent((v) => !v)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-colors ${isParent ? "border-[#ffb800]/50 bg-[#ffb800]/10" : "border-white/10 bg-white/5"}`}>
                      <div className="flex items-center gap-2.5">
                        <Users className="h-4 w-4 text-[#ffb800]" />
                        <span className="text-[13px] font-medium text-white">I am a parent / guardian — this is for my child</span>
                      </div>
                      <div className={`h-5 w-9 rounded-full transition-colors ${isParent ? "bg-[#ffb800]" : "bg-white/20"} relative shrink-0`}>
                        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isParent ? "translate-x-4" : "translate-x-0.5"}`} />
                      </div>
                    </button>
                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.97 }} onClick={handleBack}
                        className="flex-1 rounded-xl border border-white/10 py-3 text-[14px] font-semibold text-white/60">
                        Back
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={isParent ? handleNext : () => { void handleSubmit(); }}
                        disabled={loading}
                        className="flex-[2] rounded-xl bg-gradient-to-r from-[#ffb800] to-[#ffb800] py-3 text-[15px] font-semibold text-white shadow-lg disabled:opacity-40">
                        {isParent ? "Next" : loading ? "Creating…" : "Create My First Fire"}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
                {step === 4 && isParent && (
                  <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-3">
                    <p className="text-[13px] font-semibold text-white/70">Child features</p>
                    {/* Star chart toggle */}
                    <button type="button" onClick={() => setStarChart((v) => !v)}
                      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Star className="h-3.5 w-3.5 text-[#ffb800]" />
                        <span className="text-[13px] text-white/80">Use a star chart?</span>
                      </div>
                      <div className={`h-5 w-9 rounded-full transition-colors ${starChart ? "bg-[#ffb800]" : "bg-white/20"} relative shrink-0`}>
                        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${starChart ? "translate-x-4" : "translate-x-0.5"}`} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {starChart && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="rounded-xl border border-[#ffb800]/20 bg-[#ffb800]/5 px-4 py-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] text-white/80">Star value per star</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[12px] text-white/40">£</span>
                                <input type="number" min="0.10" max="50" step="0.10" value={starValue}
                                  onChange={(e) => setStarValue(e.target.value)}
                                  className="w-16 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-center text-[13px] text-white focus:border-[#ffb800]/60 focus:outline-none" />
                              </div>
                            </div>
                            <p className="text-[10px] text-white/30">30 stars to earn — milestone value: £{(parseFloat(starValue || "5") * 30).toFixed(0)}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* Catalogue circling */}
                    <button type="button" onClick={() => setCatalogueCircle((v) => !v)}
                      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CircleEllipsis className="h-3.5 w-3.5 text-[#ffb800]" />
                        <span className="text-[13px] text-white/80">Enable Catalogue Circling Mode</span>
                      </div>
                      <div className={`h-5 w-9 rounded-full transition-colors ${catalogueCircle ? "bg-[#ffb800]" : "bg-white/20"} relative shrink-0`}>
                        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${catalogueCircle ? "translate-x-4" : "translate-x-0.5"}`} />
                      </div>
                    </button>
                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.97 }} onClick={handleBack}
                        className="flex-1 rounded-xl border border-white/10 py-3 text-[14px] font-semibold text-white/60">
                        Back
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => { void handleSubmit(); }} disabled={loading}
                        className="flex-[2] rounded-xl bg-gradient-to-r from-[#ffb800] to-[#ffb800] py-3 text-[15px] font-semibold text-white shadow-lg disabled:opacity-40">
                        {loading ? "Creating…" : "Create My First Fire"}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// PROFILE HEADER
// ═══════════════════════════════════════════════════════════════════════════════

function ProfileHeader({ potCount, totalGoal, onShare: _onShare, isContributor, onStartReceiving }: {
  potCount: number; totalGoal: number; onShare: () => void; isContributor?: boolean; onStartReceiving?: () => void;
}) {
  return (
    <header className="vh sticky top-0 z-30 bg-[#fdf6e3]/92 backdrop-blur-lg">
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 100 100" width="44" height="44" className="shrink-0 vh-lift" style={{ borderRadius: 14 }} role="img" aria-label="Kindled">
              <rect width="100" height="100" rx="24" fill="#0f172a"/>
              <g fill="#f59e0b">
                <rect x="28" y="27" width="12" height="46" rx="6"/>
                <rect x="34" y="33" width="34" height="12" rx="6" transform="rotate(-37 51 39)"/>
                <rect x="34" y="56" width="34" height="12" rx="6" transform="rotate(37 51 62)"/>
              </g>
              <path d="M48 22 C41 14 32 17 35.5 25 C38 30 44 29 48 25.5 Z" fill="#f59e0b"/>
              <path d="M48 22 C55 14 64 17 60.5 25 C58 30 52 29 48 25.5 Z" fill="#f59e0b"/>
              <circle cx="48" cy="23.5" r="5.5" fill="#fff4e6"/>
            </svg>
            <div>
              <div className="flex items-baseline gap-1.5">
                <h1 className="font-editorial text-[23px] font-semibold tracking-tight text-[#0f172a]">Kindled</h1>
                <span className="text-[11px] font-medium tracking-tight text-[#0f172a]/40">· Billy&apos;s List</span>
              </div>
              <p className="text-[11px] tracking-tight text-[#0f172a]/50">
                {isContributor
                  ? <>Contributing to <span className="font-semibold text-[#0f172a]/75">Billy&apos;s List</span></>
                  : <>Managed by <span className="font-semibold text-[#0f172a]/75">Mum (Sarah)</span></>}
              </p>
            </div>
          </div>
          {isContributor && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              transition={VH_BOUNCE}
              onClick={onStartReceiving}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#ff6b6b] px-4 py-2.5 text-[13px] font-bold text-white vh-lift"
            >
              <Flame className="h-3.5 w-3.5" />
              Create
            </motion.button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {[
            { value: potCount, label: "fires", gold: false },
            { value: `£${totalGoal.toLocaleString()}`, label: "goal", gold: true },
            { value: "4", label: "events", gold: false },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-[#fffdf7] px-3 py-3 text-center vh-lift">
              <p className={`font-editorial text-[20px] font-semibold leading-none ${stat.gold ? "text-[#f59e0b]" : "text-[#0f172a]"}`}>{stat.value}</p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#0f172a]/40">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEASONAL OCCASION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

type Occasion = "christmas" | "birthday";

/** Whichever major occasion lands soonest from today — used for pots without a fixed date. */
function nextMajorOccasion(): Occasion {
  const now = new Date();
  const year = now.getFullYear();
  let xmas = new Date(year, 11, 25);
  if (xmas.getTime() < now.getTime()) xmas = new Date(year + 1, 11, 25);
  let bday = new Date(year, 5, 28);
  if (bday.getTime() < now.getTime()) bday = new Date(year + 1, 5, 28);
  return xmas.getTime() <= bday.getTime() ? "christmas" : "birthday";
}

function occasionFor(pot: DemoPot): Occasion {
  const label = pot.eventLabel.toLowerCase();
  if (label.includes("christmas")) return "christmas";
  if (label.includes("birthday")) return "birthday";
  return nextMajorOccasion();
}

/** Real countdown target for pots whose own eventIso is just a placeholder ("Ongoing"). */
function occasionTargetIso(pot: DemoPot): string {
  if (pot.eventLabel !== "Ongoing") return pot.eventIso;
  const occasion = occasionFor(pot);
  const now = new Date();
  const year = now.getFullYear();
  if (occasion === "christmas") {
    let d = new Date(year, 11, 25);
    if (d.getTime() < now.getTime()) d = new Date(year + 1, 11, 25);
    return d.toISOString();
  }
  let d = new Date(year, 5, 28);
  if (d.getTime() < now.getTime()) d = new Date(year + 1, 5, 28);
  return d.toISOString();
}

function occasionLabel(occasion: Occasion): string {
  return occasion === "christmas" ? "Christmas" : "Birthday";
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE POT CARD
// ═══════════════════════════════════════════════════════════════════════════════

const KINDLE_AMOUNTS = [5, 10, 25, 50];

function LivePotCard({ pot, onRemove, onKindle, onBuy, onAmountSelected, hideStackNote }: {
  pot: DemoPot;
  onRemove?: (id: string) => void;
  onKindle?: (id: string, amount: number) => void;
  onBuy?: (id: string) => void;
  onAmountSelected?: (pot: DemoPot, amount: number) => void;
  hideStackNote?: boolean;
}) {
  const [kindleOpen, setKindleOpen] = useState(false);
  const [kindled, setKindled] = useState(false);
  const pct = Math.min(100, Math.round((pot.raised / pot.goal) * 100));
  const statusLabel =
    pot.isClaimed    ? "Ordered" :
    pct >= 100 ? "Fully Lit" :
    pct >= 75  ? "Blazing" :
    pct >= 50  ? "Campfire" :
    pct >= 25  ? "Kindling" :
    pct > 0    ? "Embers" :
                 "Spark";
  const statusColor = pot.isClaimed ? "text-[#0f172a]/45" : "text-[#0f172a]/55";

  function handleKindle(amount: number) {
    if (onAmountSelected) {
      setKindleOpen(false);
      onAmountSelected(pot, amount);
      return;
    }
    setKindled(true);
    setKindleOpen(false);
    onKindle?.(pot.id, amount);
    setTimeout(() => setKindled(false), 2000);
  }

  return (
    <Reveal>
    <MagneticCard maxTilt={3} className="relative block overflow-hidden rounded-[24px] bg-[#fffdf7] vh-lift-lg">
      <div className="flex flex-col p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-[#f6ecd2]">
              {pot.image ? (
                <img src={pot.image} alt={pot.title} className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Gift className="h-5 w-5 text-[#0f172a]/30" strokeWidth={1.5} />
                </div>
              )}
              {pot.isClaimed && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a]/85">
                  <Check className="h-5 w-5 text-[#f59e0b]" strokeWidth={3} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="font-editorial truncate text-[17px] font-semibold tracking-tight text-[#0f172a]">{pot.title}</h3>
                {pot.tag && (
                  <span className="shrink-0 rounded-full bg-[#f59e0b]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#f59e0b]">
                    {pot.tag}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <p className={cn("text-[11px] font-bold uppercase tracking-[0.1em]", statusColor)}>{statusLabel}</p>
                {pot.continuous && !pot.isClaimed && !hideStackNote && (
                  <span className="rounded-full bg-[#ff6b6b]/12 px-2 py-0.5 text-[9px] font-bold text-[#ff6b6b]">
                    ∞ continuous
                  </span>
                )}
              </div>
            </div>
          </div>
          {onRemove && !pot.isClaimed && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => onRemove(pot.id)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f6ecd2] text-[#0f172a]/40 transition-colors hover:text-[#ff6b6b]">
              <X className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </div>

        {/* Claimed state */}
        {pot.isClaimed && pot.claimedBy && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[#f6ecd2] px-3.5 py-2.5">
            <Check className="h-4 w-4 shrink-0 text-[#0f172a]" strokeWidth={2.5} />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold tracking-tight text-[#0f172a]">{pot.claimedBy} — ordered</p>
              {pot.claimedNote && <p className="truncate text-[11px] text-[#0f172a]/55">{pot.claimedNote}</p>}
            </div>
          </div>
        )}

        {/* Progress — Under Wraps: heat-themed, totals hidden */}
        {!pot.isClaimed && (
          <>
            <FundingBar raised={pot.raised} goal={pot.goal} className="mt-4" tone="light" />
            <div className="mt-3 flex items-center justify-between">
              <span className="flex items-center gap-1 text-[11px] tracking-tight text-[#0f172a]/45"><Users className="h-3 w-3" />{pot.contributors} contributors</span>
              <CountdownTimer targetIso={pot.eventIso} compact />
            </div>
            {hideStackNote && pot.eventLabel !== "Ongoing" && (
              <div className="mt-2 flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3 shrink-0 text-[#0f172a]/35" />
                <p className="text-[10px] text-[#0f172a]/40">Next event: <span className="font-medium text-[#0f172a]/60">{pot.eventLabel} · {pot.eventDate}</span></p>
              </div>
            )}
            {pot.stackNote && !hideStackNote && (
              <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-[#f59e0b]/[0.1] px-3 py-2">
                <RefreshCw className="mt-0.5 h-3 w-3 shrink-0 text-[#f59e0b]" />
                <p className="text-[10px] leading-snug text-[#0f172a]/70">{pot.stackNote}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-4 flex gap-2">
              <motion.button
                whileTap={{ scale: 0.93 }}
                transition={VH_BOUNCE}
                onClick={() => setKindleOpen((v) => !v)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-[14px] font-bold transition-colors vh-lift",
                  kindled
                    ? "bg-[#0f172a] text-[#f59e0b]"
                    : "bg-[#ff6b6b] text-white",
                )}
              >
                {kindled
                  ? <Check className="h-4 w-4" />
                  : <Flame className="h-4 w-4" />}
                {kindled ? "Kindled!" : "Kindle"}
              </motion.button>
            </div>

            {/* Kindle contribution panel */}
            <AnimatePresence>
              {kindleOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2.5">
                    {/* Chip in — pick an amount */}
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0f172a]/40">Chip in</p>
                      <div className="grid grid-cols-4 gap-2">
                        {KINDLE_AMOUNTS.map((amt) => (
                          <motion.button
                            key={amt}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleKindle(amt)}
                            disabled={amt > pot.goal - pot.raised}
                            className={cn(
                              "rounded-xl py-3 text-[14px] font-bold tabular-nums transition-colors",
                              amt > pot.goal - pot.raised
                                ? "cursor-not-allowed bg-[#f6ecd2] text-[#0f172a]/25"
                                : "bg-[#f59e0b]/12 text-[#0f172a] vh-lift hover:bg-[#f59e0b]/20",
                            )}
                          >
                            £{amt}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-[rgba(15,23,42,0.1)]" />
                      <span className="text-[10px] text-[#0f172a]/30">or</span>
                      <div className="h-px flex-1 bg-[rgba(15,23,42,0.1)]" />
                    </div>

                    {/* Light this fire — fund the remaining balance */}
                    {pot.goal - pot.raised > 0 && (
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        transition={VH_BOUNCE}
                        onClick={() => handleKindle(pot.goal - pot.raised)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-[#ff6b6b] px-4 py-3.5 text-left vh-lift"
                      >
                        <div className="flex items-center gap-2.5">
                          <Flame className="h-4 w-4 shrink-0 text-white" strokeWidth={2} />
                          <div>
                            <p className="text-[13px] font-bold leading-tight text-white">Light this fire fully</p>
                            <p className="text-[10px] leading-tight text-white/80">Cover the remaining balance — make it happen today</p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-[13px] font-bold tabular-nums text-white">
                          £{pot.goal - pot.raised}
                        </span>
                      </motion.button>
                    )}

                    {/* Buy outright */}
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      transition={VH_BOUNCE}
                      onClick={() => onBuy?.(pot.id)}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl bg-[#f6ecd2] px-4 py-3.5 text-left transition-colors hover:bg-[#f0e4c4]"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShoppingBag className="h-4 w-4 shrink-0 text-[#0f172a]/55" strokeWidth={2} />
                        <div>
                          <p className="text-[13px] font-bold leading-tight text-[#0f172a]">Buy it outright</p>
                          <p className="text-[10px] leading-tight text-[#0f172a]/45">Skip the pot — purchase it directly as your gift</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#fffdf7] px-3 py-1 text-[13px] font-bold tabular-nums text-[#0f172a]/70">
                        £{pot.goal}
                      </span>
                    </motion.button>

                    <p className="text-center text-[10px] text-[#0f172a]/40">
                      £{pot.goal - pot.raised} left to fully fund this gift
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </MagneticCard>
    </Reveal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOCKED POT CARD
// ═══════════════════════════════════════════════════════════════════════════════

function LockedPotCard({ pot, onReveal }: { pot: DemoPot; onReveal: (p: DemoPot) => void }) {
  const occasion = occasionFor(pot);
  const isXmas = occasion === "christmas";
  const targetIso = occasionTargetIso(pot);

  // Days until occasion
  const daysUntil = Math.max(0, Math.ceil((new Date(targetIso).getTime() - Date.now()) / 86_400_000));

  const th = isXmas
    ? { bg: "bg-[#1a0f0f]", border: "border-red-700/30", glow: "animate-gift-glow",
        box: "from-red-800/30 to-amber-700/20", label: "text-amber-400",
        modeLabel: "Under the Tree", btn: "from-amber-400 to-orange-500 shadow-amber-900/40" }
    : { bg: "bg-[#1a1028]", border: "border-violet-500/30", glow: "animate-gift-glow-plum",
        box: "from-violet-600/25 to-fuchsia-700/20", label: "text-violet-400",
        modeLabel: "Wrapped Up", btn: "from-violet-500 to-fuchsia-500 shadow-violet-900/40" };

  return (
    <article className={cn("relative overflow-hidden rounded-2xl border shadow-lg shadow-black/50", th.bg, th.border)}>
      {/* Seasonal particle backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        {isXmas
          ? SNOW.map((s) => (
              <span key={s.id} className="animate-snow absolute rounded-full bg-white/80"
                style={{ left: s.left, top: 0, width: s.size, height: s.size,
                  "--dur": s.dur, "--sx": s.sx, "--drift": s.drift, animationDelay: s.delay } as React.CSSProperties} />
            ))
          : (
            <>
              {CONFETTI_P.map((c) => (
                <span key={c.id} className={cn("animate-confetti absolute rounded-sm", c.color)}
                  style={{ left: c.left, top: 0, width: c.w, height: c.h,
                    "--dur": c.dur, "--rot": c.rot, animationDelay: c.delay } as React.CSSProperties} />
              ))}
              {BUBBLES_P.map((b) => (
                <span key={b.id} className="animate-bubble-rise absolute bottom-0 rounded-full opacity-70"
                  style={{ left: b.left, width: b.size, height: b.size, backgroundColor: b.color,
                    "--dur": b.dur, animationDelay: b.delay,
                    boxShadow: `0 0 8px ${b.color}80` } as React.CSSProperties} />
              ))}
            </>
          )}
      </div>
      <div className={cn("h-[3px] w-full bg-gradient-to-r", pot.accentGradient)} />
      <div className="relative z-10 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-black/30">
              {pot.image
                ? <img src={pot.image} alt={pot.title} className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                : <div className="flex h-full w-full items-center justify-center"><Gift className="h-5 w-5 text-stone-500" strokeWidth={1.5} /></div>}
              <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-tl-lg bg-black/60"><Lock className="h-2.5 w-2.5 text-white/60" /></span>
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[14px] font-bold text-white">{pot.title}</h3>
              <p className={cn("text-[11px] font-medium", th.label)}>{th.modeLabel} · hidden</p>
            </div>
          </div>
          <div className="shrink-0 rounded-xl bg-black/20 px-2.5 py-1.5 text-right">
            <p className="text-[9px] uppercase tracking-wider text-stone-500">{pot.eventLabel}</p>
            <p className="text-[12px] font-bold text-stone-200">{pot.eventDate}</p>
          </div>
        </div>
        <div className={cn(th.glow, "mt-4 flex flex-col items-center gap-3 rounded-2xl py-6 border border-white/5 bg-gradient-to-b", th.box)}>
          {/* Occasion countdown headline */}
          <p className={cn("text-[13px] font-bold", isXmas ? "text-amber-300" : "text-violet-300")}>
            {occasionLabel(occasion)} in {daysUntil} {daysUntil === 1 ? "day" : "days"}
          </p>
          <Gift className={cn("h-14 w-14", isXmas ? "text-amber-400" : "text-violet-300")} strokeWidth={1.2} />
          <div className="flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-stone-400" />
            <p className="text-[12px] font-semibold text-stone-200">Locked · Unwraps {pot.eventDate}</p>
          </div>
          <CountdownTimer targetIso={targetIso} eventLabel={pot.eventLabel} />
          <button
            onClick={() => onReveal(pot)}
            className={cn(
              "mt-1 flex items-center gap-1.5 rounded-full px-5 py-2.5",
              "bg-gradient-to-r text-[12px] font-bold text-stone-900 shadow-lg active:scale-95 transition-transform",
              th.btn,
            )}
          >
            <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
            Open my gift
          </button>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-stone-500">
          <Lock className="h-3 w-3" />
          <span className="text-[11px]">Keeping it a secret until the big day</span>
        </div>
        {pot.stackNote && (
          <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
            <RefreshCw className="mt-0.5 h-3 w-3 shrink-0 text-violet-300" />
            <p className="text-[10px] leading-snug text-stone-400">{pot.stackNote}</p>
          </div>
        )}
      </div>
    </article>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// CONTRIBUTION PROMPT MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function ContributionPromptModal({
  pot,
  amount,
  onConfirm,
  onClose,
}: {
  pot: DemoPot;
  amount: number;
  onConfirm: (id: string, amount: number) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"card" | "video">("card");
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function finalize() {
    setSubmitted(true);
    onConfirm(pot.id, amount);
    setTimeout(onClose, 1200);
  }

  return (
    <AnimatePresence>
      <motion.div
        key="contrib-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="contrib-sheet"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 34 }}
          className="w-full max-w-lg overflow-hidden rounded-t-3xl"
          style={{ background: "linear-gradient(160deg, #0f0f0f 0%, #0a0a0a 100%)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-white/20" />
          </div>

          <div className="px-5 pb-8 pt-2">
            {/* Header */}
            <div className="mb-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#ffb800] mb-1">
                Chipping in £{amount} to {pot.title}
              </p>
              <p className="font-editorial text-[20px] font-semibold text-white leading-tight">
                Add a personal touch?
              </p>
              <p className="mt-1 text-[12px] text-[#f5f5f5]/50">
                Make Billy&apos;s reveal morning even more magical
              </p>
            </div>

            {/* Option tabs */}
            <div className="mb-4 flex gap-2 rounded-2xl bg-white/5 p-1">
              <button
                onClick={() => setTab("card")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition-all",
                  tab === "card"
                    ? "bg-gradient-to-r from-[#ffb800] to-orange-500 text-[#0a0a0a] shadow-md"
                    : "text-[#f5f5f5]/50",
                )}
              >
                <PenLine className="h-4 w-4" />
                Digital Card
              </button>
              <button
                onClick={() => setTab("video")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition-all",
                  tab === "video"
                    ? "bg-gradient-to-r from-[#ffb800] to-[#f59e0b] text-white shadow-md"
                    : "text-[#f5f5f5]/50",
                )}
              >
                <Radio className="h-4 w-4" />
                Video Wish
              </button>
            </div>

            {/* Option A — Digital Card */}
            {tab === "card" && (
              <motion.div
                key="card-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3"
              >
                <div
                  className="relative rounded-2xl border-2 transition-all"
                  style={{ borderColor: message.length > 0 ? "#f59e0b" : "rgba(255,255,255,0.1)",
                    boxShadow: message.length > 0 ? "0 0 0 3px rgba(245,158,11,0.15), 0 0 20px rgba(245,158,11,0.12)" : "none" }}
                >
                  <div className="absolute left-3 top-2.5 flex items-center gap-1.5 text-[#ffb800]">
                    <PenLine className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Your message</span>
                  </div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write a beautiful note to float onto Billy's screen on his big reveal morning…"
                    rows={4}
                    className="w-full resize-none rounded-2xl bg-transparent px-3 pb-3 pt-8 text-[13px] leading-relaxed text-[#f5f5f5]/85 placeholder:text-[#f5f5f5]/30 focus:outline-none"
                  />
                </div>
                <p className="text-center text-[11px] text-[#f5f5f5]/40">
                  &ldquo;Stoke the Fire with a Digital Card&rdquo; — your words will float onto Billy&apos;s screen at the moment of reveal.
                </p>
              </motion.div>
            )}

            {/* Option B — Video Wish */}
            {tab === "video" && (
              <motion.div
                key="video-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-4"
              >
                {/* Pulsating record button */}
                <div className="relative flex items-center justify-center py-4">
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="absolute rounded-full bg-[#ffb800]/20"
                      style={{ width: 60 + i * 28, height: 60 + i * 28,
                        animation: `ping ${1 + i * 0.35}s ${i * 0.2}s ease-out infinite` }}
                    />
                  ))}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setRecording((r) => !r)}
                    className={cn(
                      "relative z-10 flex h-16 w-16 items-center justify-center rounded-full transition-all",
                      recording
                        ? "bg-[#f59e0b] shadow-lg shadow-[#241a00]/60"
                        : "bg-gradient-to-br from-[#ffb800] to-[#f59e0b] shadow-xl shadow-[#241a00]/50",
                    )}
                  >
                    {recording
                      ? <span className="h-5 w-5 rounded bg-white" />
                      : <Radio className="h-7 w-7 text-white" strokeWidth={2} />}
                  </motion.button>
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-semibold text-[#f5f5f5]/85">
                    {recording ? "Recording… tap to stop" : "Press to record"}
                  </p>
                  <p className="mt-1 text-[11px] text-[#f5f5f5]/40">
                    &ldquo;Spark a Smile with a Video Wish&rdquo; — a heartfelt 15-second clip woven into Billy&apos;s cinematic unboxing celebration!
                  </p>
                </div>
                <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[rgba(245,245,245,0.18)] bg-white/5 py-2.5 text-[12px] font-medium text-[#f5f5f5]/50 hover:border-[rgba(245,245,245,0.32)] transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                  Or upload a video instead
                  <input type="file" accept="video/*" className="sr-only" />
                </label>
              </motion.div>
            )}

            {/* Giver incentive callout */}
            <div className="mt-4 rounded-2xl border border-[#ffb800]/20 bg-gradient-to-br from-[#ffb800]/10 to-[#ffb800]/5 p-3.5 space-y-2.5"
              style={{ boxShadow: "0 0 20px rgba(245,158,11,0.08)" }}>
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ffb800]/20">
                  <Trophy className="h-3.5 w-3.5 text-[#ffb800]" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-[#ffb800]">Stoke &amp; Win</p>
                  <p className="text-[11px] text-white/55 leading-snug">Chipping in automatically enters you into our active <span className="text-[#ffb800] font-semibold">£2,500 Summer Goal Booster Draw</span> — one entry per £10 contributed.</p>
                </div>
              </div>
              <div className="h-px bg-white/8" />
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ffb800]/20">
                  <Flame className="h-3.5 w-3.5 text-[#ffb800]" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-[#ffb800]">Kindle Back Rewards</p>
                  <p className="text-[11px] text-white/55 leading-snug">Earn <span className="text-[#ffb800] font-semibold">2% back</span> in Spark Balance on every contribution — ignite your own future Spark Goals when you start your own board.</p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-4 flex flex-col gap-2">
              {submitted ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#ffb800] py-4">
                  <Check className="h-5 w-5 text-[#0a0a0a]" strokeWidth={2.5} />
                  <span className="text-[15px] font-semibold text-[#0a0a0a]">Contribution sent!</span>
                </div>
              ) : (
                <>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={finalize}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-semibold text-[#0a0a0a]"
                    style={{ background: "linear-gradient(135deg, #ffb800, #f59e0b)", boxShadow: "0 4px 20px rgba(251,146,60,0.4)" }}
                  >
                    <Flame className="h-5 w-5" />
                    Send £{amount} {tab === "card" && message.trim() ? "+ Digital Card" : tab === "video" ? "+ Video Wish" : ""}
                  </motion.button>
                  <button
                    onClick={finalize}
                    className="text-center text-[12px] text-[#f5f5f5]/40 hover:text-[#f5f5f5]/70 transition-colors py-1"
                  >
                    Skip — just contribute £{amount}
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATALOGUE CARD (SVG circle + 3D tilt)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Premium product image: skeleton shimmer while loading, and a branded
 * gradient fallback (brand initial + icon) if the photo 404s — so the
 * catalogue never shows a broken-image glyph.
 */
// ─── Creator sign-up modal (shown to contributors who click Catalogue) ────────
function CreatorSignUpModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: "Contributor", type: "creator-from-contributor" }),
      });
    } catch { /* silent */ }
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-3xl border-t border-[#ffb800]/25"
        style={{ background: "linear-gradient(160deg, #0a0a0a 0%, #121212 50%, #0a0a0a 100%)" }}
      >
        {/* Ambient particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {CONFETTI_P.slice(0, 8).map((c) => (
            <span key={c.id} className="animate-confetti absolute rounded-sm bg-[#ffb800] opacity-30"
              style={{ left: c.left, top: 0, width: c.w, height: c.h,
                "--dur": c.dur, "--rot": c.rot, animationDelay: c.delay } as React.CSSProperties} />
          ))}
        </div>

        <div className="relative px-6 pb-10 pt-5">
          {/* Handle */}
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />

          {/* Close */}
          <button onClick={onClose} className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20">
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffb800] to-[#f59e0b]">
              <Flame className="h-6 w-6 text-[#0a0a0a]" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#ffb800]/80">For You</p>
              <h2 className="font-editorial text-[20px] font-semibold text-white leading-tight">
                Start Your Own Kindle Board
              </h2>
            </div>
          </div>

          <p className="mb-5 text-[13px] leading-relaxed text-white/70">
            Loved how easy it was to chip in for Billy? Create your family&apos;s continuous Spark Goals today.
            Gather contributions year-round, stop plastic duplicate waste, and easily fund your family&apos;s
            biggest milestone dreams.
          </p>

          {sent ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br from-[#ffb800]/20 to-[#f59e0b]/20 border border-[#ffb800]/30 px-5 py-6"
            >
              {/* Golden reservation pass skeuomorph */}
              <div className="relative flex w-full max-w-xs flex-col items-center overflow-hidden rounded-2xl border-2 border-dashed border-[#ffb800]/60 bg-gradient-to-br from-[#ffb800] to-[#f59e0b] px-6 py-5 shadow-xl shadow-[#0a0a0a]/40">
                <div className="absolute left-0 top-1/2 h-6 w-3 -translate-y-1/2 rounded-r-full bg-[#0a0a0a]/40" />
                <div className="absolute right-0 top-1/2 h-6 w-3 -translate-y-1/2 rounded-l-full bg-[#0a0a0a]/40" />
                <Sparkles className="h-7 w-7 text-[#0a0a0a] mb-1" strokeWidth={2} />
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#0a0a0a]/70">Kindled · First Kindler Pass</p>
                <p className="font-editorial text-[19px] font-bold text-[#0a0a0a] text-center leading-tight mt-1">Reserved</p>
                <p className="text-[11px] text-[#0a0a0a]/70 mt-1">Your Kindle Board is being set up</p>
              </div>
              <p className="text-[12px] text-[#ffb800]/80 text-center">We&apos;ll send your magic link to {email}</p>
            </motion.div>
          ) : (
            <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-2xl border border-[#ffb800]/30 bg-white/10 px-4 py-3.5 text-[14px] text-white placeholder-white/30 outline-none focus:border-[#ffb800]/70 focus:ring-2 focus:ring-[#ffb800]/20 transition-all"
              />
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ffb800] to-[#f59e0b] py-4 text-[15px] font-bold text-[#0a0a0a] shadow-xl shadow-[#0a0a0a]/40 active:scale-95 disabled:opacity-60"
              >
                <Flame className="h-[18px] w-[18px]" strokeWidth={2.5} />
                {loading ? "Lighting the fire…" : "Create My First Fire"}
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVEAL CEREMONY MODAL
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// INVESTOR PIN GATE
// ═══════════════════════════════════════════════════════════════════════════════

const INVESTOR_PIN = "1066";
const SESSION_KEY  = "kindled_investor_unlocked";

function InvestorPinGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [digits, setDigits]     = useState("");
  const [shake, setShake]       = useState(false);
  const [showGate, setShowGate] = useState(false);

  // Read session on mount (client-only)
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setUnlocked(true);
    else setShowGate(true);
  }, []);

  const handleDigit = useCallback((d: string) => {
    const next = (digits + d).slice(0, 4);
    setDigits(next);
    if (next.length === 4) {
      if (next === INVESTOR_PIN) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setUnlocked(true);
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setDigits(""); }, 650);
      }
    }
  }, [digits]);

  const handleBackspace = useCallback(() => setDigits((d) => d.slice(0, -1)), []);

  if (unlocked) return <>{children}</>;
  if (!showGate) return null;

  return (
    <div className="mx-4 mb-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)" }}>
      {/* Top accent */}
      <div className="h-[3px] w-full bg-gradient-to-r from-amber-400 via-orange-400 to-red-500" />
      <div className="p-5 text-center">
        <div className="mb-3 flex justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100">
            <Lock className="h-5 w-5 text-stone-500" strokeWidth={2} />
          </div>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Investor View</p>
        <p style={{ fontFamily: "var(--font-display)" }} className="mt-0.5 text-[17px] font-semibold text-stone-800">Enter PIN to unlock</p>

        {/* Dot indicators */}
        <div className={cn("mt-4 flex justify-center gap-3", shake && "animate-shake")}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={cn(
              "h-3.5 w-3.5 rounded-full border-2 transition-all duration-150",
              i < digits.length
                ? shake ? "border-red-400 bg-red-400" : "border-amber-500 bg-amber-500"
                : "border-stone-300 bg-transparent",
            )} />
          ))}
        </div>

        {/* Keypad */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["1","2","3","4","5","6","7","8","9"].map((d) => (
            <button key={d} onClick={() => handleDigit(d)}
              className="flex h-12 items-center justify-center rounded-xl bg-stone-100 text-[18px] font-semibold text-stone-800 transition-all active:scale-95 active:bg-stone-200 hover:bg-stone-200">
              {d}
            </button>
          ))}
          <div />
          <button onClick={() => handleDigit("0")}
            className="flex h-12 items-center justify-center rounded-xl bg-stone-100 text-[18px] font-semibold text-stone-800 transition-all active:scale-95 active:bg-stone-200 hover:bg-stone-200">
            0
          </button>
          <button onClick={handleBackspace}
            className="flex h-12 items-center justify-center rounded-xl bg-stone-100 text-stone-500 transition-all active:scale-95 active:bg-stone-200 hover:bg-stone-200">
            <ChevronDown className="h-5 w-5 rotate-90" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVESTOR HUD
// ═══════════════════════════════════════════════════════════════════════════════

function useCountUp(target: number, running: boolean, dur = 1200) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!running || started.current) return;
    started.current = true;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setVal(Math.round(target * (1 - (1 - p) ** 2) * 100) / 100);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [running, target, dur]);
  return val;
}

function InvestorHUD({ pots, logEntries }: { pots: DemoPot[]; logEntries: string[] }) {
  const [open, setOpen] = useState(false);

  const totalGoal = pots.reduce((s, p) => s + p.goal, 0);
  const totalRaised = pots.reduce((s, p) => s + p.raised, 0);
  const totalContributors = pots.reduce((s, p) => s + p.contributors, 0);

  const affiliateTarget = totalGoal * 0.045;
  const giftCardTarget = totalRaised * 0.04;
  const obTarget = Math.max(0, totalRaised * 0.005 - totalContributors * 0.05);
  const intentTarget = pots.filter((p) => p.goal >= 200).length * 4.75;
  const totalTarget = affiliateTarget + giftCardTarget + obTarget + intentTarget;

  const affiliate = useCountUp(affiliateTarget, open);
  const giftCard = useCountUp(giftCardTarget, open, 1400);
  const ob = useCountUp(obTarget, open, 1600);
  const intent = useCountUp(intentTarget, open, 1800);
  const total = useCountUp(totalTarget, open, 2000);

  const streams = [
    { icon: Link2, label: "Affiliate Commission", sub: "4.5% on £" + totalGoal.toLocaleString() + " catalogue value", val: affiliate, color: "text-amber-400" },
    { icon: Gift, label: "Gift Card Margin", sub: "4% wholesale via Tillo / Prezzee", val: giftCard, color: "text-emerald-400" },
    { icon: Landmark, label: "Open Banking Spread", sub: "0.5% minus 5p per A2A transfer", val: ob, color: "text-sky-400" },
    { icon: Radio, label: "Intent Data Leads", sub: "£4.75 CPM × high-ticket nodes", val: intent, color: "text-violet-400" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Handle */}
      <div className="flex justify-center">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-t-xl border border-b-0 border-stone-700/60 bg-stone-900/98 px-5 py-2.5 backdrop-blur-md"
        >
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400"><Wrench className="h-3 w-3" /> Investor HUD</span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-px text-[9px] font-black text-emerald-400">
            £{total.toFixed(2)} earned
          </span>
          {open ? <ChevronDown className="h-3 w-3 text-stone-500" /> : <ChevronUp className="h-3 w-3 text-stone-500" />}
        </button>
      </div>

      {/* Panel */}
      <div className={cn(
        "border-t border-stone-700/60 bg-stone-950/98 backdrop-blur-lg transition-all duration-500 ease-out overflow-hidden",
        open ? "max-h-[420px]" : "max-h-0",
      )}>
        <div className="overflow-y-auto max-h-[420px] px-4 pb-6 pt-4 space-y-4">
          {/* Revenue streams */}
          <div className="grid grid-cols-2 gap-2">
            {streams.map((s) => (
              <div key={s.label} className="rounded-xl border border-stone-800/40 bg-stone-900/60 px-3 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <s.icon className={cn("h-3.5 w-3.5", s.color)} strokeWidth={2} />
                  <p className="text-[10px] font-bold text-stone-300 leading-tight">{s.label}</p>
                </div>
                <p className={cn("font-mono text-[15px] font-black tabular-nums", s.color)}>
                  £{s.val.toFixed(2)}
                </p>
                <p className="text-[9px] text-stone-600 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-900/15 px-4 py-3">
            <p className="text-[12px] font-bold text-stone-200">Total silent revenue</p>
            <span className="font-mono text-[18px] font-black text-emerald-400 animate-gold-shimmer tabular-nums">
              £{total.toFixed(2)}
            </span>
          </div>

          {/* Intent log */}
          <div className="rounded-xl border border-stone-800/40 bg-stone-950 p-3">
            <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-violet-400 mb-2">
              <Radio className="h-3 w-3" /> IntentDataNode Ledger — Series A Foundation
            </p>
            <div className="space-y-1 font-mono text-[9px] text-stone-500 max-h-28 overflow-y-auto">
              {logEntries.map((entry, i) => (
                <p key={i} className={cn(i === 0 && "text-violet-400")}>{entry}</p>
              ))}
              <p>▶ System initialized. Monitoring intent signals…</p>
            </div>
          </div>

          <p className="text-center text-[9px] text-stone-700">
            Revenue generated silently behind a delightful consumer product · No ads · No subscriptions
          </p>
        </div>
      </div>
    </div>
  );
}



// ═══════════════════════════════════════════════════════════════════════════════
// WOULD YOU RATHER — 2-YEAR VISION PANEL
// ═══════════════════════════════════════════════════════════════════════════════

interface DreamUnlock {
  id: string;
  label: string;
  desc: string;
  price: number;
  grad: string;
  glow: string;
  icon: LucideIcon;
  pkg: string[];
}

const DREAM_UNLOCKS: DreamUnlock[] = [
  {
    id: "hottub",
    label: "Hot tub",
    desc: "Lay-Z-Spa inflatable",
    price: 700,
    grad: "from-cyan-500 to-teal-600",
    glow: "rgba(20,184,166,0.45)",
    icon: Waves,
    pkg: ["Lay-Z-Spa Miami", "Cover + pump", "LED light kit", "Chemical starter kit"],
  },
  {
    id: "disney",
    label: "Disneyland Paris",
    desc: "Family of 4, 2 nights",
    price: 1200,
    grad: "from-violet-500 to-indigo-600",
    glow: "rgba(139,92,246,0.45)",
    icon: Castle,
    pkg: ["2-night Disney hotel", "2-day park tickets", "Character dining", "Disney gift card"],
  },
  {
    id: "ebike",
    label: "Electric bike",
    desc: "Foldable commuter",
    price: 900,
    grad: "from-emerald-500 to-green-600",
    glow: "rgba(16,185,129,0.45)",
    icon: Bike,
    pkg: ["Engwe folding e-bike", "Helmet + lock", "Rear pannier bag", "Service plan 1yr"],
  },
  {
    id: "spa",
    label: "Luxury spa break",
    desc: "2 nights for two",
    price: 650,
    grad: "from-rose-500 to-pink-600",
    glow: "rgba(244,63,94,0.45)",
    icon: Sparkles,
    pkg: ["2-night hotel stay", "Full-day spa access", "Couples massage", "Dinner for 2"],
  },
];

const RANDOM_GIFT_SET = [
  { label: "Lynx gift set",     price: 12  },
  { label: "Socks (3-pack)",    price: 8   },
  { label: "Scented candle",    price: 15  },
  { label: "Novelty mug",       price: 10  },
  { label: "Wine (house red)",  price: 9   },
  { label: "Yankee Candle",     price: 18  },
  { label: "Book voucher",      price: 10  },
  { label: "Chocolates",        price: 11  },
  { label: "Picture frame",     price: 14  },
  { label: "Moisturiser set",   price: 16  },
];

function WouldYouRatherPanel({ people, each }: { people: number; each: number }) {
  const [activeDream, setActiveDream] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e!.isIntersecting) setInView(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const perEvent = people * each;
  const events = [
    { label: "Birthday 1",  short: "B1", color: "#f59e0b", amount: perEvent },
    { label: "Christmas 1", short: "C1", color: "#ef4444", amount: perEvent },
    { label: "Birthday 2",  short: "B2", color: "#f59e0b", amount: perEvent },
    { label: "Christmas 2", short: "C2", color: "#ef4444", amount: perEvent },
  ];
  const stackedTotal = perEvent * 4;

  const dream = DREAM_UNLOCKS[activeDream]!;
  const pct = Math.min(100, Math.round((stackedTotal / dream.price) * 100));
  const canAfford = stackedTotal >= dream.price;

  // Pick random gifts for the "without" side
  const randomGifts = useMemo(() => {
    const n = Math.min(people * 4, RANDOM_GIFT_SET.length);
    return RANDOM_GIFT_SET.slice(0, n);
  }, [people]);

  return (
    <div ref={ref} className="mt-6">
      {/* Header */}
      <div className="mb-4 text-center">
        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-stone-400">2-year picture</p>
        <h3 style={{ fontFamily: "var(--font-display)" }}
          className="text-[22px] font-semibold leading-tight text-stone-900">
          Would you rather…
        </h3>
        <p className="mt-1 text-[12px] text-stone-400">Same circle · Same occasions · Completely different outcome</p>
      </div>

      {/* VS layout */}
      <div className="grid grid-cols-2 gap-3">

        {/* Left — random gifts pile */}
        <div className="overflow-hidden rounded-3xl border border-red-100 bg-red-50/80">
          <div className="bg-red-100/80 px-3 py-2 text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-red-400">Without Kindled</p>
            <p className="text-[11px] font-semibold text-red-700">2 years of guesswork</p>
          </div>
          <div className="space-y-1.5 p-3">
            {randomGifts.map((g, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 28 }}
                className="flex items-center gap-2 rounded-xl bg-white/70 px-2.5 py-1.5 shadow-sm">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-red-100">
                  <Gift className="h-2.5 w-2.5 text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-semibold text-stone-600">{g.label}</p>
                </div>
                <span className="shrink-0 text-[9px] text-stone-400">£{g.price}</span>
              </motion.div>
            ))}
            <div className="mt-2 rounded-xl border border-red-200 bg-red-100/60 px-3 py-2 text-center">
              <p className="text-[9px] text-red-400">Forgotten by February</p>
              <p className="text-[13px] font-black text-red-500">£{randomGifts.reduce((s,g)=>s+g.price,0)}</p>
              <p className="text-[9px] text-red-400">in stuff you didn&apos;t want</p>
            </div>
          </div>
        </div>

        {/* Right — stacked dream */}
        <div className="overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-b from-amber-50 to-orange-50">
          <div className="bg-amber-400/20 px-3 py-2 text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-600">With Kindled</p>
            <p className="text-[11px] font-semibold text-amber-800">4 events · 1 dream</p>
          </div>
          <div className="p-3 space-y-1.5">
            {/* Stacking events */}
            {events.map((ev, i) => (
              <motion.div key={ev.label}
                initial={{ opacity: 0, x: 10 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.07, type: "spring", stiffness: 400, damping: 28 }}
                className="flex items-center gap-2 rounded-xl bg-white/80 px-2.5 py-1.5 shadow-sm">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: ev.color }} />
                <p className="flex-1 text-[10px] font-semibold text-stone-600 truncate">{ev.label}</p>
                <span className="text-[10px] font-black" style={{ color: ev.color }}>+£{ev.amount}</span>
              </motion.div>
            ))}
            {/* Total pot */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.35, type: "spring", stiffness: 320, damping: 24 }}
              className={`rounded-xl bg-gradient-to-r ${dream.grad} p-2.5 text-center`}
              style={{ boxShadow: `0 4px 16px ${dream.glow}` }}>
              <p className="text-[9px] font-black uppercase tracking-wider text-white/70">pot total</p>
              <p className="text-[22px] font-black text-white leading-none" style={{ fontFamily: "var(--font-display)" }}>
                £{stackedTotal}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Dream picker */}
      <div className="mt-4">
        <p className="mb-2.5 text-center text-[10px] font-semibold uppercase tracking-widest text-stone-400">
          What £{stackedTotal} could unlock
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {DREAM_UNLOCKS.map((d, i) => (
            <button key={d.id} onClick={() => setActiveDream(i)}
              className={cn(
                "rounded-2xl py-2.5 text-center transition-all",
                activeDream === i
                  ? `bg-gradient-to-b ${d.grad} text-white shadow-md`
                  : "bg-stone-100 text-stone-500",
              )}>
              <d.icon className="mx-auto h-[18px] w-[18px]" strokeWidth={2} />
              <span className="block text-[9px] font-bold leading-tight mt-0.5 px-0.5">{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dream unlock card */}
      <AnimatePresence mode="wait">
        <motion.div key={dream.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className={`mt-3 overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-sm`}>

          {/* Header */}
          <div className={`bg-gradient-to-r ${dream.grad} px-5 py-4`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <dream.icon className="h-7 w-7 text-white" strokeWidth={2} />
                <p className="mt-1 text-[17px] font-black text-white leading-tight">{dream.label}</p>
                <p className="text-[11px] text-white/70">{dream.desc}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[9px] font-black uppercase tracking-wider text-white/60">worth</p>
                <p className="text-[26px] font-black text-white leading-none" style={{ fontFamily: "var(--font-display)" }}>
                  £{dream.price}
                </p>
                {canAfford
                  ? <span className="inline-block mt-1 rounded-full bg-white/25 px-2 py-0.5 text-[9px] font-black text-white">Unlocked</span>
                  : <span className="inline-block mt-1 rounded-full bg-black/20 px-2 py-0.5 text-[9px] font-black text-white/70">£{dream.price - stackedTotal} to go</span>
                }
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/20">
              <motion.div
                className="h-full rounded-full bg-white"
                initial={{ width: "0%" }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: 0.1 }}
                style={{ boxShadow: "0 0 8px rgba(255,255,255,0.6)" }}
              />
            </div>
            <p className="mt-1 text-[9px] text-white/55">{pct}% funded after 2 years · {4} occasions pooled</p>
          </div>

          {/* What's in the package */}
          <div className="px-5 py-4">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-stone-400">What&apos;s included</p>
            <div className="grid grid-cols-2 gap-1.5">
              {dream.pkg.map((item, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-stone-50 px-2.5 py-2">
                  <div className={`h-1.5 w-1.5 rounded-full shrink-0 bg-gradient-to-r ${dream.grad}`} />
                  <p className="text-[10px] font-semibold text-stone-600 leading-tight">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50/80 px-4 py-3">
              <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-xl bg-red-100">
                <X className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-stone-700">vs. the alternative</p>
                <p className="text-[10px] text-stone-400">
                  {people * 4} separate presents &middot; none of them {dream.label.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WOULD YOU RATHER
// ═══════════════════════════════════════════════════════════════════════════════

const CIRCLE_SIZES = [3, 5, 8, 12, 20];
const CONTRIB_AMOUNTS = [10, 20, 30, 50, 100];
const UNLOCK_TIERS = [
  { max: 55,  label: "Starter gift",   desc: "Thoughtful & personal",         grad: "from-teal-500 to-emerald-500"  },
  { max: 130, label: "Sweet spot",     desc: "Top of most wish lists",         grad: "from-amber-400 to-yellow-500"  },
  { max: 280, label: "Dream tier",     desc: "The gift they'll never forget",  grad: "from-orange-400 to-amber-500"  },
  { max: 520, label: "Premium unlock", desc: "Life-changing quality",          grad: "from-violet-500 to-purple-500" },
  { max: 1e6, label: "No limits",      desc: "Anything is possible",           grad: "from-rose-500 to-pink-500"    },
];

function WouldYouRather() {
  const [people, setPeople] = useState(5);
  const [each, setEach] = useState(20);
  const total = people * each;
  const tier = UNLOCK_TIERS.find(t => total <= t.max) ?? UNLOCK_TIERS[4]!;

  const matched = useMemo(() => {
    const inRange = CATALOGUE.filter(c => c.price >= total * 0.6 && c.price <= total * 1.4);
    const pool = inRange.length >= 2 ? inRange : [...CATALOGUE];
    return pool.sort((a, b) => Math.abs(a.price - total) - Math.abs(b.price - total)).slice(0, 3);
  }, [total]);

  return (
    <section className="px-4 pb-2">

      {/* ── Header ── */}
      <div className="mb-5 text-center">
        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-stone-400">Try it yourself</p>
        <h2 style={{ fontFamily: "var(--font-display)" }}
          className="text-[24px] font-semibold leading-tight text-stone-900">
          What could your circle unlock?
        </h2>
        <p className="mt-1 text-[12px] text-stone-400">Tap your group size and amount — see your real buying power</p>
      </div>

      {/* ── Main calculator card ── */}
      <div className="overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-md shadow-stone-100/80">
        <div className="space-y-5 p-5">

          {/* People picker */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-stone-600">People in your circle</span>
              <span className="rounded-xl bg-amber-50 border border-amber-100 px-2.5 py-1 text-[12px] font-black text-amber-600">
                {people} people
              </span>
            </div>
            <div className="flex gap-1.5">
              {CIRCLE_SIZES.map(n => (
                <motion.button key={n} whileTap={{ scale: 0.86 }} onClick={() => setPeople(n)}
                  className={cn(
                    "flex-1 rounded-xl py-2.5 text-[13px] font-bold transition-all",
                    people === n
                      ? "bg-gradient-to-b from-amber-400 to-orange-500 text-stone-900 shadow-sm shadow-amber-200"
                      : "bg-stone-100 text-stone-400 hover:bg-stone-200",
                  )}>
                  {n}
                </motion.button>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between px-0.5">
              <span className="text-[9px] text-stone-300">Immediate family</span>
              <span className="text-[9px] text-stone-300">Big extended circle</span>
            </div>
          </div>

          {/* Amount picker */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-stone-600">Each person chips in</span>
              <span className="rounded-xl bg-amber-50 border border-amber-100 px-2.5 py-1 text-[12px] font-black text-amber-600">
                £{each} each
              </span>
            </div>
            <div className="flex gap-1.5">
              {CONTRIB_AMOUNTS.map(a => (
                <motion.button key={a} whileTap={{ scale: 0.86 }} onClick={() => setEach(a)}
                  className={cn(
                    "flex-1 rounded-xl py-2.5 text-[12px] font-bold transition-all",
                    each === a
                      ? "bg-gradient-to-b from-amber-400 to-orange-500 text-stone-900 shadow-sm shadow-amber-200"
                      : "bg-stone-100 text-stone-400 hover:bg-stone-200",
                  )}>
                  £{a}
                </motion.button>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between px-0.5">
              <span className="text-[9px] text-stone-300">Birthday card money</span>
              <span className="text-[9px] text-stone-300">Special occasion</span>
            </div>
          </div>

          {/* ── Live result ── */}
          <AnimatePresence mode="wait">
            <motion.div key={tier.label}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={`rounded-2xl bg-gradient-to-br ${tier.grad} p-4`}>

              <div className="flex items-start justify-between gap-3">
                {/* Left: pot total */}
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/60">Combined pot</p>
                  <motion.p key={total}
                    initial={{ y: -10, opacity: 0.5 }} animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 520, damping: 22 }}
                    style={{ fontFamily: "var(--font-display)" }}
                    className="text-[52px] font-black leading-none text-white">
                    £{total}
                  </motion.p>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-white/18 px-2.5 py-1">
                    <Sparkles className="h-3 w-3 text-white/90" />
                    <span className="text-[10px] font-black text-white/90">{tier.label} · {tier.desc}</span>
                  </div>
                </div>
                {/* Right: guesswork comparison */}
                <div className="shrink-0 rounded-xl bg-black/15 px-3 py-2 text-right">
                  <p className="text-[9px] uppercase tracking-wider text-white/50">Without Kindled</p>
                  <p className="mt-0.5 text-[13px] font-bold text-white/45 line-through">{people} random gifts</p>
                  <p className="text-[9px] text-white/35">same money · zero memory</p>
                </div>
              </div>

              {/* Pill trio */}
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {[
                  { Icon: Users, label: `${people} people` },
                  { Icon: Check, label: `£${each} each`   },
                  { Icon: Gift,  label: "1 perfect gift"  },
                ].map(({ Icon, label }) => (
                  <div key={label} className="flex items-center justify-center gap-1.5 rounded-xl bg-white/15 py-2">
                    <Icon className="h-3 w-3 text-white/80" strokeWidth={2} />
                    <span className="text-[10px] font-bold text-white/90">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── What it unlocks ── */}
        <div className="border-t border-stone-100 px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              What £{total} unlocks right now
            </p>
            <p className="text-[10px] text-stone-300">from the catalogue</p>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={matched.map(m => m.id).join("-")}
              className="flex gap-3 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
              {matched.map((item, i) => (
                <motion.div key={item.id}
                  initial={{ opacity: 0, y: 16, scale: 0.88 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.07, type: "spring", stiffness: 400, damping: 26 }}
                  className="w-[150px] shrink-0 overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
                  {/* Product image */}
                  <div className="relative h-[100px] overflow-hidden bg-stone-100">
                    <img src={item.image} alt={item.name}
                      className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                    <div className={cn(
                      "absolute right-2 top-2 rounded-lg px-1.5 py-0.5 text-[9px] font-black text-white",
                      item.price <= total ? "bg-emerald-500/90 backdrop-blur-sm" : "bg-amber-500/90 backdrop-blur-sm",
                    )}>
                      {item.price <= total ? "In budget" : `£${item.price - total} away`}
                    </div>
                  </div>
                  {/* Product info */}
                  <div className="p-2.5">
                    <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-stone-700">{item.name}</p>
                    <div className="mt-1.5 flex items-end justify-between">
                      <span style={{ fontFamily: "var(--font-display)" }}
                        className="text-[15px] font-black text-amber-600">£{item.price}</span>
                      <span className="text-[9px] text-stone-400">{item.hearts} wishlists</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Comparison row ── */}
        <div className="border-t border-stone-100 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Without */}
            <div className="rounded-2xl border border-red-100 bg-red-50/60 p-3">
              <div className="mb-1.5 flex items-center gap-1.5">
                <X className="h-3.5 w-3.5 text-red-400" strokeWidth={2.5} />
                <span className="text-[10px] font-black uppercase tracking-wide text-red-400">Without Kindled</span>
              </div>
              <p className="text-[12px] font-semibold text-stone-700">
                {people} separate gifts
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-stone-400">
                Average £{Math.round(total / people)} each · guesswork · duplicates · forgotten by February
              </p>
            </div>
            {/* With */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.5} />
                <span className="text-[10px] font-black uppercase tracking-wide text-emerald-500">With Kindled</span>
              </div>
              <p className="text-[12px] font-semibold text-stone-700">
                1 gift they actually want
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-stone-400">
                £{total} pooled · chosen by them · remembered forever · zero duplicates
              </p>
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="px-5 pb-5">
          <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-[15px] font-bold text-stone-900"
            style={{ boxShadow: "0 4px 24px rgba(251,146,60,0.35)" }}>
            Start a pot — takes 2 minutes
          </motion.button>
          <p className="mt-2 text-center text-[10px] text-stone-400">Free forever · No credit card · Works on any device</p>
        </div>
      </div>

      {/* ── Would You Rather — 2-year vision ── */}
      <WouldYouRatherPanel people={people} each={each} />

      {/* ── Social proof chips ── */}
      <div className="-mx-4 mt-3 overflow-x-auto px-4">
        <div className="flex min-w-max gap-2 pb-1">
          {[
            { who: "Families of 4–6",   unlock: "Mountain bikes · MacBooks · log burners"    },
            { who: "Friend groups 8+",  unlock: "Festival tickets · spa days · gaming chairs" },
            { who: "Work colleagues",   unlock: "Wine experiences · cookery classes · tech"   },
          ].map(p => (
            <div key={p.who} className="min-w-[190px] rounded-2xl border border-stone-100 bg-white px-4 py-3 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{p.who}</p>
              <p className="mt-0.5 text-[12px] font-semibold text-stone-700">{p.unlock}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WHY KINDLED — STATS COLLATERAL
// ═══════════════════════════════════════════════════════════════════════════════

const WHY_STATS: {
  stat: string; label: string; body: string; Icon: LucideIcon; iconBg: string; iconColor: string;
  color: string; accent: string; border: string; source: string;
}[] = [
  {
    stat: "£3.2bn",
    label: "spent on unwanted UK gifts each year",
    body: "Around 1 in 4 gifts ends up unused, regifted, or returned — money and effort wasted on both sides.",
    Icon: Package,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
    color: "from-orange-50 to-amber-50",
    accent: "text-orange-500",
    border: "border-orange-100",
    source: "OnePoll / Halifax Bank survey, 2023",
  },
  {
    stat: "+30%",
    label: "seasonal packaging waste spike",
    body: "Packaging, returns logistics, and unnecessary duplicates surge every December — guided lists help cut this down.",
    Icon: Leaf,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    color: "from-emerald-50 to-teal-50",
    accent: "text-emerald-600",
    border: "border-emerald-100",
    source: "WRAP UK Seasonal Waste Report, 2022",
  },
  {
    stat: "1 in 5",
    label: "gifts are duplicates or returned",
    body: "Without coordination, duplicates are inevitable. Real-time claim locking means no two people can buy the same thing.",
    Icon: RefreshCw,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-500",
    color: "from-violet-50 to-purple-50",
    accent: "text-violet-500",
    border: "border-violet-100",
    source: "YouGov UK Gift Buying Survey, 2023",
  },
  {
    stat: "0",
    label: "duplicates when you guide your buyers",
    body: "Real-time claim locking means no two people can buy the same thing. Everyone contributes with confidence.",
    Icon: ShieldCheck,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-500",
    color: "from-sky-50 to-blue-50",
    accent: "text-sky-500",
    border: "border-sky-100",
    source: "Kindled platform mechanic",
  },
];

function WhyKindled() {
  return (
    <section className="px-4">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Why it matters</p>
        <h2 style={{ fontFamily: "var(--font-display)" }} className="text-[20px] font-semibold text-stone-800 leading-tight mt-0.5">
          Guiding your buyers helps everyone
        </h2>
        <p className="text-[13px] text-stone-500 mt-1 leading-relaxed">
          One shared list. No more guessing, overspending to compensate, or gifts that miss the mark.
          The people who love you finally know exactly how to help — and you get one step closer to what you really want.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {WHY_STATS.map((s) => (
          <motion.div
            key={s.stat}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className={cn("rounded-2xl border p-4 bg-gradient-to-br", s.color, s.border)}
          >
            <div className={cn("inline-flex h-8 w-8 items-center justify-center rounded-xl", s.iconBg)}>
              <s.Icon className={cn("h-4 w-4", s.iconColor)} />
            </div>
            <p className={cn("mt-2 text-[26px] font-black leading-none", s.accent)} style={{ fontFamily: "var(--font-display)" }}>
              {s.stat}
            </p>
            <p className="text-[11px] font-semibold text-stone-700 mt-0.5 leading-tight">{s.label}</p>
            <p className="text-[10px] text-stone-500 mt-1.5 leading-relaxed">{s.body}</p>
            <p className="text-[8.5px] text-stone-400/70 mt-2 leading-snug italic">Source: {s.source}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-gradient-to-r from-amber-400/10 to-orange-400/10 border border-amber-200 px-4 py-4">
        <p className="text-[13px] font-semibold text-stone-800 leading-relaxed text-center">
          No more guessing. No overspending to compensate. No awkward returns.
        </p>
        <p className="text-[12px] text-stone-500 text-center mt-1">
          Just one list — and everyone who loves you, finally able to help.
        </p>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEW GIFT SHEET
// ═══════════════════════════════════════════════════════════════════════════════

type EventType = "birthday" | "christmas" | "custom" | "ongoing";
type FetchState = "idle" | "fetching" | "done" | "error";

const DOMAIN_IMAGES: Record<string, string> = {
  "amazon":    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&q=80",
  "catalogue": "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=400&fit=crop&q=80",
  "currys":    "https://images.unsplash.com/photo-1585399000684-d2f72660f092?w=400&h=400&fit=crop&q=80",
  "johnlewis": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop&q=80",
  "smyths":    "https://images.unsplash.com/photo-1560961911-ba7ef651a56c?w=400&h=400&fit=crop&q=80",
  "lego":      "https://images.unsplash.com/photo-1609372332255-611485350f25?w=400&h=400&fit=crop&q=80",
  "apple":     "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=400&fit=crop&q=80",
};

function parseProductUrl(raw: string): { title: string; price: string; image?: string } {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    // Match image by domain keyword
    const image = Object.entries(DOMAIN_IMAGES).find(([k]) => host.includes(k))?.[1]
      ?? "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop&q=80";

    const amzMatch = u.pathname.match(/\/([A-Za-z0-9][A-Za-z0-9-]{3,})\/dp\//);
    if (amzMatch) {
      const title = (amzMatch[1] ?? "")
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
      return { title, price: "", image };
    }
    const segments = u.pathname.split("/").filter(Boolean);
    const last = (segments[segments.length - 1] ?? "").replace(/\.(html?|php|aspx?)$/i, "");
    const title = last
      ? last.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : `Product from ${host}`;
    return { title, price: "", image };
  } catch {
    return { title: "", price: "" };
  }
}

const EVENT_OPTIONS: { type: EventType; label: string; color: string }[] = [
  { type: "birthday",  label: "Birthday",  color: "#0a0a0a" },
  { type: "christmas", label: "Christmas", color: "#0a0a0a" },
  { type: "custom",    label: "Other",     color: "#0a0a0a" },
  { type: "ongoing",   label: "Ongoing",   color: "#0a0a0a" },
];

const ACCENT_GRADIENTS = [
  "from-rose-500 via-pink-400 to-orange-400",
  "from-sky-500 via-blue-400 to-indigo-400",
  "from-green-500 via-emerald-400 to-teal-400",
  "from-amber-500 via-yellow-400 to-orange-400",
  "from-fuchsia-500 via-purple-400 to-indigo-500",
];

function NewGiftSheet({ onAdd, onClose }: { onAdd: (pot: DemoPot) => void; onClose: () => void }) {
  const [mode, setMode] = useState<"link" | "manual">("link");
  const [url, setUrl] = useState("");
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [eventType, setEventType] = useState<EventType>("birthday");
  const [isSurprise, setIsSurprise] = useState(true);
  const [eventDate, setEventDate] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [scrapedImage, setScrapedImage] = useState<string | undefined>(undefined);
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUrlChange = useCallback((val: string) => {
    setUrl(val);
    setFetchState("idle");
    setTitle("");
    setAmount("");
    setScrapedImage(undefined);
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    const trimmed = val.trim();
    if (trimmed.startsWith("http") && trimmed.length > 15) {
      setFetchState("fetching");
      fetchTimer.current = setTimeout(() => {
        const parsed = parseProductUrl(trimmed);
        setTitle(parsed.title);
        setAmount(parsed.price);
        setScrapedImage(parsed.image);
        setFetchState("done");
      }, 1400);
    }
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleUrlChange(text);
    } catch {
      /* clipboard blocked */
    }
  }, [handleUrlChange]);

  const canSubmit = title.trim().length > 0 && amount.length > 0 && parseFloat(amount) > 0;

  function buildPot(): DemoPot {
    const goal = parseFloat(amount) || 100;
    const isLocked = isSurprise && eventType !== "ongoing";

    let potMode: DemoPot["mode"] = "LIVE_FEED";
    let evLabel = "Ongoing";
    let evDate = "Anytime";
    let evIso = "2027-01-01T00:00:00Z";

    if (isLocked) {
      if (eventType === "christmas") {
        potMode = "UNDER_THE_TREE";
        evLabel = "Christmas";
        evDate = "Dec 25";
        evIso = "2026-12-25T08:00:00Z";
      } else {
        potMode = "WRAPPED_UP";
        const d = eventDate ? new Date(eventDate) : new Date("2026-09-15");
        evLabel = eventType === "birthday" ? "Birthday" : (customLabel || "Event");
        evDate = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        evIso = d.toISOString();
      }
    } else if (eventType !== "ongoing") {
      if (eventType === "christmas") { evLabel = "Christmas"; evDate = "Dec 25"; evIso = "2026-12-25T08:00:00Z"; }
      else {
        const d = eventDate ? new Date(eventDate) : new Date("2026-09-15");
        evLabel = eventType === "birthday" ? "Birthday" : (customLabel || "Event");
        evDate = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        evIso = d.toISOString();
      }
    }

    return {
      id: `p${Date.now()}`,
      title: title.trim(),
      ...(scrapedImage ? { image: scrapedImage } : {}),
      goal,
      raised: 0,
      mode: potMode,
      continuous: eventType === "ongoing",
      eventLabel: evLabel,
      eventDate: evDate,
      eventIso: evIso,
      contributors: 0,
      boosterEntries: 0,
      accentGradient: ACCENT_GRADIENTS[Math.floor(Math.random() * ACCENT_GRADIENTS.length)]!,
      tributes: [],
    };
  }

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAdd(buildPot());
    onClose();
  };

  const showDatePicker = eventType !== "ongoing" && eventType !== "christmas";
  const showSurpriseToggle = eventType !== "ongoing";

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      />
      {/* Sheet */}
      <motion.div
        key="sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
        className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl bg-[#fdf9f5] shadow-2xl"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-[rgba(10,10,10,0.22)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <div>
            <h2 className="font-editorial text-[20px] font-semibold text-[#0a0a0a] leading-tight">New Gift</h2>
            <p className="text-[12px] text-[#0a0a0a]/45">Add something special to the list</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f0f0] text-[#0a0a0a]/55 active:scale-95 transition-transform">
            <span className="text-[14px] font-bold leading-none">✕</span>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-5">

          {/* Mode toggle */}
          <div className="flex rounded-xl bg-[#f0f0f0] p-1 gap-1">
            {(["link", "manual"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setTitle(""); setAmount(""); setUrl(""); setFetchState("idle"); }}
                className={cn(
                  "flex-1 rounded-lg py-2 text-[13px] font-semibold transition-all",
                  mode === m ? "bg-white shadow text-[#0a0a0a]" : "text-[#0a0a0a]/45",
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  {m === "link" ? <Link2 className="h-3.5 w-3.5" /> : <PenLine className="h-3.5 w-3.5" />}
                  {m === "link" ? "Paste a link" : "Enter manually"}
                </span>
              </button>
            ))}
          </div>

          {/* Link mode */}
          {mode === "link" && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="url"
                  placeholder="amazon.co.uk/... or any product URL"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(10,10,10,0.12)] bg-white px-4 py-3 pr-20 text-[14px] text-[#0a0a0a] placeholder:text-[#0a0a0a]/45 focus:border-[#ffb800] focus:outline-none transition-colors"
                />
                <button
                  onClick={() => { void handlePaste(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-[#ffb800]/15 px-3 py-1.5 text-[12px] font-semibold text-[#0a0a0a] active:scale-95 transition-transform"
                >
                  Paste
                </button>
              </div>

              {/* Fetch loading state */}
              {fetchState === "fetching" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-xl bg-[#ffb800]/[0.08] border border-[#ffb800]/30 px-4 py-3"
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-2 w-2 rounded-full bg-[#ffb800]"
                        style={{ animation: `bounce 0.9s ${i * 0.15}s ease-in-out infinite` }}
                      />
                    ))}
                  </div>
                  <p className="text-[13px] font-medium text-[#0a0a0a]">Fetching product details…</p>
                </motion.div>
              )}

              {/* Fetched result — editable */}
              {fetchState === "done" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="rounded-xl border border-[rgba(10,10,10,0.12)] bg-[#f0f0f0] p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    {scrapedImage && (
                      <img src={scrapedImage} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0 border border-[rgba(10,10,10,0.12)]" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="h-3.5 w-3.5 text-[#0a0a0a]/70 shrink-0" strokeWidth={2.5} />
                        <p className="text-[12px] font-semibold text-[#0a0a0a]">Product details found — edit if needed</p>
                      </div>
                      <input
                        type="text"
                        placeholder="Product name"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-lg border border-[rgba(10,10,10,0.12)] bg-white px-3 py-2 text-[14px] text-[#0a0a0a] focus:border-[#ffb800] focus:outline-none mb-2"
                      />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-[#0a0a0a]/45">£</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full rounded-lg border border-[rgba(10,10,10,0.12)] bg-white pl-7 pr-3 py-2 text-[14px] text-[#0a0a0a] focus:border-[#ffb800] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Manual mode */}
          {mode === "manual" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <input
                type="text"
                placeholder="Gift name e.g. LEGO Technic Ferrari"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-[rgba(10,10,10,0.12)] bg-white px-4 py-3 text-[14px] text-[#0a0a0a] placeholder:text-[#0a0a0a]/45 focus:border-[#ffb800] focus:outline-none transition-colors"
              />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-[#0a0a0a]/45">£</span>
                <input
                  type="number"
                  placeholder="Goal amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(10,10,10,0.12)] bg-white pl-8 pr-4 py-3 text-[14px] text-[#0a0a0a] placeholder:text-[#0a0a0a]/45 focus:border-[#ffb800] focus:outline-none transition-colors"
                />
              </div>
            </motion.div>
          )}

          {/* Event type */}
          <div className="space-y-2">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#0a0a0a]/45">For which event?</p>
            <div className="grid grid-cols-4 gap-2">
              {EVENT_OPTIONS.map((ev) => (
                <button
                  key={ev.type}
                  onClick={() => setEventType(ev.type)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl py-3 text-center transition-all",
                    eventType === ev.type
                      ? "bg-[#ffb800] text-[#0a0a0a] shadow-md shadow-[#ffb800]/30"
                      : "bg-[#f0f0f0] text-[#0a0a0a]/55",
                  )}
                >
                  <div className="h-5 w-5 rounded-full" style={{ background: ev.color }} />
                  <span className="text-[11px] font-semibold leading-tight">{ev.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date picker for non-christmas dated events */}
          <AnimatePresence>
            {showDatePicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {eventType === "custom" && (
                  <input
                    type="text"
                    placeholder="Event name e.g. Graduation"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    className="w-full rounded-xl border border-[rgba(10,10,10,0.12)] bg-white px-4 py-3 text-[14px] text-[#0a0a0a] placeholder:text-[#0a0a0a]/45 focus:border-[#ffb800] focus:outline-none"
                  />
                )}
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(10,10,10,0.12)] bg-white px-4 py-3 text-[14px] text-[#0a0a0a] focus:border-[#ffb800] focus:outline-none"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Surprise toggle */}
          <AnimatePresence>
            {showSurpriseToggle && (
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                onClick={() => setIsSurprise((v) => !v)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all",
                  isSurprise ? "border-[#ffb800] bg-[#ffb800]/[0.08]" : "border-[rgba(10,10,10,0.12)] bg-white",
                )}
              >
                {isSurprise
                  ? <Lock className="h-6 w-6 text-[#ffb800]" strokeWidth={1.75} />
                  : <Eye className="h-6 w-6 text-[#0a0a0a]/45" strokeWidth={1.75} />}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#0a0a0a]">
                    {isSurprise ? "Keep it a surprise" : "Visible to everyone"}
                  </p>
                  <p className="text-[12px] text-[#0a0a0a]/45 mt-0.5">
                    {isSurprise
                      ? "Hidden from the recipient until the big day"
                      : "Recipient can see progress and contributions"}
                  </p>
                </div>
                <div className={cn(
                  "h-6 w-11 rounded-full transition-colors relative",
                  isSurprise ? "bg-[#ffb800]" : "bg-[rgba(10,10,10,0.12)]",
                )}>
                  <div className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    isSurprise ? "translate-x-5" : "translate-x-0.5",
                  )} />
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: canSubmit ? 1.01 : 1 }}
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-[16px] font-semibold transition-all",
              canSubmit
                ? "bg-gradient-to-r from-[#ffb800] to-[#f59e0b] text-[#0a0a0a] shadow-lg shadow-[#ffb800]/30"
                : "bg-[#f0f0f0] text-[#0a0a0a]/45 cursor-not-allowed",
            )}
          >
            <Gift className="h-[18px] w-[18px]" strokeWidth={2} />
            <span style={{ fontFamily: "var(--font-display)" }}>Add to list</span>
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABOUT PAGE (one-pager)
// ═══════════════════════════════════════════════════════════════════════════════

function AboutPage() {
  const [email, setEmail] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitState("sending");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: "Waitlist" }),
      });
      setSubmitState(res.ok ? "done" : "error");
    } catch {
      setSubmitState("error");
    }
  }

  const PROBLEMS = [
    { Icon: AlertCircle, title: "The Guessing Game", stat: "71%", body: "of us feel real anxiety shopping for someone on our list. The well-meant guesses that follow are how 23 million unwanted gifts end up in UK landfill every Christmas." },
    { Icon: Copy, title: "The Duplicate Disaster", stat: "£700M", body: "wasted yearly on UK gifts nobody actually wanted. Nobody coordinates — so Grandma and Uncle Dave both buy the same LEGO set." },
    { Icon: CreditCard, title: "The Money Squeeze", stat: "£514", body: "the average UK Christmas costs per head. 36% of us say the cost of living has already shrunk our gifting budget — yet the big stuff feels out of reach alone." },
  ];

  const STEPS = [
    { n: "1", title: "Build your list", desc: "Items or a cash goal — any size, any occasion." },
    { n: "2", title: "Share one link", desc: "WhatsApp or text — no app download, grandparents included." },
    { n: "3", title: "It stays a secret", desc: "Contributors see what's covered so nothing's bought twice — the total stays under wraps." },
    { n: "4", title: "The big reveal", desc: "On the day — birthday, baby shower, Christmas and more — everyone gathers for one big moment." },
  ];

  const BENEFITS = [
    { title: "Free. Forever.", desc: "No listing fees, no withdrawal fees — not even on the small stuff." },
    { title: "Real cashback", desc: "Earn 1–2% back on every contribution, plus a raffle entry every £10." },
    { title: "No app needed", desc: "Open a link, pay by FaceID in seconds. Works for grandparents too." },
    { title: "Duplicate-proof", desc: "Contributors see it ticked off instantly, so nobody ever doubles up." },
    { title: "The Reveal", desc: "A genuinely emotional ceremony with the people who love you — not just a balance update." },
    { title: "Nothing expires", desc: "An unfinished pot carries to the next birthday or Christmas — never a \"failure.\"" },
  ];


  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5]">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[60vw] w-[60vw] rounded-full bg-[#ffb800]/[0.08] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl space-y-10 px-4 pb-20 pt-8">

        {/* ── Hero ── */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#ffb800]">Gifting, Reimagined</p>
          <h1 className="font-editorial text-[clamp(1.8rem,6.5vw,2.7rem)] font-semibold leading-[1.05] tracking-tight text-[#f5f5f5]">
            Gifting, Without the{" "}
            <span className="text-[#ffb800]">Guesswork.</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed tracking-tight text-[#f5f5f5]/60">
            Kindled turns &ldquo;what do you actually want?&rdquo; into one shared goal everyone can chip in on — any amount, no app required, completely free. No more duplicates. No more clutter. Just the thing you really wanted, funded by the people who love you.
          </p>
        </div>

        {/* ── Problem ── */}
        <div>
          <h2 className="font-editorial mb-1 text-[22px] font-semibold text-white">We&apos;ve All Been There</h2>
          <p className="mb-5 text-[13px] text-[#f5f5f5]/50">The same gifting headaches, year after year — and the numbers prove it&apos;s not just you.</p>
          <div className="flex flex-col gap-3">
            {PROBLEMS.map(({ Icon, title, stat, body }) => (
              <motion.div
                key={title}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="rounded-2xl border border-white/8 p-4"
                style={{ background: "#121212" }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Icon className="h-5 w-5 shrink-0 text-[#ffb800]" strokeWidth={1.75} />
                  <p className="text-[14px] font-semibold text-[#ffb800]">{title}</p>
                </div>
                <p className="text-[13px] leading-relaxed text-[#f5f5f5]/60">
                  <span className="font-bold text-[#ffb800]">{stat} </span>{body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Solution ── */}
        <div className="rounded-2xl border border-[#ffb800]/25 p-5" style={{ background: "rgba(255,184,0,0.05)" }}>
          <h2 className="font-editorial mb-3 text-[22px] font-semibold text-white">Meet the Pot.</h2>
          <p className="mb-5 text-[13px] leading-relaxed text-[#f5f5f5]/65">
            Kindled replaces the guesswork with one shared goal. Build a list — from new trainers to a house deposit. Share a single link. Everyone who loves you chips in whatever they can, big or small. Nothing gets duplicated, nothing gets wasted — and the big moment stays a surprise until everyone&apos;s together to share it.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-xl border border-white/8 bg-white/4 p-3 transition-colors hover:bg-amber-500/8">
                <span className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#ffb800] text-[11px] font-semibold text-[#0a0a0a]">{s.n}</span>
                <p className="text-[13px] font-semibold text-white">{s.title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-[#f5f5f5]/50">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Real Life Vignettes ── */}
        <div>
          <h2 className="font-editorial mb-1 text-[22px] font-semibold text-white">Real People. Real Pots.</h2>
          <p className="mb-5 text-[13px] text-[#f5f5f5]/50">Two ordinary moments, fixed.</p>
          <div className="flex flex-col gap-4">
            {/* Leo's Birthday */}
            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Cake className="h-5 w-5 text-[#ffb800]" strokeWidth={1.75} />
                <h3 className="text-[14px] font-semibold text-white">Leo&apos;s 6th Birthday</h3>
              </div>
              <div className="mb-2 flex gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-white/8 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#f5f5f5]/45">Before</span>
                <p className="text-[12px] leading-snug text-[#f5f5f5]/60">Mum gets 14 &ldquo;what does he want?&rdquo; texts. Grandma and Uncle Dave both buy the LEGO set. £80 of toys get returned or binned.</p>
              </div>
              <div className="mb-3 flex gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ffb800]">Kindled</span>
                <p className="text-[12px] leading-snug text-[#f5f5f5]/60">One link, 14 relatives — every gift ticked off behind the scenes so nothing doubles up. Leo has no idea what&apos;s coming.</p>
              </div>
              <p className="border-t border-white/8 pt-2.5 text-[12px] font-medium italic text-[#ffb800]">Mum saves £80 — and her sanity.</p>
            </div>
            {/* Dad's Log Burner */}
            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Flame className="h-5 w-5 text-[#ffb800]" strokeWidth={1.75} />
                <h3 className="text-[14px] font-semibold text-white">Dad&apos;s Log Burner</h3>
              </div>
              <div className="mb-2 flex gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-white/8 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#f5f5f5]/45">Before</span>
                <p className="text-[12px] leading-snug text-[#f5f5f5]/60">Everyone gets Dad &ldquo;something&rdquo; for Christmas — ties, socks. The £1,200 log burner he actually wants stays a pipe dream; too much for one person.</p>
              </div>
              <div className="mb-3 flex gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ffb800]">Kindled</span>
                <p className="text-[12px] leading-snug text-[#f5f5f5]/60">8 family members quietly chip in throughout the year. Christmas morning, with everyone gathered round, Dad finds out exactly how far they got.</p>
              </div>
              <p className="border-t border-white/8 pt-2.5 text-[12px] font-medium italic text-[#ffb800]">Fully funded or not, every pound brings it closer — and an unfinished pot simply rolls on to his birthday, until the log burner&apos;s real.</p>
            </div>
          </div>
        </div>

        {/* ── Reveal Ceremony ── */}
        <div className="relative overflow-hidden rounded-2xl border border-[#ffb800]/30 p-6 text-center" style={{ background: "rgba(255,184,0,0.07)" }}>
          {/* Static confetti dots */}
          {[["10%","8%","#FFC971",10],["88%","16%","#F4684E",8],["6%","72%","#FFC24B",7],["92%","80%","#F48C06",11],["48%","8%","#E85D04",6]].map(([l,t,c,s],i) => (
            <div key={i} className="pointer-events-none absolute rounded-full opacity-60" style={{ left: l as string, top: t as string, background: c as string, width: Number(s), height: Number(s) }} />
          ))}
          <h2 className="font-editorial relative z-10 mb-2 text-[22px] font-semibold text-white">The Big Reveal Ceremony</h2>
          <p className="relative z-10 mx-auto mb-5 max-w-lg text-[13px] leading-relaxed text-[#f5f5f5]/65">
            This is the bit other apps skip. When it&apos;s time, everyone gathers — in the room or on a video call — for one big moment. Slide to reveal. Confetti. A wall of photos from everyone who chipped in, plus the odd video message that&apos;ll get someone a little misty-eyed. It&apos;s not a notification — it&apos;s an occasion.
          </p>
          <div className="relative z-10 flex flex-wrap justify-center gap-2">
            {["Slide to reveal","Confetti & photo wall","Video messages","Everyone together"].map((chip) => (
              <span key={chip} className="rounded-full border border-[#ffb800]/40 bg-white/7 px-3 py-1.5 text-[11px] font-bold text-[#ffb800]">{chip}</span>
            ))}
          </div>
        </div>

        {/* ── Benefits ── */}
        <div>
          <h2 className="font-editorial mb-4 text-[22px] font-semibold text-white">The Bit That Actually Matters</h2>
          <div className="grid grid-cols-2 gap-3">
            {BENEFITS.map(({ title, desc }) => (
              <div key={title} className="flex gap-2.5 rounded-2xl border border-white/8 bg-white/3 p-3 transition-colors hover:bg-amber-500/6">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                  <Check className="h-3.5 w-3.5 text-[#ffb800]" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-[#f5f5f5]/50">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Kids ── */}
        <div className="rounded-2xl border border-[#ffb800]/20 p-5" style={{ background: "rgba(255,184,0,0.05)" }}>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#ffb800]">For the Little Ones</p>
          <h2 className="font-editorial mb-3 text-[18px] font-semibold text-white">The List They&apos;ve Been Building All Year</h2>
          <p className="mb-2 text-[13px] leading-relaxed text-[#f5f5f5]/60">
            We all remember it — the big catalogue landing on the doormat, dog-eared by page two. Circling things in biro. That quietly absorbed, hopeful ritual of building a wish list.
          </p>
          <p className="mb-4 text-[13px] leading-relaxed text-[#f5f5f5]/60">
            Kindled gives kids their own digital catalogue to browse, tap, and dream over — starring exactly what they&apos;d love, with no idea which ones are already covered. Good behaviour is built in: stars earned for good days move them closer to the gifts they&apos;re working towards.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Browse & star items","Surprise stays intact","Any age, any occasion","Good days earn stars"].map((chip) => (
              <span key={chip} className="rounded-full border border-[#ffb800]/25 bg-amber-200/8 px-3 py-1 text-[11px] font-bold text-[#ffb800]">{chip}</span>
            ))}
          </div>
        </div>

        {/* ── Trust ── */}
        <div className="flex gap-4 rounded-2xl border border-white/8 bg-[#121212] p-5">
          <ShieldCheck className="mt-0.5 h-8 w-8 shrink-0 text-[#ffb800]" strokeWidth={1.5} />
          <div>
            <h3 className="font-editorial mb-1.5 text-[16px] font-semibold text-white">Every Penny Goes to the Gift.</h3>
            <p className="text-[13px] leading-relaxed text-[#f5f5f5]/60">
              No listing fees. No withdrawal fees. No quiet percentage disappearing along the way. Whether you&apos;re chipping in £5 or running the whole pot, every penny goes toward the gift — not one slice is ever taken, by us or anyone else. Free for the people giving. Free for the people receiving. Always.
            </p>
          </div>
        </div>

        {/* ── Waitlist CTA ── */}
        <div className="rounded-2xl border border-[#ffb800] p-6 text-center" style={{ background: "rgba(255,184,0,0.08)", boxShadow: "0 0 30px rgba(255,184,0,0.18)" }}>
          <h2 className="font-editorial mb-2 text-[22px] font-semibold text-white">Be Among the First to Light a Pot</h2>
          <p className="mx-auto mb-5 max-w-sm text-[13px] leading-relaxed text-[#f5f5f5]/65">
            We&apos;re opening Kindled to early users soon. Join the waitlist and we&apos;ll let you know the moment you can build your first list.
          </p>
          {submitState === "done" ? (
            <div className="flex items-center justify-center gap-2 border border-[#ffb800]/40 bg-[#ffb800]/15 py-3.5">
              <Check className="h-5 w-5 text-[#ffb800]" strokeWidth={2.5} />
              <span className="text-[14px] font-semibold text-[#f5f5f5]">You&apos;re on the list — we&apos;ll be in touch!</span>
            </div>
          ) : (
            <form onSubmit={(e) => { void handleWaitlist(e); }} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="flex-1 border border-[rgba(245,245,245,0.18)] bg-[#f5f5f5]/[0.06] px-3.5 py-3 text-[13px] text-white placeholder:text-[#f5f5f5]/35 focus:outline-none focus:ring-2 focus:ring-[#ffb800]/50"
              />
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="submit"
                disabled={submitState === "sending"}
                className="rounded-xl bg-[#ffb800] px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.05em] text-[#0a0a0a] disabled:opacity-60 whitespace-nowrap"
                style={{ animation: "pulseGlow 2.4s ease-in-out infinite" }}
              >
                {submitState === "sending" ? "Sending…" : "Join the Waitlist →"}
              </motion.button>
            </form>
          )}
          {submitState === "error" && <p className="mt-2 text-[11px] text-red-400">Something went wrong — try again.</p>}
          <p className="mt-3 text-[11px] text-[#f5f5f5]/35">Free forever. No spam, ever.</p>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-white/8 pt-4">
          <span className="text-[12px] text-[#f5f5f5]/45"><span className="font-bold text-[#ffb800]">Kindled</span> — gifting, the way it should feel.</span>
          <span className="text-right text-[10px] leading-snug text-[#f5f5f5]/30">Sources: GiftAFeeling 2025 · GlobalData UK Gifting 2024 · YouGov/MoneySuperMarket 2025</span>
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// REVEAL V2 — Cinematic viral reveal experience
// ═══════════════════════════════════════════════════════════════════════════════

const EMBERS_V2 = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: `${3 + (i * 4.1) % 94}%`,
  size: `${2 + (i * 0.8) % 4}px`,
  dur: `${3 + (i * 0.5) % 4.5}s`,
  delay: `${(i * 0.28) % 3.5}s`,
  drift: `${-20 + (i * 7) % 40}px`,
}));

const V2_POTS = [
  { id: "p1", name: "Super-Fast Mountain Bike", sub: "Trek Marlin 5 · Your #1 wish",
    amount: 310, goal: 310, Icon: Bike,
    grad: "from-[#ffb800] to-[#f59e0b]", glow: "#ffb800", complete: true,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop&q=85",
    retailer: "Halfords", boost: 5,
    buyUrl: "https://www.amazon.co.uk/s?k=Trek+Marlin+5+mountain+bike&tag=kindled-21" },
  { id: "p2", name: "LEGO Millennium Falcon", sub: "Star Wars · 3,187 pieces",
    amount: 89, goal: 89, Icon: Package,
    grad: "from-[#ffb800] to-[#f59e0b]", glow: "#ffb800", complete: true,
    image: "https://images.unsplash.com/photo-1608889476518-738c9b1dcb40?w=600&h=600&fit=crop&q=85",
    retailer: "LEGO Store", boost: 4,
    buyUrl: "https://www.amazon.co.uk/s?k=LEGO+Millennium+Falcon&tag=kindled-21" },
  { id: "p3", name: "PS5 Gaming Bundle", sub: "3 games · controller included",
    amount: 75, goal: 80, Icon: Gamepad2,
    grad: "from-[#ffb800] to-[#f59e0b]", glow: "#ffb800", complete: false,
    image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&h=600&fit=crop&q=85",
    retailer: "Currys", boost: 3,
    buyUrl: "https://www.amazon.co.uk/s?k=PlayStation+5+console+bundle&tag=kindled-21" },
];

const V2_CONTRIBS = [
  { name: "Mum & Dad", amount: 150, initials: "MD", grad: "from-[#ffb800] to-[#f59e0b]", pot: "Mountain Bike",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&q=80",
    msg: "We are so proud of who you are becoming. You deserve every single part of this. We love you to the moon and back, always." },
  { name: "Grandma Linda", amount: 50, initials: "GL", grad: "from-[#ffb800] to-[#f59e0b]", pot: "Mountain Bike",
    image: "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=200&h=200&fit=crop&crop=faces&q=80",
    msg: "I've watched you grow into someone truly special. This is just the beginning of your adventures, my darling. Ride fast and smile wide." },
  { name: "Uncle Steve", amount: 35, initials: "US", grad: "from-[#ffb800] to-[#f59e0b]", pot: "LEGO Set",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces&q=80",
    msg: "Every ride is going to be an adventure. I can't wait to hear the stories — go fast, stay safe, have the absolute best time." },
  { name: "Auntie Claire", amount: 25, initials: "AC", grad: "from-[#ffb800] to-[#f59e0b]", pot: "PS5 Bundle",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop&crop=faces&q=80",
    msg: "Happy birthday to the most brilliant kid I know. This is from everyone who loves watching you shine. Enjoy every second." },
  { name: "Nana Joyce", amount: 30, initials: "NJ", grad: "from-[#ffb800] to-[#f59e0b]", pot: "Mountain Bike",
    image: "https://images.unsplash.com/photo-1592621385612-4d7129426394?w=200&h=200&fit=crop&crop=faces&q=80",
    msg: "I hope every single ride reminds you just how deeply you are loved. You make all of us so incredibly happy and proud." },
  { name: "School Friends", amount: 20, initials: "SF", grad: "from-[#ffb800] to-[#f59e0b]", pot: "LEGO Set",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&h=200&fit=crop&q=80",
    msg: "From all the gang — go absolutely smash it! You are the absolute best. See you at the park very soon." },
];

const V2_TOTAL = V2_POTS.reduce((s, p) => s + p.amount, 0);

type RevealV2Phase = "idle" | "intro" | "name" | "flash" | "pots" | "contributors" | "share";

function useFireworks(canvasRef: React.RefObject<HTMLCanvasElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let raf = 0;
    interface FParticle { x: number; y: number; vx: number; vy: number; alpha: number; color: string; size: number; trail: [number, number][]; }
    const particles: FParticle[] = [];
    const COLORS = ["#ffb800", "#ffb800", "#ef4444", "#a855f7", "#3b82f6", "#10b981", "#ffb800", "#fff"];
    let t = 0;

    function explode(x: number, y: number) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]!;
      const n = 55 + Math.floor(Math.random() * 35);
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.4;
        const speed = 1.5 + Math.random() * 5;
        particles.push({ x, y, trail: [], vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1,
          alpha: 1, color, size: 1.5 + Math.random() * 2 });
      }
    }

    function frame() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      t++;
      if (t % 20 === 0) explode(canvas!.width * (0.1 + Math.random() * 0.8), canvas!.height * (0.08 + Math.random() * 0.5));

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]!;
        p.trail.push([p.x, p.y]);
        if (p.trail.length > 7) p.trail.shift();
        p.x += p.vx; p.y += p.vy; p.vy += 0.13; p.vx *= 0.98; p.alpha -= 0.015;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }
        for (let j = 0; j < p.trail.length - 1; j++) {
          const ta = (j / p.trail.length) * p.alpha * 0.4;
          const hex = Math.round(ta * 255).toString(16).padStart(2, "0");
          ctx!.beginPath();
          ctx!.strokeStyle = p.color + hex;
          ctx!.lineWidth = 0.8;
          ctx!.moveTo(p.trail[j]![0], p.trail[j]![1]);
          ctx!.lineTo(p.trail[j + 1]![0], p.trail[j + 1]![1]);
          ctx!.stroke();
        }
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, "0");
        ctx!.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, canvasRef]);
}

function TypedMessage({ text, delay = 0 }: { text: string; delay?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    const t0 = setTimeout(() => {
      const iv = setInterval(() => setShown((v) => { if (v >= text.length) { clearInterval(iv); return v; } return v + 1; }), 24);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t0);
  }, [text, delay]);
  return <>{text.slice(0, shown)}{shown < text.length && <span className="animate-pulse opacity-70">|</span>}</>;
}

function RevealV2View() {
  const [phase, setPhase] = useState<RevealV2Phase>("idle");
  const [contribIdx, setContribIdx] = useState(0);
  const [flash, setFlash] = useState(false);
  const [visiblePots, setVisiblePots] = useState(0);
  const [showPotsCta, setShowPotsCta] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useFireworks(canvasRef, phase === "pots" || phase === "contributors" || phase === "share");

  function launch() {
    setPhase("intro");
    setTimeout(() => setPhase("name"), 3000);
    setTimeout(() => { setFlash(true); setTimeout(() => setFlash(false), 380); setPhase("flash"); }, 5800);
    setTimeout(() => setPhase("pots"), 6200);
  }

  useEffect(() => {
    if (phase !== "pots") { setVisiblePots(0); setShowPotsCta(false); return; }
    const ts = [
      setTimeout(() => setVisiblePots(1), 300),
      setTimeout(() => setVisiblePots(2), 1000),
      setTimeout(() => setVisiblePots(3), 1700),
      setTimeout(() => setShowPotsCta(true), 3100),
    ];
    return () => ts.forEach(clearTimeout);
  }, [phase]);

  function goContributors() { setContribIdx(0); setPhase("contributors"); }
  function nextContrib() { if (contribIdx < V2_CONTRIBS.length - 1) setContribIdx((i) => i + 1); else setPhase("share"); }
  function reset() { setPhase("idle"); setContribIdx(0); setFlash(false); setVisiblePots(0); setShowPotsCta(false); }

  const contrib = V2_CONTRIBS[contribIdx]!;

  return (
    <div className="relative overflow-hidden" style={{ minHeight: "calc(100vh - 120px)", background: "#000" }}>
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-10 h-full w-full" />

      {/* White flash */}
      <AnimatePresence>
        {flash && (
          <motion.div key="flash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.06 }} className="absolute inset-0 z-50 bg-white" />
        )}
      </AnimatePresence>

      {/* ── IDLE ── */}
      <AnimatePresence>
        {phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.45 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
            style={{ background: "radial-gradient(ellipse 90% 65% at 50% 65%,#101010,#000)" }}>
            {EMBERS_V2.map((e) => (
              <span key={e.id} className="pointer-events-none absolute rounded-full bg-amber-400/55"
                style={{ left: e.left, bottom: 0, width: e.size, height: e.size,
                  animation: `ember-rise ${e.dur} ${e.delay} ease-out infinite`, "--sx": e.drift } as React.CSSProperties} />
            ))}
            <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="mb-7 flex h-20 w-20 items-center justify-center rounded-3xl"
              style={{ background: "linear-gradient(135deg,#ffb800,#ffb800)", boxShadow: "0 0 50px rgba(251,146,60,0.65),0 0 100px rgba(251,146,60,0.3)" }}>
              <Flame className="h-10 w-10 text-stone-900" strokeWidth={1.5} />
            </motion.div>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-400/60">
              Kindled · The Big Reveal
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              style={{ fontFamily: "var(--font-display)" }}
              className="mb-3 text-[40px] font-black leading-tight text-white md:text-[52px]">
              The moment<br />
              <span style={{ backgroundImage: "linear-gradient(135deg,#ffb800,#ffb800,#ffb800)" }}
                className="bg-clip-text text-transparent">they&apos;ve been waiting for</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="mb-3 max-w-xs text-[14px] leading-relaxed text-white/35">
              A cinematic reveal for Billy — {V2_POTS.length} gifts, {V2_CONTRIBS.length} people, one unforgettable moment.
            </motion.p>
            {/* Mini pot preview pills */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72 }}
              className="mb-9 flex flex-wrap justify-center gap-2">
              {V2_POTS.map((p) => (
                <div key={p.id} className={`flex items-center gap-1.5 rounded-full bg-gradient-to-r ${p.grad} px-3 py-1.5`}>
                  <p.Icon className="h-3 w-3 text-white" strokeWidth={2} />
                  <span className="text-[10px] font-bold text-white">{p.name.split(" ").slice(0, 2).join(" ")}</span>
                  {p.complete && <span className="ml-0.5 text-[9px] font-black text-white/70">✓</span>}
                </div>
              ))}
            </motion.div>
            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}
              whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.05, y: -2 }} onClick={launch}
              className="flex items-center gap-3 rounded-2xl px-8 py-4 text-[16px] font-black text-stone-900"
              style={{ background: "linear-gradient(135deg,#ffb800,#ffb800)", boxShadow: "0 0 40px rgba(251,146,60,0.5),0 8px 32px rgba(0,0,0,0.5)" }}>
              <Flame className="h-5 w-5" />
              Ignite Billy&apos;s Reveal
              <Sparkles className="h-5 w-5" />
            </motion.button>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
              className="mt-4 text-[10px] uppercase tracking-widest text-white/15">Sound on for full experience</motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INTRO ── */}
      <AnimatePresence>
        {phase === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: "#000" }}>
            <motion.div animate={{ scale: [0.85, 1.3, 0.9, 1.15, 0.85], opacity: [0.2, 0.8, 0.3, 0.7, 0.2] }}
              transition={{ duration: 3, ease: "easeInOut" }} className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%,rgba(251,146,60,0.3),transparent)" }} />
            <motion.p initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.7, 1, 1, 1.15] }}
              transition={{ duration: 3, times: [0, 0.2, 0.75, 1] }}
              style={{ fontFamily: "var(--font-display)" }}
              className="text-center text-[32px] font-black text-white md:text-[48px]">
              Something special<br />is about to happen…
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NAME ── */}
      <AnimatePresence>
        {phase === "name" && (
          <motion.div key="name" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden"
            style={{ background: "radial-gradient(ellipse 110% 80% at 50% 60%,#141414,#000)" }}>
            {EMBERS_V2.map((e) => (
              <span key={e.id} className="pointer-events-none absolute rounded-full bg-amber-400/70"
                style={{ left: e.left, bottom: 0, width: e.size, height: e.size,
                  animation: `ember-rise ${e.dur} ${e.delay} ease-out infinite`, "--sx": e.drift } as React.CSSProperties} />
            ))}
            <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="mb-5 text-[11px] font-black uppercase tracking-[0.35em] text-amber-400/55">This one&apos;s for</motion.p>
            <div className="mb-7 flex gap-1 md:gap-2">
              {"BILLY".split("").map((letter, i) => (
                <motion.span key={i} initial={{ opacity: 0, y: 50, scale: 0.4 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.25 + i * 0.11, type: "spring", stiffness: 520, damping: 22 }}
                  style={{ fontFamily: "var(--font-display)",
                    backgroundImage: "linear-gradient(180deg,#fde68a 0%,#ffb800 35%,#ffb800 100%)",
                    textShadow: "0 0 40px rgba(251,146,60,0.9),0 0 80px rgba(251,146,60,0.45)" }}
                  className="bg-clip-text text-[80px] font-black leading-none text-transparent md:text-[110px]">
                  {letter}
                </motion.span>
              ))}
            </div>
            {/* Contributor avatars */}
            <div className="flex flex-wrap justify-center gap-2 px-8">
              {V2_CONTRIBS.map((c, i) => (
                <motion.div key={c.name} initial={{ opacity: 0, scale: 0, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 1.1 + i * 0.14, type: "spring", stiffness: 480, damping: 24 }}
                  className={`relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${c.grad} text-[11px] font-black text-white shadow-lg`}>
                  {c.initials}
                  {c.image && <img src={c.image} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" onError={(e)=>{e.currentTarget.remove();}} />}
                </motion.div>
              ))}
            </div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.1 }}
              className="mt-4 text-[13px] text-white/35">{V2_CONTRIBS.length} people · {V2_POTS.length} gifts · £{V2_TOTAL} raised</motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MULTI-POT REVEAL ── */}
      <AnimatePresence>
        {phase === "pots" && (
          <motion.div key="pots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 z-20 flex flex-col justify-center px-4 overflow-y-auto py-6"
            style={{ background: "radial-gradient(ellipse 110% 70% at 50% 30%,#0d0d0d,#000)" }}>

            {/* Ambient glow */}
            <div className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(ellipse 55% 40% at 50% 25%,rgba(251,146,60,0.14),transparent)" }} />

            {/* Header */}
            <div className="mb-5 text-center">
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-amber-400/55">
                Billy&apos;s Christmas haul — revealed
              </motion.p>
              <motion.div initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 380, damping: 22 }}
                className="flex items-baseline justify-center gap-2">
                <span style={{ fontFamily: "var(--font-display)" }}
                  className="text-[56px] font-black leading-none text-white">£{V2_TOTAL}</span>
                <span className="pb-1 text-[15px] font-bold text-amber-400/60">raised in total</span>
              </motion.div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                className="text-[11px] text-white/30">
                {V2_POTS.filter(p => p.complete).length} of {V2_POTS.length} gifts fully funded · {V2_CONTRIBS.length} people chipped in
              </motion.p>
            </div>

            {/* Pot cards — staggered drop-in */}
            <div className="flex flex-col gap-3 w-full">
              {V2_POTS.map((pot, i) => (
                <AnimatePresence key={pot.id}>
                  {visiblePots > i && (
                    <motion.div
                      key={pot.id}
                      initial={{ y: -90, opacity: 0, scale: 0.84, rotateX: -20 }}
                      animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 24 }}
                      className="relative overflow-hidden rounded-2xl"
                      style={{
                        background: "linear-gradient(145deg,#111111,#0a0a0a)",
                        border: `1px solid ${pot.complete ? "rgba(251,146,60,0.28)" : "rgba(255,255,255,0.07)"}`,
                        boxShadow: pot.complete
                          ? `0 0 0 1px ${pot.glow}22, 0 12px 48px ${pot.glow}35, 0 4px 16px rgba(0,0,0,0.8)`
                          : "0 4px 20px rgba(0,0,0,0.7)",
                      }}>
                      {/* Coloured accent bar */}
                      <div className={`h-1 w-full bg-gradient-to-r ${pot.grad}`} />

                      <div className="flex items-center gap-3.5 p-4">
                        {/* Icon badge */}
                        <motion.div
                          initial={{ scale: 0, rotate: -30 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.18, type: "spring", stiffness: 500, damping: 20 }}
                          className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${pot.grad}`}
                          style={{ boxShadow: `0 4px 20px ${pot.glow}55`, width: 52, height: 52 }}>
                          <pot.Icon className="h-6 w-6 text-white" strokeWidth={1.75} />
                        </motion.div>

                        {/* Name + progress */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-bold text-white leading-tight">{pot.name}</p>
                          <p className="text-[10px] text-white/30 mb-2">{pot.sub}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-white/8">
                              <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: `${Math.round((pot.amount / pot.goal) * 100)}%` }}
                                transition={{ delay: 0.28, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                                className={`h-full rounded-full bg-gradient-to-r ${pot.grad}`}
                              />
                            </div>
                            <span className="shrink-0 text-[10px] font-bold text-white/40">
                              {Math.round((pot.amount / pot.goal) * 100)}%
                            </span>
                          </div>
                        </div>

                        {/* Amount + badge */}
                        <div className="shrink-0 text-right ml-1">
                          <motion.p
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.22 }}
                            style={{ fontFamily: "var(--font-display)" }}
                            className="text-[24px] font-black text-white leading-none">
                            £{pot.amount}
                          </motion.p>
                          {pot.complete ? (
                            <motion.div
                              initial={{ scale: 0, rotate: -25, opacity: 0 }}
                              animate={{ scale: 1, rotate: -7, opacity: 1 }}
                              transition={{ delay: 0.95, type: "spring", stiffness: 650, damping: 16 }}
                              className={`mt-1.5 inline-block rounded-md bg-gradient-to-r ${pot.grad} px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white shadow-lg`}>
                              Funded!
                            </motion.div>
                          ) : (
                            <p className="mt-1.5 text-[9px] text-white/25">of £{pot.goal}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}
            </div>

            {/* Contributor avatar strip — appears with CTA */}
            <AnimatePresence>
              {showPotsCta && (
                <motion.div key="strip"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 340, damping: 28 }}
                  className="mt-4 flex items-center justify-center gap-1.5">
                  <div className="flex -space-x-2.5">
                    {V2_CONTRIBS.map((c, i) => (
                      <div key={i}
                        className={`relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-black bg-gradient-to-br ${c.grad} text-[9px] font-black text-white`}>
                        {c.initials}
                        {c.image && <img src={c.image} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" onError={(e)=>{e.currentTarget.remove();}} />}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-white/35 ml-1">{V2_CONTRIBS.length} people made this happen</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA */}
            <AnimatePresence>
              {showPotsCta && (
                <motion.button key="pots-cta"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 360, damping: 26 }}
                  whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.03, y: -2 }}
                  onClick={goContributors}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-black text-stone-900"
                  style={{ background: "linear-gradient(135deg,#ffb800,#ffb800)", boxShadow: "0 8px 32px rgba(251,146,60,0.45),0 2px 8px rgba(0,0,0,0.5)" }}>
                  <Users className="h-5 w-5" />
                  Meet the {V2_CONTRIBS.length} people who made this happen
                  <ChevronRight className="h-5 w-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONTRIBUTORS ── */}
      <AnimatePresence mode="wait">
        {phase === "contributors" && (
          <motion.div key={`c-${contribIdx}`}
            initial={{ opacity: 0, y: 55, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -55, scale: 1.04 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6 text-center overflow-hidden"
            style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%,#0c0c0c,#000)" }}>
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {EMBERS_V2.slice(0, 10).map((e) => (
                <span key={e.id} className="absolute rounded-full bg-amber-400/25"
                  style={{ left: e.left, bottom: 0, width: e.size, height: e.size,
                    animation: `ember-rise ${e.dur} ${e.delay} ease-out infinite`, "--sx": e.drift } as React.CSSProperties} />
              ))}
            </div>

            {/* Progress dots */}
            <div className="mb-5 flex gap-1.5">
              {V2_CONTRIBS.map((_, i) => (
                <motion.div key={i}
                  animate={{ scale: i === contribIdx ? 1 : 0.65, opacity: i === contribIdx ? 1 : 0.3 }}
                  className={`h-1.5 rounded-full bg-gradient-to-r ${V2_CONTRIBS[i]!.grad}`}
                  style={{ width: i === contribIdx ? 24 : 6 }} />
              ))}
            </div>

            {/* Avatar */}
            <motion.div initial={{ scale: 0, rotate: -160 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 480, damping: 22 }}
              className={`relative mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br ${contrib.grad} text-[28px] font-black text-white`}
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.7),0 0 40px rgba(251,146,60,0.15)" }}>
              {contrib.initials}
              {contrib.image && <img src={contrib.image} alt={contrib.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" onError={(e)=>{e.currentTarget.remove();}} />}
            </motion.div>

            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ fontFamily: "var(--font-display)" }} className="text-[30px] font-black text-white mb-0.5">
              {contrib.name}
            </motion.p>

            {/* Amount + which pot */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="mb-5 flex items-center gap-2">
              <span className="text-[26px] font-black text-amber-400">£{contrib.amount}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/40">
                → {contrib.pot}
              </span>
            </motion.div>

            {/* Message card */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}
              className="mb-6 w-full max-w-sm rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-4 backdrop-blur-sm text-left"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}>
              <div className="mb-2.5 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-[#ffb800]" />
                <p className="text-[9px] font-black uppercase tracking-widest text-[#ffb800]/65">Personal message</p>
              </div>
              <p className="min-h-[72px] text-[13px] leading-relaxed text-white/75 italic">
                &ldquo;<TypedMessage text={contrib.msg} delay={500} />&rdquo;
              </p>
            </motion.div>

            {/* Next button */}
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.82 }}
              whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.04 }} onClick={nextContrib}
              className={`flex items-center gap-2 rounded-2xl bg-gradient-to-r ${contrib.grad} px-7 py-3.5 text-[14px] font-bold text-white shadow-xl`}>
              {contribIdx < V2_CONTRIBS.length - 1
                ? <><span>Next: {V2_CONTRIBS[contribIdx + 1]!.name}</span><ChevronRight className="h-4 w-4" /></>
                : <><Sparkles className="h-4 w-4" /><span>See the celebration</span></>}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SHARE / CELEBRATION ── */}
      <AnimatePresence>
        {phase === "share" && (
          <motion.div key="share" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center overflow-hidden"
            style={{ background: "radial-gradient(ellipse 100% 70% at 50% 40%,#121212,#000)" }}>
            {EMBERS_V2.map((e) => (
              <span key={e.id} className="pointer-events-none absolute rounded-full bg-amber-400/45"
                style={{ left: e.left, bottom: 0, width: e.size, height: e.size,
                  animation: `ember-rise ${e.dur} ${e.delay} ease-out infinite`, "--sx": e.drift } as React.CSSProperties} />
            ))}

            <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 14, -10, 6, 0] }}
              transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
              className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl"
              style={{ background: "linear-gradient(135deg,#ffb800,#ffb800)", boxShadow: "0 0 50px rgba(251,146,60,0.6),0 0 100px rgba(251,146,60,0.25)" }}>
              <Sparkles className="h-10 w-10 text-stone-900" />
            </motion.div>

            <motion.h2 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{ fontFamily: "var(--font-display)" }}
              className="mb-2 text-[44px] font-black leading-tight text-white">
              That&apos;s a wrap,{" "}
              <span style={{ backgroundImage: "linear-gradient(135deg,#ffb800,#ffb800)" }} className="bg-clip-text text-transparent">Billy!</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="mb-7 max-w-xs text-[14px] leading-relaxed text-white/40">
              {V2_CONTRIBS.length} people came together, raised £{V2_TOTAL}, and funded {V2_POTS.filter(p => p.complete).length} gifts. That&apos;s the power of Kindled.
            </motion.p>

            {/* Stats row */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
              className="mb-7 flex gap-3">
              {[[String(V2_CONTRIBS.length), "people"], [`£${V2_TOTAL}`, "raised"], [`${V2_POTS.filter(p=>p.complete).length}/${V2_POTS.length}`, "gifts"]].map(([v, l]) => (
                <div key={l} className="flex flex-col items-center rounded-2xl border border-white/8 bg-white/[0.05] px-4 py-3">
                  <span style={{ fontFamily: "var(--font-display)" }} className="text-[26px] font-black text-amber-400 leading-tight">{v}</span>
                  <span className="text-[9px] uppercase tracking-wider text-white/30">{l}</span>
                </div>
              ))}
            </motion.div>

            {/* Pot recap strip */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }}
              className="mb-6 flex gap-2">
              {V2_POTS.map((p) => (
                <div key={p.id} className={`flex items-center gap-1.5 rounded-full bg-gradient-to-r ${p.grad} px-3 py-1.5 opacity-90`}>
                  <p.Icon className="h-3 w-3 text-white" strokeWidth={2} />
                  <span className="text-[9px] font-black text-white">{p.complete ? "Funded" : "In progress"}</span>
                </div>
              ))}
            </motion.div>

            {/* Action buttons — the "what comes next" */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.74 }}
              className="flex w-full max-w-xs flex-col gap-3">
              <button
                onClick={() => { void navigator.clipboard.writeText("https://kindledgift.co.uk").catch(() => null); }}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ffb800] to-[#f59e0b] py-4 text-[15px] font-bold text-stone-900"
                style={{ boxShadow: "0 8px 32px rgba(251,146,60,0.4)" }}>
                <Share2 className="h-4 w-4" />
                Share this moment
              </button>
              <a href="/pots/demo"
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] py-4 text-[15px] font-semibold text-white/65 transition-colors hover:border-white/20 hover:text-white/90">
                <Flame className="h-4 w-4 text-amber-400" />
                Start my own board — free
              </a>
              <button onClick={reset}
                className="py-2 text-[12px] text-white/20 transition-colors hover:text-white/45">
                Watch again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE SWITCHER
// ═══════════════════════════════════════════════════════════════════════════════

// ─── POST-REVEAL: turn the pot into the real gift ─────────────────────────────
// This is the affiliate + gift-card revenue moment: buy now (boosted cashback),
// flexible gift cards, and a top-up for any gift that isn't fully funded.
function PostRevealOptions({ recipientName, totalRaised, onReplay }: {
  recipientName: string; totalRaised: number; onReplay: () => void;
}) {
  const [toppedUp, setToppedUp] = useState<Set<string>>(new Set());
  const [addedCards, setAddedCards] = useState<Set<string>>(new Set());

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 px-4 pb-32 pt-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffb800] to-[#f59e0b] shadow-lg shadow-emerald-900/30">
          <Check className="h-7 w-7 text-white" strokeWidth={3} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Reveal complete</p>
        <h2 style={{ fontFamily: "var(--font-display)" }} className="mt-1 text-[24px] font-black text-white">Now make it real</h2>
        <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-stone-400">
          {recipientName}&apos;s £{totalRaised} is ready. Buy each gift for real, or turn it into flexible gift cards.
        </p>
      </div>

      {/* Gifts → buy now / top up */}
      <div className="space-y-3">
        {V2_POTS.map((g) => {
          const remaining = Math.max(0, g.goal - g.amount);
          const funded = g.complete || toppedUp.has(g.id);
          return (
            <div key={g.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="flex gap-3 p-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl" style={{ background: g.glow + "22" }}>
                  <img src={g.image} alt={g.name} loading="lazy" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.opacity = "0"; }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-black text-white">{g.name}</p>
                  <p className="text-[11px] text-stone-400">{g.retailer} · £{g.goal}</p>
                  {funded ? (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      <Check className="h-3 w-3" strokeWidth={3} /> Fully funded
                    </span>
                  ) : (
                    <span className="mt-1.5 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">£{remaining} to go</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 border-t border-white/5 p-3">
                {funded ? (
                  <a href={trackingDecorator(g.buyUrl, "amazon")} target="_blank" rel={AFFILIATE_LINK_REL}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ffb800] to-[#f59e0b] py-2.5 text-[13px] font-black text-stone-900 shadow-lg shadow-amber-500/20 active:scale-95 transition-transform">
                    <ShoppingBag className="h-4 w-4" strokeWidth={2.5} /> Buy now
                    <span className="rounded-full bg-stone-900/20 px-1.5 py-0.5 text-[9px] font-black">+{g.boost}% back</span>
                  </a>
                ) : (
                  <>
                    <button onClick={() => setToppedUp((s) => new Set([...s, g.id]))}
                      className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-2.5 text-[13px] font-black text-white transition-transform active:scale-95">
                      Top up £{remaining}
                    </button>
                    <a href={trackingDecorator(g.buyUrl, "amazon")} target="_blank" rel={AFFILIATE_LINK_REL}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 px-3.5 py-2.5 text-[12px] font-bold text-white">
                      <ShoppingBag className="h-3.5 w-3.5" /> Buy
                    </a>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Gift cards — flexible option */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950/60 to-violet-950/40 p-4">
        <p className="text-[14px] font-black text-white">Prefer flexibility?</p>
        <p className="mt-1 text-[12px] leading-relaxed text-stone-400">
          Turn the pot into gift cards — spend anywhere, and earn cashback into {recipientName}&apos;s wallet for next time.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[{ brand: "Amazon", back: 3, color: "#f59e0b" }, { brand: "Currys", back: 4, color: "#a78bfa" }, { brand: "Smyths", back: 5, color: "#34d399" }].map((c) => {
            const added = addedCards.has(c.brand);
            return (
              <button key={c.brand} onClick={() => setAddedCards((s) => new Set([...s, c.brand]))}
                className={cn("rounded-xl border px-2 py-3 text-center transition-colors", added ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/10 bg-white/[0.06]")}>
                <p className="text-[12px] font-black text-white">{c.brand}</p>
                <p className="mt-0.5 text-[10px] font-bold" style={{ color: added ? "#34d399" : c.color }}>{added ? "Added" : `+${c.back}% back`}</p>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-center text-[10px] leading-relaxed text-stone-500">
        <span className="font-semibold text-stone-400">{AFFILIATE_DISCLOSURE}</span> The commission keeps Kindled free, with a cashback boost for next time. Real UK retailers only.
      </p>

      <button onClick={onReplay} className="mx-auto mt-5 flex items-center gap-1.5 text-[12px] font-bold text-stone-500 transition-colors hover:text-stone-300">
        <Play className="h-3.5 w-3.5" /> Watch the reveal again
      </button>
    </div>
  );
}

// ─── JOINT FIRES — two partners, one Major Goal (Modern-Nostalgia / Monzo feel) ─
// Charcoal canvas, bone-white type, a single amber action accent, glass cards,
// an SVG "Momentum Arc" that fills toward the goal, and a 1/2/3-year projection.

const JOINT_PARTNERS: (JointContributor & { initials: string; image: string })[] = [
  { name: "Sam",  avgPerEvent: 200, initials: "S", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&q=80" },
  { name: "Jess", avgPerEvent: 130, initials: "J", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces&q=80" },
];
const JOINT_EVENTS: (GiftingEvent & { Icon: LucideIcon })[] = [
  { label: "Birthdays",     perYear: 1, Icon: Cake },
  { label: "Christmas",     perYear: 1, Icon: TreePine },
  { label: "Anniversary",   perYear: 1, Icon: Heart },
];
// Each milestone category has its own Major Goal and aspirational imagery —
// the Legacy Arc and hero re-skin when the category changes.
const MILESTONE_GOALS: Record<MilestoneCategory, { title: string; sub: string; value: number; image: string }> = {
  EXPEDITION:  { title: "The Maldives",      sub: "Overwater villa · 10 nights",   value: 3200, image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=900&h=600&fit=crop&q=85" },
  FOUNDATION:  { title: "The Dream Kitchen", sub: "Full renovation · fitted",       value: 6000, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&h=600&fit=crop&q=85" },
  CELEBRATION: { title: "The 40th",          sub: "Venue, the works · one big night", value: 2400, image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&h=600&fit=crop&q=85" },
  LEGACY:      { title: "Theo's Future Fund", sub: "A head start for our son",       value: 4500, image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&h=600&fit=crop&q=85" },
};
const MILESTONE_ORDER: MilestoneCategory[] = ["EXPEDITION", "FOUNDATION", "CELEBRATION", "LEGACY"];

function MomentumArc({ progress, milestones }: { progress: number; milestones: { label: string; frac: number }[] }) {
  const trackRef = useRef<SVGPathElement>(null);
  const [pts, setPts] = useState<{ x: number; y: number }[]>([]);
  const [goalPt, setGoalPt] = useState<{ x: number; y: number } | null>(null);
  const D = "M 26 170 C 120 170, 150 60, 298 42";

  useEffect(() => {
    const p = trackRef.current;
    if (!p) return;
    const len = p.getTotalLength();
    setPts(milestones.map((m) => { const pt = p.getPointAtLength(len * m.frac); return { x: pt.x, y: pt.y }; }));
    const end = p.getPointAtLength(len);
    setGoalPt({ x: end.x, y: end.y });
  }, [milestones]);

  return (
    <svg viewBox="0 0 320 200" className="w-full">
      <defs>
        <linearGradient id="jfArc" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <filter id="jfGlow"><feGaussianBlur stdDeviation="2.4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <path ref={trackRef} d={D} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.5 7" />
      <motion.path d={D} fill="none" stroke="url(#jfArc)" strokeWidth="4.5" strokeLinecap="round" filter="url(#jfGlow)"
        initial={{ pathLength: 0 }} animate={{ pathLength: Math.max(0.001, progress) }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} />
      {pts.map((pt, i) => {
        const reached = progress >= milestones[i]!.frac;
        return (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r="5.5" fill={reached ? "#fbbf24" : "#1c1f27"} stroke={reached ? "#fff" : "rgba(148,163,184,0.45)"} strokeWidth="1.5" />
            <text x={pt.x} y={pt.y - 12} textAnchor="middle" fill={reached ? "#fcd34d" : "#64748b"} fontSize="9" fontWeight="700">{milestones[i]!.label}</text>
          </g>
        );
      })}
      {goalPt && (
        <g>
          <circle cx={goalPt.x} cy={goalPt.y} r="6" fill="#1c1410" stroke="#fbbf24" strokeWidth="2.5" />
          <circle cx={goalPt.x} cy={goalPt.y} r="2.5" fill="#fbbf24" />
          <circle cx={goalPt.x} cy={goalPt.y} r="9" fill="none" stroke="#fbbf24" strokeOpacity="0.4">
            <animate attributeName="r" values="9;16;9" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <text x={goalPt.x} y={goalPt.y - 14} textAnchor="middle" fill="#fcd34d" fontSize="9" fontWeight="800">GOAL</text>
        </g>
      )}
    </svg>
  );
}

const MILESTONE_ICONS: Record<MilestoneCategory, LucideIcon> = { EXPEDITION: Plane, FOUNDATION: Home, CELEBRATION: Sparkles, LEGACY: Heart };

// Discovery products — what the Conversion Engine surfaces for each goal. In
// production these come from CatalogService.fetchProductFeed; here they're a
// curated demo set, with a few price-drops to show the Smart-Shopper monitor.
interface DiscoveryProduct {
  id: string; name: string; price: number; prevPrice?: number;
  image: string; retailerId: string; category: MilestoneCategory; url: string;
}
const IMG = (id: string) => `https://images.unsplash.com/photo-${id}?w=400&h=300&fit=crop&q=80`;
const DISCOVERY_PRODUCTS: DiscoveryProduct[] = [
  { id: "x1", category: "EXPEDITION", name: "7-Night Maldives Escape", price: 2890, prevPrice: 3200, retailerId: "tui",          image: IMG("1514282401047-d79a71a590e8"), url: "https://www.tui.co.uk/holidays" },
  { id: "x2", category: "EXPEDITION", name: "Osprey 70L Travel Pack",   price: 185,                 retailerId: "cotswold",     image: IMG("1553062407-98eeb64c6a62"),    url: "https://www.cotswoldoutdoor.com" },
  { id: "x3", category: "EXPEDITION", name: "Learn-to-Surf Week",       price: 299,                 retailerId: "gooutdoors",   image: IMG("1502680390469-be75c86b636f"), url: "https://www.gooutdoors.co.uk" },
  { id: "f1", category: "FOUNDATION", name: "Velvet 3-Seater Sofa",     price: 649, prevPrice: 799, retailerId: "dunelm",       image: IMG("1555041469-a586c61ea9bc"),    url: "https://www.dunelm.com" },
  { id: "f2", category: "FOUNDATION", name: "Artisan Stand Mixer",      price: 429,                 retailerId: "johnlewis",    image: IMG("1556909114-f6e7ad7d3136"),    url: "https://www.johnlewis.com" },
  { id: "f3", category: "FOUNDATION", name: "Bean-to-Cup Coffee Machine", price: 549,               retailerId: "wayfair",      image: IMG("1495474472287-4d71bcdd2085"), url: "https://www.wayfair.co.uk" },
  { id: "c1", category: "CELEBRATION", name: "Hot Air Balloon for Two", price: 198,                 retailerId: "virginexperience", image: IMG("1471879832106-c7ab9e0cee23"), url: "https://www.virginexperiencedays.co.uk" },
  { id: "c2", category: "CELEBRATION", name: "Luxury Spa Day for Two",  price: 149, prevPrice: 179, retailerId: "buyagift",     image: IMG("1540555700478-4be289fbecef"), url: "https://www.buyagift.co.uk" },
  { id: "c3", category: "CELEBRATION", name: "Michelin Dinner for Two", price: 249,                 retailerId: "redletterdays", image: IMG("1414235077428-338989a2e8c0"), url: "https://www.redletterdays.co.uk" },
  { id: "l1", category: "LEGACY", name: "9ct Gold Locket",             price: 240, prevPrice: 295, retailerId: "beaverbrooks", image: IMG("1535632787350-4e68ef0ac584"), url: "https://www.beaverbrooks.co.uk" },
  { id: "l2", category: "LEGACY", name: "Engraved Automatic Watch",    price: 495,                 retailerId: "goldsmiths",   image: IMG("1523275335684-37898b6baf30"), url: "https://www.goldsmiths.co.uk" },
  { id: "l3", category: "LEGACY", name: "Heirloom Fragrance Set",      price: 160,                 retailerId: "etsy",         image: IMG("1541643600914-78b084683702"), url: "https://www.etsy.com" },
];

function GoalDiscovery({ category }: { category: MilestoneCategory }) {
  const products = DISCOVERY_PRODUCTS.filter((p) => p.category === category);
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Discover · curated for this goal</p>
        <span className="text-[10px] text-slate-600">Partner retailers</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {products.map((p) => {
          const drop = p.prevPrice ? priceDrop(p.prevPrice, p.price) : null;
          const retailer = getRetailer(p.retailerId);
          return (
            <a key={p.id} href={trackingDecorator(p.url, p.retailerId)} target="_blank" rel={AFFILIATE_LINK_REL}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]">
              <div className="relative h-28 overflow-hidden">
                <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => { e.currentTarget.style.opacity = "0.2"; }} />
                {drop?.dropped && (
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black text-stone-900">
                    <TrendingDown className="h-2.5 w-2.5" strokeWidth={3} /> {drop.pct}% · save £{drop.saved}
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-[12px] font-bold text-stone-100">{p.name}</p>
                <p className="text-[10px] text-slate-500">{retailer?.name ?? p.retailerId}</p>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-[15px] font-black text-amber-400 tabular-nums">£{p.price.toLocaleString()}</span>
                  {drop?.dropped && <span className="text-[11px] text-slate-600 line-through">£{p.prevPrice!.toLocaleString()}</span>}
                  <ExternalLink className="ml-auto h-3 w-3 text-slate-600 transition-colors group-hover:text-amber-400" />
                </div>
              </div>
            </a>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-slate-600">{AFFILIATE_DISCLOSURE}</p>
    </div>
  );
}

function JointFireView() {
  const [category, setCategory] = useState<MilestoneCategory>("EXPEDITION");
  const [combined, setCombined] = useState(true);
  const [horizon, setHorizon] = useState(3);

  const goal = MILESTONE_GOALS[category];
  const profile = MILESTONE_PROFILES[category];
  const HeroIcon = MILESTONE_ICONS[category];
  const contributors = combined ? JOINT_PARTNERS : [JOINT_PARTNERS[0]!];

  const projection = projectCumulative(contributors, JOINT_EVENTS, { years: 3, momentum: profile.momentum });
  const current = projection.find((p) => p.year === horizon) ?? projection[projection.length - 1]!;
  const progress = goalProgress(projection, goal.value, horizon);

  const ttgCombined = timeToGoal(JOINT_PARTNERS, JOINT_EVENTS, goal.value, category);
  const ttgSolo = timeToGoal([JOINT_PARTNERS[0]!], JOINT_EVENTS, goal.value, category);
  const ttg = combined ? ttgCombined : ttgSolo;
  const faster = Number.isFinite(ttgSolo) && Number.isFinite(ttgCombined) && ttgSolo > 0 ? Math.round((1 - ttgCombined / ttgSolo) * 100) : 0;
  const fmtYears = (y: number) => (Number.isFinite(y) ? `${y.toFixed(1)} yrs` : "5+ yrs");

  const milestones = [
    { label: "Birthday", frac: 0.26 },
    { label: "Xmas", frac: 0.54 },
    { label: "Anniv.", frac: 0.8 },
  ];
  const reveal = { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "0px 0px -60px 0px" }, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } };

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 pb-32 pt-6 text-[#f5f5f5]">
      {/* Header */}
      <motion.div {...reveal} className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#ffb800]">Joint Fire · Milestone Engine</p>
        <h2 className="font-editorial mt-1.5 text-[27px] font-semibold leading-tight text-[#f5f5f5]">Stack your birthdays. Combine your Christmases.</h2>
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed tracking-tight text-[#f5f5f5]/55">Link accounts, pick a milestone, and every occasion stacks toward something neither of you would buy on a single day.</p>
      </motion.div>

      {/* Milestone category selector */}
      <motion.div {...reveal} className="mb-4 grid grid-cols-2 gap-2">
        {MILESTONE_ORDER.map((c) => {
          const Icon = MILESTONE_ICONS[c];
          const on = c === category;
          return (
            <button key={c} onClick={() => setCategory(c)}
              className={cn("flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-colors", on ? "border-amber-400/60 bg-amber-400/[0.1]" : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]")}>
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", on ? "bg-amber-400 text-stone-900" : "bg-white/5 text-slate-300")}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className={cn("text-[13px] font-bold leading-tight", on ? "text-amber-200" : "text-stone-200")}>{MILESTONE_PROFILES[c].label}</p>
                <p className="truncate text-[10px] text-slate-500">{MILESTONE_PROFILES[c].tagline}</p>
              </div>
            </button>
          );
        })}
      </motion.div>

      {/* Goal hero card — category-specific photography */}
      <motion.div {...reveal} className="relative overflow-hidden rounded-3xl border border-white/10">
        <AnimatePresence mode="wait">
          <motion.img key={goal.image} src={goal.image} alt={goal.title} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }} className="h-52 w-full object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.opacity = "0.25"; }} />
        </AnimatePresence>
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.94) 100%)" }} />
        <div className="absolute right-4 top-4 flex -space-x-3">
          {JOINT_PARTNERS.map((p) => (
            <div key={p.name} className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-[#0a0a0a] bg-[#1a1a1a]">
              <span className="flex h-full w-full items-center justify-center text-[11px] font-black text-white">{p.initials}</span>
              <img src={p.image} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" onError={(e) => { e.currentTarget.remove(); }} />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="flex items-center gap-1.5">
            <HeroIcon className="h-3.5 w-3.5 text-[#ffb800]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ffb800]">{profile.label} · Major Goal</p>
          </div>
          <p className="font-editorial mt-1 text-[25px] font-semibold leading-none text-[#f5f5f5]">{goal.title}</p>
          <p className="text-[12px] tracking-tight text-[#f5f5f5]/70">{goal.sub}</p>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#f5f5f5]/45">Goal value</p>
              <p className="text-[20px] font-semibold tabular-nums text-[#f5f5f5]">£{goal.value.toLocaleString()}</p>
            </div>
            <span className="bg-[#f5f5f5]/10 px-3 py-1 text-[11px] font-semibold text-[#f5f5f5]/85">{Math.round(progress * 100)}% in {horizon} yrs</span>
          </div>
        </div>
      </motion.div>

      {/* Momentum Arc */}
      <motion.div {...reveal} className="mt-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-sm">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[13px] font-bold text-stone-100">The Legacy Arc</p>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400"><TrendingUp className="h-3.5 w-3.5" /> Building</span>
        </div>
        <p className="mb-2 text-[11px] text-slate-400">Each occasion is an energy booster flowing into the macro-pot.</p>
        <MomentumArc progress={progress} milestones={milestones} />
      </motion.div>

      {/* Dynamic calculator — Individual vs Combined, Time-to-Goal */}
      <motion.div {...reveal} className="mt-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Time to your goal</p>
          <div className="flex rounded-xl border border-white/10 bg-black/20 p-0.5">
            {([["Individual", false], ["Combined", true]] as const).map(([label, val]) => (
              <button key={label} onClick={() => setCombined(val)}
                className={cn("rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors", combined === val ? "bg-amber-400 text-stone-900" : "text-slate-400 hover:text-stone-200")}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={`${category}-${combined}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-3 flex items-end gap-3">
            <p className="font-editorial text-[48px] font-semibold leading-none tabular-nums text-[#f5f5f5]">{fmtYears(ttg)}</p>
            {combined && faster > 0 && <span className="mb-1.5 border border-[#ffb800]/40 bg-[#ffb800]/[0.1] px-2.5 py-1 text-[12px] font-semibold text-[#ffb800]">{faster}% faster together</span>}
          </motion.div>
        </AnimatePresence>
        <p className="mt-1 text-[12px] text-slate-400">{combined ? "Sam & Jess pooling" : "Sam on their own"} · {profile.label} velocity</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl border border-white/10 bg-black/20 py-2.5"><p className="text-[10px] uppercase tracking-wider text-slate-500">Solo</p><p className="text-[15px] font-black text-slate-300">{fmtYears(ttgSolo)}</p></div>
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.08] py-2.5"><p className="text-[10px] uppercase tracking-wider text-amber-400/80">Combined</p><p className="text-[15px] font-black text-amber-300">{fmtYears(ttgCombined)}</p></div>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden bg-[#f5f5f5]/10">
          <motion.div className="h-full bg-[#ffb800]" style={{ boxShadow: "0 0 6px #ffb800" }} initial={{ width: 0 }} animate={{ width: `${Math.round(progress * 100)}%` }} transition={{ duration: 1, ease: LUX_EASE }} />
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Projected pot at {horizon} yrs: <span className="font-bold text-stone-300">£{current.total.toLocaleString()}</span> across {current.events} occasions
          <span className="ml-2 inline-flex gap-1">{[1, 2, 3].map((y) => (
            <button key={y} onClick={() => setHorizon(y)} className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", horizon === y ? "bg-white/15 text-white" : "text-slate-500")}>{y}yr</button>
          ))}</span>
        </p>
      </motion.div>

      {/* Event timeline / macro-pot */}
      <motion.div {...reveal} className="mt-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">What stacks into the goal</p>
        <div className="space-y-2.5">
          {JOINT_EVENTS.map((ev) => {
            const perEvent = contributors.reduce((s, p) => s + p.avgPerEvent, 0);
            return (
              <div key={ev.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10">
                  <ev.Icon className="h-5 w-5 text-amber-400" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-stone-100">{ev.label}</p>
                  <p className="text-[11px] text-slate-400">{combined ? "Both circles chip in" : "One circle chips in"} · adds to the macro-pot</p>
                </div>
                <p className="text-[15px] font-black text-amber-400 tabular-nums">+£{perEvent.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Discovery — the Conversion Engine, filtered to this goal */}
      <motion.div {...reveal} className="mt-6">
        <GoalDiscovery category={category} />
      </motion.div>

      <motion.button {...reveal}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] py-3.5 text-[14px] font-bold text-amber-300 transition-colors active:scale-[0.99] hover:bg-amber-400/[0.14]">
        <UserPlus className="h-4 w-4" /> Invite a partner to your Joint Fire
      </motion.button>
      <p className="mt-3 text-center text-[10px] leading-relaxed text-slate-500">Free to link · withdraw anytime · funds held on regulated Open Banking rails</p>
    </div>
  );
}

type ViewMode = "parent" | "receiver" | "catalogue" | "reveal" | "about" | "stars" | "investor" | "joint";

function RoleSwitcher({ role, onChange }: { role: ViewMode; onChange: (r: ViewMode) => void }) {
  const tabs: { id: ViewMode; label: string; Icon: typeof Users }[] = [
    { id: "parent", label: "Kindlers", Icon: Users },
    { id: "receiver", label: "Billy's View", Icon: Sparkles },
    { id: "stars", label: "Stars", Icon: Star },
    { id: "joint", label: "Joint Fire", Icon: Link2 },
    { id: "catalogue", label: "Catalogue", Icon: ShoppingBag },
    { id: "reveal", label: "Reveal", Icon: Sparkles },
    { id: "about", label: "About", Icon: Info },
    { id: "investor", label: "Investor", Icon: Lock },
  ];
  return (
    <div className="sticky top-0 z-30 border-b border-[rgba(10,10,10,0.1)] bg-[#f5f5f5]/90 px-4 pb-2 pt-3 backdrop-blur-md">
      <div className="-mx-1 overflow-x-auto px-1 scrollbar-none">
      <div className="flex w-full min-w-max gap-1 border border-[rgba(10,10,10,0.08)] bg-[#fafafa] p-1">
        {tabs.map(({ id, label, Icon }) => (
          <motion.button
            key={id}
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange(id)}
            className={cn(
              "relative flex min-w-[52px] flex-col items-center justify-center gap-0.5 px-2.5 py-2 text-[10px] font-semibold transition-colors",
              role === id ? "text-[#f5f5f5]" : "text-[#0a0a0a]/45 hover:text-[#0a0a0a]/70",
            )}
          >
            {role === id && (
              <motion.div layoutId="role-pill" className="absolute inset-0 bg-[#0a0a0a]" style={{ zIndex: -1 }} transition={{ duration: 0.4, ease: LUX_EASE }} />
            )}
            <Icon className={cn("h-3.5 w-3.5", role === id && "text-[#ffb800]")} strokeWidth={role === id ? 2.5 : 1.75} />
            <span>{label}</span>
          </motion.button>
        ))}
      </div>
      </div>
    </div>
  );
}

// ─── Count-up stat for the proof block ───────────────────────────────────────
function CountUpStat({ target, suffix = "", duration = 1400 }: { target: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const ease = 1 - Math.pow(1 - t, 3);
        setVal(Math.round(ease * target));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ─── Single locked pot card used in Receiver's unified stream ─────────────────
function ReceiverPotCard({ pot, index }: { pot: DemoPot; index: number }) {
  const occ = occasionFor(pot);
  const isXmas = occ === "christmas";
  const targetIso = occasionTargetIso(pot);
  const daysUntil = Math.max(0, Math.ceil((new Date(targetIso).getTime() - Date.now()) / 86_400_000));

  const th = {
    bg: "bg-[#0f172a]",
    giftColor: "text-[#f59e0b]", dayColor: "text-[#f59e0b]", labelColor: "text-[#fdf6e3]/50",
    modeLabel: isXmas ? "Under Wraps" : "Wrapped Up",
  };

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ ...VH_BOUNCE, delay: (index % 2) * 0.05 }}
      className={cn("relative overflow-hidden rounded-[24px] vh-lift-lg", th.bg)}
    >
      {/* Seasonal particle backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        {isXmas
          ? SNOW.map((s) => (
              <span key={s.id} className="animate-snow absolute rounded-full bg-white/70"
                style={{ left: s.left, top: 0, width: s.size, height: s.size,
                  "--dur": s.dur, "--sx": s.sx, "--drift": s.drift, animationDelay: s.delay } as React.CSSProperties} />
            ))
          : (
            <>
              {CONFETTI_P.map((c) => (
                <span key={c.id} className={cn("animate-confetti absolute rounded-sm", c.color)}
                  style={{ left: c.left, top: 0, width: c.w, height: c.h,
                    "--dur": c.dur, "--rot": c.rot, animationDelay: c.delay } as React.CSSProperties} />
              ))}
              {BUBBLES_P.map((b) => (
                <span key={b.id} className="animate-bubble-rise absolute bottom-0 rounded-full"
                  style={{ left: b.left, width: b.size, height: b.size, backgroundColor: b.color,
                    "--dur": b.dur, animationDelay: b.delay,
                    boxShadow: `0 0 8px ${b.color}60` } as React.CSSProperties} />
              ))}
            </>
          )}
      </div>

      <div className="relative z-10">
        {/* Product image — full-width banner */}
        {pot.image && (
          <div className="relative h-32 w-full overflow-hidden">
            <img src={pot.image} alt={pot.title} className="h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
            {/* Lock badge */}
            <div className="absolute right-3 top-3 flex items-center gap-1 bg-black/60 px-2 py-1 backdrop-blur-sm">
              <Lock className="h-3 w-3 text-[#fdf6e3]/70" strokeWidth={2} />
              <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#fdf6e3]/60">{th.modeLabel}</span>
            </div>
            {/* Countdown badge */}
            <div className="absolute left-3 top-3 bg-black/60 px-2.5 py-1 backdrop-blur-sm">
              <span className={cn("text-[11px] font-semibold", th.dayColor)}>
                {isXmas ? "Christmas" : "Birthday"} in {daysUntil} {daysUntil === 1 ? "day" : "days"}
              </span>
            </div>
          </div>
        )}

        <div className="p-4">
          {/* Title row */}
          <div className="flex items-start gap-3">
            {!pot.image && (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[rgba(245,245,245,0.12)] bg-[#fdf6e3]/[0.04]">
                <Gift className={cn("h-5 w-5", th.giftColor)} strokeWidth={1.5} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-editorial text-[16px] font-semibold leading-snug text-[#fdf6e3]">{pot.title}</h3>
              <p className={cn("mt-0.5 text-[11px] tracking-tight", th.labelColor)}>
                {!pot.image && `${isXmas ? "Christmas" : "Birthday"} in ${daysUntil} days · `}Keeping it a secret until the big day
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#fdf6e3]/40">Target</p>
              <p className="font-editorial text-[17px] font-semibold text-[#fdf6e3]">£{pot.goal.toLocaleString()}</p>
            </div>
          </div>

          {/* Progress hidden from Billy */}
          <div className="mt-3 flex items-center gap-1.5">
            <Lock className="h-3 w-3 shrink-0 text-[#fdf6e3]/30" />
            <span className="text-[11px] italic text-[#fdf6e3]/30">Progress hidden until reveal day</span>
          </div>

          {/* Stack note */}
          {pot.stackNote && (
            <div className="mt-2 flex items-start gap-1.5 border border-[rgba(245,245,245,0.08)] bg-[#fdf6e3]/[0.04] px-2.5 py-1.5">
              <RefreshCw className="mt-0.5 h-3 w-3 shrink-0 text-[#f59e0b]/70" />
              <p className="text-[10px] leading-snug text-[#fdf6e3]/45">{pot.stackNote}</p>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}

// ─── On-dashboard proof stats (receiver view) ─────────────────────────────────
function ReceiverProofStats() {
  const stats = [
    {
      Icon: Leaf,
      value: 30, suffix: "%",
      label: "Waste Spike",
      desc: "Household retail waste rises 30% over the festive season. Kindled helps families chip away at and reduce holiday retail waste by matching physical purchases to exact, parent-approved demand.",
      color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200/60",
    },
    {
      Icon: ShieldCheck,
      value: 100, suffix: "%",
      label: "Duplicate Free",
      desc: "1 in 5 physical gifts are duplicates. Our real-time checklists eliminate duplicate buying entirely.",
      color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200/60",
    },
    {
      Icon: Landmark,
      value: 3, suffix: ".2B",
      label: "Wasted Annually",
      desc: "Over £3.2B is wasted on unwanted gifts each year in the UK and US alone. Kindled is designed to help families redirect their portion of this wasted capital into major milestone assets.",
      color: "text-violet-500", bg: "bg-violet-50", border: "border-violet-200/60",
    },
  ];

  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff6b6b]">Why this list matters</p>
      <p className="font-editorial mb-4 text-[21px] font-semibold leading-tight text-[#0f172a]">
        A smarter, kinder way to give
      </p>
      <div className="flex flex-col gap-3">
        {stats.map(({ Icon, value, suffix, label, desc }) => (
          <div key={label} className="flex gap-4 rounded-[20px] bg-[#fffdf7] p-4 vh-lift">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f59e0b]/12">
              <Icon className="h-5 w-5 text-[#f59e0b]" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <p className="font-editorial text-[24px] font-semibold text-[#ff6b6b]">
                  {value === 3 ? "£" : ""}<CountUpStat target={value} suffix={suffix} />
                </p>
                <p className="text-[12px] font-bold tracking-tight text-[#0f172a]/70">{label}</p>
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-[#0f172a]/50">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[9px] leading-snug text-[#0f172a]/40">
        Sources: British Retail Consortium · Waste & Resources Action Programme (WRAP) UK · Psychological Science Gifting Surveys
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECEIVER VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function ReceiverView({ pots, onShare, onReveal }: {
  pots: DemoPot[];
  onShare: () => void;
  onReveal: () => void;
}) {
  // Exclude checklist pots entirely — receiver must not see "Mum Knows Best" items
  const sparkGoals = pots.filter((p) => !p.isClaimed && !p.isChecklist);
  const claimed    = pots.filter((p) => p.isClaimed && !p.isChecklist);
  const totalTarget = sparkGoals.reduce((s, p) => s + p.goal, 0);

  // Dual countdown: always compute both Christmas AND Birthday
  const now = new Date();
  const yr  = now.getFullYear();
  let xmasDate = new Date(yr, 11, 25); if (xmasDate <= now) xmasDate = new Date(yr + 1, 11, 25);
  let bdayDate = new Date(yr, 5, 28);  if (bdayDate <= now) bdayDate = new Date(yr + 1, 5, 28);
  const xmasDays = Math.ceil((xmasDate.getTime() - now.getTime()) / 86_400_000);
  const bdayDays = Math.ceil((bdayDate.getTime() - now.getTime()) / 86_400_000);

  return (
    <div className="vh vh-paper min-h-screen">
      {/* Hero */}
      <div className="px-5 pb-4 pt-7">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff6b6b] vh-lift">
              <Sparkles className="h-7 w-7 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff6b6b]">Your Spark Goals</p>
              <h1 className="font-editorial text-[28px] font-semibold leading-tight text-[#0f172a]">Hey Billy!</h1>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            transition={VH_BOUNCE}
            onClick={onShare}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#ff6b6b] px-4 py-2.5 text-[13px] font-bold text-white vh-lift"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </motion.button>
        </div>

        {/* ── Total Spark Goal Value hero ── */}
        <div className="mt-5 rounded-[28px] bg-[#0f172a] px-6 py-6 vh-lift-lg">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f59e0b]">Total Spark Goal Value</p>
          <p className="font-editorial mt-1.5 text-[44px] font-semibold leading-none text-[#fdf6e3]">
            £{totalTarget.toLocaleString()}
          </p>
          <p className="mt-2.5 text-[12px] leading-snug text-[#fdf6e3]/55">
            Across {sparkGoals.length} Kindle Fires — all held under wraps until reveal day
          </p>
        </div>

        {/* ── Dual event countdowns ── */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[
            { Icon: TreePine, label: "Christmas", days: xmasDays },
            { Icon: Cake,     label: "10th Birthday", days: bdayDays },
          ].map(({ Icon, label, days }) => (
            <div key={label} className="rounded-2xl bg-[#fffdf7] px-4 py-4 vh-lift">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Icon className="h-4 w-4 shrink-0 text-[#ff6b6b]" strokeWidth={1.75} />
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.1em] text-[#0f172a]/50">{label}</p>
              </div>
              <p className="font-editorial text-[32px] font-semibold leading-none text-[#0f172a]">{days}</p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#0f172a]/40">days away</p>
            </div>
          ))}
        </div>

        {/* Continuous-fire note */}
        <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-[#f59e0b]/[0.1] px-3.5 py-3">
          <Flame className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#f59e0b]" strokeWidth={2} />
          <p className="text-[11px] leading-snug text-[#0f172a]/70">
            These fires are continuous. A magical Reveal Ceremony will ignite on your next big occasion even if your Kindle Goals are only partially stoked!
          </p>
        </div>
      </div>

      <div className="space-y-6 px-4 pb-20">
        {/* ── Unified Spark Goals stream — every fire locked under wraps ── */}
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff6b6b]">Your Spark Goals · all under wraps</p>
          <div className="flex flex-col gap-3.5">
            {sparkGoals.map((pot, i) => (
              <ReceiverPotCard key={pot.id} pot={pot} index={i} />
            ))}
          </div>
        </div>

        {/* ── Receiver Reveal Demo — Midnight feature card ── */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={VH_BOUNCE}
          onClick={() => onReveal()}
          className="relative w-full overflow-hidden rounded-[24px] bg-[#0f172a] text-left vh-lift-lg"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {CONFETTI_P.slice(0, 6).map((c) => (
              <span key={c.id} className="animate-confetti absolute bg-[#f59e0b] opacity-25"
                style={{ left: c.left, top: 0, width: c.w, height: c.h,
                  "--dur": c.dur, "--rot": c.rot, animationDelay: c.delay } as React.CSSProperties} />
            ))}
          </div>
          <div className="relative flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#ff6b6b]">
              <Sparkles className="h-7 w-7 text-white" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#f59e0b]">Experience Your Reveal Day</p>
              <p className="font-editorial text-[17px] font-semibold leading-snug text-[#fdf6e3]">
                See the magical reveal celebration
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-[#fdf6e3]/55">
                Preview the cinematic ceremony your family will ignite when your fires are fully stoked
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-[#ff6b6b] p-2.5">
              <Play className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </motion.button>

        {/* ── Claimed / sorted ── */}
        {claimed.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0f172a]/40">Sorted</p>
            <div className="flex flex-col gap-2.5">
              {claimed.map((pot) => (
                <div key={pot.id} className="flex items-center gap-3 rounded-2xl bg-[#fffdf7] px-4 py-3.5 vh-lift">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f59e0b]">
                    <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold tracking-tight text-[#0f172a]">{pot.title}</p>
                    <p className="text-[11px] text-[#0f172a]/50">{pot.claimedBy} — on its way!</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── On-dashboard proof stats ── */}
        <ReceiverProofStats />


      </div>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function DemoPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("parent");
  const [isContributor, setIsContributor] = useState(false);
  useEffect(() => {
    setIsContributor(new URLSearchParams(window.location.search).get("view") === "contributor");
  }, []);
  const [showNewGift, setShowNewGift] = useState(false);
  const [pots, setPots] = useState<DemoPot[]>([...INITIAL_POTS, ...CHECKLIST_POTS]);
  const [toast, setToast] = useState<string | null>(null);
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [pendingContribution, setPendingContribution] = useState<{ pot: DemoPot; amount: number } | null>(null);
  const [previewReceiver, setPreviewReceiver] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [showReceiverSignUp, setShowReceiverSignUp] = useState(false);
  // AI reveal overlay — shown when user clicks into the Reveal tab
  const [showAiReveal, setShowAiReveal] = useState(false);
  const [showPostReveal, setShowPostReveal] = useState(false);

  const addLog = useCallback((entry: string) => {
    setLogEntries((prev) => [entry, ...prev].slice(0, 20));
  }, []);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  const handleShare = useCallback(() => {
    void navigator.clipboard.writeText("https://kindledgift.co.uk/list/billys-dreams?view=contributor").catch(() => null);
    showToast("Link copied to share with family!");
    addLog("Wishlist link shared — referral tracking engaged");
  }, [showToast, addLog]);

  const handleKindle = useCallback((id: string, amount: number) => {
    setPots((prev) => prev.map((p) =>
      p.id === id ? { ...p, raised: Math.min(p.goal, p.raised + amount), contributors: p.contributors + 1 } : p,
    ));
    showToast(`£${amount} kindled!`);
    addLog(`Contribution: £${amount} added to pot`);
  }, [showToast, addLog]);

  const handleBuy = useCallback((id: string) => {
    setPots((prev) => prev.map((p) =>
      p.id === id ? { ...p, raised: p.goal, isClaimed: true, claimedBy: "You", claimedNote: "Bought outright — no duplicate risk!" } : p,
    ));
    showToast("Bought outright — duplicate prevented!");
    addLog("Outright purchase: item fully claimed");
  }, [showToast, addLog]);

  const handleAddNewGift = useCallback((pot: DemoPot) => {
    setPots((prev) => [pot, ...prev]);
    showToast(`"${pot.title}" added to the list!`);
    addLog(`New gift created: "${pot.title}" £${pot.goal} — ${pot.mode}`);
  }, [showToast, addLog]);

  const activePots = pots.filter((p) => !p.isClaimed);
  const claimedPots = pots.filter((p) => p.isClaimed);
  const surprisePots = pots.filter((p) => p.mode !== "LIVE_FEED");

  return (
    <div className="min-h-screen bg-[#fdf9f5] text-stone-900">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      {showNewGift && <NewGiftSheet onAdd={handleAddNewGift} onClose={() => setShowNewGift(false)} />}
      <AnimatePresence>{showCreatorModal && <CreatorSignUpModal onClose={() => setShowCreatorModal(false)} />}</AnimatePresence>
      <AnimatePresence>{showReceiverSignUp && <ReceiverSignUpModal onClose={() => setShowReceiverSignUp(false)} />}</AnimatePresence>
      {pendingContribution && (
        <ContributionPromptModal
          pot={pendingContribution.pot}
          amount={pendingContribution.amount}
          onConfirm={handleKindle}
          onClose={() => setPendingContribution(null)}
        />
      )}

      {/* ── Role switcher (always visible) ── */}
      <RoleSwitcher role={viewMode} onChange={setViewMode} />

      {/* ── Context strip — tells visitors which perspective they're seeing ── */}
      <AnimatePresence mode="wait">
        {viewMode === "parent" && (
          <motion.div
            key={isContributor ? "ctx-contributor" : "ctx-parent"}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="vh mx-3 mb-1 flex items-center gap-2 rounded-full bg-[#fffdf7] px-4 py-2.5 vh-lift"
          >
            <div className={cn("h-2 w-2 shrink-0 rounded-full", isContributor ? "bg-[#0f172a]/40" : "bg-[#ff6b6b]")} />
            <p className="text-[11px] leading-snug tracking-tight text-[#0f172a]/55">
              {isContributor
                ? <><span className="font-bold text-[#0f172a]">Contributor view</span> — you&apos;re seeing Billy&apos;s board as a family member. Tap any gift to chip in.</>
                : <><span className="font-bold text-[#0f172a]">Parent / owner view</span> — this is how Billy&apos;s family manages and tracks his wish board. Switch tabs to explore.</>
              }
            </p>
          </motion.div>
        )}
        {viewMode === "receiver" && (
          <motion.div
            key="ctx-receiver"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="vh mx-3 mb-1 flex items-center gap-2 rounded-full bg-[#fffdf7] px-4 py-2.5 vh-lift"
          >
            <div className="h-2 w-2 shrink-0 rounded-full bg-[#0f172a]/40" />
            <p className="text-[11px] leading-snug tracking-tight text-[#0f172a]/55">
              <span className="font-bold text-[#0f172a]">Billy&apos;s view</span> — this is what Billy sees on his device. Amounts are hidden — just the excitement of what&apos;s coming.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Views ── */}
      <AnimatePresence mode="wait">
      {viewMode === "about" ? (
        <motion.div key="about" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 340, damping: 32 }}>
          <AboutPage />
        </motion.div>
      ) : viewMode === "investor" ? (
        <motion.div key="investor" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}>
          <div className="px-3 py-4">
            <InvestorPinGate>
              <InvestorWarRoom embedded />
            </InvestorPinGate>
          </div>
        </motion.div>
      ) : viewMode === "joint" ? (
        <motion.div key="joint" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}>
          <JointFireView />
        </motion.div>
      ) : viewMode === "catalogue" ? (
        <motion.div key="catalogue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <VibrantCatalogue items={CATALOGUE} />
        </motion.div>
      ) : viewMode === "reveal" ? (
        <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          {showPostReveal ? (
            <PostRevealOptions
              recipientName="Billy"
              totalRaised={V2_TOTAL}
              onReplay={() => { setShowPostReveal(false); setShowAiReveal(true); }}
            />
          ) : (
          /* AI Reveal trigger card — shown before the overlay fires */
          <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 px-6 py-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl shadow-amber-900/30">
              <Sparkles className="h-10 w-10 text-stone-900" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Immersive AI Reveal</p>
              <h2 className="mt-2 text-[24px] font-black leading-tight text-white">
                Billy&apos;s reveal is ready
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-stone-400">
                A cinematic reveal, built live from everyone who chipped in.
                Full-screen, feel-good, and made to be shared.
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}
              onClick={() => setShowAiReveal(true)}
              className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-8 py-4 text-[16px] font-black text-stone-900 shadow-xl shadow-amber-900/40"
            >
              <Play className="h-5 w-5" strokeWidth={3} />
              Play AI Reveal
            </motion.button>
            <p className="text-[10px] text-stone-500">Tap to experience the full-screen reveal · Generated live from this fire</p>
            {/* Classic reveal underneath */}
            <div className="mt-4 w-full border-t border-white/10 pt-6">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-500">Or — classic reveal</p>
              <RevealV2View />
            </div>
          </div>
          )}
        </motion.div>
      ) : viewMode === "stars" ? (
        <motion.div key="stars" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}>
          <StarChart goalLabel="Billy's Nintendo Switch" goalValue={150} />
        </motion.div>
      ) : viewMode === "receiver" ? (
        <motion.div key="receiver" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ type: "spring", stiffness: 340, damping: 32 }}>
          <ReceiverView pots={pots} onShare={handleShare} onReveal={() => setViewMode("reveal")} />
        </motion.div>
      ) : (
      <motion.div key="parent" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ type: "spring", stiffness: 340, damping: 32 }} className="vh vh-paper min-h-screen">
      {/* ── Parent Dashboard ── */}
      {<>
      <ProfileHeader
        potCount={pots.length}
        totalGoal={pots.reduce((s, p) => s + p.goal, 0)}
        onShare={handleShare}
        isContributor={isContributor}
        onStartReceiving={() => setShowCreatorModal(true)}
      />

      <main className="space-y-7 pb-36 pt-4">

        {/* ── All pots grid (always LivePotCard — no hidden amounts) ── */}
        <section className="px-5">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff6b6b]">
              {isContributor ? "Active Spark Goals" : "Gift List"}
            </p>
            <p className="font-editorial mt-1 text-[26px] font-semibold leading-tight text-[#0f172a]">
              {activePots.filter((p) => !p.isChecklist).length} {isContributor ? "fires to stoke" : "gifts to kindle or buy"}
            </p>
          </div>
          <div className="flex flex-col gap-3.5">
            {(isContributor ? activePots.filter((p) => !p.isChecklist) : activePots).map((pot) => (
              <LivePotCard
                key={pot.id}
                pot={pot}
                onKindle={handleKindle}
                onBuy={handleBuy}
                onAmountSelected={(p, amt) => setPendingContribution({ pot: p, amount: amt })}
                hideStackNote
                {...(!isContributor && { onRemove: (id: string) => setPots((p) => p.filter((x) => x.id !== id)) })}
              />
            ))}
            {/* Add new gift — owner only */}
            {!isContributor && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                transition={VH_BOUNCE}
                onClick={() => setShowNewGift(true)}
                className="flex w-full items-center gap-3.5 rounded-[24px] bg-[#fffdf7] px-5 py-5 text-left vh-lift transition-transform hover:-translate-y-0.5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#ff6b6b] text-xl font-bold text-white">+</div>
                <div>
                  <p className="font-editorial text-[17px] font-semibold text-[#0f172a]">New gift</p>
                  <p className="text-[12px] text-[#0f172a]/45">Paste a link or enter manually</p>
                </div>
              </motion.button>
            )}

          </div>
          {/* ── Claimed / ordered pots — contributor view ── */}
          {claimedPots.filter((p) => !p.isChecklist).length > 0 && (
            <div className="mt-2">
              <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0f172a]/40">Ordered &amp; on their way</p>
              <div className="flex flex-col gap-3">
                {claimedPots.filter((p) => !p.isChecklist).map((pot) => (
                  <LivePotCard
                    key={pot.id}
                    pot={pot}
                    onKindle={handleKindle}
                    onBuy={handleBuy}
                    onAmountSelected={(p, amt) => setPendingContribution({ pot: p, amount: amt })}
                    hideStackNote
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Sign-up card — Midnight feature card ── */}
          <Reveal>
            <div className="mt-3 overflow-hidden rounded-[28px] bg-[#0f172a] p-6 vh-lift-lg">
              <div className="flex items-center gap-2">
                <Flame className="h-3.5 w-3.5 shrink-0 text-[#f59e0b]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f59e0b]">Want your own list like this?</p>
              </div>
              <p className="font-editorial mt-3 text-[24px] font-semibold leading-tight text-[#fdf6e3]">
                Start receiving kindled gifts yourself
              </p>
              <p className="mt-2.5 text-[13px] leading-relaxed text-[#fdf6e3]/60">
                No awkward money conversations, no duplicate gifts — just exactly what you want, chipped in by people who care.
              </p>
              <div className="mt-4 space-y-2">
                {([
                  [Check, "Friends & family chip in any amount — no app needed"],
                  [Lock, "Gifts stay secret until your reveal day"],
                  [Star, "Star chart mode for kids · parent controls built in"],
                ] as const).map(([Icon, text]) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ff6b6b]">
                      <Icon className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
                    </div>
                    <p className="text-[12px] text-[#fdf6e3]/75">{text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-[#f59e0b]/[0.12] px-3.5 py-3">
                <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-[#f59e0b]" />
                <p className="text-[11px] leading-snug text-[#fdf6e3]/80">
                  <span className="font-bold text-[#fdf6e3]">Enter our £2,500 Goal Booster Draw</span> with every contribution.{" "}
                  Plus earn <span className="font-bold text-[#f59e0b]">2% Spark Balance back</span> on your own future fires.
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={VH_BOUNCE}
                onClick={() => setShowReceiverSignUp(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#ff6b6b] py-4 text-[15px] font-bold text-white vh-lift"
              >
                <Flame className="h-4 w-4" />
                Create my own fire — it&apos;s free
              </motion.button>
              <p className="mt-2.5 text-center text-[11px] text-[#fdf6e3]/45">No app required · 2 minute setup</p>
            </div>
          </Reveal>

          {/* Reveal preview — contributor only */}
          {isContributor && surprisePots.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 26 }}
              onClick={() => setViewMode("reveal")}
              className="relative mt-4 flex w-full items-center gap-4 overflow-hidden rounded-2xl p-4 text-left"
              style={{
                background: "linear-gradient(135deg, #1a0f0f 0%, #2d1515 50%, #1a0f0f 100%)",
                boxShadow: "0 4px 24px rgba(220,38,38,0.35), 0 0 0 1px rgba(220,38,38,0.25)",
              }}
            >
              {/* Subtle snow particles */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                {SNOW.slice(0, 6).map((s) => (
                  <span key={s.id} className="animate-snow absolute rounded-full bg-white/40"
                    style={{ left: s.left, top: 0, width: s.size, height: s.size,
                      "--dur": s.dur, "--sx": s.sx, "--drift": s.drift, animationDelay: s.delay } as React.CSSProperties} />
                ))}
              </div>
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/20">
                <Lock className="h-6 w-6 text-red-300" strokeWidth={1.75} />
              </div>
              <div className="relative flex-1 min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-red-400/80">Locked for Billy</p>
                <p style={{ fontFamily: "var(--font-display)" }} className="text-[14px] font-semibold text-white leading-snug">
                  Countdown: {Math.max(0, Math.ceil((new Date(surprisePots[0]?.eventIso ?? "2026-12-25T00:00:00Z").getTime() - Date.now()) / 86_400_000))} Days
                </p>
                <p className="text-[11px] text-red-200/70 mt-0.5">Givers: Tap to preview the magical unwrap ceremony</p>
              </div>
              <div className="relative shrink-0 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 px-3 py-2">
                <Sparkles className="h-4 w-4 text-stone-900" strokeWidth={2} />
              </div>
            </motion.button>
          )}
        </section>

        {/* ── Contributor: See What the Receiver Sees toggle + Advantage panel ── */}
        {isContributor && (
          <section className="px-4 space-y-4">
            {/* Preview toggle */}
            <div className="overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-violet-50 to-fuchsia-50">
              <div className="h-[3px] w-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400" />
              <div className="p-4">
                <button
                  onClick={() => setPreviewReceiver((v) => !v)}
                  className="flex w-full items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-violet-500" strokeWidth={2} />
                    <p className="text-[13px] font-semibold text-violet-700">See What Billy Sees</p>
                  </div>
                  <div className={cn(
                    "flex h-6 w-11 items-center rounded-full transition-colors duration-200",
                    previewReceiver ? "bg-violet-500" : "bg-stone-200",
                  )}>
                    <motion.div
                      animate={{ x: previewReceiver ? 22 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 32 }}
                      className="h-5 w-5 rounded-full bg-white shadow"
                    />
                  </div>
                </button>

                <AnimatePresence>
                  {previewReceiver && (
                    <motion.div
                      key="receiver-preview"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: "spring", stiffness: 360, damping: 34 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3">
                        <LockedPotCard
                          pot={surprisePots[0] ?? activePots[0]!}
                          onReveal={() => undefined}
                        />
                        <p className="mt-2 text-[11px] leading-snug text-stone-500">
                          Billy sees a locked card with a heat bar and countdown — no amounts, no names, no spoilers.
                          <span className="font-semibold text-violet-600"> The magic stays intact until the big day.</span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Contributor Advantage panel */}
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 shadow-xl">
              <div className="h-[3px] w-full bg-gradient-to-r from-amber-400 via-orange-400 to-red-500" />
              <div className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80 mb-1">Contributor Advantage</p>
                <p style={{ fontFamily: "var(--font-display)" }} className="text-[16px] font-semibold text-white mb-3 leading-snug">
                  Why giving this way feels better
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    { Icon: ShieldCheck, stat: "82%", label: "Zero Gift Anxiety", desc: "of contributors report zero gift-buying stress when using Kindled vs traditional shopping." },
                    { Icon: Wallet, stat: "0%", label: "Payout Fees", desc: "Every penny you kindle goes directly to the pot — no platform fees, no hidden charges." },
                    { Icon: Star, stat: "3×", label: "Emotional ROI", desc: "Group gifting creates 3× stronger memory bonds than solo gifts of the same monetary value." },
                  ].map(({ Icon, stat, label, desc }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15">
                        <Icon className="h-[18px] w-[18px] text-amber-400" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <span style={{ fontFamily: "var(--font-display)" }} className="text-[17px] font-bold text-amber-400">{stat}</span>
                          <span className="text-[12px] font-semibold text-white/80">{label}</span>
                        </div>
                        <p className="text-[10px] leading-snug text-white/50">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Claimed pots (owner view only) */}
        {!isContributor && claimedPots.length > 0 && (
          <section className="px-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-stone-400">Ordered & Claimed</p>
            <div className="flex flex-col gap-2">
              {claimedPots.map((pot) => (
                <div key={pot.id} className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                    <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-stone-700">{pot.title}</p>
                    {pot.claimedBy && <p className="text-[11px] text-emerald-600">{pot.claimedBy} — on its way!</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Would You Rather ── */}
        {!isContributor && <WouldYouRather />}

        {/* ── Catalogue moved to dedicated tab ── */}

        {/* ── Why Kindled stats ── */}
        <WhyKindled />

        {/* ── Gifting Impact Panel (budget chart + metrics + simulator) ── */}
        <GiftingImpactPanel />

        {/* ── First Kindlers Creator Sign-up ── */}
        <FirstKindlersCTA />
      </main>

      {!isContributor && (
        <InvestorPinGate>
          <InvestorHUD pots={pots} logEntries={logEntries} />
        </InvestorPinGate>
      )}
      </>}
      </motion.div>
      )}
      </AnimatePresence>

      {/* Personalised generated reveal — built live from this fire's own data */}
      {showAiReveal && (
        <GeneratedReveal
          recipientName="Billy"
          occasion="Birthday"
          totalRaised={V2_TOTAL}
          gifts={V2_POTS.map((p) => ({ name: p.name, sub: p.sub, Icon: p.Icon, grad: p.grad, glow: p.glow, image: p.image }))}
          contributors={V2_CONTRIBS.map((c) => ({ name: c.name, initials: c.initials, grad: c.grad, image: c.image }))}
          onComplete={() => { setShowAiReveal(false); setShowPostReveal(true); }}
        />
      )}
    </div>
  );
}
