"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { COLLEAGUES, findColleague, matches, type Nomination } from "@/lib/shared";
import { adminLogin, adminLogout, adminSetCode } from "../actions";
import { useLang } from "../lang";
import { Avatar } from "../ui";

export function AdminLogin() {
  const { t } = useLang();
  const [state, action, pending] = useActionState(adminLogin, null);

  return (
    <form action={action} className="mx-auto mt-14 w-[calc(100%-2.5rem)] max-w-md border border-line border-t-purple bg-surface p-6 [border-top-width:2px] sm:p-9">
      <h1 className="font-serif text-4xl leading-none">{t.admin}</h1>
      <label htmlFor="password" className="eyebrow mt-7 mb-2 block">
        {t.adminPassword}
      </label>
      <input id="password" name="password" type="password" required autoFocus autoComplete="current-password" className="input" />
      {state?.error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {t.badAdminPassword}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary mt-6 w-full">
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
    <div className="wrap pt-10 sm:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-purple-pale">{t.admin}</p>
          <h1 className="mt-3 font-serif text-6xl leading-[0.9] tracking-[-0.02em] sm:text-7xl">{t.results}</h1>
          <p className="mt-4 text-muted">{t.stats(nominations.length, totals.size, voters.length)}</p>
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

      <div className="mt-10 grid gap-4 border-t border-line pt-6 sm:grid-cols-3">
        <label className="eyebrow">
          {t.nominee}
          <select value={nominee} onChange={(e) => setNominee(e.target.value)} className="input mt-2 text-base font-normal tracking-normal normal-case">
            <option value="">{t.all}</option>
            {COLLEAGUES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({totals.get(c.id) ?? 0})
              </option>
            ))}
          </select>
        </label>
        <label className="eyebrow">
          {t.voter}
          <select value={voter} onChange={(e) => setVoter(e.target.value)} className="input mt-2 text-base font-normal tracking-normal normal-case">
            <option value="">{t.all}</option>
            {voters.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="eyebrow">
          {t.searchText}
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} className="input mt-2 text-base font-normal tracking-normal normal-case" />
        </label>
      </div>

      {groups.length === 0 && (
        <p className="mt-10 text-center text-muted">
          {nominations.length === 0 ? t.noNominations : t.noResults}{" "}
          {filtering && (
            <button
              type="button"
              onClick={() => (setNominee(""), setVoter(""), setQuery(""))}
              className="link"
            >
              {t.clearFilters}
            </button>
          )}
        </p>
      )}

      {groups.map(({ colleague, items }) => (
        <section key={colleague.id} className="card mt-6 overflow-hidden">
          <h3 className="flex items-center gap-3 border-b border-line bg-surface-2 px-4 py-3 text-lg font-semibold">
            <Avatar name={colleague.name} size="sm" />
            {colleague.name}
            <span className="foil ml-auto min-w-7 px-2 py-0.5 text-center text-xs font-bold tabular-nums">{items.length}</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="eyebrow">
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
                    <td className="px-4 py-3 font-serif text-lg leading-snug text-gold italic">{n.awardName}</td>
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
          <h3 className="eyebrow">{t.notNominated(notNominated.length)}</h3>
          <p className="mt-3 text-white/85">{notNominated.map((c) => c.name).join(" · ")}</p>
        </section>
      )}

      <Codes holders={codeHolders} />
    </div>
  );
}

/** Give someone a new 4-digit code, or clear it so they can choose their own. */
function Codes({ holders }: { holders: string[] }) {
  const { t } = useLang();
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const person = COLLEAGUES.find((c) => c.id === selected);

  async function save(newCode: string | null) {
    if (!person) return;
    const { ok } = await adminSetCode(person.id, newCode);
    setMessage(!ok ? t.errors.generic : newCode ? t.codeSaved(person.name, newCode) : t.codeCleared(person.name));
    if (!ok) return;
    setSelected("");
    setCode("");
    router.refresh();
  }

  return (
    <section className="card mt-12 p-5 sm:p-6" aria-labelledby="codes-title">
      <h3 id="codes-title" className="font-serif text-3xl leading-none">
        {t.codesTitle}
      </h3>
      <p className="mt-3 text-muted">
        {t.codes(holders.length, COLLEAGUES.length)}. {t.codesHint}
      </p>
      <form
        className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (/^\d{4}$/.test(code)) save(code);
        }}
      >
        <label className="eyebrow">
          {t.person}
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="input mt-2 text-base font-normal tracking-normal normal-case"
          >
            <option value="">—</option>
            {COLLEAGUES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {holders.includes(c.id) ? ` (${t.hasCode})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="eyebrow">
          {t.newCode}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            placeholder="0000"
            className="input mt-2 text-base font-normal tracking-[0.3em] placeholder:text-white/20"
          />
        </label>
        <button type="submit" disabled={!person || code.length !== 4} className="btn btn-primary">
          {t.setCode}
        </button>
        <button type="button" onClick={() => save(null)} disabled={!person || !holders.includes(selected)} className="btn btn-ghost">
          {t.clearCode}
        </button>
      </form>
      <p role="status" className="mt-3 text-sm text-gold">
        {message}
      </p>
    </section>
  );
}
