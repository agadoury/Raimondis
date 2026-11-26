"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { COLLEAGUES, findColleague, initials, matches, photoOf, type Colleague, type OwnNomination } from "@/lib/shared";
import { deleteOwnNomination, signOut } from "./actions";
import { formatDeadline } from "@/lib/i18n";
import { useLang } from "./lang";
import NominateDialog from "./NominateDialog";
import { Chevron, Confetti, GoldCheck } from "./ui";

type Toast = { id: string; text: string; kind: "success" | "milestone" | "error" };

type Props = {
  voter: Colleague;
  /** The signed-in voter's own nominations, loaded on the server. Nobody else's are ever sent. */
  initialNominations: OwnNomination[];
};

export default function Board({ voter, initialNominations }: Props) {
  const { t, lang } = useLang();
  const [mine, setMine] = useState(initialNominations);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Colleague | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [burst, setBurst] = useState({ n: 0, big: false });
  const [focusRequest, setFocusRequest] = useState<{ id: string } | null>(null);
  const [justNominated, setJustNominated] = useState<string | null>(null); // gets a one-off gold sheen
  const cards = useRef(new Map<string, HTMLButtonElement>());

  const others = useMemo(() => COLLEAGUES.filter((c) => c.id !== voter.id), [voter.id]);
  const visible = others.filter((c) => matches(c.name, query));
  const counts = new Map<string, number>();
  for (const n of mine) counts.set(n.nomineeId, (counts.get(n.nomineeId) ?? 0) + 1);
  const total = others.length;
  const done = others.filter((c) => counts.has(c.id)).length;

  // Signing in swaps the landing page for the board without a navigation: start at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Hide the toast after a few seconds.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.kind === "milestone" ? 5000 : 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // After the dialog closes, move focus to the requested card.
  useEffect(() => {
    if (!focusRequest || active) return;
    const card = cards.current.get(focusRequest.id);
    card?.focus({ preventScroll: true });
    card?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusRequest, active]);

  function handleSaved(n: OwnNomination) {
    const next = [...mine, n];
    setMine(next);
    const nominated = new Set(next.map((x) => x.nomineeId));
    const nowDone = others.filter((c) => nominated.has(c.id)).length;

    // Milestone when this submission crosses 25 / 50 / 100 %.
    const milestone = ([100, 50, 25] as const).find((p) => done * 100 < p * total && nowDone * 100 >= p * total);
    const text = milestone ? t[`milestone${milestone}`] : t.saved(findColleague(n.nomineeId)?.name ?? "");
    setToast({ id: n.id, text, kind: milestone ? "milestone" : "success" });
    setBurst((b) => ({ n: b.n + 1, big: milestone === 100 }));

    // Jump to the next colleague without a nomination: first within the current
    // search results, otherwise anywhere (clearing the search so the card shows).
    const nextAfter = (list: Colleague[]) => {
      const start = list.findIndex((c) => c.id === n.nomineeId);
      for (let k = 1; k <= list.length; k++) {
        const c = list[(start + k) % list.length];
        if (!nominated.has(c.id)) return c.id;
      }
    };
    let target = nextAfter(visible);
    if (!target) {
      target = nextAfter(others);
      if (target) setQuery("");
    }
    setActive(null);
    setJustNominated(n.nomineeId);
    setFocusRequest({ id: target ?? n.nomineeId });
  }

  async function handleDelete(id: string) {
    const { ok } = await deleteOwnNomination(id).catch(() => ({ ok: false }));
    if (ok) setMine((list) => list.filter((n) => n.id !== id));
    else setToast({ id, text: t.errors.deleteFailed, kind: "error" });
  }

  return (
    <>
      <div className="wrap pt-10 sm:pt-14">
        <p className="eyebrow text-purple-pale">
          {t.edition} — {t.deadline(formatDeadline(lang))}
        </p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h1 className="font-serif text-6xl leading-[0.9] tracking-[-0.02em] sm:text-8xl">{t.hello(voter.name)}</h1>
          <button type="button" onClick={() => signOut()} className="link eyebrow">
            {t.notYou}
          </button>
        </div>
        <p className="mt-5 max-w-xl text-lg text-white/85">{t.intro}</p>
      </div>

      {/* Tally + search stay visible while scrolling. One tick per colleague. */}
      <div className="sticky top-0 z-10 mt-8 border-y border-line bg-ink/85 backdrop-blur-md">
        <div className="wrap flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:gap-8">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium" aria-live="polite">
              {t.progress(done, total)}
            </p>
            <div
              role="progressbar"
              aria-label={t.progress(done, total)}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={done}
              className="mt-2 flex gap-[3px]"
            >
              {others.map((c) => (
                <span key={c.id} className={`h-2.5 flex-1 transition-colors duration-500 ${counts.has(c.id) ? "foil" : "bg-white/15"}`} />
              ))}
            </div>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchColleagues}
            aria-label={t.searchColleagues}
            className="input sm:w-80"
          />
        </div>
      </div>

      <div className="wrap">
        <ul className="mt-8 grid grid-cols-2 border-t border-l border-line sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((c) => {
            const count = counts.get(c.id) ?? 0;
            const number = String(others.indexOf(c) + 1).padStart(2, "0");
            const photo = photoOf(c.id);
            return (
              <li key={c.id} className="border-r border-b border-line">
                <button
                  type="button"
                  ref={(el) => {
                    if (el) cards.current.set(c.id, el);
                    else cards.current.delete(c.id);
                  }}
                  onClick={() => setActive(c)}
                  aria-label={count ? `${t.nominate(c.name)} (${t.awardsGiven(count)})` : t.nominate(c.name)}
                  className={`group relative flex h-full min-h-40 w-full cursor-pointer flex-col overflow-hidden p-4 text-left transition-colors duration-200 hover:bg-purple focus-visible:-outline-offset-2 sm:min-h-48 sm:p-5 ${
                    count ? "bg-[linear-gradient(140deg,rgb(227_191_98/0.13),transparent_55%)]" : ""
                  } ${justNominated === c.id ? "sheen" : ""}`}
                >
                  <span className="flex items-start justify-between">
                    <span className="eyebrow tabular-nums transition-colors group-hover:text-white/80">{number}</span>
                    {count > 0 && (
                      <span className="flex items-center gap-2 text-xs font-semibold text-gold group-hover:text-white">
                        {count > 1 && <span>×{count}</span>}
                        <GoldCheck />
                      </span>
                    )}
                  </span>
                  {photo ? (
                    // Black and white until you hover or have nominated them; then colour, framed in gold.
                    <Image
                      src={photo}
                      alt=""
                      width={192}
                      height={192}
                      className={`mt-auto size-20 object-cover transition duration-300 group-hover:grayscale-0 sm:size-24 ${
                        count ? "outline-2 outline-offset-2 outline-gold" : "grayscale"
                      }`}
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className={`mt-auto font-serif text-5xl leading-none italic transition-colors group-hover:text-white sm:text-6xl ${
                        count ? "text-gold" : "text-purple-light"
                      }`}
                    >
                      {initials(c.name)}
                    </span>
                  )}
                  <span className="mt-3 flex items-end justify-between gap-2">
                    <span className="leading-tight font-medium">{c.name}</span>
                    <Chevron className="nudge mb-0.5 size-3 shrink-0 text-white/30 transition-colors group-hover:text-white" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {visible.length === 0 && (
          <p className="mt-10 text-center text-muted">
            {t.noMatch(query)}{" "}
            <button type="button" onClick={() => setQuery("")} className="link">
              {t.clearSearch}
            </button>
          </p>
        )}

        <section className="mt-20" aria-labelledby="mine-title">
          <h2 id="mine-title" className="font-serif text-4xl leading-none sm:text-5xl">
            {t.mineTitle(mine.length)}
          </h2>
          <p className="mt-3 text-muted">{mine.length ? t.mineHint : t.mineEmpty}</p>
          <ul className="mt-8 border-b border-line empty:hidden">
            {[...mine].reverse().map((n) => (
              <MineItem key={n.id} nomination={n} onDelete={() => handleDelete(n.id)} />
            ))}
          </ul>
        </section>
      </div>

      <NominateDialog
        nominee={active}
        existing={active ? mine.filter((n) => n.nomineeId === active.id) : []}
        onClose={() => setActive(null)}
        onSaved={handleSaved}
      />

      {burst.n > 0 && <Confetti key={burst.n} big={burst.big} />}

      {/* Live region: always mounted so screen readers announce new messages */}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast && (
          <p
            key={toast.id}
            className={`pop flex items-center gap-3 px-5 py-3.5 text-sm font-semibold shadow-2xl shadow-black ${
              toast.kind === "error"
                ? "border border-red-400/60 bg-[#1f0d0f] text-red-200"
                : toast.kind === "milestone"
                  ? "foil"
                  : "border border-line border-l-gold bg-surface-2 text-white [border-left-width:3px]"
            }`}
          >
            {toast.kind === "success" && <GoldCheck className="size-4" />}
            {toast.kind === "milestone" && <Chevron className="size-3" />}
            {toast.text}
          </p>
        )}
      </div>
    </>
  );
}

