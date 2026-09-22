import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { publicRoutes } from "@/config/routes";

// Section 14: "a sitemap that excludes admin, drafts, and private claim
// pages." publicRoutes (config/routes.ts, Phase 1) already excludes
// /admin by construction — item detail pages aren't listed individually
// since they change too often to be worth enumerating here; the
// crawlable /purchase wall is what actually links to them.
export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: new URL(route.path, env.NEXT_PUBLIC_SITE_URL).toString(),
    changeFrequency: route.key === "home" || route.key === "purchase" || route.key === "inventory" ? "daily" : "monthly",
    priority: route.key === "home" ? 1 : route.key === "purchase" ? 0.9 : 0.6,
  }));
}
