import type { Metadata } from "next";

// v13: /survey gets its OWN og:title/description rather than inheriting the
// root layout's "group gifting" copy, which narrowed the frame before the
// survey even opened. Exact wording per the v13 brief.
export const metadata: Metadata = {
  title: "Two minutes on gift-giving — Kindled",
  description: "A quick, anonymous survey about how we all actually buy gifts. Quick taps, under four minutes.",
  openGraph: {
    title: "Kindled — quick survey on gift-giving",
    description: "A quick, anonymous survey about how we all actually buy gifts. Quick taps, under four minutes.",
    type: "website",
    siteName: "Kindled",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kindled — quick survey on gift-giving",
    description: "A quick, anonymous survey about how we all actually buy gifts. Quick taps, under four minutes.",
  },
};

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
