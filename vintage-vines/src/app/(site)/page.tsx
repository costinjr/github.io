import { RouteShell } from "@/components/route-shell";
import { business } from "@/config/business";
import { routes } from "@/config/routes";

export default function HomePage() {
  return (
    <RouteShell
      eyebrow={`${business.location.city}, ${business.location.state}`}
      heading={business.tagline}
      purpose={routes.home.purpose}
    />
  );
}
