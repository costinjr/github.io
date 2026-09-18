"use client";

export default function QueueError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">Queue</h1>
      <div className="rounded-md border border-red-400/60 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-400/30 dark:bg-red-950/40 dark:text-red-200">
        <p className="font-medium">Couldn&apos;t load the queue.</p>
        <p className="mt-1 text-red-900/80 dark:text-red-200/80">{error.message}</p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-red-900/60 dark:text-red-200/60">
            Error digest: {error.digest} — look this up in the server logs for the full message.
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={retry}
        className="w-fit rounded-md border border-black/15 px-3 py-2 text-sm font-medium dark:border-white/20"
      >
        Try again
      </button>
    </main>
  );
}
