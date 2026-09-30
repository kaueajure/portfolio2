import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/server/http";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/login/", "/proposta/"],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
