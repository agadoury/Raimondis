# Les Raimondis — 4th Edition

A small nomination site for the team's end-of-year award show. Colleagues pick their name, create a 4-digit code, and recommend teammates for award categories they invent. **Nobody sees anyone else's nominations**; only the admin does, at `/admin`.

Next.js (App Router) · Tailwind CSS · Upstash Redis · English / French.

## Go live on Vercel (about 5 minutes)

There are no settings to type in. The only thing to connect is the database.

1. **Import the repo.** In [Vercel](https://vercel.com/new), choose **Add New → Project**, import this GitHub repository, keep every default and click **Deploy**. The site builds, but nothing can be saved until step 2.
2. **Add the database.** Open the project, go to the **Storage** tab, click **Create Database**, and pick **Upstash → Upstash for Redis**. Choose the **Free** plan and a region near you (for example `us-east-1`), then **connect it to this project** for all environments. Leave the "custom prefix" field empty. This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` to the project for you.
3. **Redeploy** so the new variables are picked up: **Deployments → ⋯ on the latest one → Redeploy**.
4. **Try it.** Open the site, pick your name, choose a code and submit a nomination. Then open `/admin` (password `admin123`) to see it.

Button names in Vercel change now and then; the flow is always: import, deploy, attach Upstash Redis from the Storage tab, redeploy.

### Clear your test data before sharing the link

In Vercel, open **Storage → your database → Open in Upstash**, go to the **Data Browser**, and delete the keys `raimondis:nominations` and `raimondis:codes`. Deleting `raimondis:codes` lets everyone (including you) choose a fresh code.

## Running the event

- **Someone forgot their code**, or found their name already taken: open `/admin`, scroll to the bottom, choose their name and click **Reset code**. They can then pick a new code. Their nominations are kept.
- **Results:** `/admin` shows every nomination grouped by nominee, with filters and an **Export CSV** button.
- **The deadline is shown, not enforced.** The site keeps accepting nominations after the date in the header.
- **Anyone with the link can open the site** and see the list of names. The 4-digit code protects each person's nominations, not the site itself, so share the link with the team only.

## Things you may want to change

| What | Where |
|---|---|
| Deadline shown on the site | `DEADLINE` in `lib/i18n.ts` |
| Any wording, in English or French | `lib/i18n.ts` |
| The list of colleagues | `data/colleagues.json` |
| Admin password | `ADMIN_PASSWORD` in `lib/config.ts` |
| Nominations allowed per person per hour (60) | `RATE_LIMIT_PER_HOUR` in `lib/config.ts` |
| Colours and fonts | `app/globals.css` and `app/layout.tsx` |

## Run it locally

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000. With no environment variables set, everything is kept in memory (and vanishes when you stop the server), so you can try the whole site without a database.

To use the real database locally, copy `.env.example` to `.env.local` and paste the two values from Vercel under **Storage → your database**.

## How it works

```
data/colleagues.json   the team
lib/shared.ts          sorting, accent-free search, initials (used by server and browser)
lib/i18n.ts            every UI string, EN + FR, and the deadline
lib/config.ts          server-only settings (admin password, rate limits)
lib/auth.ts            cookies: who is signed in, admin
lib/store.ts           the only file that talks to Redis
app/actions.ts         the only way to write: sign in, submit, delete, admin login, reset a code
app/page.tsx           "Who are you?" → nomination board
app/PickVoter.tsx      landing page: explanations, name list, 4-digit code
app/admin/             results table, code reset and CSV export
```

**Data.** Redis keys:

- `raimondis:nominations`: a hash of nomination id → `{ id, nomineeId, awardName, reason, voterId, voterName, createdAt }`.
- `raimondis:codes`: a hash of colleague id → their 4-digit code, stored hashed (never the code itself).
- `raimondis:limit:…`: counters that expire after an hour, for the rate limits (60 nominations per person, 10 sign-in attempts per name).

**Signing in.** The first time someone picks a name, the code they type is saved for that name. After that, the same code is required for that name, on any device. A signed, httpOnly cookie keeps them signed in for 90 days. The signing secret is the Redis token Vercel already holds, so there is nothing extra to configure.

**No spoilers, by construction.**

- The only nominations a voter is ever sent are the ones written under their own name, loaded on the server after checking their signed cookie.
- All nominations are loaded in exactly two places, `/admin` and `/admin/export`, and both check the admin cookie first.
- The voter's identity comes from their cookie, never from the request, so nobody can submit or delete as someone else.
- `lib/config.ts`, `lib/auth.ts` and `lib/store.ts` import `server-only`, so the build fails if browser code ever imports them. The admin password is never in the JavaScript sent to browsers.

**Good to know.**

- A 4-digit code is light protection, suited to a fun internal vote. Guessing is limited to 10 tries per name per hour.
- The CSV uses commas, UTF-8 with a BOM, and Montréal time. If Excel shows everything in one column (this happens with French regional settings), use **Data → From Text/CSV** instead of double-clicking the file.

See [TESTING.md](TESTING.md) for the manual test checklist.
