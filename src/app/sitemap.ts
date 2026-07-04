import type { MetadataRoute } from "next";

const BASE = "https://kravcoaching.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE,
      lastModified: new Date("2026-06-01"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE}/personal-trainer-online`,
      lastModified: new Date("2026-06-01"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/online-personal-trainer`,
      lastModified: new Date("2026-06-01"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/start`,
      lastModified: new Date("2026-06-01"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/links`,
      lastModified: new Date("2026-06-01"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE}/terms`,
      lastModified: new Date("2026-07-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/privacy`,
      lastModified: new Date("2026-07-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
