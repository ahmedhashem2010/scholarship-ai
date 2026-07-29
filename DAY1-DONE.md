# Day 1 — Completed Work

**Date:** _____ · **Theme:** Stop the bleeding — security, secrets, and the money path

Nothing new was built today. The goal was to make what already exists safe and
coherent. Every change below is in the working tree, not yet committed.

---

## ✅ What I changed

### 1. Removed every secret from tracked files

| File | What was in it | Now |
|------|----------------|-----|
| `src/lib/ai-review.ts` | Live BazaarLink key `sk-bl-iecc…` hardcoded on line 2 | Reads `BAZAARLINK_API_KEY`; skips the provider entirely when unset |
| `AGENTS.md` | Live Resend key, Supabase **service-role** key, anon key | Replaced with env var names + a "never paste secrets here" warning |
| `scripts/create-test-accounts.mjs` | Supabase URL + anon + service-role keys | Reads from `.env`, exits with a clear message if unset |
| `scripts/recreate-test-accounts.mjs` | Same | Same |
| `scripts/test-agentrouter.mjs` | AgentRouter key as a fallback literal | Reads from `.env`, exits if unset |

I scanned **all tracked files** for key-shaped strings afterwards. Result: clean.

I also turned off verbose AI logging by default (`AI_DEBUG=false`). It was
printing 500 characters of every provider response to the console — which can
include fragments of a user's uploaded CV or personal statement. That's user
data in production logs, and it shouldn't be on by default.

### 2. Hardened authentication

**`src/middleware.ts`**

- `getSession()` → `getUser()`. `getSession` only decodes the cookie, which the
  client controls; `getUser` revalidates the JWT against Supabase's auth server.
  The old code was making authorization decisions on unverified input.
- Added `/admin/:path*` to the matcher — the admin **page** was previously
  unprotected (only the API route checked).
- Added an `ADMIN_EMAIL` check for admin routes.
- Login redirects now carry `?redirectTo=`, so users land where they intended.
- `/auth/callback` is now explicitly excluded, so OAuth can't be caught by the
  redirect rule that bounces logged-in users off `/auth/*`.

**`src/app/admin/layout.tsx`** (new)

Server-side re-check of auth + `ADMIN_EMAIL` for everything under `/admin`.
Middleware already covers this; this is defence in depth so a future route or a
matcher typo can't silently expose the admin surface. Fails closed — if
`ADMIN_EMAIL` is unset, nobody is an admin.

### 3. Fixed the pricing contradiction

**`src/lib/pricing.ts`** (new) is now the only place a price may be written.

Before, three files disagreed:

| Source | What it claimed |
|--------|-----------------|
| `dashboard/credits/page.tsx` | $3/review · **$15/mo Pro** · Enterprise "Custom" |
| `pricing/page.tsx` | 1/3/5 reviews at $3/$8/$12 |
| `api/checkout/route.ts` | 1/3/5 reviews at $3/$8/$12 |

The $15/mo Pro tier and the Enterprise tier **could not be bought** — no
checkout code existed for them. They're now deleted.

The canonical packages:

| Package | Credits | Price | Per review |
|---------|---------|-------|-----------|
| Single Review | 1 | $3 | $3.00 |
| **Application Pack** (popular) | 3 | $8 | $2.67 · saves 11% |
| Full Season | 5 | $12 | $2.40 · saves 20% |

Also added: Arabic names for every package, EGP display alongside USD, and
per-review unit pricing.

**I removed false claims from the pricing page.** It advertised "24hr delivery",
"12hr delivery", "6hr delivery", and "Unlimited revisions". Reviews are
generated in seconds, and "unlimited revisions" directly contradicts a credit
system. Those would have caused refund requests. The feature lists are now
things the product actually does.

### 4. Fixed the payment dead ends

- **`src/lib/contact.ts`** (new) — WhatsApp, Vodafone Cash and InstaPay details
  now come from env. `isWhatsAppConfigured()` rejects short numbers, all-same-digit
  numbers, and the old `201000000000` placeholder specifically, so a
  misconfiguration hides the button instead of opening a broken chat.
- `pricing/page.tsx` had **three** placeholder contact values: the WhatsApp
  number `201000000000`, Vodafone Cash `0100 000 0000`, and InstaPay
  `@ScholarshipAI`. All now read from env with honest fallback text.
