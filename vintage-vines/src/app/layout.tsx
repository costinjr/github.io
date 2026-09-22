import type { Metadata } from "next";
import { Fraunces, Karla } from "next/font/google";
import { business } from "@/config/business";
import { env } from "@/lib/env";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: `${business.name} — One-of-one plants, grown with purpose.`,
    template: `%s | ${business.name}`,
  },
  description:
    "Locally propagated houseplants in thrifted vintage vessels, made in Columbus, Ohio.",
};

// Section 14: "Add LocalBusiness or Store structured data only with
// verified fields." No street address (never published, matching the
// pickup copy elsewhere), no openingHours or priceRange — those are
// PENDING per section 18 and don't belong here until confirmed.
const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: business.name,
  description: business.tagline,
  email: business.contact.email,
  telephone: business.contact.phone,
  url: env.NEXT_PUBLIC_SITE_URL,
  address: {
    "@type": "PostalAddress",
    addressLocality: business.location.city,
    addressRegion: business.location.state,
  },
  sameAs: [business.contact.instagramUrl],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${karla.variable}`}>
      <body className="flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
