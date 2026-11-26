"use client";

import { formatDeadline } from "@/lib/i18n";
import { useLang } from "./lang";
import { Chevron } from "./ui";

export default function Header() {
  const { lang, t, setLang } = useLang();
  const other = lang === "en" ? "fr" : "en";

  return (
    <header className="mx-auto flex w-full max-w-5xl items-start justify-between gap-4 px-4 pt-8 pb-6 sm:px-6 sm:pt-12 sm:pb-8">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-purple-light uppercase">
          <Chevron className="size-3.5 text-purple" />
          {t.edition}
        </p>
        <h1 className="mt-2 font-serif text-4xl leading-none font-bold tracking-tight sm:text-6xl">
          Les Raimondis
        </h1>
        <p className="mt-3 text-sm text-muted">{t.deadline(formatDeadline(lang))}</p>
      </div>
      <button
        type="button"
        onClick={() => setLang(other)}
        aria-label={t.switchLang}
        lang={other}
        className="btn btn-ghost shrink-0 px-4 py-2 text-xs tracking-widest"
      >
        {t.switchLangShort}
      </button>
    </header>
  );
}
