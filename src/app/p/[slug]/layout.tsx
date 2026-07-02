import type { Metadata } from "next";
import { getPotBySlug, ensureHydrated } from "@/lib/sandbox/store";

/**
 * v7 Stage-0 P0: pot share links must carry a per-pot preview in WhatsApp/iMessage.
 * Metadata is resolved SERVER-side here (the page itself is a client component),
 * reading the wish directly from the store. Surprise safety: no amounts, no
 * progress, no item names — ever — in any preview field. The dynamic
 * opengraph-image.tsx sibling supplies the per-pot og:image automatically.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  await ensureHydrated();
  const pot = getPotBySlug(slug);
  if (!pot) {
    return { title: "Kindled — chip in together", description: "One wish, one link, revealed on the big day." };
  }
  const date = new Date(pot.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  const wishCount = pot.items.filter((i) => i.approved).length;
  const title = wishCount > 1 ? `${wishCount} wishes for ${pot.recipientName} — chip in 🎉` : `Chip in for ${pot.title} 🎉`;
  const description = `${pot.occasion} on ${date} — everyone's chipping in together. No app, no account, takes 30 seconds.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: "Kindled" },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: false }, // unguessable share links stay out of search
  };
}

export default function PotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
