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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${karla.variable}`}>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
