#!/usr/bin/env node
/**
 * card-text-provenance.mjs — خط إنتاج إثبات مصدر نصوص البطاقات (ثلاث طبقات)
 *
 * الطبقات:
 *   A. صورة الصفحة المرسومة من PDF  ← tesseract (ara+eng)   (حقيقة الطباعة بقدر ما يقرأه OCR)
 *   B. طبقة نص PDF                  ← pdftotext             (ما تقرؤه أدوات الاستخراج)
 *   C. نص البطاقة                   ← data/tws/sections.json (ما يعرضه التطبيق)
 *
 * الاستخدام:
 *   node scripts/card-text-provenance.mjs ocr   --from 16 --to 279   # مرحلة OCR (تُخزَّن مؤقتًا في tmp/prov/)
 *   node scripts/card-text-provenance.mjs build                        # تحليل + توليد CSV
 *
 * المخرجات:
 *   data/apc2025_review/reports/card-text-provenance.csv
 *
 * القواعد:
 *  - لا يعدّل أي نص زراعي؛ يسجّل فقط الحالة والدرجة والفئة (أ-هـ).
 *  - كل صف يحمل: مسار الملف، معرّف البطاقة، صفحة المصدر، الالتزام الذي أدخل النص
 *    (أقرب التزام يحويه من تاريخ data/tws)، المؤلف/المودِع كما في Git، الدليل، الفئة، الثقة، الحالة.
 *  - الفئات: (أ) عطب استخراج ورثته البطاقة من طبقة النص · (ب) خطأ نسخ/تنظيف ·
 *    (ج) خطأ في الطباعة نفسها · (د) خطأ عرض · (هـ) حالة غير محسومة تبقى للمراجعة البشرية.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PDF = fs.existsSync(path.join(ROOT, "tmp/apc/Recomm25.pdf"))
  ? path.join(ROOT, "tmp/apc/Recomm25.pdf")
  : process.env.APC_PDF;
const SECTIONS = path.join(ROOT, "data/tws/sections.json");
const AUDIT = path.join(ROOT, "data/tws/audit.json");
const TMP = path.join(ROOT, "tmp/prov");
const OUT_DIR = path.join(ROOT, "data/apc2025_review/reports");
const OUT_CSV = path.join(OUT_DIR, "card-text-provenance.csv");

const FIELDS = ["group", "name_ar", "symptom", "appearance", "timing", "guidance"];
// أنماط عطب طبقة النص العربي المعروفة (لا تُعدّ دليلاً وحدها — التصنيف من مطابقة الطبقة بالصورة)
const ARTIFACT_PATTERNS = [
  ["lam_swap", /احلشرات|االحشرات/],
  ["hamza_bleed", /اإ[بتثجحخدذرزسشصضطظعغفقكلمنهوي]/],
  ["hamza_split", /باإ|باأ|اأ[بتثجحخدذرزسشصضطظعغفقكلمنهوي]/],
  ["al_missing", /(?<=[ \u0022\u0027(])ا[بتثجحخدذرزسشصضطظعغفقكلمنهوي][تة]/],
];

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });
}

function norm(s) {
  return s
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "") // تشكيل + تطويل
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627") // أ إ آ ٱ → ا
    .replace(/\u0649/g, "\u064A") // ى → ي
    .replace(/\u0629/g, "\u0647") // ة → ه
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069\u061C]/g, "")
    .trim();
}
const AR = /[\u0600-\u06FF]/;
// إزالة رموز عدم الوضوح وعلامات الاتجاه قبل التقطيع (تمنع تكسير الرموز داخل الكلمة)
const stripInv = (s) => String(s).replace(/[\uFFFD\u200E\u200F\u202A-\u202E\u2066-\u2069\u061C]/g, "");
function tokens(s) {
  s = stripInv(s);
  return s
    .split(/[^\u0621-\u064A\u0660-\u0669\u0641\u0642\u0644a-zA-Z0-9\-]+/u)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4 && (t.match(new RegExp(AR, "g")) || []).length >= 3);
}
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[m][n];
}

// ---------- مرحلة OCR ----------
function phaseOcr(from, to, part = 0, parts = 1, dpi = 200) {
  if (!PDF) throw new Error("PDF not found — set APC_PDF");
  fs.mkdirSync(TMP, { recursive: true });
  const done = [];
  for (let p = from; p <= to; p++) {
    if (parts > 1 && p % parts !== part) continue;
    const ocr = path.join(TMP, `p${p}.ocr.txt`);
    const layer = path.join(TMP, `p${p}.layer.txt`);
    if (fs.existsSync(ocr) && fs.existsSync(layer)) { done.push(p); continue; }
    sh("pdftoppm", ["-f", String(p), "-l", String(p), "-r", String(dpi), "-png", PDF, path.join(TMP, `p${p}`)]);
    const rendered = path.join(TMP, `p${p}-0${p}.png`).replace(/p(\d+)-0\1\.png$/, (m, d) => `p${d}-${String(d).padStart(3, "0")}.png`);
    const actual = fs.readdirSync(TMP).find((f) => f.startsWith(`p${p}-`) && f.endsWith(".png"));
    if (!actual) throw new Error(`render failed for page ${p}`);
    sh("tesseract", [path.join(TMP, actual), path.join(TMP, `p${p}`), "-l", "ara+eng", "--oem", "1", "--psm", "3"], { stdio: "pipe", env: { ...process.env, OMP_THREAD_LIMIT: "1" } });
    sh("pdftotext", ["-f", String(p), "-l", String(p), "-layout", PDF, layer]);
    fs.renameSync(path.join(TMP, `p${p}.txt`), ocr);
    fs.rmSync(path.join(TMP, actual), { force: true });
    done.push(p);
    process.stdout.write(`ocr:${p} `);
  }
  console.log(`\nOCR done for ${done.length} pages`);
}

// ---------- الالتزامات ----------
function gitBlobs() {
  const log = sh("git", ["log", "--format=%H|%h|%an|%cn|%ad|%s", "--date=short", "--", "data/tws/sections.json"], { cwd: ROOT })
    .trim().split("\n").filter(Boolean);
  const commits = log.map((l) => { const [sha, short, an, cn, ad, ...s] = l.split("|"); return { sha, short, an, cn, ad, subject: s.join("|") }; });
  const blobs = [];
  for (const c of [...commits].reverse()) {
    try {
      const content = sh("git", ["show", `${c.sha}:data/tws/sections.json`], { cwd: ROOT });
      blobs.push({ ...c, content });
    } catch { /* ملف غير موجود في هذا الالتزام */ }
  }
  return { commits: blobs }; // الأقدم في المؤشر 0
}
function introducingCommit(blobs, token) {
  for (const b of blobs) if (b.content.includes(token)) return b;
  return null;
}

