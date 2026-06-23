import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/personal-trainer-online", "/start", "/links", "/guia"],
        disallow: ["/coach/", "/client/", "/auth/", "/api/", "/offline"],
      },
    ],
    sitemap: "https://kravcoaching.com/sitemap.xml",
  };
}
