import { business } from "@/config/business";
import { TrackedLink } from "@/components/analytics/tracked-link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-cream-deep">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="font-serif text-lg text-ink">{business.name}</p>
          <p className="mt-2 text-sm text-ink-soft">{business.purpose.statement}</p>
        </div>

        <div className="text-sm text-ink-soft">
          <p>
            {business.location.city}, {business.location.state} &middot; Pickup in{" "}
            {business.location.pickupArea}
          </p>
          <p className="mt-2">
            <TrackedLink
              event="contact_click"
              href={`mailto:${business.contact.email}`}
              className="inline-block py-1.5 hover:text-green"
            >
              {business.contact.email}
            </TrackedLink>
          </p>
          <p className="mt-1">
            <TrackedLink
              event="contact_click"
              href={business.contact.phoneHref}
              className="inline-block py-1.5 hover:text-green"
            >
              {business.contact.phone}
            </TrackedLink>
          </p>
          <p className="mt-1">
            <TrackedLink
              event="instagram_click"
              href={business.contact.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block py-1.5 hover:text-green"
            >
              {business.contact.instagramHandle}
            </TrackedLink>
          </p>
        </div>
      </div>

      <div className="border-t border-line px-4 py-4 text-center text-xs text-ink-soft sm:px-6">
        <p>
          &copy; {year} {business.name}. {business.tagline}
        </p>
      </div>
    </footer>
  );
}
