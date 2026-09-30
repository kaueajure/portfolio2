import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/server/http";
import { projects } from "@/lib/domain/portfolio";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: appUrl(), changeFrequency: "monthly", priority: 1 },
    ...projects.map((project) => ({
      url: `${appUrl()}${project.caseStudyHref}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
