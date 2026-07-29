#!/usr/bin/env node
/**
 * Generates every brand asset from ONE source file.
 *
 *   node scripts/build-brand.mjs
 *
 * Source:  public/brand/logo-source.svg   (the artwork, 1024x1024)
 * Output:  public/brand/*.svg
 *
 * WHY A GENERATOR AND NOT HAND-EDITED FILES
 *
 * The previous identity drifted three times because the favicon, the app icon
 * and the nav logo were separate files that were edited separately. Within a
 * month they had different proportions and nobody noticed. Everything here is
 * derived, so the geometry physically cannot diverge — change the source, run
 * this, done.
 *
 * THE ONE DELIBERATE DIFFERENCE
 *
 * The favicon drops the lane dashes. At 16px each dash is under a pixel wide
 * and they turn the road into grey mud, which reads as a smudge rather than a
 * mark. The road, the two nodes and the gold destination survive; the texture
 * does not. Same geometry, different detail budget — that is a legitimate
 * reason for two files, unlike "someone tweaked one of them".
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BRAND = resolve(ROOT, "public", "brand");
const SOURCE = resolve(BRAND, "logo-source.svg");

const NAVY = "#162C4C";
const GOLD = "#C6A14B";

if (!existsSync(SOURCE)) {
  console.error(`\n  Missing ${SOURCE}`);
  console.error(`  Put the master artwork there first.\n`);
  process.exit(1);
}

const src = readFileSync(SOURCE, "utf8");
const paths = src.match(/<path\b[\s\S]*?\/>/g) ?? [];

if (paths.length < 4) {
  console.error(`\n  Only found ${paths.length} paths — is this the right artwork?\n`);
  process.exit(1);
}

/**
 * Identify the structural paths by their opening coordinate.
 *
 * Brittle-looking, but the alternative is guessing from bounding boxes, which
 * silently picks the wrong shape when the artwork changes. If the source is
 * ever redrawn this throws loudly instead of shipping a broken favicon.
 */
const startsWith = (prefix) => paths.find((p) => p.includes(`d="M${prefix}`));

const ROAD = startsWith("466.906,807.82");   // the navy S, drawn second
const DEST = startsWith("707.623,296.114");  // gold destination node
const NODE_MID = startsWith("505.418,479.539");
const NODE_START = startsWith("312.981,774.524");

// paths[0] is the opaque 1024 white background square.
const BACKGROUND = paths[0];

for (const [name, p] of Object.entries({ ROAD, DEST, NODE_MID, NODE_START })) {
  if (!p) {
    console.error(`\n  Could not locate the "${name}" path in the artwork.`);
    console.error(`  The source has been redrawn — update the coordinates in this script.\n`);
    process.exit(1);
  }
}

// Everything that isn't background or a structural shape is a lane dash.
const structural = new Set([BACKGROUND, ROAD, DEST, NODE_MID, NODE_START]);
const DASHES = paths.filter((p) => !structural.has(p));

/**
 * The road occupies roughly x 277–753, y 196–808 of the 1024 canvas — under
 * half of it. That padding is correct for an app icon, where the OS expects
 * breathing room inside the tile, and badly wrong everywhere else: at 16px it
 * leaves about seven actual pixels of mark and the logo reads as a smudge.
 *
 * So there are two viewBoxes. Icons keep the full canvas; the mark and the
 * favicon crop tight to the artwork.
 */
const FULL = "0 0 1024 1024";
const TIGHT = "185 172 660 660";

