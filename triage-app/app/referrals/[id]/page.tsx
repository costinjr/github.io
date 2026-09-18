export default async function ReferralDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">Referral {id}</h1>
      <p className="text-sm text-foreground/70">
        The referral detail view — original intake, extracted facts, rule
        hits, evidence quotes, and history — lands here in a later session.
      </p>
    </main>
  );
}
