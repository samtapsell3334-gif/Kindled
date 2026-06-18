import type { NextConfig } from "next";

const config: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/pots/demo",
        permanent: false,
      },
    ];
  },
};

export default config;
