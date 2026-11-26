"use client";

import { useState, useTransition } from "react";
import { formatDeadline, type ErrorCode } from "@/lib/i18n";
import { COLLEAGUES, matches, type Colleague } from "@/lib/shared";
import { signIn } from "./actions";
import { useLang } from "./lang";
import { Avatar, Chevron } from "./ui";

/** Landing page: what this is, "Who are you?", then a 4-digit code so we can remember you. */
export default function PickVoter() {
  const { t, lang } = useLang();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Colleague | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<ErrorCode | null>(null);
  const [pending, startTransition] = useTransition();
  const list = COLLEAGUES.filter((c) => matches(c.name, query));

  function submit() {
    if (!picked) return;
    if (!/^\d{4}$/.test(code)) return setError("codeFormat");
    setError(null);
    startTransition(async () => {
      const result = await signIn(picked.id, code).catch(() => ({ error: "generic" as const }));
      if (result?.error) setError(result.error); // on success the page re-renders as the board
    });
  }

  return (
    <section className="mx-auto max-w-2xl">
      <ol className="card space-y-3 p-5 sm:p-6">
        {t.how.map((line, i) => (
          <li key={i} className="flex gap-3">
            <span aria-hidden="true" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-purple text-xs font-bold">
              {i + 1}
            </span>
            <span>{line}</span>
          </li>
        ))}
        <li className="flex gap-3 border-t border-line pt-3 text-sm text-gold">
          <Chevron className="mt-1 size-3.5 shrink-0" />
          <span>{t.howDeadline(formatDeadline(lang))}</span>
        </li>
      </ol>

      {!picked ? (
        <>
          <h2 className="mt-8 font-serif text-3xl font-semibold">{t.whoTitle}</h2>
          <p className="mt-2 text-muted">{t.whoHint}</p>

          {/* Enter picks the first match */}
          <form
            className="mt-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (list[0]) setPicked(list[0]);
            }}
          >
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchNames}
              aria-label={t.searchNames}
              className="input"
            />
          </form>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {list.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setPicked(c)}
                  className="card flex w-full cursor-pointer items-center gap-3 p-2.5 pr-4 text-left transition-colors hover:border-purple-light hover:bg-surface-2"
                >
                  <Avatar name={c.name} />
                  <span className="font-medium">{c.name}</span>
                </button>
              </li>
            ))}
          </ul>
          {list.length === 0 && <p className="mt-6 text-muted">{t.noMatch(query)}</p>}
        </>
      ) : (
        <form
          noValidate
          className="card mt-8 p-5 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="flex items-center gap-3">
            <Avatar name={picked.name} size="lg" />
            <div>
              <p className="font-semibold">{picked.name}</p>
              <button
                type="button"
                onClick={() => (setPicked(null), setCode(""), setError(null))}
                className="cursor-pointer rounded text-sm text-purple-light underline underline-offset-4 hover:text-purple-pale"
              >
                {t.change}
              </button>
            </div>
          </div>

          <h2 className="mt-5 font-serif text-2xl font-semibold lining-nums">{t.codeTitle(picked.name)}</h2>
          <p id="code-hint" className="mt-2 text-sm text-muted">
            {t.codeHint}
          </p>
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            autoComplete="off"
            placeholder="••••"
            aria-label={t.codeLabel}
            aria-describedby="code-hint"
            aria-invalid={!!error}
            className="input mt-4 max-w-44 text-center text-2xl tracking-[0.5em]"
          />
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-300">
              {t.errors[error]}
            </p>
          )}
          <button type="submit" disabled={pending} className="btn btn-primary mt-5 w-full sm:w-auto">
            {t.start}
            <Chevron className="size-3" />
          </button>
        </form>
      )}
    </section>
  );
}
