/* tests/fixtures/substitute-ground-aluminium.mjs
 * ---------------------------------------------------------------------------
 * بديل معتمد لفيباك 2 — «بديل لا الصورة الأصلية».
 *
 * صورة المالك (GROUND ALUMINIUM SULPHATE بأسطرها الثلاثة) غير موجودة في هذه
 * البيئة. هذا الملف يرسم ملصقاً اصطناعياً يحمل **النص المطبوع نفسه** على
 * ثلاثة أسطر كما يطبعه المالك، ليُحمَّل بالمحرك الحقيقي (Tesseract) لا
 * بمحاكاة. الغرض منه قياس **سلوك التجميع عبر الأسطر** لا قياس جودة صورة
 * المالك، ولذلك المشهد نظيف عالي التباين بلا لمعان ولا إضاءة ضعيفة: لو كان
 * الصمت سببه القراءة لا التجميع لظهر ذلك في الجدول.
 *
 * التشغيل: node tests/fixtures/substitute-ground-aluminium.mjs
 * المخرج: tests/fixtures/labels/SUBSTITUTE-ground-aluminium-sulphate.png
 * النص ليس لعلامة تجارية حقيقية؛ الرمز MIT مثل بقية المستودع.
 */
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
try {
  GlobalFonts.registerFromPath(join(root, 'assets/fonts/ibm-plex-sans-arabic-regular.woff2'), 'IBM Plex Sans Arabic');
} catch (e) { /* system fallback is fine for Latin-only scenes */ }

export const PRINTED = {
  header: 'ACTIVE INGREDIENT:',
  nameLines: ['GROUND', 'ALUMINIUM', 'SULPHATE'],
  cas: '17927-65-0',
  conc: '88% W/W',
  noise: ['BATCH 4471-22-9  LOT 31820', 'NET WEIGHT 25 KG', 'KEEP OUT OF REACH OF CHILDREN']
};

export const PRINTED_US = {
  header: 'ACTIVE INGREDIENT:',
  nameLines: ['GROUND', 'ALUMINUM', 'SULFATE'],
  cas: '17927-65-0',
  conc: '88% W/W',
  noise: ['BATCH 4471-22-9  LOT 31820', 'NET WEIGHT 25 KG', 'KEEP OUT OF REACH OF CHILDREN']
};

/* الإملاء الأمريكي وبلا رقم CAS مقروء: المسار بالاسم وحده — وهذا يقيس
 * قيمة التسوية الإملائية وحدها، لأن الرقم كان يختصر الأمر في العيّنتين
 * السابقتين. */
export const PRINTED_US_NOCAS = {
  header: 'ACTIVE INGREDIENT:',
  nameLines: ['GROUND', 'ALUMINUM', 'SULFATE'],
  cas: '',
  conc: '88% W/W',
  noise: ['BATCH 4471-22-9  LOT 31820', 'NET WEIGHT 25 KG', 'KEEP OUT OF REACH OF CHILDREN']
};

export function drawScene(printed) {
  const w = 1200, h = 1000;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f4f2ea'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#111'; ctx.textAlign = 'center';
  let y = 150;
  ctx.font = 'bold 40px "IBM Plex Sans Arabic", sans-serif';
  ctx.fillText(printed.header, w / 2, y);
  y += 110;
  /* الاسم على ثلاثة أسطر — هذا هو سبب الصمت المقيس */
  ctx.font = 'bold 84px "IBM Plex Sans Arabic", sans-serif';
  for (const line of printed.nameLines) { ctx.fillText(line, w / 2, y); y += 110; }
  y += 40;
  ctx.font = '52px "IBM Plex Sans Arabic", sans-serif';
  if (printed.cas) { ctx.fillText(printed.cas, w / 2, y); y += 80; }
  ctx.fillText(printed.conc, w / 2, y); y += 110;
  ctx.font = '34px "IBM Plex Sans Arabic", sans-serif';
  for (const line of printed.noise) { ctx.fillText(line, w / 2, y); y += 60; }
  return canvas;
}

/* الإملاء البريطاني كما يطبعه المالك (العيّنة الأولى). */
export function drawSubstitute() { return drawScene(PRINTED); }

/* الإملاء الأمريكي على الأسطر نفسها — يقيس فائدة قائمة التسوية وحدها. */
export function drawSubstituteUS() { return drawScene(PRINTED_US); }

export function drawSubstituteUSNoCas() { return drawScene(PRINTED_US_NOCAS); }

if (process.argv[1] && process.argv[1].endsWith('substitute-ground-aluminium.mjs')) {
  const out = join(root, 'tests/fixtures/labels');
  mkdirSync(out, { recursive: true });
  const a = join(out, 'SUBSTITUTE-ground-aluminium-sulphate.png');
  const b = join(out, 'SUBSTITUTE-ground-aluminum-sulfate.png');
  const c = join(out, 'SUBSTITUTE-ground-aluminum-sulfate-nocas.png');
  writeFileSync(a, drawSubstitute().toBuffer('image/png'));
  writeFileSync(b, drawSubstituteUS().toBuffer('image/png'));
  console.log('wrote ' + a);
  writeFileSync(c, drawSubstituteUSNoCas().toBuffer('image/png'));
  console.log('wrote ' + b);
  console.log('wrote ' + c);
}
