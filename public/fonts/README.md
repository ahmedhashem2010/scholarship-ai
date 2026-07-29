# Fonts

Two self-hosted Arabic faces, used for different jobs. Drop the files in this
folder and they activate. **If a file is missing nothing breaks** — the CSS
falls through to the next family in the stack.

---

## ⭐ Nitro — headlines. Start here.

**This is the one to use.** Geometric, squared, high-impact Arabic — and unlike
Zafran and RB it has a clean commercial licence.

**Download the Fontesk release specifically:** https://fontesk.com/nitro-arabic-font/

- Foundry: MTtype Foundry
- Licence: **free for commercial use**, stated explicitly by the publisher
- Covers Arabic, Kurdish and Persian
- Ships Regular, Dash and Reverse styles

```
public/fonts/Nitro-Regular.ttf   (or .woff2)
public/fonts/Nitro-Bold.ttf      (or .woff2)
```

The `@font-face` also accepts `MTNitro-Regular.ttf` / `MTNitro-Bold.ttf` if your
download uses those filenames.

### Nitro vs "MT Nitro Display"

Same foundry, and they look alike. The difference is paperwork:

| | Licence |
|---|---|
| **Nitro Arabic** (fontesk.com) | ✅ Free for commercial use, stated by publisher |
| MT Nitro Display (alfont / arbfonts) | ❓ No terms stated |

Take the Fontesk one. You're building something that takes payments.

---

## Zafran — alternative display face

Fallback behind Nitro in the `.font-display` stack.

```
public/fonts/Zafran-Regular.ttf   (or .woff2)
public/fonts/Zafran-Bold.ttf      (or .woff2)
```

### ⚠️ Read this before shipping it

**Zafran is a commercial font.** It's by Abdo Mohamed, published by Boharat
Cairo, and sold on MyFonts:

- Publisher: https://boharat.com/zafran/
- Licence: https://www.myfonts.com/collections/zafran-arabic-font-boharat-cairo

The "free download" copies on fontsempire / arfonts are almost certainly
unlicensed redistributions. Using one on a site that takes payments is a real
exposure — font foundries do pursue this, and web embedding is a separate
licence from desktop use.

**Buy the webfont licence, or pick a different display face.** It's usually a
modest one-off cost, and it's the sort of thing that's much cheaper to sort out
now than after launch.

### Why headlines only

Boharat describe Zafran as *"an elegant industrial display typeface... designed
for use in headlines and posters."* Display faces have tight spacing and high
stroke contrast — characterful at 48px, unreadable at 14px. It is deliberately
**not** applied to body text, buttons, labels, or form fields.

That split is also just good typography: a distinctive display face over a
neutral UI face is what makes a product look designed rather than templated.

---

## RB — optional Arabic UI face

Free Arabic TrueType face. Sits between Zafran and the fallback.

```
public/fonts/RB-Regular.ttf
public/fonts/RB-Bold.ttf
```

Download: https://arabicfonts.net/fonts/rb-regular · https://arabicfonts.net/fonts/rb-bold

Same licence caveat, more mildly: these aggregator sites list fonts as "free
download" without always naming the foundry or the terms. Worth a check.

Only two weights ship, so 500/600 map to Regular and 700+ to Bold.
`font-synthesis-weight: none` is set — faux-bolding Arabic distorts letterforms
and breaks the joins between characters.

---

## The stack, in order

| Job | Order |
|---|---|
| Headlines (`.font-display`) | **Nitro** → Zafran → RB → IBM Plex Sans Arabic → Plus Jakarta |
| Arabic body/UI | RB → IBM Plex Sans Arabic → system |
| Latin body/UI | Plus Jakarta Sans → system |

Drop in whichever display font you land on — the stack picks up the first one
that's actually present, so you can try Nitro, Zafran and RB by just adding and
removing files. No code changes.

RB is `unicode-range` scoped to Arabic, so Latin glyphs skip it and land on
Plus Jakarta Sans. A mixed string like `"منحة DAAD"` gets the right face for
each script instead of forcing Latin through an Arabic font.

---

## Convert to WOFF2 before launch

A `.ttf` is typically 3–5× larger than the same font as `.woff2`, and every
visitor downloads it. Use https://cloudconvert.com/ttf-to-woff2 and drop the
`.woff2` files in here — the CSS already prefers woff2 and falls back to ttf
automatically, so there's no code change.

---

## Commercial-safe alternatives

If the licensing doesn't clear, these are all SIL Open Font Licence, free for
commercial use, and available on Google Fonts — each is a one-line swap:

| Font | Character |
|---|---|
| **Readex Pro** | Modern, geometric, good display presence |
| **Cairo** | Very familiar in MENA, friendly |
| **Almarai** | Clean, neutral, excellent at small sizes |
| **IBM Plex Sans Arabic** | Already the fallback. Professional, wide weight range |
| **Noto Kufi Arabic** | Strong display option with Kufi character |
