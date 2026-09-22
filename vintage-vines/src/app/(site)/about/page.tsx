import type { Metadata } from "next";
import { RouteShell } from "@/components/route-shell";
import { routes } from "@/config/routes";

export const metadata: Metadata = { title: routes.about.label };

export default function AboutPage() {
  return (
    <RouteShell
      eyebrow="About"
      heading={routes.about.label}
      purpose={routes.about.purpose}
    />
  );
}
