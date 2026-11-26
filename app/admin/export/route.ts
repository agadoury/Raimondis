import { cookies } from "next/headers";
import { isAdmin } from "@/lib/auth";
import { dict, LANG_COOKIE } from "@/lib/i18n";
import { COLLEAGUES, findColleague } from "@/lib/shared";
import { listAllNominations } from "@/lib/store";

// Excel-friendly CSV: UTF-8 with BOM (so accents display correctly), CRLF line endings.
export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });

  const lang = (await cookies()).get(LANG_COOKIE)?.value === "fr" ? "fr" : "en";
  const order = new Map(COLLEAGUES.map((c, i) => [c.id, i]));
  const rank = (id: string) => order.get(id) ?? COLLEAGUES.length;
  const nominations = (await listAllNominations()).sort(
    (a, b) => rank(a.nomineeId) - rank(b.nomineeId) || a.createdAt.localeCompare(b.createdAt),
  );

  // "2026-12-01 14:32:05" in Montréal time, which Excel reads as a date.
  const time = new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Toronto" });
  const rows = [
    dict[lang].csvHeaders,
    ...nominations.map((n) => [
      findColleague(n.nomineeId)?.name ?? n.nomineeId,
      n.awardName,
      n.reason,
      n.voterName,
      time.format(new Date(n.createdAt)),
    ]),
  ];
  const csv = "﻿" + rows.map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="raimondis-nominations.csv"',
      "Cache-Control": "no-store",
    },
  });
}

function cell(value: string) {
  // A leading = + - @ would make Excel run the text as a formula; prefix it with an apostrophe.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
