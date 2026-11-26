// Small presentational pieces shared across screens.
import { initials } from "@/lib/shared";

/** The brand ">" mark. */
export function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M3 2.5 21 12 3 21.5v-5.6L11.4 12 3 8.1z" fill="currentColor" />
    </svg>
  );
}

const AVATAR_STYLES = [
  "bg-purple text-white",
  "bg-purple-dark text-white",
  "bg-purple-deep text-purple-pale",
  "bg-purple-light text-[#1b0030]",
  "bg-purple-pale text-[#2a0045]",
];

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const hash = [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const dims = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg" }[size];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide ${dims} ${AVATAR_STYLES[hash % AVATAR_STYLES.length]}`}
    >
      {initials(name)}
    </span>
  );
}

export function GoldCheck({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`pop text-gold ${className}`}>
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="m7 12.5 3.2 3.2L17 9" fill="none" stroke="#1a1200" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const CONFETTI_COLORS = ["#e9c46a", "#a100ff", "#be82ff", "#ffffff", "#dcafff"];

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
        return <span key={i} className="confetti-piece absolute h-2.5 w-1.5 rounded-[1px]" style={style} />;
      })}
    </div>
  );
}
