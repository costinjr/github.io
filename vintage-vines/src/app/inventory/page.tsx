import type { Metadata } from "next";
import { RouteShell } from "@/components/route-shell";
import { routes } from "@/config/routes";

export const metadata: Metadata = { title: routes.inventory.label };

export default function InventoryPage() {
  return (
    <RouteShell
      eyebrow="Inventory"
      heading="Current pieces"
      purpose={routes.inventory.purpose}
    />
  );
}
