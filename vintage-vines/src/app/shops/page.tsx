import type { Metadata } from "next";
import { RouteShell } from "@/components/route-shell";
import { routes } from "@/config/routes";

export const metadata: Metadata = { title: routes.shops.label };

export default function ShopsPage() {
  return (
    <RouteShell
      eyebrow="For Shops"
      heading="A display worth a second look"
      purpose={routes.shops.purpose}
    />
  );
}
