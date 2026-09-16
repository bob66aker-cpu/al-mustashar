/*
 * scripts/generate-icons.cjs
 * ---------------------------------------------------------------
 * Generates the PWA icons (icons/icon-192.png, icons/icon-512.png,
 * icons/maskable-512.png) and icons/favicon.svg WITHOUT any external
 * dependency: PNGs are rasterized in pure JS and encoded with Node's
 * zlib. The design matches the app identity: rounded dark-green
 * square (#1F6F52) with a light leaf (#E9F2EB) — the same leaf motif
 * as the brand mark in the header. Run:  node scripts/generate-icons.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'icons');
fs.mkdirSync(OUT, { recursive: true });

/* ---------- tiny PNG encoder (RGBA, 8-bit) ---------- */
function crc32(buf) {
  let c, table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c;
    }
  }
  c = ~0;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xff];
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ---------- colors ---------- */
const GREEN = [0x1f, 0x6f, 0x52, 255];
const LEAF  = [0xe9, 0xf2, 0xeb, 255];

/* rounded-rectangle coverage test (anti-aliased edge) */
function roundedRectAlpha(x, y, size, radius) {
  const nx = Math.min(x, size - 1 - x);
  const ny = Math.min(y, size - 1 - y);
  if (nx >= radius || ny >= radius) return 1;
  const dx = radius - nx - 0.5, dy = radius - ny - 0.5;
  const d = Math.sqrt(dx * dx + dy * dy);
  return Math.max(0, Math.min(1, radius - d + 0.5));
}

/* leaf shape: two quadratic arcs meeting at both ends (a classic leaf) */
function leafAlpha(x, y, size) {
  // leaf occupies the central area of the icon
  const w = size * 0.52, h = size * 0.34;
  const cx = size / 2, cy = size / 2;
  const lx = x - (cx - w / 2), ly = y - (cy - h / 2); // 0..w, 0..h space
  if (lx < 0 || lx > w || ly < 0 || ly > h) return 0;
  const t = lx / w;                                    // 0..1 along length
  const bulge = 4 * t * (1 - t) * h;                   // half-height at t
  const d = Math.abs(ly - h / 2);
  return Math.max(0, Math.min(1, bulge / 2 - d + 0.5));
}

/* midrib line of the leaf */
function midribAlpha(x, y, size) {
  const w = size * 0.52, h = size * 0.34;
  const cx = size / 2, cy = size / 2;
  const lx = x - (cx - w / 2), ly = y - (cy - h / 2);
  if (lx < w * 0.08 || lx > w * 0.92) return 0;
  const t = lx / w;
  const bulge = 4 * t * (1 - t) * h;
  const d = Math.abs((ly - h / 2) - 0);                 // center line
  return Math.max(0, Math.min(1, 1.1 - d));
}

function renderIcon(size, maskable) {
  const buf = Buffer.alloc(size * size * 4);
  const radius = maskable ? size * 0.22 : size * 0.18;
  // maskable keeps the artwork inside the safe zone (80%)
  const pad = maskable ? size * 0.10 : 0;
  const inner = size - pad * 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const a = roundedRectAlpha(x - pad, y - pad, inner, radius);
      let r, g, b, al;
      if (a <= 0) { r = g = b = al = 0; }
      else {
        const la = leafAlpha(x - pad, y - pad, inner);
        const ma = midribAlpha(x - pad, y - pad, inner) * 0.9;
        // base green
        r = GREEN[0]; g = GREEN[1]; b = GREEN[2];
        // leaf with green midrib drawn over it
        const leafR = LEAF[0], leafG = LEAF[1], leafB = LEAF[2];
        // blend leaf over green
        r = r + (leafR - r) * la; g = g + (leafG - g) * la; b = b + (leafB - b) * la;
        // blend midrib (green) over leaf
        r = r + (GREEN[0] - r) * ma; g = g + (GREEN[1] - g) * ma; b = b + (GREEN[2] - b) * ma;
        al = Math.round(a * 255);
      }
      buf[i] = Math.round(r); buf[i + 1] = Math.round(g); buf[i + 2] = Math.round(b); buf[i + 3] = al;
    }
  }
  return encodePNG(size, size, buf);
}

fs.writeFileSync(path.join(OUT, 'icon-192.png'), renderIcon(192, false));
fs.writeFileSync(path.join(OUT, 'icon-512.png'), renderIcon(512, false));
fs.writeFileSync(path.join(OUT, 'maskable-512.png'), renderIcon(512, true));

/* simple favicon.svg (crisp at any size) */
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="#1F6F52"/>
<path d="M16 36 Q32 12 48 36 Q32 48 16 36 Z" fill="#E9F2EB"/>
<path d="M18 36 Q32 34 46 36" stroke="#1F6F52" stroke-width="2" fill="none"/>
</svg>`;
fs.writeFileSync(path.join(OUT, 'favicon.svg'), favicon);

console.log('icons written:', fs.readdirSync(OUT).join(', '));
