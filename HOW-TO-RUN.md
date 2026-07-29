# How to run everything

Plain steps. Run them **in this order** — later ones depend on earlier ones.

---

## Opening a terminal in the right place

1. Open **File Explorer** and go to `E:\scholarship-project`
2. Click the address bar at the top, type `powershell`, press **Enter**

A blue/black window opens, already pointed at your project. Check it says
`E:\scholarship-project` at the prompt.

> You can also use VS Code: open the folder, then **Terminal → New Terminal**.

Sanity check — this should print a version number like `v20.x` or `v22.x`:

```powershell
node -v
```

If it says "not recognized", install Node from https://nodejs.org (LTS version),
close the terminal, open a new one, and try again.

---

## STEP 1 — Regenerate the database client ⚠️ do this first

I added new fields to the database schema. Until you run this, **everything else
will fail** and your editor will show red errors on the new fields.

```powershell
npx prisma generate
```

Then apply the changes to your actual database:

```powershell
npx prisma db push
```

You should see `Your database is now in sync with your Prisma schema.`

<details>
<summary>If <code>db push</code> hangs after "Datasource db: PostgreSQL database…"</summary>

**This is already fixed** — but here's what it was, in case it comes back.

Supabase gives you two connection ports:

| Port | Mode | Good for |
|------|------|----------|
| 6543 | transaction pooler (pgbouncer) | your app's normal queries |
| 5432 | session pooler | schema changes |

`db push` runs `ALTER TABLE` and `CREATE INDEX`, which the transaction pooler
**cannot** execute. So Prisma connects, sends the command, and waits forever —
no error, no timeout, just a blinking cursor.

The fix (already applied): `prisma/schema.prisma` now has a `directUrl`, and
your `.env` has a `DIRECT_URL` on port 5432 with `pgbouncer=true` removed.

If you ever recreate `.env`, both lines are required:

```
DATABASE_URL="…pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=no-verify"
DIRECT_URL="…pooler.supabase.com:5432/postgres?sslmode=no-verify"
```

Same username and password in both — **only the port and query string differ.**

Remember to add `DIRECT_URL` to your Vercel environment variables too.
</details>

<details>
<summary>If it asks "Do you want to continue? All data will be lost"</summary>

**Say no (N).** None of my changes require dropping data — every new field is
optional or has a default. If Prisma wants to reset the database, something's
wrong; stop and send me the exact message.
</details>

---

## STEP 2 — See how bad the data is

```powershell
node scripts/audit-scholarships.mjs
```

Prints a report: how many scholarships are missing deadlines, eligibility data,
etc. **Nothing is changed** — this is read-only.

It also writes `scholarship-verification-worklist.csv`, which you can open in
Excel later.

---

## STEP 3 — Re-scrape for9a ⭐ the big one

This recovers the eligibility data your original scraper skipped.

### 3a. Test on 5 records first

```powershell
node scripts/rescrape-for9a.mjs --fetch --limit 5
node scripts/rescrape-for9a.mjs --parse --limit 5
```

The second command prints a **preview**. You should see things like:

```
Fields recovered:
   eligibleCountries      5
   eligibleEducation      4
   minimumAge             2
   benefits               5

Sample (first 3):
   Aberdeen Global Scholarship for Postgraduate Students…
      eligibleCountries: [Algeria, Egypt, Libya, Morocco, Sudan, Tunisia, …]
      eligibleEducation: [MASTER]
      minimumAge: 18
      deadlineType: ONGOING
```

**Look at it before continuing.** If the countries and degree levels look
sensible, carry on. If it looks like nonsense, stop and send me the output.

### 3b. Fetch all of them

```powershell
node scripts/rescrape-for9a.mjs --fetch
```

Takes about **5 minutes** — it waits 1.5 seconds between pages to avoid
hammering for9a's servers. Leave it running. You'll see `…fetched 10`,
`…fetched 20` and so on.

Pages are saved in `.scrape-cache/`, so **you only ever need to do this once.**

### 3c. Preview the full result

```powershell
node scripts/rescrape-for9a.mjs --parse
```

Still no changes to your database. Read the numbers.

### 3d. Write it in

```powershell
node scripts/rescrape-for9a.mjs --parse --apply
```

**This is the one that changes your database.** It only fills fields that are
currently empty — your 39 hand-written scholarships are untouched.

---

## STEP 4 — Fill the remaining gaps by inference

Run this **after** the re-scraper, never before.

```powershell
node scripts/enrich-scholarships.mjs
```

Preview only. If it looks right:

```powershell
node scripts/enrich-scholarships.mjs --apply
```

---

## STEP 5 — Hide expired scholarships

```powershell
node scripts/audit-scholarships.mjs --fix
```

Marks anything past its deadline as inactive so students never see it. Nothing
is deleted — it's reversible.

---

## STEP 6 — Check the result

```powershell
node scripts/audit-scholarships.mjs
```

Compare against Step 2. "No eligible countries" should have dropped from ~195 to
a much smaller number, and completeness should be far higher.

---

## STEP 7 — Make sure the app still builds

```powershell
npx tsc --noEmit
npm run build
```

`tsc --noEmit` should print nothing at all — that means zero errors.

**If you see errors, copy the whole output and send it to me.** I couldn't run
this myself; my sandbox can't finish a typecheck over the network drive.

---

## STEP 8 — Run the app

```powershell
npm run dev
```

Open http://localhost:3000

---

# Quick reference

| Command | What it does | Changes DB? |
|---|---|---|
| `npx prisma generate` | Regenerate DB client after schema changes | no |
| `npx prisma db push` | Apply schema to database | **yes** |
| `node scripts/audit-scholarships.mjs` | Data quality report + CSV | no |
| `node scripts/audit-scholarships.mjs --fix` | Hide expired scholarships | **yes** |
| `node scripts/rescrape-for9a.mjs --fetch` | Download pages to cache | no |
| `node scripts/rescrape-for9a.mjs --parse` | Preview what was found | no |
| `node scripts/rescrape-for9a.mjs --parse --apply` | Save recovered data | **yes** |
| `node scripts/enrich-scholarships.mjs` | Preview inferred fields | no |
| `node scripts/enrich-scholarships.mjs --apply` | Save inferred fields | **yes** |
| `npx tsc --noEmit` | Check for code errors | no |
| `npm run dev` | Start the app locally | no |

**Rule of thumb: nothing writes to your database unless you type `--apply`,
`--fix`, or `db push`.** Everything else is safe to run and re-run.

---

# If something goes wrong

**`Cannot find module '@prisma/client'`**
→ `npm install`, then `npx prisma generate`

**`Unknown argument 'isActive'` or similar**
→ You skipped Step 1. Run `npx prisma generate`.

**`Missing required environment variable: DATABASE_URL`**
→ Your `.env` file is missing or that line is blank. Compare with `.env.example`.

**`node` is not recognized**
→ Node isn't installed or isn't on your PATH. Install the LTS from nodejs.org,
then open a *new* terminal.

**The script hangs on `--fetch`**
→ Normal. It waits 1.5s per page; 195 pages ≈ 5 minutes. If it's truly stuck,
press `Ctrl+C` and re-run — already-downloaded pages are cached and skipped.

**I want to start the scrape over**
→ Delete the `.scrape-cache` folder and run `--fetch` again.

**Anything else**
→ Copy the full error text and send it to me.
