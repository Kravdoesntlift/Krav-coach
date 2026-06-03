import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import AppRefresh from "@/components/AppRefresh";
import { Analytics } from "@vercel/analytics/next";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KRAV Coach",
  description: "A tua plataforma de coaching fitness premium",
  manifest: "/manifest.json",
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
      </head>
      <body className="bg-black text-white antialiased font-sans">
        <AppRefresh />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
