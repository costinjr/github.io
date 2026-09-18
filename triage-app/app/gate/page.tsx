import { GateForm } from "./GateForm";

export default async function GatePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-xl font-semibold">Northstar Triage Demo</h1>
        <p className="max-w-sm text-sm text-foreground/70">
          Enter the shared demo passcode to continue. This is friction against
          casual visitors, not production security.
        </p>
      </div>
      <GateForm next={next ?? "/"} />
    </main>
  );
}
