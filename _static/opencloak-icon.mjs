// Source for public/icon/*.png. Regenerate with:
//
//   node _static/opencloak-icon.mjs
//
// No background plate, so the mark is filled in the accent rather than black:
// a black mark vanishes on a dark toolbar and a white one vanishes on a light
// one. The mark is drawn tighter at 16 and 32 px, where the counters in the
// hood fill in and the glyph needs more of the canvas.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const FG = '#7C62F5';
const MARK_HEIGHT = 77.9;
const CENTER = { x: 50.65, y: 49.85 };

const source = readFileSync(new URL('./opencloak-logo.svg', import.meta.url), 'utf8');
const path = source.match(/\sd="([^"]+)"/)[1];

function icon(fill) {
  const scale = fill / MARK_HEIGHT;
  const tx = 50 - CENTER.x * scale;
  const ty = 50 - CENTER.y * scale;

  return `<svg width="512" height="512" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})"><path d="${path}" fill="${FG}"/></g></svg>`;
}

mkdirSync(new URL('../public/icon/', import.meta.url), { recursive: true });

for (const [size, fill] of [
  [16, 96],
  [32, 96],
  [48, 88],
  [96, 88],
  [128, 88],
]) {
  const svg = new URL(`../.icon-${size}.svg`, import.meta.url);
  writeFileSync(svg, icon(fill));
  execFileSync('rsvg-convert', [
    '-w', String(size), '-h', String(size),
    svg.pathname, '-o', new URL(`../public/icon/${size}.png`, import.meta.url).pathname,
  ]);
  execFileSync('rm', [svg.pathname]);
  console.log(`public/icon/${size}.png`);
}
