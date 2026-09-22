interface RouteShellProps {
  eyebrow: string;
  heading: string;
  purpose: string;
}

/**
 * Placeholder shell for routes whose full content arrives in a later build
 * phase (core pages, public inventory, admin). Proves routing, design
 * tokens, and typography now; not the final page.
 */
export function RouteShell({ eyebrow, heading, purpose }: RouteShellProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brass">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-4xl text-ink">{heading}</h1>
      <p className="mx-auto mt-4 max-w-xl text-ink-soft">{purpose}</p>
    </div>
  );
}
