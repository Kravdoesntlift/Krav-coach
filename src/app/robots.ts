import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Assistants are becoming a real discovery channel — people ask them for a
 * coach the way they used to ask Google. Their crawlers are named explicitly
 * rather than left to the wildcard so the intent is deliberate and reviewable:
 * this site *wants* to be readable by them.
 *
 * The private areas stay closed to everyone, wildcard included.
 */
const PRIVATE_AREAS = ["/coach/", "/client/", "/auth/", "/api/", "/offline", "/p/"];

const AI_CRAWLERS = [
  "GPTBot",           // OpenAI — training + ChatGPT browsing
  "OAI-SearchBot",    // OpenAI search index
  "ChatGPT-User",     // ChatGPT acting on a user's request
  "ClaudeBot",        // Anthropic
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",  // Gemini / AI Overviews
  "Applebot-Extended",
  "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_AREAS,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE_AREAS,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
