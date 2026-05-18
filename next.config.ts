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

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Next.js requires unsafe-inline for styles; unsafe-eval for dev HMR (noop in prod)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  // Images: self + Supabase Storage
  `img-src 'self' data: blob: https://${supabaseHost}`,
  // API calls + Supabase Realtime WebSocket
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.stripe.com`,
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
  images: {
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
