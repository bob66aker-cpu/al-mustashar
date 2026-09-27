/*
 * tests/fixtures/synthetic-labels.mjs — 3.1: مصانع صور اصطناعية حقيقية المظهر
 * ---------------------------------------------------------------------------
 * لماذا اصطناعية؟ لا صور مزارعين مرخصة بعد (هذا بالضبط ما تثبته خط الأساس:
 * docs/ocr-baseline.md «لا صور مرجعية حقيقية»). التصميم يحاكي الفيزياء
 * الحقيقية للملصقات بدل صور مخزّنة: نص حقيقي (أسماء ذائبة CAS/PSM)، هندسة
 * حلقيّة (عبوة أسطوانية)، لمعان، وإضاءة متدرجة — ثم يعاد استخدامها في:
 *   - tests/stage3-baseline.test.mjs (قياس خط الأساس + حراسة الانحدار)
 *   - اختبارات مستقبلية لنفس العدّة عند تبديل المحرك (3.7)
 * ترخيص المشهد: نص المنتج نص اصطناعي لا يمثل شركة حقيقية. الرمز: MIT مثل بقية
 * المستودع (بانتظام المشروع — شوف LICENSE النصية عند وجودها).
 */
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/* font: use the app's own Latin-capable system font first, bundled Arabic
 * font as fallback — @napi-rs/canvas resolves by family name. */
const FONTS = ['IBM Plex Sans Arabic', 'sans-serif'];
try {
  GlobalFonts.registerFromPath(
    join(root, 'assets/fonts/ibm-plex-sans-arabic-regular.woff2'),
    'IBM Plex Sans Arabic');
} catch (e) { /* system fallback is fine for Latin-only scenes */ }

/* seeded PRNG — deterministic scenes, reproducible baselines */
function rng(seed) {
  let s = (seed >>> 0) || 1;
  return function () {
    s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
    return (s >>> 0) / 4294967296;
  };
}

/* 7-digit CAS number with valid check digit (the judge's own math). */
export function casNumber(rand) {
  const d = Array.from({ length: 6 }, () => Math.floor(rand() * 10));
  let sum = 0;
  for (let i = 0; i < 6; i++) sum += d[i] * (6 - i);
  d.push(sum % 10);
  return d.join('-') + '-' + d[6];
}

/* Bifenthrin-like ingredient name pool (synthetic: name + fake concentration). */
const NAMES = [
  'Bifenthrin', 'Lambda-cyhalothrin', 'Chlorpyrifos', 'Deltamethrin',
  'Imidacloprid', 'Abamectin', 'Acetamiprid', 'Thiamethoxam',
  'Emamectin benzoate', 'Cypermethrin', 'Profenofos', 'Methomyl'
];

export function sceneSpec(seed) {
  const rand = rng(seed);
  return {
    name: NAMES[Math.floor(rand() * NAMES.length)],
    conc: [1.8, 2.5, 4.8, 7.9, 10, 25, 48][Math.floor(rand() * 7)],
    cas: casNumber(rand),
    w: 1600 + Math.floor(rand() * 400),      // oversized on purpose (12MP class)
    h: 2000 + Math.floor(rand() * 400),
    glare: rand() < 0.5,
    curve: rand() < 0.5,
    dim: rand() < 0.5
  };
}

/* Draw one label scene onto a canvas of the spec. */
export function drawScene(spec) {
  const { w, h } = spec;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const rand = rng(spec.cas.split('').reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7));

  /* bottle body: warm plastic, darker rim */
  ctx.fillStyle = '#e8e4d8';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#cfc9b8';
  ctx.fillRect(0, 0, w, Math.round(h * 0.06));
  ctx.fillRect(0, Math.round(h * 0.94), w, Math.round(h * 0.06));

  /* label area */
  const lx = Math.round(w * 0.10), ly = Math.round(h * 0.18);
  const lw = Math.round(w * 0.80), lh = Math.round(h * 0.58);
  ctx.fillStyle = '#f7f4ec';
  ctx.fillRect(lx, ly, lw, lh);
  ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.strokeRect(lx, ly, lw, lh);

  /* headline + ingredients block — the region OCR must read */
  const cx = lx + lw / 2;
  ctx.textAlign = 'center'; ctx.fillStyle = '#111';
  ctx.font = `bold ${Math.round(w * 0.075)}px ${FONTS}`;
  ctx.fillText(spec.name.toUpperCase(), cx, ly + Math.round(lh * 0.20));
  ctx.font = `${Math.round(w * 0.045)}px ${FONTS}`;
  ctx.fillText(`${spec.conc}% EC  —  INSECTICIDE`, cx, ly + Math.round(lh * 0.30));
  ctx.font = `bold ${Math.round(w * 0.058)}px ${FONTS}`;
  ctx.fillText('ACTIVE INGREDIENT:', cx, ly + Math.round(lh * 0.47));
  ctx.fillText(spec.cas, cx, ly + Math.round(lh * 0.60));
  ctx.font = `${Math.round(w * 0.032)}px ${FONTS}`;
  ctx.fillText('NET CONTENTS 1 LITRE', cx, ly + Math.round(lh * 0.78));
  ctx.fillText('KEEP OUT OF REACH OF CHILDREN', cx, ly + Math.round(lh * 0.88));

  /* fine print rows (noise text that must NOT break extraction) */
  ctx.font = `${Math.round(w * 0.022)}px ${FONTS}`;
  for (let i = 0; i < 5; i++) {
    ctx.fillText('BATCH ' + casNumber(rand) + '  LOT ' + Math.floor(rand() * 90000 + 10000),
      cx, ly + Math.round(lh * (0.90 + i * 0.02)));
  }

  /* cylindrical shading: horizontal luminance bands (curvature) */
  if (spec.curve) {
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0.34)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.34)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  /* dim light: multiplicative darkening + slight blue shift */
  if (spec.dim) {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = d[i] * 0.52; d[i + 1] = d[i + 1] * 0.54; d[i + 2] = d[i + 2] * 0.60;
    }
    ctx.putImageData(img, 0, 0);
  }

  /* glare: elliptical blown highlight across the label */
  if (spec.glare) {
    const gx = lx + lw * (0.25 + rand() * 0.5);
    const gy = ly + lh * (0.2 + rand() * 0.5);
    const gr = w * (0.10 + rand() * 0.08);
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    g.addColorStop(0, 'rgba(255,255,255,0.97)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(gx, gy, gr * 1.6, gr, 0.35, 0, Math.PI * 2); ctx.fill();
  }

  /* sensor noise */
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rand() - 0.5) * 26;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/* Full scene set: 12 cases covering the 4 requested condition families. */
export function buildSet() {
  const defs = [
    ['clean-1', 11, {}], ['clean-2', 12, {}],
    ['glare-1', 21, { glare: true }], ['glare-2', 22, { glare: true }],
    ['curve-1', 31, { curve: true }], ['curve-2', 32, { curve: true }],
    ['dim-1', 41, { dim: true }], ['dim-2', 42, { dim: true }],
    ['mixed-1', 51, { glare: true, curve: true }],
    ['mixed-2', 52, { dim: true, curve: true }],
    ['mixed-3', 53, { glare: true, dim: true }],
    ['worst', 61, { glare: true, dim: true, curve: true }]
  ];
  return defs.map(([id, seed, over]) => {
    const spec = Object.assign(sceneSpec(seed), over);
    const canvas = drawScene(spec);
    return { id, spec, canvas, png: canvas.toBuffer('image/png') };
  });
}