// ---------- التحليل ----------
function phaseBuild() {
  const sec = JSON.parse(fs.readFileSync(SECTIONS, "utf8"));
  const audit = JSON.parse(fs.readFileSync(AUDIT, "utf8"));
  const { commits: blobs } = gitBlobs();
  const commitInfo = blobs.map((b) => ({ short: b.short, sha: b.sha, an: b.an, cn: b.cn, ad: b.ad }));

  const rows = [];
  const ocrPages = fs.readdirSync(TMP).filter((f) => /^p\d+\.ocr\.txt$/.test(f)).map((f) => Number(f.slice(1, -8)));
  const ocrSet = new Set(ocrPages);
  const stats = { field_tokens: 0, image_verified: 0, mismatch: 0, no_ocr: 0, sections: sec.sections.length,
    ocr_pages: ocrPages.length, book_pages: 264, sections_covered: 0, sections_not_ocrd: 0 };
  const csvEscape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  const layerFor = (p) => fs.existsSync(path.join(TMP, `p${p}.layer.txt`)) ? fs.readFileSync(path.join(TMP, `p${p}.layer.txt`), "utf8") : null;
  const ocrFor = (p) => fs.existsSync(path.join(TMP, `p${p}.ocr.txt`)) ? fs.readFileSync(path.join(TMP, `p${p}.ocr.txt`), "utf8") : null;

  for (const s of sec.sections) {
    const pages = [...new Set(s.pages || [s.page])].filter((p) => p != null);
    const ocrTexts = pages.map(ocrFor).filter((t) => t != null);
    const layerTexts = pages.map(layerFor).filter((t) => t != null);
    if (pages.some((p) => ocrSet.has(p))) stats.sections_covered++;
    else stats.sections_not_ocrd++;
    const ocrTokens = new Set(ocrTexts.flatMap((t) => tokens(t).map(norm)));
    const ocrTokenList = [...ocrTokens];
    const layerTokens = new Set(layerTexts.flatMap((t) => tokens(t).map(norm)));
    const layerTokenList = [...layerTokens];

    const evidencePage = pages.join("+");
    const imgRef = (s.images || []).map((i) => i.file).slice(0, 2).join("|");

    for (const f of FIELDS) {
      const vals = Array.isArray(s[f]) ? s[f] : s[f] ? [s[f]] : [];
      for (const raw of vals) {
        if (typeof raw !== "string") continue;
        const toks = tokens(raw);
        if (!toks.length) continue;
        // صنف النمط إن وُجد
        const artifact = ARTIFACT_PATTERNS.find(([, re]) => re.test(raw))?.[0] || "";
        for (const tk of toks) {
          stats.field_tokens++;
          const n = norm(tk);
          if (ocrTokens.size === 0) { stats.no_ocr++; continue; }
          if (ocrTokens.has(n)) { stats.image_verified++; continue; }
          // أقرب مرشح في الصورة
          let best = null, bestD = 9;
          for (const c of ocrTokenList) {
            if (Math.abs(c.length - n.length) > 2) continue;
            const d = lev(n, c);
            if (d < bestD) { bestD = d; best = c; }
          }
          const limit = n.length >= 7 ? 2 : 1;
          if (!best || bestD > limit) { stats.no_ocr++; continue; }
          stats.mismatch++;
          const layerHas = layerTokens.has(n);
          const ic = introducingCommit(blobs, tk);
          // أقرب رمز في طبقة النص لتمييز (أ) عن (ب)
          let bestL = null, bestLD = 9;
          for (const c of layerTokenList) {
            if (Math.abs(c.length - n.length) > 2) continue;
            const d = lev(n, c);
            if (d < bestLD) { bestLD = d; bestL = c; }
          }
          let cls, conf, status, why;
          if (layerHas && best !== n) {
            cls = "أ";
            conf = bestD === 1 ? "متوسطة (فارق بمسافة واحدة — قد يكون ضجيج OCR)" : "مرتفعة (ثلاث طبقات)";
            status = "NEEDS_REVIEW";
            why = `البطاقة مطابقة لطبقة النص والصورة تقول «${best}» — عطب استخراج ورثته البطاقة${bestD === 1 ? "؛ فرق بمسافة واحدة قد يكون خطأ OCR لا خطأ طباعة" : ""}`;
          } else if (bestL && bestLD <= 2 && best !== n) {
            cls = "ب";
            conf = "متوسطة (طبقتان: بطاقة ≠ طبقة ≠ صورة)";
            status = "NEEDS_VERIFICATION";
            why = `البطاقة «${tk}» تنحرف عن طبقة النص «${bestL}» وعن الصورة «${best}» — نسخ أو تنظيف بعد الاستخراج`;
          } else if (!layerHas && layerTokens.size) {
            cls = "هـ"; conf = "منخفضة"; status = "NEEDS_VERIFICATION";
            why = `ثلاث طبقات مختلفة: بطاقة «${tk}» · طبقة ≠ · صورة «${best}» — يحتاج مراجعة بشرية`;
          } else {
            cls = "هـ"; conf = "منخفضة"; status = "NEEDS_VERIFICATION";
            why = `لا تطابق حاسم — صورة «${best}»`;
          }
          rows.push({
            file_path: "data/tws/sections.json",
            card_id: `${s.crop_id}#${s.n ?? 1}`,
            field: f,
            printed_page: s.printed_page ?? "",
            pdf_page: evidencePage,
            raw_value: tk,
            layer_value: layerHas ? tk : bestL || "(غير طبقة مطابقة)",
            image_value: best,
            proposed: bestD <= limit ? best : "",
            artifact_pattern: artifact,
            commit_sha: ic?.short || commitInfo[0]?.short || "",
            author: ic?.an || "",
            committer: ic?.cn || "",
            commit_date: ic?.ad || "",
            evidence: `ocr:${path.basename(TMP)}/p${evidencePage}.ocr.txt vs layer vs sections · ${s.crop_evidence || ""} · img:${imgRef}`,
            defect_class: cls,
            confidence: conf,
            status,
            reason: why,
          });
        }
      }
    }
  }

  // سجلات الإصلاح البصرية السابقة (مثبتة بسجل name_fix/text_fix/timing_fix)
  let fixRows = 0;
  for (const s of sec.sections) {
    for (const k of ["name_fix", "text_fix", "timing_fix"]) {
      const fx = s[k];
      if (!fx) continue;
      fixRows++;
      const ic = introducingCommit(blobs, JSON.stringify(fx).slice(20, 60)) || introducingCommit(blobs, s.crop_id);
      rows.push({
        file_path: "data/tws/sections.json",
        card_id: `${s.crop_id}#${s.n ?? 1}`,
        field: k === "name_fix" ? "name_ar" : k === "text_fix" ? "text" : "timing",
        printed_page: s.printed_page ?? "",
        pdf_page: (s.pages || [s.page]).filter(Boolean).join("+"),
        raw_value: fx.from_extraction || "(منقول)",
        layer_value: fx.from_extraction || "",
        image_value: fx.to_print || "(مصحَّح بصريًا)",
        proposed: fx.display_normalized ? "مطبَّق" : "مطبَّق",
        artifact_pattern: "prior_visual_fix",
        commit_sha: ic?.short || "",
        author: ic?.an || "",
        committer: ic?.cn || "",
        commit_date: ic?.ad || "",
        evidence: `${k}: ${fx.reason || fx.fields?.join(",") || ""} · ${s.crop_evidence || ""}`,
        defect_class: "د/ب",
        confidence: "مرتفع (تحقق بصري سابق موثَّق)",
        status: "FIXED_VERIFIED",
        reason: fx.reason || "تصحيح موثَّق في سجل الإصلاحات",
      });
    }
  }

  // سجل أسماء الآفات: الحالات المعلَّقة
  let reviewRows = 0;
  for (const r of audit.rows) {
    if (r.status !== "NEEDS_REVIEW") continue;
    reviewRows++;
    rows.push({
      file_path: "data/tws/audit.json",
      card_id: `${r.crop_id}#${r.infection_id}`,
      field: "infection_name",
      printed_page: r.printed_page ?? "",
      pdf_page: r.pdf_page ?? "",
      raw_value: r.old_name,
      layer_value: "",
      image_value: "",
      proposed: "",
      artifact_pattern: "name_needs_review",
      commit_sha: "",
      author: "",
      committer: "",
      commit_date: "",
      evidence: r.action || "",
      defect_class: "هـ",
      confidence: "—",
      status: "NEEDS_REVIEW",
      reason: "اسم بحالة مراجعة في سجل التدقيق القائم",
    });
  }

  // كتابة CSV (UTF-8 BOM للفتح في Excel)
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const head = ["file_path","card_id","field","printed_page","pdf_page","raw_value","layer_value","image_value","proposed","artifact_pattern","commit_sha","author","committer","commit_date","evidence","defect_class","confidence","status","reason"];
  const lines = [head.join(",")];
  for (const r of rows) lines.push(head.map((h) => csvEscape(r[h])).join(","));
  fs.writeFileSync(OUT_CSV, "\uFEFF" + lines.join("\n") + "\n", "utf8");

  const byClass = {}, byStatus = {};
  for (const r of rows) { byClass[r.defect_class] = (byClass[r.defect_class] || 0) + 1; byStatus[r.status] = (byStatus[r.status] || 0) + 1; }
  console.log(JSON.stringify({ rows: rows.length, fixRows, reviewRows, stats, byClass, byStatus, csv: OUT_CSV }, null, 1));
}

const [phase, ...rest] = process.argv.slice(2);
const arg = (k, d) => { const i = rest.indexOf(k); return i < 0 ? d : rest[i + 1]; };
if (phase === "ocr") {
  phaseOcr(Number(arg("--from", 1)), Number(arg("--to", 999)), Number(arg("--part", 0)), Number(arg("--parts", 1)), Number(arg("--dpi", 200)));
} else if (phase === "build") {
  phaseBuild();
} else {
  console.log("usage: card-text-provenance.mjs ocr --from N --to M | build");
}
