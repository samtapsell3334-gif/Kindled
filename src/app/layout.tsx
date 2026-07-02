import type { Metadata, Viewport } from "next";
import { DEFAULT_THEME } from "@/lib/theme";
import { Geist, Geist_Mono, Fredoka, Fraunces, Outfit, Gabarito } from "next/font/google";
import "./globals.css";
import { ConsentBanner } from "@/components/ConsentBanner";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const fontDisplay = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

// Monochrome-Luxe editorial serif for headers (bold, nostalgic).
const fontSerif = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

// Brand wordmark font (2026 logo kit — "Kindled" lockups only).
const fontLogo = Gabarito({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-logo",
});

// Vibrant-Heritage UI sans — playful, confident, clean.
const fontOutfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Kindled — group gifting for friends & family",
  description:
    "Friends and family chip into shared wishes for the gifts that actually matter. No duplicates, no awkward money chat, and a magical reveal on the big day.",
  metadataBase: new URL("https://www.kindledgift.co.uk"),
  // TODO(founder): add a real 1200×630 OG image for rich link previews.
  openGraph: {
    title: "Kindled — group gifting for friends & family",
    description:
      "Chip into shared wishes for the gifts that actually matter — revealed together on the big day.",
    type: "website",
    siteName: "Kindled",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kindled — group gifting for friends & family",
    description: "Chip into shared wishes for the gifts that actually matter — revealed on the big day.",
  },
  icons: {
    icon: "/favicon.svg?v=3",
    apple: "/apple-touch-icon.png?v=3",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kindled",
  },
};

// WCAG 2.1 AA: never disable pinch-zoom.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0C4E4C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning data-theme={DEFAULT_THEME}>
      <body className={`${fontSans.variable} ${fontMono.variable} ${fontDisplay.variable} ${fontSerif.variable} ${fontOutfit.variable} ${fontLogo.variable} font-sans antialiased`}>
        {/* v8.2 preview switch: ?theme=ember-teal|legacy overrides data-theme
            during parse (before paint) and persists for the session. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var q=new URLSearchParams(location.search).get("theme");if(q==="ember-teal"||q==="legacy"){sessionStorage.setItem("kindled-theme",q);}var t=sessionStorage.getItem("kindled-theme");if(t==="ember-teal"||t==="legacy"){document.documentElement.dataset.theme=t;}}catch(e){}})();`,
          }}
        />
        {children}
        <ConsentBanner />
      </body>
    </html>
  );
}
