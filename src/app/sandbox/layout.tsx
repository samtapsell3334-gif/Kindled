import type { Metadata } from "next";

// v8 P0.4: metadata parity for the sandbox surface.
export const metadata: Metadata = {
  title: "Kindled sandbox — build a real pot with simulated money",
  description:
    "Create a pot, share the link, and run the full Kindled loop with simulated money — chip-ins, sealed messages, and the reveal. No payments are processed.",
  openGraph: {
    title: "Try the Kindled sandbox",
    description: "Build a real pot with simulated money — share it, watch it fill, run the reveal.",
    type: "website",
    siteName: "Kindled",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: false },
};

export default function SandboxLayout({ children }: { children: React.ReactNode }) {
  return children;
}
