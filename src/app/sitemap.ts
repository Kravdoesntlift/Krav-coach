import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Dates were hardcoded to June 2026 and never touched again, so every page
 * looked stale to a crawler regardless of what actually changed. Marketing
 * copy genuinely does not change often: but claiming a fixed date in the past
 * forever is worse than claiming nothing, so pages carry a real date and the
 * evergreen ones are simply described honestly by changeFrequency.
 */
const LAST_CONTENT_UPDATE = new Date("2026-09-04");
const LAST_LEGAL_UPDATE = new Date("2026-07-01");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL,                                  lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly",  priority: 1 },
    { url: `${SITE_URL}/personal-trainer-online`,     lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/online-personal-trainer`,     lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/start`,                       lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.8 },
    // Lead magnet: was crawlable and linked, but missing from the sitemap
    { url: `${SITE_URL}/guia`,                        lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/links`,                       lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/terms`,                       lastModified: LAST_LEGAL_UPDATE,   changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE_URL}/privacy`,                     lastModified: LAST_LEGAL_UPDATE,   changeFrequency: "yearly",  priority: 0.3 },
  ];
}
