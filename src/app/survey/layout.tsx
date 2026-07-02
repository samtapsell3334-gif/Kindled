import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Two minutes on gift-giving — Kindled",
  description: "A quick, anonymous survey about how we all actually buy gifts. Quick taps, under four minutes.",
};

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
