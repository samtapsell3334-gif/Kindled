import type { NextConfig } from "next";

const config: NextConfig = {
  async redirects() {
    return [
      // v8.1 noun rename: every old /pots/… link permanently redirects to /wishes/…
      // (old shared WhatsApp links must keep working forever — link-based product).
      { source: "/pots", destination: "/wishes", permanent: true },
      { source: "/pots/:path*", destination: "/wishes/:path*", permanent: true },
      { source: "/sandbox/pots", destination: "/sandbox/wishes", permanent: true },
      { source: "/film", destination: "/", permanent: true },
    ];
  },
  images: {
    remotePatterns: [],
  },
};

export default config;
