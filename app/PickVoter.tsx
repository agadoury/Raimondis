"use client";

import { useState, useTransition } from "react";
import { formatDeadline, type ErrorCode } from "@/lib/i18n";
import { COLLEAGUES, matches, type Colleague } from "@/lib/shared";
import { signIn } from "./actions";
import { useLang } from "./lang";
import { Avatar, Chevron, Marquee } from "./ui";

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
      {/* Hero */}
      <section className="hero relative overflow-hidden border-b border-line">
        <div className="wrap relative pt-12 pb-12 sm:pt-20 sm:pb-20">
          <Chevron className="hero-chevron absolute top-4 -right-[10vw] size-[58vw] text-purple sm:top-1/2 sm:right-4 sm:size-[26rem] sm:-translate-y-1/2 lg:size-[31rem]" />
          <p className="eyebrow fade-up relative text-purple-pale">{t.edition}</p>
          <h1 className="hero-title relative mt-5 font-serif text-[clamp(3.7rem,17.5vw,11.5rem)] leading-[0.86] tracking-[-0.025em]">
            <span className="-mb-[0.14em] block overflow-hidden pb-[0.14em]">
              <span className="rise block italic">Les</span>
            </span>
            <span className="-mb-[0.14em] block overflow-hidden pb-[0.14em]">
              <span className="rise block [animation-delay:90ms]">Raimondis</span>
            </span>
          </h1>
          <p className="fade-up relative mt-8 text-lg text-white/85 [animation-delay:350ms] sm:text-xl">
            {t.tagline.map((phrase) => (
              <span key={phrase} className="mr-[0.35em] inline-block">
                {phrase}
              </span>
            ))}
          </p>
        </div>
        <Marquee items={[...t.marquee, `${t.deadlineLabel} ${deadline}`]} />
      </section>

      {/* How it works */}
      <section className="border-b border-line">
        <ol className="wrap grid sm:grid-cols-3 sm:gap-x-10">
          {t.how.map((line, i) => (
            <li key={i} className="border-b border-line py-7 last:border-b-0 sm:border-b-0 sm:py-12">
              <span aria-hidden="true" className="font-serif text-5xl leading-none text-purple-light italic">
                0{i + 1}
              </span>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-white/90">{line}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="border-b border-line bg-surface">
        <div className="wrap flex flex-col justify-between gap-1 py-4 sm:flex-row sm:items-center">
          <p className="eyebrow">
            <span className="foil-text">
              {t.deadlineLabel} — {deadline}
            </span>
          </p>
          <p className="eyebrow">{t.privacy}</p>
        </div>
      </section>

      {/* Who are you? → 4-digit code */}
      <section className="wrap pt-12 sm:pt-16">
        {!picked ? (
          <>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-serif text-5xl leading-none sm:text-6xl">{t.whoTitle}</h2>
                <p className="mt-4 text-muted">{t.whoHint}</p>
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
                  className="input"
                />
              </form>
            </div>

            <ul className="mt-8 grid border-t border-l border-line sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="flex items-center gap-4">
              <Avatar name={picked.name} size="lg" />
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
