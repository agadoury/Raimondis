# Manual test checklist

Run through this once on the live site before sharing the link. It takes about ten minutes. Use two browsers (or one normal window and one private window) so you can act as two different voters, and have a phone handy.

## 1. Voter flow

- [ ] On a first visit (use a private window), the intro popup opens and plays through its five screens by itself. **Skip**, **Back**, **Next** and the final **Pick your name** button all work, and it does not open again on reload. **Watch the intro** replays it.
- [ ] Behind the popup, the site opens straight on the landing page: the title, the deadline (Friday, Dec 4), then "Step 1 of 2 — Who are you?" with 32 names in alphabetical order by first name. No password is asked.
- [ ] Typing `eloise` shows both Éloïse Turgeon and Eloïse Provost-Carrière; `francois` shows François-Xavier Groulx.
- [ ] Picking a name asks for a 4-digit code. Fewer than 4 digits shows an error; letters can't be typed.
- [ ] After choosing a code, the grid shows 31 cards and yours is missing. The progress line reads "You've nominated 0 of 31 colleagues".
- [ ] Initials look right: **FG** for François-Xavier Groulx, **LD** for Laurent Desrosiers Derome.
- [ ] Click a card. Type an award name, press **Enter** (the cursor moves to the reason), type a reason, press **Enter** again. The panel closes, confetti appears, the card gets a gold check, the progress goes to 1, and the next colleague's card is focused.
- [ ] Press **Enter** straight away: the next colleague's panel opens. **Esc** closes it.
- [ ] Vote for the same colleague a second time. The panel lists what you already gave, and the card then shows **×2**.
- [ ] Submitting with an empty field shows an error and nothing is saved.
- [ ] "Your nominations" at the bottom lists what you submitted. **Delete → Confirm?** removes one, and the card's check and the progress update.
- [ ] Reload the page: you are still signed in, with the same checks and progress.
- [ ] Reaching 8, 16 and 31 colleagues shows the 25%, 50% and 100% messages.
- [ ] The **FR / EN** button switches every label, and the choice survives a reload.

## 2. Being remembered

- [ ] On a second device (or a private window), pick the same name and type the same code: your nominations, gold checks and progress are all there.
- [ ] Pick the same name with a wrong code: you get an error and are not let in.
- [ ] "Not you?" returns to the landing page.
- [ ] In the admin page under **Login codes**, set a new code for your name. The old code is refused, the new one works, and your nominations are still there.
- [ ] **Clear code** for your name. You can then sign in with any new code, and your nominations are still there.

## 3. No spoilers

- [ ] As voter A, submit a nomination with a distinctive award name (say `ZEBRA TEST`). As voter B in the other browser, look everywhere, including the card for the same colleague: `ZEBRA TEST` appears nowhere.
- [ ] As voter B, open the browser's developer tools → **Network**, reload the page, and search all responses for `ZEBRA`: no matches.
- [ ] Still in the Network tab, submit a nomination and open the response of the request it sends: it contains only the nomination you just wrote.
- [ ] Without being signed in as admin, open `/admin`: you only get the password form. Open `/admin/export`: you get "Unauthorized".
- [ ] In the developer tools → **Sources**, search all files for `admin123`: no matches.
- [ ] These are the only addresses the site answers on: `/`, `/admin` and `/admin/export`. There is no `/api` route.

## 4. Admin and export

- [ ] The **Admin** link in the footer opens the admin page. It rejects a wrong password and accepts `admin123`.
- [ ] The table is grouped by nominee, with a count on each group, and shows the voter's name on every row.
- [ ] The **Nominee** and **Voter** filters narrow the table. Searching `zebra` (lower case) finds `ZEBRA TEST`.
- [ ] Submit a nomination whose text has accents and punctuation, for example award `Le prix « Élève modèle »` with reason `Parce qu'elle a dit "oui", même à 8 h`, for **Éloïse Turgeon**.
- [ ] Click **Export CSV** and open the file in Excel. Names such as Éloïse, François-Xavier and Régimbald, and the accents and quotes in your test nomination, all display correctly. Columns are nominee, award name, reason, voter, timestamp.
- [ ] **Sign out** returns to the password form, and `/admin/export` is "Unauthorized" again.

## 5. Mobile

- [ ] On a phone, the landing page and the grid fit the screen with no sideways scrolling. The grid shows two cards per row.
- [ ] The code field brings up the number keypad.
- [ ] The progress bar and search box stay pinned at the top while you scroll the grid.
- [ ] Tapping a card opens the panel near the top of the screen, and both fields and the submit button stay reachable with the keyboard open.
- [ ] Submitting works, and the message at the bottom is readable.

## 6. Before you share the link

- [ ] Delete the test data (see "Clear your test data" in the README).
- [ ] The deadline on the landing page is the right date.
