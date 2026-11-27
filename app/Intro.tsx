"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { formatDeadline } from "@/lib/i18n";
import { COLLEAGUES, initials } from "@/lib/shared";
import { useLang } from "./lang";
import { Chevron, Confetti } from "./ui";

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

// Five scenes. Seconds each one plays before the next starts (the last one waits for you).
const SECONDS = [4.5, 8, 6.5, 7, 6];
const LAST = SECONDS.length - 1;
// Where the big ">" sits in each scene; it glides from one to the next.
const CHEVRON = [
  "translate(10%, -50%) scale(1.25)",
  "translate(34%, -88%) scale(0.55)",
  "translate(38%, -20%) scale(1.7)",
  "translate(30%, -84%) scale(0.6)",
  "translate(14%, -52%) scale(1.35)",
];

type Props = {
  replay: boolean; // true when "Watch the intro" was clicked
  onClose: () => void;
  onStart: () => void; // the "Pick your name" button at the end
};

/** A short animated explainer that plays like a video in a popup. Skippable at any point. */
export default function Intro({ replay, onClose, onStart }: Props) {
  const { t } = useLang();
  const seen = useSyncExternalStore(subscribe, hasSeen, () => true);
  const open = !seen || replay;
  const ref = useRef<HTMLDialogElement>(null);
  const [scene, setScene] = useState(0);

  useEffect(() => {
    const dialog = ref.current!;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.focus(); // so no button looks "selected" when it opens; Tab still reaches them
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const go = (to: number) => setScene(Math.max(0, Math.min(LAST, to)));
  const close = () => ref.current?.close();

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
      onClick={(e) => e.target === ref.current && close()} // click on the backdrop
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(scene + 1);
        if (e.key === "ArrowLeft") go(scene - 1);
      }}
      className="m-auto w-[calc(100%-1.5rem)] max-w-3xl overflow-hidden border border-line bg-ink p-0 text-white shadow-[0_0_10rem_rgb(161_0_255/0.35)] outline-none"
    >
      {open && (
        // Like a story: tap the right side to jump ahead, the left side to go back.
        <div
          className="relative flex h-[34rem] max-h-[calc(100dvh-3rem)] flex-col overflow-hidden p-6 sm:h-[31rem] sm:p-10"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            const box = e.currentTarget.getBoundingClientRect();
            go(e.clientX - box.left < box.width * 0.3 ? scene - 1 : scene + 1);
          }}
        >
          {/* Backdrop: a drifting purple light and the big ">" that glides between scenes */}
          <div aria-hidden="true" className="intro-drift absolute -inset-1/4 bg-[radial-gradient(26rem_20rem_at_70%_50%,rgb(161_0_255/0.34),transparent_70%)]" />
          <Chevron
            className="intro-float absolute top-1/2 right-0 size-72 text-purple opacity-40 drop-shadow-[0_0_4rem_rgb(161_0_255/0.6)] transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:size-96 sm:opacity-90"
            style={{ transform: CHEVRON[scene] }}
          />

          {/* Progress: one thin bar per scene. The current one fills, then the next scene starts. */}
          <div className="relative flex gap-1.5" aria-hidden="true">
            {SECONDS.map((seconds, i) => (
              <span key={i} className="h-0.5 flex-1 bg-white/20">
                {i < scene && <span className="block h-full bg-white" />}
                {i === scene && (
                  <span
                    key={scene}
                    className="intro-fill block h-full bg-white"
                    style={{ "--d": `${seconds}s` } as React.CSSProperties}
                    onAnimationEnd={(e) => e.animationName === "intro-fill" && scene < LAST && go(scene + 1)}
                  />
                )}
              </span>
            ))}
          </div>
          <div className="relative mt-3 flex justify-end">
            <button type="button" onClick={close} className="eyebrow -mr-2 cursor-pointer px-2 py-2 hover:text-white">
              {scene === LAST ? t.close : t.tour.skip}
            </button>
          </div>

          {/* The scene. Re-keyed so everything in it animates from the start. */}
          <div key={scene} className="relative flex min-h-0 flex-1 flex-col justify-center" aria-live="polite">
            {scene === 0 && <Opening />}
            {scene === 1 && <Invent />}
            {scene === 2 && <Votes />}
            {scene === 3 && <Everyone />}
            {scene === 4 && (
              <Deadline
                onStart={() => {
                  close();
                  onStart();
                }}
              />
            )}
          </div>

          {/* A purple sweep between scenes, instead of a hard cut */}
          <span key={`wipe-${scene}`} aria-hidden="true" className="intro-wipe pointer-events-none absolute inset-y-0 left-0 hidden w-full bg-purple" />

          {/* Small step controls (also the only way to advance for reduced-motion users) */}
          <div className="relative flex justify-end gap-1">
            <button type="button" aria-label={t.tour.back} onClick={() => go(scene - 1)} disabled={scene === 0} className="cursor-pointer p-3 text-white/50 hover:text-white disabled:opacity-20">
              <Chevron className="size-3 rotate-180" />
            </button>
            <button type="button" aria-label={t.tour.next} onClick={() => go(scene + 1)} disabled={scene === LAST} className="cursor-pointer p-3 text-white/50 hover:text-white disabled:opacity-20">
              <Chevron className="size-3" />
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

// ---- Building blocks -----------------------------------------------------------

/** Text that rises in piece by piece (words, or letters). Read as one phrase by screen readers. */
function Rise({ text, by = "word", delay = 0, step = 70 }: { text: string; by?: "word" | "letter"; delay?: number; step?: number }) {
  const parts = by === "word" ? text.split(" ") : [...text];
  return (
    <span>
      <span className="sr-only">{text}</span>
      {parts.map((part, i) => (
        <span key={i} aria-hidden="true" className="-mb-[0.16em] inline-block overflow-hidden pb-[0.16em] align-bottom">
          <span className="rise inline-block whitespace-pre" style={{ animationDelay: `${delay + i * step}ms` }}>
            {part}
            {by === "word" && i < parts.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </span>
  );
}

const headline = "font-serif text-[clamp(2.4rem,8.5vw,4.25rem)] leading-[1] tracking-[-0.02em]";
const caption = "fade-up mt-5 max-w-md text-lg leading-snug text-white/85";

/** Types each phrase out, pauses, deletes it, and moves to the next. */
function useTypewriter(phrases: string[]) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const once = setTimeout(() => setText(phrases[0]), 0);
      return () => clearTimeout(once);
    }
    let phrase = 0;
    let length = 0;
    let typing = true;
    let wait = 12; // ticks to hold before the next move
    const timer = setInterval(() => {
      if (wait > 0) return void wait--;
      const full = phrases[phrase % phrases.length];
      length = typing ? length + 1 : Math.max(0, length - 3);
      setText(full.slice(0, length));
      if (typing && length === full.length) {
        typing = false;
        wait = 26;
      } else if (!typing && length === 0) {
        typing = true;
        phrase++;
        wait = 5;
      }
    }, 42);
    return () => clearInterval(timer);
  }, [phrases]);
  return text;
}

// ---- Scenes --------------------------------------------------------------------

/** 1. The title lands letter by letter, with a burst of confetti. */
function Opening() {
  const { t } = useLang();
  return (
    <>
      <Confetti />
      <p className="eyebrow fade-up text-purple-pale [animation-delay:500ms]">{t.edition}</p>
      <h2 className="hero-title mt-3 font-serif text-[clamp(2.7rem,11.5vw,6rem)] leading-[1] tracking-[-0.025em] whitespace-nowrap">
        <i>
          <Rise text="Les" by="letter" delay={250} step={45} />
        </i>{" "}
        <Rise text="Raimondis" by="letter" delay={420} step={45} />
      </h2>
      <p className={`${caption} [animation-delay:1100ms]`}>{t.tour.opening}</p>
    </>
  );
}

/** 2. An award card whose name types itself, one example after another. */
function Invent() {
  const { t } = useLang();
  const typed = useTypewriter(t.awardExamples);
  return (
    <>
      <h2 className={headline}>
        <Rise text={t.tour.invent} delay={250} />
      </h2>
      <div className="fade-up mt-6 max-w-md border border-line border-l-gold bg-surface/90 p-4 [animation-delay:700ms] [border-left-width:3px]">
        <p className="eyebrow">{t.awardName}</p>
        <p className="mt-1 min-h-[2.4em] font-serif text-2xl leading-tight text-gold italic sm:text-3xl" aria-hidden="true">
          {typed}
          <span className="intro-caret ml-0.5 inline-block h-[0.9em] w-px translate-y-[0.1em] bg-gold" />
        </p>
      </div>
      <p className={`${caption} [animation-delay:1000ms]`}>{t.tour.inventCaption}</p>
    </>
  );
}

/** 3. Votes pile up behind three contenders, and one pulls ahead. */
function Votes() {
  const { t } = useLang();
  const bars = [46, 92, 63]; // % widths; the middle one wins
  return (
    <>
      <h2 className={headline}>
        <Rise text={t.tour.votes} delay={250} />
      </h2>
      <div className="mt-6 max-w-md space-y-2.5" aria-hidden="true">
        {bars.map((width, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="fade-up flex size-8 shrink-0 items-center justify-center bg-purple font-serif italic" style={{ animationDelay: `${600 + i * 120}ms` }}>
              ?
            </span>
            <span className="relative h-8 flex-1">
              <span
                className={`intro-grow absolute inset-y-0 left-0 flex items-center justify-end px-2 ${i === 1 ? "foil" : "bg-white/25"}`}
                style={{ width: `${width}%`, animationDelay: `${900 + i * 150}ms` }}
              >
                {i === 1 && <span className="fade-up text-[0.625rem] font-bold tracking-[0.18em] uppercase [animation-delay:2700ms]">{t.tour.winner}</span>}
              </span>
            </span>
          </div>
        ))}
      </div>
      <p className={`${caption} [animation-delay:1300ms]`}>{t.tour.votesCaption}</p>
    </>
  );
}

/** 4. Everyone's initials, turning gold one after another. */
function Everyone() {
  const { t } = useLang();
  return (
    <>
      <h2 className={headline}>
        <Rise text={t.tour.everyone} delay={250} />
      </h2>
      <div className="mt-6 grid max-w-md grid-cols-8 gap-1.5 sm:grid-cols-11" aria-hidden="true">
        {COLLEAGUES.map((c, i) => (
          <span
            key={c.id}
            className="intro-tile flex aspect-square items-center justify-center bg-white/10 font-serif text-xs text-white/70 italic"
            style={{ animationDelay: `${700 + i * 110}ms` }}
          >
            {initials(c.name)}
          </span>
        ))}
      </div>
      <p className={`${caption} [animation-delay:1100ms]`}>{t.tour.everyoneCaption}</p>
    </>
  );
}

/** 5. The date, and the way in. Stays up until you choose. */
function Deadline({ onStart }: { onStart: () => void }) {
  const { t, lang } = useLang();
  const date = formatDeadline(lang);
  return (
    <>
      <p className="eyebrow fade-up [animation-delay:300ms]">
        <span className="foil-text">{t.deadlineLabel}</span>
      </p>
      <h2 className="mt-2 font-serif text-[clamp(2.8rem,11vw,5.5rem)] leading-[0.98] tracking-[-0.025em]">
        <Rise text={date.endsWith(".") ? date : `${date}.`} delay={350} step={110} />
      </h2>
      <p className={`${caption} [animation-delay:900ms]`}>{t.tour.deadlineCaption}</p>
      <div>
        <button type="button" onClick={onStart} className="btn btn-primary intro-pulse mt-7 [animation-delay:1200ms]">
          {t.tour.start}
          <Chevron className="nudge size-3" />
        </button>
      </div>
    </>
  );
}
