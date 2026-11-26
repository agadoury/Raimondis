// Shared by server and client. Nothing secret in here.
import raw from "@/data/colleagues.json";

export type Colleague = { id: string; name: string };

export type Nomination = {
  id: string;
  nomineeId: string;
  awardName: string;
  reason: string;
  voterId: string;
  voterName: string;
  createdAt: string; // ISO 8601
};

/** What a voter gets back about their own nominations (never anyone else's). */
export type OwnNomination = Omit<Nomination, "voterId" | "voterName">;

export const AWARD_MAX = 80;
export const REASON_MAX = 500;

/** Sorted by first name, French collation (É sorts with E, etc.). */
export const COLLEAGUES: Colleague[] = [...(raw as Colleague[])].sort((a, b) =>
  a.name.localeCompare(b.name, "fr"),
);

const BY_ID = new Map(COLLEAGUES.map((c) => [c.id, c]));
export const findColleague = (id: string | undefined | null) => (id ? BY_ID.get(id) : undefined);

// Photos found in public/photos at build time, keyed by colleague id (see next.config.ts).
const PHOTOS = new Map(
  (JSON.parse(process.env.PHOTO_FILES ?? "[]") as string[]).map((file) => [
    file.replace(/\.\w+$/, "").toLowerCase(),
    `/photos/${file}`,
  ]),
);
/** The colleague's photo, if one was added; otherwise undefined and their initials are shown. */
export const photoOf = (id: string) => PHOTOS.get(id);

/** Lowercase, strip accents, treat hyphens as spaces: "François-Xavier" → "francois xavier". */
export function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[-‐–]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const matches = (name: string, query: string) => normalize(name).includes(normalize(query));

/** First letter of first + last word (hyphens stay inside a word): "François-Xavier Groulx" → "FG". */
export function initials(name: string) {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}
