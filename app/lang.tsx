"use client";

import { createContext, useContext, useState } from "react";
import { dict, LANG_COOKIE, type Dict, type Lang } from "@/lib/i18n";

const LangContext = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void } | null>(null);

export function LangProvider({ initial, children }: { initial: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState(initial);

  function setLang(l: Lang) {
    setLangState(l);
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
    document.title = `Les Raimondis — ${dict[l].edition}`;
  }

  return <LangContext.Provider value={{ lang, t: dict[lang], setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}
