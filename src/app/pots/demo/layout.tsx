import type { Metadata } from "next";

// Per-page metadata for the demo (the page itself is a client component).
// TODO(founder): supply a real OG image (1200×630) for rich WhatsApp/social previews.
export const metadata: Metadata = {
  title: "Live demo — Kindled",
  description:
    "Explore a live Kindled pot: chip in to Billy's gifts, browse the catalogue, see the star chart, and preview the reveal. No sign-up needed.",
  openGraph: {
    title: "See a live Kindled pot",
    description:
      "Friends and family chip into the gifts that actually matter — revealed together on the big day. Explore the live demo.",
    type: "website",
    siteName: "Kindled",
  },
  twitter: {
    card: "summary",
    title: "See a live Kindled pot",
    description: "Friends and family chip into the gifts that actually matter — revealed on the big day.",
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
