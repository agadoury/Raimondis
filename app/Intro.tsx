"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { formatDeadline } from "@/lib/i18n";
import { useLang } from "./lang";
import { Chevron } from "./ui";

// The intro opens by itself on someone's first visit. "Seen" is remembered in their browser.
const SEEN_KEY = "raimondis:intro-seen";
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};
const hasSeen = () => {
  try {
    return localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return true; // storage blocked: don't nag on every visit
  }
};
const markSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {}
  listeners.forEach((cb) => cb());
};

// Where the big ">" sits in each scene; it glides from one to the next.
const CHEVRON = [
  "translate(8%, -50%) scale(1)",
  "translate(-6%, -78%) scale(0.62)",
  "translate(26%, -34%) scale(1.5)",
  "translate(-2%, -50%) scale(0.85)",
  "translate(12%, -56%) scale(1.2)",
];
// Seconds each scene stays up before moving on by itself (the last one waits for you).
const SECONDS = [4.5, 7.5, 6, 6.5, 6];

type Props = {
  replay: boolean; // true when "Watch the intro" was clicked
  onClose: () => void;
  onStart: () => void; // the "Pick your name" button on the last scene
};

/** A short animated explainer that plays like a video in a popup. Skippable at any point. */
export default function Intro({ replay, onClose, onStart }: Props) {
  const { t, lang } = useLang();
  const seen = useSyncExternalStore(subscribe, hasSeen, () => true);
  const open = !seen || replay;
  const ref = useRef<HTMLDialogElement>(null);
  const [scene, setScene] = useState(0);
  const scenes = t.tour.scenes(formatDeadline(lang));
  const last = scenes.length - 1;
  const current = scenes[scene];

  useEffect(() => {
    const dialog = ref.current!;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.focus(); // so no button looks "selected" when it opens; Tab still reaches them
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const go = (to: number) => setScene(Math.max(0, Math.min(last, to)));

  return (
    <dialog
      ref={ref}
      aria-label={t.tour.label}
      tabIndex={-1}
      onClose={() => {
        markSeen();
        setScene(0);
        onClose();
      }}
      onClick={(e) => e.target === ref.current && ref.current.close()} // click on the backdrop
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(scene + 1);
        if (e.key === "ArrowLeft") go(scene - 1);
      }}
      className="m-auto w-[calc(100%-1.5rem)] max-w-3xl overflow-hidden border outline-none border-line bg-ink p-0 text-white shadow-[0_0_10rem_rgb(161_0_255/0.35)]"
    >
      {open && (
        <div className="relative flex min-h-[32rem] flex-col p-6 sm:min-h-[30rem] sm:p-10">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(28rem_22rem_at_85%_50%,rgb(161_0_255/0.32),transparent_70%)]"
          />
          <Chevron
            className="absolute top-1/2 right-0 size-72 text-purple opacity-45 drop-shadow-[0_0_4rem_rgb(161_0_255/0.6)] transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:size-96 sm:opacity-100"
            style={{ transform: CHEVRON[scene] }}
          />

          {/* Progress: one bar per scene. The current one fills, then the next scene starts. */}
          <div className="relative flex gap-1.5" aria-hidden="true">
            {scenes.map((_, i) => (
              <span key={i} className="h-0.5 flex-1 bg-white/20">
                {i < scene && <span className="block h-full bg-white" />}
                {i === scene && (
                  <span
                    key={scene}
                    className="intro-fill block h-full bg-white"
                    style={{ "--d": `${SECONDS[i]}s` } as React.CSSProperties}
                    onAnimationEnd={() => scene < last && go(scene + 1)}
                  />
                )}
              </span>
            ))}
          </div>

          <div className="relative mt-4 flex items-center justify-between">
            <p className="eyebrow text-purple-pale">Les Raimondis — {t.edition}</p>
            <button type="button" onClick={() => ref.current?.close()} className="eyebrow -mr-2 cursor-pointer px-2 py-2 hover:text-white">
              {scene === last ? t.close : t.tour.skip}
            </button>
          </div>

          {/* The scene itself. Re-keyed so the text animates in each time. */}
          <div key={scene} className="relative flex flex-1 flex-col justify-center py-8" aria-live="polite">
            <p aria-hidden="true" className="fade-up font-serif text-2xl text-purple-light italic">
              0{scene + 1}
            </p>
            <h2 className="mt-3 -mb-[0.14em] overflow-hidden pb-[0.14em] font-serif text-[clamp(2.5rem,9vw,4.5rem)] leading-[0.98] tracking-[-0.02em]">
              <span className="rise block max-w-xl">{current.title}</span>
            </h2>
            <p className="fade-up mt-6 max-w-md text-lg leading-snug text-white/90 [animation-delay:250ms]">{current.body}</p>
            {scene === last && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    ref.current?.close();
                    onStart();
                  }}
                  className="btn btn-primary fade-up mt-7 [animation-delay:450ms]"
                >
                  {t.tour.start}
                  <Chevron className="nudge size-3" />
                </button>
              </div>
            )}
          </div>

          <div className="relative flex items-center justify-between">
            <span className="eyebrow tabular-nums">
              {scene + 1} / {scenes.length}
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={() => go(scene - 1)} disabled={scene === 0} className="btn btn-ghost px-4 py-3 disabled:opacity-30">
                {t.tour.back}
              </button>
              <button type="button" onClick={() => go(scene + 1)} disabled={scene === last} className="btn btn-ghost px-4 py-3 disabled:opacity-30">
                {t.tour.next}
              </button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
