import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { ADMIN_PASSWORD } from "./config";
import { findColleague } from "./shared";
import { redisCredentials } from "./store";

const VOTER = "rv_voter"; // "<colleagueId>.<signature>": who is signed in
const ADMIN = "rv_admin";

const secure = process.env.NODE_ENV === "production";
const LONG = { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90 } as const;

// Cookies and codes are signed with a secret nobody has to set up: the Redis
// token that the Upstash integration adds to the project.
const secret = () => redisCredentials()?.token ?? "local-development-secret";

const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url");

function safeEqual(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

// ---- Voter: name + 4-digit code ------------------------------------------------

/** What we store instead of the code itself. */
export const hashCode = (voterId: string, code: string) => `v1:${sign(`code:${voterId}:${code}`)}`;

export async function getVoter() {
  const [id, signature] = ((await cookies()).get(VOTER)?.value ?? "").split(".");
  if (!id || !signature || !safeEqual(signature, sign(`voter:${id}`))) return undefined;
  return findColleague(id);
}

export async function setVoter(id: string | null) {
  const jar = await cookies();
  if (id) jar.set(VOTER, `${id}.${sign(`voter:${id}`)}`, LONG);
  else jar.delete(VOTER);
}

// ---- Admin -------------------------------------------------------------------

const adminToken = () => createHmac("sha256", ADMIN_PASSWORD).update("raimondis-admin").digest("base64url");

export const adminPasswordMatches = (input: string) => safeEqual(input, ADMIN_PASSWORD);

export async function isAdmin() {
  const value = (await cookies()).get(ADMIN)?.value;
  return !!value && safeEqual(value, adminToken());
}

export async function setAdmin(on: boolean) {
  const jar = await cookies();
  // No maxAge → cookie lasts for the browser session only.
  if (on) jar.set(ADMIN, adminToken(), { httpOnly: true, secure, sameSite: "lax", path: "/" });
  else jar.delete(ADMIN);
}