const wrap = (body, { size = 1024, label = "SmartScholar", box = TIGHT } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
  `viewBox="${box}" fill="none" role="img" aria-label="${label}">\n` +
  body.map((l) => "  " + l).join("\n") +
  `\n</svg>\n`;

/** Swap a path's fill colour. */
const recolour = (path, colour) =>
  path.replace(/fill="[^"]*"/, `fill="${colour}"`);

const roundedTile = (colour) =>
  `<rect x="0" y="0" width="1024" height="1024" rx="230" fill="${colour}"/>`;

const files = {};

// --- The mark: transparent background, full detail -------------------------
// This is the one components import.
files["logo-mark.svg"] = wrap([ROAD, ...DASHES, NODE_MID, NODE_START, DEST]);

// --- Monochrome: one ink, any background -----------------------------------
//
// A true knockout. The dashes and nodes are cut OUT of the road with a mask
// rather than painted white on top of it — painting white only works on a
// white page, which defeats the point of having a one-colour version. Masked,
// the holes show whatever is behind, so this sits on navy, on gold, on a
// photograph, or on an embroidered shirt.
// Every knocked-out shape becomes a subpath of the road, and fill-rule
// evenodd turns enclosed subpaths into holes. Chosen over an SVG <mask>
// because mask support is patchy — cairosvg dropped the masked group
// entirely, and the same thing happens in older email clients and some
// PDF pipelines. Even-odd is understood by everything.
const dOf = (p) => (p.match(/\bd="([^"]*)"/) || [, ""])[1].trim();

const knockout = [ROAD, ...DASHES, NODE_MID, NODE_START].map(dOf).join(" ");

files["logo-mark-mono.svg"] = wrap([
  // Both the presentation attribute and the style property: some renderers
  // honour only one, and a silent fallback to nonzero fills the holes in and
  // turns the road into a plain fat S.
  `<path d="${knockout}" fill="currentColor" fill-rule="evenodd" ` +
    `clip-rule="evenodd" style="fill-rule:evenodd"/>`,
  recolour(DEST, "currentColor"),
]);

// --- Favicon: dashes removed, nodes enlarged -------------------------------
//
// The lane dashes are the first thing to die at small sizes — each one lands
// under a pixel wide and greys the road into mud. The nodes are re-emitted as
// plain circles, slightly larger than the artwork's, because a node that
// survives is what makes this read as a route rather than a letter.
files["favicon.svg"] = wrap([
  ROAD,
  `<circle cx="334" cy="751" r="42" fill="#FFFFFF"/>`,
  `<circle cx="512" cy="512" r="42" fill="#FFFFFF"/>`,
  `<circle cx="682" cy="262" r="48" fill="${GOLD}"/>`,
]);

// --- App icons: full canvas, the padding is correct here --------------------
files["app-icon.svg"] = wrap(
  [roundedTile("#FFFFFF"), ROAD, ...DASHES, NODE_MID, NODE_START, DEST],
  { box: FULL }
);

files["app-icon-dark.svg"] = wrap(
  [
    roundedTile(NAVY),
    recolour(ROAD, "#FFFFFF"),
    ...DASHES.map((p) => recolour(p, NAVY)),
    recolour(NODE_MID, NAVY),
    recolour(NODE_START, NAVY),
    DEST,
  ],
  { box: FULL }
);

// --- Horizontal lockup -----------------------------------------------------
//
// For slides, exports, letterheads and anywhere you need one file. In the app
// itself do NOT use this — compose the mark and live text, so the wordmark
// picks up the real webfont and stays selectable.
//
// The text here is live SVG text, which means it renders in a fallback face on
// any machine without IBM Plex Sans. That is a deliberate trade: converting it
// to outlines would make it unfixable when the wordmark changes, and this file
// is for contexts where you control the machine.
const LOCK_H = 260;
const MARK_H = 236;                      // mark height = wordmark cap height
const SCALE = MARK_H / 660;              // 660 = TIGHT viewBox extent
const GAP = MARK_H * 0.42;
const TEXT_X = MARK_H + GAP;

files["logo-lockup.svg"] =
  `<svg xmlns="http://www.w3.org/2000/svg" width="1580" height="${LOCK_H}" ` +
  `viewBox="0 0 1580 ${LOCK_H}" fill="none" role="img" aria-label="SmartScholar">\n` +
  `  <g transform="translate(0,12) scale(${SCALE.toFixed(5)}) translate(-185,-172)">\n` +
  [ROAD, ...DASHES, NODE_MID, NODE_START, DEST].map((l) => "    " + l).join("\n") +
  `\n  </g>\n` +
  `  <text x="${TEXT_X.toFixed(0)}" y="176" ` +
  `font-family="'IBM Plex Sans','Segoe UI',system-ui,sans-serif" ` +
  `font-size="150" font-weight="600" letter-spacing="-3" fill="${NAVY}">SmartScholar</text>\n` +
  `</svg>\n`;

let written = 0;
for (const [name, content] of Object.entries(files)) {
  writeFileSync(resolve(BRAND, name), content, "utf8");
  console.log(`  ✓ public/brand/${name}`);
  written++;
}

console.log(`\n  ${written} files from 1 source.`);
console.log(`  ${paths.length} paths in the artwork — ${DASHES.length} lane dashes.\n`);
