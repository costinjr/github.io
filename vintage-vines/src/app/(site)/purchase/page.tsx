import type { Metadata } from "next";
import { RouteShell } from "@/components/route-shell";
import { routes } from "@/config/routes";

export const metadata: Metadata = { title: routes.purchase.label };

export default function PurchasePage() {
  return (
    <RouteShell
      eyebrow="Shop"
      heading={routes.purchase.primaryAction}
      purpose={routes.purchase.purpose}
    />
  );
}
