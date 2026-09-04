import type { NextConfig } from "next";

const productionUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host
  : null;

const allowedOrigins = ["localhost:3000"];
if (productionUrl && !allowedOrigins.includes(productionUrl)) {
  allowedOrigins.push(productionUrl);
}

// Supabase project ref (extract from the URL)
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : "*.supabase.co";

// Analytics hosts. Without these the policy blocks the scripts silently — the
// browser refuses to load them and nothing in the app reports it, so Google
// Analytics and Vercel Analytics sat in the layout collecting nothing at all.
// Listed explicitly rather than as wildcards: only these hosts, nothing else.
const analyticsScriptHosts = [
  "https://www.googletagmanager.com", // gtag.js, loaded by @next/third-parties
  "https://va.vercel-scripts.com",    // Vercel Analytics + Speed Insights
];

// Where those scripts send their measurements back to. GA fans beacons out
// across regional subdomains, which is why these two need to be wildcards.
const analyticsConnectHosts = [
  "https://www.google-analytics.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
  "https://www.googletagmanager.com",
  "https://va.vercel-scripts.com",
];

// GA falls back to pixel beacons when fetch/beacon is unavailable
const analyticsImgHosts = [
  "https://www.google-analytics.com",
  "https://www.googletagmanager.com",
];

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Next.js requires unsafe-inline for styles; unsafe-eval only needed in dev for HMR
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} ${analyticsScriptHosts.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  // Images: self + Supabase Storage + analytics pixels
  `img-src 'self' data: blob: https://${supabaseHost} ${analyticsImgHosts.join(" ")}`,
  // API calls + Supabase Realtime WebSocket + analytics beacons
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.stripe.com ${analyticsConnectHosts.join(" ")}`,
  "font-src 'self'",
  // Stripe checkout is a redirect, not embedded — no frame-src needed
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  // Prevent MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block clickjacking (redundant with CSP frame-ancestors but belt+braces)
  { key: "X-Frame-Options", value: "DENY" },
  // Legacy XSS filter (still helps on old browsers)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Limit referrer data sent to external sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable unused browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  // Force HTTPS for 2 years (only sent over HTTPS so safe in production)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Content Security Policy
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  experimental: {
    viewTransition: true,
    serverActions: {
      allowedOrigins,
    },
  },
};

export default nextConfig;
