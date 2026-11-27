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
  const deadline = formatDeadline(lang);

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
    <>
      {/* Hero: title, tagline (desktop only) and deadline. Kept short so "Who are you?" follows at once. */}
      <section className="hero relative overflow-hidden border-b border-line">
        <div className="wrap relative py-8 sm:py-9">
          <Chevron className="hero-chevron absolute top-3 -right-[9vw] size-[30vw] text-purple sm:top-1/2 sm:right-8 sm:size-48 sm:-translate-y-1/2 lg:size-56" />
          <p className="eyebrow relative text-purple-pale">{t.edition}</p>
          <h1 className="hero-title relative mt-3 -mb-[0.14em] overflow-hidden pb-[0.14em] font-serif text-[clamp(3rem,13.5vw,6rem)] leading-[0.95] tracking-[-0.025em] whitespace-nowrap">
            <span className="rise block">
              <i>Les</i> Raimondis
            </span>
          </h1>
          <p className="relative mt-4 hidden text-xl text-white/85 sm:block">{t.tagline}</p>
          <p className="eyebrow relative mt-4 sm:mt-5">
            <span className="foil-text">
              {t.deadlineLabel} — {deadline}
            </span>
          </p>
        </div>
      </section>

      {/* Step 1: who are you? → Step 2: 4-digit code */}
      <section className="wrap pt-8 sm:pt-10">
        {!picked ? (
          <>
            {/* Heading on the left; on desktop the search sits top right of the name cards. */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow text-purple-pale">
                  {t.step(1)} — {t.startHere}
                </p>
                <h2 className="mt-2 font-serif text-5xl leading-none sm:text-6xl">{t.whoTitle}</h2>
                <p className="mt-3 text-muted">{t.whoHint}</p>
              </div>
              {/* Enter picks the first match */}
              <form
                className="w-full sm:w-80"
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
                  className="input border-purple-light/70"
                />
              </form>
            </div>

            <ul className="mt-5 grid border-t border-l border-line sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => (
                <li key={c.id} className="border-r border-b border-line">
                  <button
                    type="button"
                    onClick={() => setPicked(c)}
                    className="group flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-4 text-left text-lg transition-colors hover:bg-purple focus-visible:-outline-offset-2"
                  >
                    {c.name}
                    <Chevron className="nudge size-3 shrink-0 text-purple transition-colors group-hover:text-white" />
                  </button>
                </li>
              ))}
            </ul>
            {list.length === 0 && <p className="mt-6 text-muted">{t.noMatch(query)}</p>}
          </>
        ) : (
          <form
            noValidate
            className="mx-auto max-w-xl border border-line border-t-purple bg-surface p-6 [border-top-width:2px] sm:p-9"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <p className="eyebrow mb-5 text-purple-pale">{t.step(2)}</p>
            <div className="flex items-center gap-4">
              <Avatar person={picked} size="lg" />
              <div>
                <p className="text-lg font-semibold">{picked.name}</p>
                <button type="button" onClick={() => (setPicked(null), setCode(""), setError(null))} className="link text-sm">
                  {t.change}
                </button>
              </div>
            </div>

            <h2 className="mt-7 font-serif text-3xl leading-tight sm:text-4xl">{t.codeTitle(picked.name)}</h2>
            <p id="code-hint" className="mt-3 text-muted">
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
              placeholder="0000"
              aria-label={t.codeLabel}
              aria-describedby="code-hint"
              aria-invalid={!!error}
              className="input mt-6 max-w-52 pl-[calc(1rem+0.5em)] text-center font-serif text-4xl tracking-[0.5em] placeholder:text-white/15"
            />
            {error && (
              <p role="alert" className="mt-3 text-sm text-red-300">
                {t.errors[error]}
              </p>
            )}
            <div>
              <button type="submit" disabled={pending} className="btn btn-primary mt-7 w-full sm:w-auto">
                {t.start}
                <Chevron className="nudge size-3" />
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
