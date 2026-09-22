import type { Metadata } from "next";
import { RouteShell } from "@/components/route-shell";
import { routes } from "@/config/routes";

export const metadata: Metadata = { title: routes.realtors.label };

export default function RealtorsPage() {
  return (
    <RouteShell
      eyebrow="For Realtors"
      heading="Closing gifts, grown with purpose"
      purpose={routes.realtors.purpose}
    />
  );
}
