"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { COLLEAGUES, findColleague, matches, type Nomination } from "@/lib/shared";
import { adminLogin, adminLogout, adminResetCode } from "../actions";
import { useLang } from "../lang";
import { Avatar } from "../ui";

export function AdminLogin() {
  const { t } = useLang();
  const [state, action, pending] = useActionState(adminLogin, null);

  return (
    <form action={action} className="card mx-auto max-w-md p-6 sm:p-8">
      <h2 className="text-xl font-semibold">{t.admin}</h2>
      <label htmlFor="password" className="mt-5 mb-2 block text-sm text-muted">
        {t.adminPassword}
      </label>
      <input id="password" name="password" type="password" required autoFocus autoComplete="current-password" className="input" />
      {state?.error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {t.badAdminPassword}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary mt-5 w-full">
        {t.signIn}
      </button>
    </form>
  );
}

type TableProps = {
  nominations: Nomination[];
  /** Ids of the colleagues who have created their 4-digit code. */
  codeHolders: string[];
};

export function AdminTable({ nominations, codeHolders }: TableProps) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [nominee, setNominee] = useState("");
  const [voter, setVoter] = useState("");
  const [query, setQuery] = useState("");

  const totals = new Map<string, number>();
  for (const n of nominations) totals.set(n.nomineeId, (totals.get(n.nomineeId) ?? 0) + 1);
  const voters = [...new Set(nominations.map((n) => n.voterName))].sort((a, b) => a.localeCompare(b, "fr"));
  const notNominated = COLLEAGUES.filter((c) => !totals.has(c.id));

  const filtered = nominations.filter(
    (n) =>
      (!nominee || n.nomineeId === nominee) &&
      (!voter || n.voterName === voter) &&
      (!query || matches(`${n.awardName} ${n.reason}`, query)),
  );
  // Group by nominee, in the same alphabetical order as everywhere else.
  // (Ids no longer in colleagues.json still show up, at the end, under their id.)
  const orphans = [...new Set(filtered.map((n) => n.nomineeId))].filter((id) => !findColleague(id));
  const groups = [...COLLEAGUES, ...orphans.map((id) => ({ id, name: id }))]
    .map((c) => ({ colleague: c, items: filtered.filter((n) => n.nomineeId === c.id) }))
    .filter((g) => g.items.length > 0);
  const filtering = !!(nominee || voter || query);

  const time = new Intl.DateTimeFormat(lang === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Toronto",
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-semibold">{t.results}</h2>
          <p className="mt-1 text-muted">{t.stats(nominations.length, totals.size, voters.length)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/admin/export" download className="btn btn-primary">
            {t.exportCsv}
          </a>
          <button type="button" onClick={() => router.refresh()} className="btn btn-ghost">
            {t.refresh}
          </button>
          <form action={adminLogout}>
            <button type="submit" className="btn btn-ghost">
              {t.signOut}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <label className="text-sm text-muted">
          {t.nominee}
          <select value={nominee} onChange={(e) => setNominee(e.target.value)} className="input mt-1">
            <option value="">{t.all}</option>
            {COLLEAGUES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({totals.get(c.id) ?? 0})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-muted">
          {t.voter}
          <select value={voter} onChange={(e) => setVoter(e.target.value)} className="input mt-1">
            <option value="">{t.all}</option>
            {voters.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-muted">
          {t.searchText}
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} className="input mt-1" />
        </label>
      </div>

      {groups.length === 0 && (
        <p className="mt-10 text-center text-muted">
          {nominations.length === 0 ? t.noNominations : t.noResults}{" "}
          {filtering && (
            <button
              type="button"
              onClick={() => (setNominee(""), setVoter(""), setQuery(""))}
              className="cursor-pointer rounded text-purple-light underline underline-offset-4"
            >
              {t.clearFilters}
            </button>
          )}
        </p>
      )}

      {groups.map(({ colleague, items }) => (
        <section key={colleague.id} className="card mt-6 overflow-hidden">
          <h3 className="flex items-center gap-3 border-b border-line bg-surface-2 px-4 py-3 font-semibold">
            <Avatar name={colleague.name} size="sm" />
            {colleague.name}
            <span className="ml-auto rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-[#1a1200]">{items.length}</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs tracking-wider text-muted uppercase">
                <tr>
                  <th scope="col" className="w-[26%] px-4 py-2 font-medium">{t.colAward}</th>
                  <th scope="col" className="px-4 py-2 font-medium">{t.colReason}</th>
                  <th scope="col" className="w-[18%] px-4 py-2 font-medium">{t.colVoter}</th>
                  <th scope="col" className="w-[17%] px-4 py-2 font-medium">{t.colTime}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((n) => (
                  <tr key={n.id} className="border-t border-line align-top">
                    <td className="px-4 py-3 font-semibold text-gold">{n.awardName}</td>
                    <td className="px-4 py-3 break-words whitespace-pre-wrap">{n.reason}</td>
                    <td className="px-4 py-3">{n.voterName}</td>
                    <td className="px-4 py-3 text-muted">
                      <time dateTime={n.createdAt} suppressHydrationWarning>
                        {time.format(new Date(n.createdAt))}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {!filtering && notNominated.length > 0 && nominations.length > 0 && (
        <section className="mt-10">
          <h3 className="text-sm font-semibold text-muted">{t.notNominated(notNominated.length)}</h3>
          <p className="mt-2 text-sm">{notNominated.map((c) => c.name).join(" · ")}</p>
        </section>
      )}

      <ResetCode holders={COLLEAGUES.filter((c) => codeHolders.includes(c.id))} />
    </>
  );
}

function ResetCode({ holders }: { holders: { id: string; name: string }[] }) {
  const { t } = useLang();
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [done, setDone] = useState("");

  async function reset() {
    const person = holders.find((c) => c.id === selected);
    if (!person) return;
    const { ok } = await adminResetCode(person.id);
    if (!ok) return;
    setDone(t.resetDone(person.name));
    setSelected("");
    router.refresh();
  }

  return (
    <section className="card mt-10 p-4 sm:p-5">
      <h3 className="font-semibold">{t.codes(holders.length, COLLEAGUES.length)}</h3>
      <p className="mt-1 text-sm text-muted">{t.resetCodeHint}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <select value={selected} onChange={(e) => setSelected(e.target.value)} aria-label={t.resetCode} className="input sm:max-w-xs">
          <option value="">—</option>
          {holders.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={reset} disabled={!selected} className="btn btn-ghost">
          {t.resetCode}
        </button>
      </div>
      <p role="status" className="mt-2 text-sm text-gold">
        {done}
      </p>
    </section>
  );
}
