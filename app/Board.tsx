"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COLLEAGUES, findColleague, matches, type Colleague, type OwnNomination } from "@/lib/shared";
import { deleteOwnNomination, signOut } from "./actions";
import { useLang } from "./lang";
import NominateDialog from "./NominateDialog";
import { Avatar, Confetti, GoldCheck } from "./ui";

type Toast = { id: string; text: string; kind: "success" | "milestone" | "error" };

type Props = {
  voter: Colleague;
  /** The signed-in voter's own nominations, loaded on the server. Nobody else's are ever sent. */
  initialNominations: OwnNomination[];
};

export default function Board({ voter, initialNominations }: Props) {
  const { t } = useLang();
  const [mine, setMine] = useState(initialNominations);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Colleague | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [burst, setBurst] = useState({ n: 0, big: false });
  const [focusRequest, setFocusRequest] = useState<{ id: string } | null>(null);
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
    setFocusRequest({ id: target ?? n.nomineeId });
  }

  async function handleDelete(id: string) {
    const { ok } = await deleteOwnNomination(id).catch(() => ({ ok: false }));
    if (ok) setMine((list) => list.filter((n) => n.id !== id));
    else setToast({ id, text: t.errors.deleteFailed, kind: "error" });
  }

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-lg font-semibold">{t.hello(voter.name)}</p>
        <button
          type="button"
          onClick={() => signOut()}
          className="cursor-pointer rounded text-sm text-purple-light underline underline-offset-4 hover:text-purple-pale"
        >
          {t.notYou}
        </button>
      </div>
      <p className="mt-1 text-muted">{t.intro}</p>

      {/* Progress + search stay visible while scrolling */}
      <div className="sticky top-0 z-10 -mx-4 mt-5 bg-ink/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <p className="text-sm font-medium" aria-live="polite">
          {t.progress(done, total)}
        </p>
        <div
          role="progressbar"
          aria-label={t.progress(done, total)}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${done === total ? "bg-gold" : "bg-linear-to-r from-purple to-purple-light"}`}
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchColleagues}
          aria-label={t.searchColleagues}
          className="input mt-3"
        />
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((c) => {
          const count = counts.get(c.id) ?? 0;
          return (
            <li key={c.id}>
              <button
                type="button"
                ref={(el) => {
                  if (el) cards.current.set(c.id, el);
                  else cards.current.delete(c.id);
                }}
                onClick={() => setActive(c)}
                aria-label={count ? `${t.nominate(c.name)} (${t.awardsGiven(count)})` : t.nominate(c.name)}
                className={`card relative flex h-full w-full cursor-pointer flex-col items-center gap-3 px-3 py-5 text-center transition-colors hover:bg-surface-2 ${
                  count ? "border-gold/60" : "hover:border-purple-light"
                }`}
              >
                <Avatar name={c.name} size="lg" />
                <span className="leading-tight font-medium">{c.name}</span>
                {count > 0 && (
                  <span className="absolute top-2 right-2 flex items-center gap-1 text-xs font-semibold text-gold">
                    {count > 1 && <span>×{count}</span>}
                    <GoldCheck />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {visible.length === 0 && (
        <p className="mt-8 text-center text-muted">
          {t.noMatch(query)}{" "}
          <button type="button" onClick={() => setQuery("")} className="cursor-pointer rounded text-purple-light underline underline-offset-4">
            {t.clearSearch}
          </button>
        </p>
      )}

      <section className="mt-14" aria-labelledby="mine-title">
        <h2 id="mine-title" className="font-serif text-2xl font-semibold lining-nums">
          {t.mineTitle(mine.length)}
        </h2>
        <p className="mt-1 text-sm text-muted">{mine.length ? t.mineHint : t.mineEmpty}</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {[...mine].reverse().map((n) => (
            <MineItem key={n.id} nomination={n} onDelete={() => handleDelete(n.id)} />
          ))}
        </ul>
      </section>

      <NominateDialog
        nominee={active}
        existing={active ? mine.filter((n) => n.nomineeId === active.id) : []}
        onClose={() => setActive(null)}
        onSaved={handleSaved}
      />

      {burst.n > 0 && <Confetti key={burst.n} big={burst.big} />}

      {/* Live region: always mounted so screen readers announce new messages */}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
        {toast && (
          <p
            key={toast.id}
            className={`pop rounded-full border px-5 py-3 text-center text-sm font-semibold shadow-xl ${
              toast.kind === "error"
                ? "border-red-400/50 bg-[#2a1215] text-red-200"
                : toast.kind === "milestone"
                  ? "border-gold bg-gold text-[#1a1200]"
                  : "border-gold/60 bg-surface-2 text-white"
            }`}
          >
            {toast.kind !== "error" && <span aria-hidden="true">🏆 </span>}
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
    <li className="card flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gold">{n.awardName}</p>
          <p className="text-sm text-muted">{t.forName(name)}</p>
        </div>
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
          className={`shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
            step === "idle" ? "border-line text-muted hover:border-red-300 hover:text-red-200" : "border-red-300 bg-red-300 text-[#2a0a0a]"
          }`}
        >
          {step === "idle" ? t.delete : t.confirmDelete}
        </button>
      </div>
      <p className="text-sm break-words whitespace-pre-wrap text-white/90">{n.reason}</p>
    </li>
  );
}
