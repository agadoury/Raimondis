"use client";

import Link from "next/link";
import { formatDeadline } from "@/lib/i18n";
import { useLang } from "./lang";
import { Chevron } from "./ui";

/** Slim masthead: wordmark, deadline, language switch. */
export default function Header() {
  const { lang, t, setLang } = useLang();
  const other = lang === "en" ? "fr" : "en";

  return (
    <header className="relative z-20 border-b border-line">
      <div className="wrap flex h-14 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <Chevron className="size-4 text-purple" />
          <span className="font-serif text-xl leading-none">Les Raimondis</span>
        </Link>
        <div className="flex items-center gap-6">
          <span className="eyebrow hidden md:inline">{t.deadline(formatDeadline(lang))}</span>
          <button
            type="button"
            onClick={() => setLang(other)}
            aria-label={t.switchLang}
            className="eyebrow -mr-2 cursor-pointer px-2 py-3"
          >
            <span className={lang === "en" ? "border-b border-purple pb-0.5 text-white" : ""}>EN</span>
            <span className="mx-2 text-white/30">/</span>
            <span className={lang === "fr" ? "border-b border-purple pb-0.5 text-white" : ""}>FR</span>
          </button>
        </div>
      </div>
    </header>
  );
}
