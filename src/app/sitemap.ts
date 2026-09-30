import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/server/http";
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: appUrl(), changeFrequency: "monthly", priority: 1 }];
}
