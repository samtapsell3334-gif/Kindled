import type { Metadata } from "next";

// v11.3 Patch 1: /survey gets its OWN og:title/description rather than
// inheriting the root layout's "group gifting" copy, which narrowed the
// frame before the survey even opened.
export const metadata: Metadata = {
  title: "Two minutes on gift-giving — Kindled",
  description: "A quick, anonymous survey about how we all actually buy gifts. Quick taps, under four minutes.",
  openGraph: {
    title: "Kindled — quick survey on gift-giving",
    description: "A few honest questions about buying and receiving gifts. Takes 5 minutes — and helps us build something genuinely useful.",
    type: "website",
    siteName: "Kindled",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kindled — quick survey on gift-giving",
    description: "A few honest questions about buying and receiving gifts. Takes 5 minutes — and helps us build something genuinely useful.",
  },
};

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
