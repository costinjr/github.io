"use client";

import { useState, useTransition } from "react";
import { business } from "@/config/business";
import { siteCopy } from "@/config/site-copy";
import { requestPlantMatch } from "@/lib/actions/matchmaker";
import { MAX_MATCHMAKER_TEXT_LENGTH } from "@/lib/ai/limits";
import type { MatchmakerOutcome } from "@/lib/ai/matchmaker-service";
import { ItemCard } from "@/components/inventory/item-card";

export function MatchmakerTeaser() {
  const [text, setText] = useState("");
  const [outcome, setOutcome] = useState<MatchmakerOutcome | null>(null);
  const [pending, startTransition] = useTransition();
  const copy = siteCopy.landing.matchmaker;

  function submit() {
    if (!text.trim()) return;
    startTransition(async () => {
      setOutcome(await requestPlantMatch(text));
    });
  }

  if (outcome?.kind === "matched") {
    const { result } = outcome;
    return (
      <div id="matchmaker" className="mx-auto max-w-2xl">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-brass">
          {result.confidence === "strong" ? "Strong match" : result.confidence === "good" ? "Good match" : "A place to start"}
        </p>
        <h2 className="mt-2 text-center font-serif text-2xl text-ink">{result.headline}</h2>
        <p className="mt-3 text-center text-ink-soft">{result.reason}</p>
        <p className="mt-2 text-center text-sm text-ink-soft">{result.careNote}</p>
        {result.constraintNotes.map((note) => (
          <p key={note} className="mt-2 text-center text-sm text-terracotta">
            {note}
          </p>
        ))}
        <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <ItemCard item={result.selectedItem} />
          {result.alternateItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </ul>
        <div className="mt-4 text-center">
          <button type="button" onClick={() => setOutcome(null)} className="text-sm text-green underline">
            Try a different description
          </button>
        </div>
      </div>
    );
  }

  if (outcome) {
    const message =
      outcome.kind === "rate_limited"
        ? "That's a lot of tries in a row — give it a few minutes and try again, or message Libby directly."
        : outcome.message;

    return (
      <div id="matchmaker" className="mx-auto max-w-xl rounded-sm border border-line bg-paper p-6 text-center">
        <p className="text-ink">{message}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <a
            href={`mailto:${business.contact.email}?subject=${encodeURIComponent("Help me find a plant")}&body=${encodeURIComponent(text)}`}
            className="inline-flex min-h-11 items-center rounded-sm bg-green px-4 text-sm font-medium text-cream"
          >
            Email Libby directly
          </a>
          <button type="button" onClick={() => setOutcome(null)} className="text-sm text-ink-soft underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="matchmaker" className="mx-auto max-w-xl">
      <h2 className="text-center font-serif text-2xl text-ink">{copy.heading}</h2>
      <p className="mt-2 text-center text-ink-soft">{copy.prompt}</p>

      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          maxLength={MAX_MATCHMAKER_TEXT_LENGTH}
          placeholder={copy.examples[0]}
          className="rounded-sm border border-line bg-paper px-3 py-2 text-ink"
        />

        <div className="flex flex-wrap gap-2">
          {copy.examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setText(example)}
              className="rounded-sm border border-line px-3 py-1 text-xs text-ink-soft"
            >
              {example}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={text.trim().length === 0 || pending}
          className="min-h-11 rounded-sm bg-green px-4 text-sm font-medium text-cream disabled:opacity-50"
        >
          {pending ? "Finding a match…" : copy.buttonLabel}
        </button>
      </form>
    </div>
  );
}