- `dashboard/credits/page.tsx` — **rebuilt**. Both buttons previously said
  "Coming Soon" and linked to `/pricing`. It now shows your live credit balance,
  real buy buttons wired to checkout, manual-payment fallback, loading states,
  error handling, and a success message when Stripe redirects back.
- Card checkout now uses `window.location.href` for the Stripe redirect —
  `router.push()` cannot navigate off-origin, so **the old code could not have
  reached Stripe's checkout page even with keys configured.**
- Checkout prices are resolved server-side from `pricing.ts`. A tampered request
  can't buy 100 credits for $3.
- Stripe redirect URLs use `NEXT_PUBLIC_SITE_URL` instead of `nextUrl.origin`,
  which resolves to the internal host behind Vercel's proxy and produces 404s.
- A missing Stripe key now returns a `cardPaymentsUnavailable` flag and a
  human-readable message pointing at local payment methods, rather than a bare 503.

### 5. Fixed email — the biggest blocker

**Signup was sending no email at all.** `AGENTS.md` documented a welcome email;
`welcomeHtml` existed in `src/lib/email-templates.ts`; `sendEmail` existed in
`src/lib/email.ts`. Nothing called either of them. New users signed up and heard
nothing.

- `src/app/api/auth/signup/route.ts` now sends the welcome email, using
  `NEXT_PUBLIC_SITE_URL` for the login link. Added email format validation.
- `src/lib/email.ts` — the from-address moved to `RESEND_FROM_EMAIL`.
  `sendEmail` no longer throws; it returns `{ sent, reason }`, so a bounced
  welcome email can't fail account creation.
- It logs a loud warning whenever it's sending from the sandbox address, because
  that silently drops mail to everyone except you.
- Added `isEmailProductionReady()` for a pre-launch check.

### 6. Documented the environment

`.env.example` rewritten from 27 lines to a full reference — every variable the
app reads, marked `[REQUIRED]` where it matters, with notes on the failure mode
when it's missing.

Your `.env` was missing `ADMIN_EMAIL` entirely, which means **admin routes were
returning 500 for everyone** — the API checks for it and errors out when unset.
I appended the missing vars with placeholders. A backup of your original is at
`.env.backup-day1`.

---

### 7. Tightened `.gitignore`

`.env.*` is now ignored as a glob (with `!.env.example` re-included). Backup
files made during migrations are a classic way secrets re-enter a repo — and I
created exactly such a file today (`.env.backup-day1`, which holds your old
keys). Verified it is ignored.

---

## ⚠️ One thing I could NOT verify

**I did not get a clean `tsc --noEmit` run.** Not because of errors — because the
sandbox I work in mounts your drive over a network filesystem, and TypeScript
never finished resolving types against `node_modules` (I gave it ~20 minutes
across several attempts). This is an environment limitation, not a code signal.
**On your machine it should take under a minute.**

So before anything else:

```bash
npx tsc --noEmit
npm run build
```

I did manually review every change against your strict compiler settings
(`strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`)
and pre-emptively fixed three things that would have failed:

- `CREDIT_PACKAGES` had `as const`, which makes `features` a `readonly` tuple —
  not assignable to `string[]`. Removed.
- `Object.fromEntries` would have widened the lookup to
  `Record<string, string | CreditPackage>`. Added an explicit tuple return type.
- `React.ReactNode` in the admin layout without a React import. Switched to
  `import type { ReactNode }`.

I also grep-verified: no references remain to the deleted `packages` array,
`pkg.badge`, `pkg.icon`, or `PRICE_LOOKUP`; no hardcoded prices outside
`pricing.ts`; no "Coming Soon" strings; no placeholder phone numbers.

If `tsc` does surface something, send me the output and I'll fix it immediately.

---

## 🔴 YOUR TURN — I can't do these

These need your accounts and your decisions. **Do them before Day 2.**

### Critical — do today

- [ ] **Rotate the BazaarLink key.** The old one (`sk-bl-iecc…`) is in git
      history. Generate a new one, paste into `.env` as `BAZAARLINK_API_KEY`.
      *If you don't use BazaarLink any more, leave it blank — the code now skips
      it cleanly and falls through to AgentRouter.*
- [ ] **Rotate the Resend API key.** resend.com → API Keys → revoke old, create new.
- [ ] **Rotate the Supabase service-role key.** Supabase dashboard (project
      `kkqhvlizcbxikypsaxff`) → Settings → API → Reset. This one matters most:
      the old key grants full admin access to your auth project and it has been
      sitting in a committed markdown file.