function MineItem({ nomination: n, onDelete }: { nomination: OwnNomination; onDelete: () => Promise<void> }) {
  const { t } = useLang();
  const [step, setStep] = useState<"idle" | "confirm" | "deleting">("idle");
  const name = findColleague(n.nomineeId)?.name ?? n.nomineeId;

  return (
    <li className="grid gap-x-10 gap-y-3 border-t border-line py-6 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] sm:items-start">
      <div>
        <p className="font-serif text-2xl leading-tight break-words text-gold italic">{n.awardName}</p>
        <p className="eyebrow mt-2">{t.forName(name)}</p>
      </div>
      <p className="break-words whitespace-pre-wrap text-white/85">{n.reason}</p>
      <button
        type="button"
        disabled={step === "deleting"}
        onBlur={() => step === "confirm" && setStep("idle")}
        onClick={async () => {
          if (step === "idle") return setStep("confirm");
          setStep("deleting");
          await onDelete();
          setStep("idle");
        }}
        aria-label={`${step === "confirm" ? t.confirmDelete : t.delete}: ${n.awardName}`}
        className={`eyebrow cursor-pointer justify-self-start border px-3 py-2 transition-colors disabled:opacity-50 sm:justify-self-end ${
          step === "idle" ? "border-white/20 hover:border-red-300 hover:text-red-200" : "border-red-300 bg-red-300 text-[#2a0a0a]"
        }`}
      >
        {step === "idle" ? t.delete : t.confirmDelete}
      </button>
    </li>
  );
}
