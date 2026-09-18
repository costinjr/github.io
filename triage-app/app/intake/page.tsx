import Link from "next/link";
import type { ReactNode } from "react";
import { PasteForm } from "./PasteForm";
import { StructuredForm } from "./StructuredForm";

export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "form" ? "form" : "paste";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16">
      <div className="rounded-md border border-amber-400/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-200">
        Synthetic demo only — do not enter real patient information.
      </div>

      <h1 className="text-2xl font-semibold">New intake</h1>

      <div className="flex gap-1 border-b border-black/10 dark:border-white/10">
        <TabLink href="/intake?tab=paste" active={activeTab === "paste"}>
          Paste Referral
        </TabLink>
        <TabLink href="/intake?tab=form" active={activeTab === "form"}>
          Structured Form
        </TabLink>
      </div>

      {activeTab === "paste" ? <PasteForm /> : <StructuredForm />}
    </main>
  );
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
        active ? "border-foreground text-foreground" : "border-transparent text-foreground/50 hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
