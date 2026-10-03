import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only "N" badge: keep it off the phone tab bar (bottom-left by default).
  devIndicators: { position: "top-right" },
  async redirects() {
    return [
      // The account page moved to Profile (FRD NV-1).
      { source: "/account", destination: "/profile", permanent: false },
    ];
  },
};

export default nextConfig;