- [ ] **Rotate the AgentRouter key** — it was in `scripts/test-agentrouter.mjs`.
- [ ] **Buy the domain.** ~$1–12. Buy it from Cloudflare if you can — instant DNS,
      which matters for the next step.
- [ ] **Verify the domain in Resend** (resend.com/domains → add domain → add the
      SPF/DKIM/DMARC records at your registrar). Then set in `.env`:
      `RESEND_FROM_EMAIL="Scholarship Hub <noreply@yourdomain.com>"`.
      **Do this first thing — DNS propagation can take hours and everything
      about signup depends on it.**
- [ ] **Set `NEXT_PUBLIC_WHATSAPP_NUMBER`** to your real number, digits only,
      country code first (e.g. `201012345678`). Until you do, the manual payment
      button is hidden — which is correct, but it means nobody can pay you.
- [ ] **Set `NEXT_PUBLIC_VODAFONE_CASH_NUMBER`** and `NEXT_PUBLIC_INSTAPAY_HANDLE`.
- [ ] **Confirm `ADMIN_EMAIL`.** I set it to `ahmedprogrammer2010@gmail.com`.
      Note `.env.example` previously suggested `ahmed_m_hashem@outlook.com` —
      it must match the email you actually log in with, or you lock yourself out
      of `/admin`.

### Then verify

- [ ] Send a test signup using an email that is **not** yours. If the welcome
      email arrives, the single biggest launch blocker is gone.
- [ ] Log out, then try `/dashboard`, `/onboarding`, `/admin/payments` — all
      three should redirect to login.
- [ ] Log in as a non-admin and hit `/admin/payments` — should redirect to dashboard.

### Decisions I need from you

1. **Is $3 / $8 / $12 right?** In EGP that's roughly 144 / 384 / 576. For an
   Egyptian student that is real money. Options: keep it and target Gulf +
   diaspora students who can pay; or lower it and win on volume. I'd suggest
   keeping it for launch — you can always discount, but raising prices later is
   painful.
2. **Did Stripe accept your account?** If not, say so and I'll build the manual
   payment flow as the primary path on Day 2 rather than the fallback.

---

## 📋 Not done today (moved to Day 2)

- Git history purge. The keys are in past commits. Once you've rotated all four,
  the exposure is neutralised and rewriting history is optional. Say the word if
  you want it done properly with `git filter-repo`.
- `AGENTS.md` still documents a signup flow that didn't match the code. I fixed
  the code; the doc needs a pass.
- The scholarship data cleanup (80 null deadlines) — that's Day 2, Block 1.

---

## Files changed

```
NEW      src/lib/pricing.ts               single source of truth for prices
NEW      src/lib/contact.ts               WhatsApp / manual payment config
NEW      src/app/admin/layout.tsx         server-side admin guard
NEW      .env.backup-day1                 your original .env, untouched

EDIT     src/lib/ai-review.ts             key → env, logging gated
EDIT     src/lib/email.ts                 sender → env, non-throwing
EDIT     src/middleware.ts                getUser, admin guard, redirectTo
EDIT     src/app/api/auth/signup/route.ts now actually sends the welcome email
EDIT     src/app/api/checkout/route.ts    server-side pricing, better errors
EDIT     src/app/pricing/page.tsx         shared pricing, real contact details
EDIT     src/app/dashboard/credits/page.tsx  rebuilt — no more "Coming Soon"
EDIT     scripts/create-test-accounts.mjs    secrets → env
EDIT     scripts/recreate-test-accounts.mjs  secrets → env
EDIT     scripts/test-agentrouter.mjs        secrets → env
EDIT     AGENTS.md                        secrets removed
EDIT     .env.example                     full reference
EDIT     .env                             missing vars appended
```

---

## Bugs found today that weren't in the original plan

Worth noting — the audit underestimated the damage:

1. **Signup sent no email whatsoever.** The plan assumed sandbox mode was the
   problem. The real problem was that the send call didn't exist.
2. **Card checkout used `router.push()` for an external Stripe URL.** Next.js
   router can't navigate off-origin, so card payment would have failed even with
   valid Stripe keys.
3. **`ADMIN_EMAIL` was never set in `.env`**, so `/api/admin/*` returned 500 to
   everyone, including you.
4. **Three more files had committed secrets** beyond the two the audit found.
5. **The pricing page advertised delivery times and unlimited revisions** that
   the product cannot deliver.
