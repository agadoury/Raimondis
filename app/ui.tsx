// Small presentational pieces shared across screens.
import { initials } from "@/lib/shared";

/** The brand ">" mark. */
export function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M3 3 21 12 3 21v-4.2L12.6 12 3 7.2z" fill="currentColor" />
    </svg>
  );
}

/** A square monogram tile: serif initials on core purple. */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "size-8 text-sm", md: "size-11 text-lg", lg: "size-16 text-2xl" }[size];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center bg-purple font-serif leading-none text-white italic ${dims}`}
    >
      {initials(name)}
    </span>
  );
}

/** The gold-foil mark a colleague earns once you've nominated them. */
export function GoldCheck({ className = "size-5" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`foil pop inline-flex shrink-0 items-center justify-center ${className}`}>
      <svg viewBox="0 0 24 24" className="size-[70%]">
        <path d="m5.5 12.5 4.2 4.2L18.5 8" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" />
      </svg>
    </span>
  );
}

/** A slow ticker, like the crawl at the bottom of a broadcast. Purely decorative. */
export function Marquee({ items }: { items: string[] }) {
  const row = (
    <div className="marquee-row flex shrink-0 items-center">
      {[...items, ...items, ...items].map((item, i) => (
        <span key={i} className="flex items-center gap-8 pr-8 whitespace-nowrap">
          {item}
          <Chevron className="size-2.5 text-purple" />
        </span>
      ))}
    </div>
  );
  return (
    <div aria-hidden="true" className="eyebrow flex overflow-hidden border-t border-line py-3.5 text-white/90">
      {row}
      {row}
    </div>
  );
}

const CONFETTI_COLORS = ["#e3bf62", "#a100ff", "#fff0b5", "#ffffff", "#be82ff"];

/** A short, CSS-only burst. Remount it (change its key) to replay. Hidden for reduced-motion users. */
export function Confetti({ big = false }: { big?: boolean }) {
  const count = big ? 80 : 40;
  // Pseudo-random but deterministic, so rendering stays pure.
  const rand = (i: number, salt: number) => {
    const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  return (
    <div aria-hidden="true" className="confetti pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      {Array.from({ length: count }, (_, i) => {
        const angle = rand(i, 1) * Math.PI * 2;
        const dist = 60 + rand(i, 2) * (big ? 380 : 240);
        const style = {
          "--x": `${Math.cos(angle) * dist}px`,
          "--y": `${Math.sin(angle) * dist * 0.7 - 110}px`,
          "--r": `${rand(i, 3) * 900 - 450}deg`,
          "--d": `${(big ? 1.5 : 1.0) + rand(i, 4) * 0.5}s`,
          background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        } as React.CSSProperties;
        return <span key={i} className="confetti-piece absolute h-3 w-1.5" style={style} />;
      })}
    </div>
  );
}
