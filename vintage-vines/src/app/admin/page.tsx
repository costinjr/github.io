import type { Metadata } from "next";
import { RouteShell } from "@/components/route-shell";
import { routes } from "@/config/routes";

export const metadata: Metadata = {
  title: routes.admin.label,
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <RouteShell
      eyebrow="Admin"
      heading={routes.admin.primaryAction}
      purpose={routes.admin.purpose}
    />
  );
}
