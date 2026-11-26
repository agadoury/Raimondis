"use server";

// Every write goes through here and is validated on the server.
// No action returns other people's nominations: voters only ever get back their own.
import { randomUUID } from "node:crypto";
import * as auth from "@/lib/auth";
import * as store from "@/lib/store";
import { RATE_LIMIT_PER_HOUR, SIGN_IN_ATTEMPTS_PER_HOUR } from "@/lib/config";
import { AWARD_MAX, REASON_MAX, findColleague, type OwnNomination } from "@/lib/shared";
import type { ErrorCode } from "@/lib/i18n";

type FormState = { error: true } | null;

/** Name + 4-digit code. The first visit creates the code; later visits must match it. */
export async function signIn(voterId: string, code: string): Promise<{ error: ErrorCode } | null> {
  const voter = findColleague(String(voterId ?? ""));
  if (!voter) return { error: "pickName" };
  if (!/^\d{4}$/.test(String(code ?? ""))) return { error: "codeFormat" };
  if (!store.isConfigured()) return { error: "notConfigured" };
  try {
    if (await store.overLimit("signin", voter.id, SIGN_IN_ATTEMPTS_PER_HOUR)) return { error: "tooManyAttempts" };
    if (!(await store.saveOrCheckCode(voter.id, auth.hashCode(voter.id, code)))) return { error: "wrongCode" };
  } catch (e) {
    console.error(e);
    return { error: "generic" };
  }
  await auth.setVoter(voter.id);
  return null;
}

export async function signOut() {
  await auth.setVoter(null);
}

export type SubmitResult = { ok: true; nomination: OwnNomination } | { ok: false; error: ErrorCode };

export async function submitNomination(input: {
  nomineeId: string;
  awardName: string;
  reason: string;
}): Promise<SubmitResult> {
  const voter = await auth.getVoter();
  if (!voter) return { ok: false, error: "noSession" };

  const nominee = findColleague(String(input?.nomineeId ?? ""));
  const awardName = String(input?.awardName ?? "").trim();
  const reason = String(input?.reason ?? "").trim();

  if (!nominee) return { ok: false, error: "badNominee" };
  if (nominee.id === voter.id) return { ok: false, error: "selfNomination" };
  if (!awardName) return { ok: false, error: "awardRequired" };
  if (awardName.length > AWARD_MAX) return { ok: false, error: "awardTooLong" };
  if (!reason) return { ok: false, error: "reasonRequired" };
  if (reason.length > REASON_MAX) return { ok: false, error: "reasonTooLong" };

  try {
    if (await store.overLimit("submit", voter.id, RATE_LIMIT_PER_HOUR)) return { ok: false, error: "rateLimited" };
    const own: OwnNomination = {
      id: randomUUID(),
      nomineeId: nominee.id,
      awardName,
      reason,
      createdAt: new Date().toISOString(),
    };
    // The voter comes from the signed cookie, never from the request.
    await store.addNomination({ ...own, voterId: voter.id, voterName: voter.name });
    return { ok: true, nomination: own };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "generic" };
  }
}

export async function deleteOwnNomination(id: string): Promise<{ ok: boolean }> {
  const voter = await auth.getVoter();
  if (!voter || typeof id !== "string") return { ok: false };
  try {
    return { ok: await store.deleteNomination(id, voter.id) };
  } catch (e) {
    console.error(e);
    return { ok: false };
  }
}

// ---- Admin -------------------------------------------------------------------

export async function adminLogin(_prev: FormState, form: FormData): Promise<FormState> {
  if (!auth.adminPasswordMatches(String(form.get("password") ?? ""))) return { error: true };
  await auth.setAdmin(true);
  return null;
}

export async function adminLogout() {
  await auth.setAdmin(false);
}

/**
 * For someone who forgot their code or whose name was taken: give them a new
 * 4-digit code, or pass null to clear it so they can choose their own.
 */
export async function adminSetCode(voterId: string, code: string | null): Promise<{ ok: boolean }> {
  if (!(await auth.isAdmin()) || !findColleague(voterId)) return { ok: false };
  if (code !== null && !/^\d{4}$/.test(String(code))) return { ok: false };
  try {
    await store.setCode(voterId, code === null ? null : auth.hashCode(voterId, code));
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false };
  }
}
