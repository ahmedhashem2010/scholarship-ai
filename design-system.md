# Scholarship Hub — Design System

**Status:** authoritative. If this doc and the code disagree, fix one of them
immediately. This file previously described a blue palette while the app had
been teal for four commits — that drift is how UIs become inconsistent.

---

## Colours

Defined as CSS variables in `src/app/globals.css`, exposed to Tailwind in
`tailwind.config.ts`. **Never hardcode a hex value in a component.**

| Token | Light | Dark | Use |
|---|---|---|---|
| `primary` | `#0D9488` teal-600 | `#2DD4BF` teal-400 | Actions, links, focus |
| `background` | `#F4FDF9` | `#0F1714` | Page background |
| `foreground` | `#1A3A30` | `#DCE6E1` | Body text |
| `card` | `#FFFFFF` | `#16201C` | Surfaces |
| `muted-foreground` | `#6B8F82` | `#82A096` | Secondary text |
| `border` | `#D1DDD9` | `#283730` | Dividers |
| `success` | `#16A34A` | `#4ADE80` | Complete, eligible |
| `warning` | `#F59E0B` | `#FBBF24` | Deadline soon, unverified |
| `destructive` | `#DC2626` | `#F87171` | Errors, ineligible |

**One accent colour.** Teal is the only brand colour. Green/amber/red are
*semantic* — they mean something specific. If a colour isn't communicating
state, it should be teal, foreground, or muted.

### Use in code

```tsx
// ✅
<div className="bg-card text-foreground border-border">
<Button className="bg-primary text-primary-foreground">

// ❌ breaks dark mode
<div className="bg-white text-gray-900 border-gray-200">
```

---

## Typography

| Role | Font | Notes |
|---|---|---|
| Headings (Latin) | Poppins | weights 500/600/700 only |
| Body (Latin) | Inter | |
| Arabic (all) | Tajawal | weights 400/500/700 |

Arabic runs slightly larger than Latin at the same nominal scale — Arabic
letterforms have less x-height contrast and need the room.

### Scale — use these, don't invent sizes

| Token | Size | Use |
|---|---|---|
| `text-4xl` → `text-5xl` | 36–48px | Hero headline only |
| `text-2xl` → `text-3xl` | 24–30px | Section headings |
| `text-lg` | 18px | Card titles, lead paragraphs |
| `text-base` | 16px | Body — **minimum for anything a user reads** |
| `text-sm` | 14px | Secondary, metadata |
| `text-xs` | 12px | Labels, badges. Never for sentences |

---

## Spacing

4px base. Use `gap-*` and `space-y-*`, not margins on children.

| Context | Value |
|---|---|
| Inside a card | `p-5` mobile, `p-6` desktop |
| Between cards | `gap-4` mobile, `gap-6` desktop |
| Between sections | `py-12` mobile, `py-20` desktop |
| Page gutter | `px-4 sm:px-6 lg:px-8` |
| Max content width | `max-w-6xl` general, `max-w-2xl` prose |

**Most "bad UI" is cramped spacing and inconsistent radii, not bad colours.**
When something looks wrong, add space before you change anything else.

---

## Components

- **Radius:** `rounded-xl` (12px) cards and inputs, `rounded-lg` buttons,
  `rounded-full` pills and avatars. Driven by `--radius`.
- **Inputs:** min height 44px — the accessible touch target, and most of this
  audience is on a phone.
- **Buttons:** one primary action per screen region. Everything else is
  `outline` or `ghost`.
- **Shadows:** `shadow-sm` at rest, `shadow-md` on hover for interactive cards.
  No shadow on flat surfaces.
- **Loading:** always a skeleton matching the real layout, never a bare spinner
  on a blank page.
- **Empty states:** every one needs a one-line explanation and a CTA. A blank
  panel is a bug.

---

## RTL — Arabic is the default

The app renders `dir="rtl"` by default. This is not an afterthought.

**Use logical properties, never physical ones:**

| ❌ Breaks in RTL | ✅ Works both ways |
|---|---|
| `ml-4` / `mr-4` | `ms-4` / `me-4` |
| `pl-6` / `pr-6` | `ps-6` / `pe-6` |
| `left-0` / `right-0` | `start-0` / `end-0` |
| `text-left` | `text-start` |
| `rounded-l-lg` | `rounded-s-lg` |

**Do not flip:** phone numbers, email addresses, URLs, code, or Latin brand
names. Wrap those in `dir="ltr"`.

**Icons that imply direction** (arrows, chevrons) must mirror in RTL. Icons that
don't (search, calendar, upload) must not.

---

## Dark mode

Every screen must work in both. The recurring failure is a hardcoded
`bg-white` or `text-gray-900` slipped in during a rush.

Before shipping a screen, grep it:

```bash
grep -nE "bg-white|text-black|text-gray-[0-9]|bg-gray-[0-9]" <file>
```

Any hit is a bug unless paired with a `dark:` variant.

---

## Principles

1. **Answer "what do I do next?" above the fold.** Not stats. An action.
2. **Honest states.** If data is missing, say "not listed" — never imply we know
   something we don't. Users forgive gaps; they don't forgive being misled.
3. **Mobile is the primary target.** Design at 375px first.
4. **One primary action per view.** If everything is emphasised, nothing is.
5. **Real content in every state** — loading, empty, error, and full.
6. **Arabic first.** If a phrase reads awkwardly in Arabic, rewrite it, even if
   the English was fine.
