import type { NextConfig } from "next";

const productionUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host
  : null;

const allowedOrigins = ["localhost:3000"];
if (productionUrl && !allowedOrigins.includes(productionUrl)) {
  allowedOrigins.push(productionUrl);
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Supabase Storage — avatars and progress photos
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    viewTransition: true,
    serverActions: {
      allowedOrigins,
    },
  },
};

export default nextConfig;
