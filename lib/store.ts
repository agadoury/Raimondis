import "server-only";
import { Redis } from "@upstash/redis";
import type { Nomination } from "./shared";

// Keys
const NOMINATIONS = "raimondis:nominations"; // hash: nomination id → Nomination (JSON)
const CODES = "raimondis:codes"; // hash: colleague id → hashed 4-digit code
const counterKey = (kind: string, id: string) => `raimondis:limit:${kind}:${id}:${Math.floor(Date.now() / 3_600_000)}`;

type Hash = Record<string, unknown>;
type Client = {
  hset(key: string, values: Hash): Promise<unknown>;
  hsetnx(key: string, field: string, value: unknown): Promise<number>;
  hget(key: string, field: string): Promise<unknown>;
  hgetall(key: string): Promise<Hash | null>;
  hkeys(key: string): Promise<string[]>;
  hdel(key: string, field: string): Promise<unknown>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  del(key: string): Promise<unknown>;
};

/** In-memory stand-in so `npm run dev` works without Redis. Never used on Vercel. */
function memoryClient(): Client {
  const g = globalThis as { __raimondisMem?: Map<string, Hash> };
  const db = (g.__raimondisMem ??= new Map());
  const h = (k: string) => db.get(k) ?? db.set(k, {}).get(k)!;
  return {
    async hset(k, v) { Object.assign(h(k), structuredClone(v)); },
    async hsetnx(k, f, v) { if (f in h(k)) return 0; h(k)[f] = v; return 1; },
    async hget(k, f) { return h(k)[f] ?? null; },
    async hgetall(k) { const v = h(k); return Object.keys(v).length ? structuredClone(v) : null; },
    async hkeys(k) { return Object.keys(h(k)); },
    async hdel(k, f) { delete h(k)[f]; },
    async incr(k) { const v = h("__counters"); v[k] = ((v[k] as number) ?? 0) + 1; return v[k] as number; },
    async expire() {},
    async del(k) { delete h("__counters")[k]; },
  };
}

/**
 * The Redis URL and token that the Upstash integration adds to the Vercel project.
 * Also accepts the names with a custom prefix (e.g. STORAGE_KV_REST_API_URL).
 */
export function redisCredentials() {
  const find = (...names: string[]) => {
    for (const name of names) {
      const key = Object.keys(process.env).find((k) => k === name || k.endsWith(`_${name}`));
      if (key && process.env[key]) return process.env[key];
    }
  };
  const url = find("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL");
  const token = find("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN");
  return url && token ? { url, token } : null;
}

/** False on Vercel until Upstash for Redis is connected to the project (and the site redeployed). */
export const isConfigured = () => !process.env.VERCEL || redisCredentials() !== null;

let client: Client | undefined;
function redis(): Client {
  if (client) return client;
  const credentials = redisCredentials();
  if (credentials) return (client = new Redis(credentials) as unknown as Client);
  if (process.env.VERCEL) {
    throw new Error("Redis is not configured. Connect Upstash for Redis to this project in Vercel → Storage.");
  }
  console.warn("[raimondis] No Redis env vars found: using in-memory storage (data is lost on restart).");
  return (client = memoryClient());
}

const parse = (v: unknown) => (typeof v === "string" ? JSON.parse(v) : v) as Nomination;

// ---- 4-digit codes -------------------------------------------------------------

/** First visit: saves the code. Later visits: checks it. Returns false when it doesn't match. */
export async function saveOrCheckCode(voterId: string, hashedCode: string) {
  const r = redis();
  if (await r.hsetnx(CODES, voterId, hashedCode)) return true;
  return String(await r.hget(CODES, voterId)) === hashedCode;
}

/** ADMIN ONLY. Replaces the person's code (pass null to clear it, so they can choose a new one). */
export async function setCode(voterId: string, hashedCode: string | null) {
  const r = redis();
  await (hashedCode ? r.hset(CODES, { [voterId]: hashedCode }) : r.hdel(CODES, voterId));
  await r.del(counterKey("signin", voterId)); // lift any "too many attempts" lock
}

/** ADMIN ONLY. Ids of everyone who has created a code. */
export const listCodeHolders = () => redis().hkeys(CODES);

// ---- Nominations ---------------------------------------------------------------

export async function addNomination(n: Nomination) {
  await redis().hset(NOMINATIONS, { [n.id]: n });
}

/** Deletes only if this voter wrote the nomination. */
export async function deleteNomination(id: string, voterId: string) {
  const r = redis();
  const found = await r.hget(NOMINATIONS, id);
  if (found == null) return true; // already gone
  if (parse(found).voterId !== voterId) return false;
  await r.hdel(NOMINATIONS, id);
  return true;
}

/** ADMIN ONLY. Never return this to a voter. */
export async function listAllNominations(): Promise<Nomination[]> {
  const all = (await redis().hgetall(NOMINATIONS)) ?? {};
  return Object.values(all)
    .map(parse)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** One voter's own nominations: the only nominations a voter is ever sent. */
export async function listNominationsBy(voterId: string) {
  return (await listAllNominations()).filter((n) => n.voterId === voterId);
}

// ---- Rate limits ---------------------------------------------------------------

/** Counts one more hit in the current hour; true once `max` is exceeded. */
export async function overLimit(kind: "submit" | "signin", id: string, max: number) {
  const r = redis();
  const key = counterKey(kind, id);
  const count = Number(await r.incr(key));
  if (count === 1) await r.expire(key, 3600);
  return count > max;
}
