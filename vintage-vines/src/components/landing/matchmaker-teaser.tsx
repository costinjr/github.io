"use client";

import { useState } from "react";
import { business } from "@/config/business";
import { siteCopy } from "@/config/site-copy";

// The deterministic matcher and AI wrapper are later phases (6, 7) — this
// captures the visitor's words honestly rather than faking a match, and
// hands them straight to Libby by email in the meantime.
export function MatchmakerTeaser() {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const copy = siteCopy.landing.matchmaker;

  if (submitted) {
    return (
      <div id="matchmaker" className="mx-auto max-w-xl rounded-sm border border-line bg-paper p-6 text-center">
        <p className="text-ink">
          The plant matchmaker is almost ready. In the meantime, send Libby what you told
          us and she&apos;ll help you find the piece herself.
        </p>
        <a
          href={`mailto:${business.contact.email}?subject=${encodeURIComponent(
            "Help me find a plant",
          )}&body=${encodeURIComponent(text)}`}
          className="mt-4 inline-flex min-h-11 items-center rounded-sm bg-green px-4 text-sm font-medium text-cream"
        >
          Email Libby what I wrote
        </a>
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
          setSubmitted(true);
        }}
      >
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
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
          disabled={text.trim().length === 0}
          className="min-h-11 rounded-sm bg-green px-4 text-sm font-medium text-cream disabled:opacity-50"
        >
          {copy.buttonLabel}
        </button>
      </form>
    </div>
  );
}
