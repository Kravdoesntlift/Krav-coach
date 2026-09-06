import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import AppRefresh from "@/components/AppRefresh";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SITE_URL, organizationJsonLd } from "@/lib/seo";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  // Without a metadataBase every relative URL Next.js generates is guessed from
  // the deployment host, which on Vercel means preview URLs leak into canonical
  // tags. Pin it to the host that actually serves the site.
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  title: "KRAV Coach · Personal Trainer Online | Trial Grátis 7 Dias",
  description: "Coaching fitness personalizado com acompanhamento real. Plano de treino semanal, nutrição e chat direto com o coach. Tudo na tua app. Trial grátis de 7 dias, sem cartão.",
  keywords: ["personal trainer online", "coach fitness online", "coaching fitness portugal", "plano treino personalizado", "personal trainer portugal", "krav coach"],
  manifest: "/manifest.json",
  openGraph: {
    title: "KRAV Coach · Personal Trainer Online",
    description: "Trial grátis de 7 dias. Plano personalizado, nutrição e coaching direto. Tudo na tua app.",
    url: SITE_URL,
    siteName: "KRAV Coach",
    locale: "pt_PT",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/api/og`,
        width: 1200,
        height: 630,
        alt: "KRAV Coach · Personal Trainer Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KRAV Coach · Personal Trainer Online",
    description: "Trial grátis de 7 dias. Plano personalizado, nutrição e coaching direto. Tudo na tua app.",
    images: [`${SITE_URL}/api/og`],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KRAV Coach",
  },
};

export const viewport: Viewport = {
  themeColor: "#C9A84C",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className={`bg-black ${outfit.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        {/* The brand entity, emitted sitewide so search and answer engines
            resolve every page back to one business rather than to a loose set
            of unrelated pages. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
      </head>
      <body className="bg-black text-white antialiased font-sans">
        <AppRefresh />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
      <GoogleAnalytics gaId="G-CLY4DR251T" />
    </html>
  );
}
