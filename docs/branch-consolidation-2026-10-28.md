# سجل توحيد الفروع — 2026-10-28

المستودع: `bob66aker-cpu/al-mustashar` · الفرع الافتراضي: `main`
سُجّل هذا الجرد **قبل** أي دمج أو حذف. لم يُحذف أي مرجع حتى الآن.
الحماية: `release-1-pre-oct11-preserved` مثبّت عند
`536244cb5b57f788afa15ccbe59659ef9f80dc12` (1.19.22 / mustashar-v58) — لا checkout كتابةً، لا commit، لا force-push، لا حذف.

## 1. جرد الفروع (البعد البعيد، قبل العمل)

| الفرع | SHA (قبل) | آخر commit (تاريخ/مؤلف) | مقابل V2 |
|---|---|---|---|
| `release-1-pre-oct11-preserved` | `536244cb` | 2026-10-10 bob66aker-cpu (D55) | محمي — 0 فريد (V2 سبقه 19) |
| `main` | `46c392c` | 2026-10-12 bob66aker-cpu (D58) | محتواه كاملًا في V2 (0 فريد) |
| `work-branch` | `fb40c92` | 2026-10-25 bob66aker-cpu | محتواه كاملًا في V2 (0 فريد) |
| `experimental-v2-2026-10-25` | `08b35c9` (خادم) / `bfb3921` (محلي) | 2026-10-28 | منقسم: 9 التزامات بعيدة / 3 محلية |
| `audit/apc-2025-data-integration` | `5343b48` | 2026-10-28 bob66aker-cpu | 4 التزامات فريدة (مستندات تدقيق APC) |
| `audit/tawsiyat-core-2026-10-22` | `ace4e3f` | 2026-10-22 bob66aker-cpu | 1 التزام فريد · 1 ملف |
| `design/tawsiyat-card-refresh-2026-10-23` | `62f20d5` | 2026-10-23 bob66aker-cpu | 3 التزامات فريدة · 3 ملفات |
| `fix/pro-regulatory-pack-refresh-2026-10-23` | `ba75483` | 2026-10-23 bob66aker-cpu | 19 التزامًا فريدًا · 7 ملفات |
| `fix/tawsiyat-dark-spelling-status-2026-10-23` | `4764eb4` | 2026-10-23 bob66aker-cpu | 11 التزامًا فريدًا · 4 ملفات |
| `hotfix/remove-legacy-advice-2026-10-22` | `3b5f4a8` | 2026-10-22 bob66aker-cpu | 0 فريد (مُدمج عبر PR #2) |
| `ppocr-lab` (محلي فقط، بلا نظير بعيد) | `dbb966f` | — | أرشيف تجربة PP-OCRv5 (D24) |

شجرات العمل المحلية: `/home/daytona/codebase` (main قديم)،
`/home/daytona/al-mustashar-audit` (audit/apc)، `/home/daytona/al-mustashar-work` (V2)،
و`freebuff/changes-jh8fpjmj` (= main).

## 2. جرد الـ PRs

| # | الحالة | من → إلى | العنوان |
|---|---|---|---|
| 7 | OPEN مسودة | audit/apc → V2 | جمع حزمة تدقيق APC 2026 داخل الإصدار التجريبي الثاني |
| 6 | OPEN مسودة | audit/apc → work-branch | توثيق وتدقيق حزمة APC 2025 دون استيرادها (تُبقي مسودة) |
| 5 | OPEN | fix/pro-regulatory → work-branch | إعادة تحديث الحالة التنظيمية |
| 4 | OPEN | fix/tawsiyat-dark-spelling → work-branch | الوضع الداكن ونصوص التوصيات |
| 3 | OPEN | design/tawsiyat-card-refresh → work-branch | تحسين تصميم بطاقات التوصيات |
| 2 | MERGED | hotfix/remove-legacy-advice → work-branch | إزالة واجهة الإرشاد القديمة |
| 1 | OPEN مسودة | audit/tawsiyat-core → work-branch | توثيق مراجعة سلامة قسم التوصيات |

## 3. الـ Tags وإعدادات النشر

- Tags: `v1.19.25` → `46c392c` (= طرف `main`) — وحدها.
- GitHub Pages: مفعّلة، build_type=legacy من `main` على
  `https://bob66aker-cpu.github.io/al-mustashar/` (بيئة `github-pages`).
- الاستضافة المُدارة (Freebuff): **لا عمليات نشر إطلاقًا** (`prodSlug=null`, `latestDeployment=null`).
- لا ملفات wrangler/cloudflare داخل المستودع.
- لم يُغيَّر الفرع الافتراضي أو أي إعداد نشر ضمن هذه المهمة.

## 4. انقسام V2 وتوحيدُه (قبل → بعد)

- البعيد `08b35c9` (9 التزامات فريدة: وثائق + تصحيحات إملائية في `src/i18n.js`
  `bdda66d` + `e1902e8`) والمحلي `bfb3921` (3 التزامات: تصميم بنتو `459a6fd`
  + لغات `3d781f0` + `bfb3921`) كانا منقسمين على أساس مشترك `fb40c92`.
- الدمج: `git merge --no-edit 08b35c9` في شجرة V2 → **`7dc9477` بلا تعارض**
  (الملفان المتقاطعان `src/i18n.js` اندمجا تلقائيًا ونجح `node --check`).
- الرفع: `08b35c9..7dc9477` إلى `origin/experimental-v2-2026-10-25`.
- تغيير المستخدم غير الملتزم في `data/advice/advice-registry-report.json`
  بقي كما هو (لم يلمسه الدمج)، ولم تُمسّ الأصناف غير الملتزمة `.verify/`,
  `docs/phase2-fixes/`, `docs/phase2-preview/`, `preview/`.

## 5. قرارات الدمج والحذف النهائية (سُجِّلت 2026-10-28 بعد اكتمال التدقيق والاختبارات)

| الفرع | SHA قبل | SHA بعد | التغيير الفريد | قرار الدمج | حُذف فعليًا؟ |
|---|---|---|---|---|---|
| `release-1-pre-oct11-preserved` | `536244cb` | `536244cb` | 0 | محمي — لا يُمسّ | **لا** (يُمنع) |
| `main` | `46c392c` | `46c392c` | 0 (محتواه كاملًا في V2) | ممنوع الدمج إليه (الإنتاج/Pages) | لا |
| `work-branch` | `fb40c92` | `fb40c92` | 0 (محتواه كاملًا في V2) | ممنوع الدمج إليه | لا |
| `experimental-v2-2026-10-25` | `7dc9477` | `76b654d` | — | استقبل 5 دفعات (أدناه) | لا |
| `audit/tawsiyat-core-2026-10-22` | `ace4e3f` | `ace4e3f` | مستند واحد `docs/REVIEW-TAWSIYAT-CORE-2026-10-22.md` | **دُمج** في V2 (`d69aa6f`) بلا تعارض | لا — PR #1 مفتوح ورأسه مطلوب |
| `fix/pro-regulatory-pack-refresh-2026-10-23` | `ba75483` | `ba75483` | ميزة الحالة التنظيمية + توسعة سطح المكتب + 2 اختبار | **دُمج** في V2 (`13e4c20`) بحل تعارض يدوي موثَّق | لا — PR #5 مفتوح |
| `fix/tawsiyat-dark-spelling-status-2026-10-23` | `4764eb4` | `4764eb4` | 0 فريد: مطابق تمامًا لـpro-regulatory في `tawsiyat.js`/`index.html`/`tokens.css` (فرق 0 سطر) | **مغطى** بمحتوى `13e4c20` — دمج منفصل يكرر نفس التغييرات | لا — PR #4 مفتوح |
| `design/tawsiyat-card-refresh-2026-10-23` | `62f20d5` | `62f20d5` | 0 فريد: `index.html`+`tokens.css` مطابقان لـpro-reg (0 سطر)، و`tawsiyat.js` مضمَّن فيه (119 من 120 سطرًا؛ السطران المستبدلان: جسد `esc` القديم وقاعدة تقليل الحركة التي V2 يملك نسخة أوسع منها) | **مغطى**؛ كتلة CSS القديمة فيه مرفوضة لوراثة V2 تصميمًا أحدث (Bento 2.0) | لا — PR #3 مفتوح |
| `hotfix/remove-legacy-advice-2026-10-22` | `3b5f4a8` | `3b5f4a8` | 0 فريد (مُدمج عبر PR #2) | لا حاجة | لا |
| `audit/apc-2025-data-integration` | `5343b48` | `5343b48` | حزمة تدقيق APC (55 ملفًا: تقارير/CSV/verification) — **بلا مساس بـ`data/tws` أو `src/`** (فُحص بالمقارنة مع الأساس `fb40c92`) | **دُمج** في V2 (`a82b253`) بلا تعارض — يُغلق PR #7 كمُدمَج عند الرفع. PR #6 يبقى مسودة كما طُلب | لا |
| `ppocr-lab` (محلي فقط) | `dbb966f` | `dbb966f` | أرشيف تجربة D24 | خارج نطاق التوحيد | لا |

**دفعات الدمج إلى V2 (كلها مراجَلة ومختبرة):**
1. `aa067b0` — خط إنتاج إثبات مصدر النصوص + `card-text-provenance.csv` (2585 صفًا).
2. `d69aa6f` — مستند مراجعة سلامة قسم التوصيات (ملف جديد فقط).
3. `13e4c20` — دمج pro-regulatory مع حل 3 تعارضات يدويًا (بقي CSS بنتو V2 كاملًا + 7 قواعد شارات جديدة؛ سقطت نسخة `typeName` القديمة؛ اتحاد سطري في `package.json`) — فحص الخسارة مقابل stage2: حُذف سطران فقط من V2 وكلاهما مُستبدَل.
4. `a82b253` — حزمة تدقيق APC (مستندات/بيانات مراجعة فقط).
5. `76b654d` — بوابة `tests/tws-source-integrity.test.mjs` (عدّاد + SHA-256 + ترتيب + حقول حساسة).

**لماذا لم يُحذف أي فرع فعليًا:**
- `gh api repos/...` يُعيد `permissions: {admin:false, maintain:false, pull:false, triage:false}` — لا توجد صلاحية حذف مؤكدة من الجهة المُدارة، والسياسة تنص على عدم الدعوى بحذف لم يُنفَّذ.
- رؤوس 5 فروع مرتبطة بـPRs مفتوحة (#1, #3, #4, #5, #6) — حذفها يُغلقها تلقائيًا وهو قرار مالك المشروع.
- **قائمة حذف جاهزة (محتواها الفريد مثبت بالكامل في V2 بالأدلة أعلاه)**، بانتظار تأكيد المالك:
  `audit/tawsiyat-core-2026-10-22` · `design/tawsiyat-card-refresh-2026-10-23` ·
  `fix/pro-regulatory-pack-refresh-2026-10-23` · `fix/tawsiyat-dark-spelling-status-2026-10-23` ·
  `hotfix/remove-legacy-advice-2026-10-22` · `audit/apc-2025-data-integration` (بعد إغلاق PR #6/#7).
- **لا تُحذف أبدًا:** `release-1-pre-oct11-preserved` · `main` · `work-branch` · `ppocr-lab`.

## 6. الاختبارات الفعلية (أوامر ونتائج)

| الأمر | النتيجة |
|---|---|
| `npm run test:static` | **EXIT=0** — 423 سطر PASS، صفر FAIL (شامل `pro-regulatory-packs` 4/4 و`tws-active-ingredient-gaps` 1/1 و`tws-source-integrity` 4/4 بعد إضافته للسلسلة) |
| `node --test tests/tws-source-integrity.test.mjs` | 4/4 pass |
| `node --check src/tawsiyat.js` | سليم بعد كل دفعة |
| `git diff --check` | نظيف (لا whitespace errors) |
| سلامة الإصدار الأول | `origin/release-1-pre-oct11-preserved` = `536244cb5b57f788afa15ccbe59659ef9f80dc12` بلا تغيير بعد كل الجلب |
| بوابات النشر | لا نشر: لا عمليات نشر مُسجَّلة (Pages من `main` لم تُمسّ، ولا إعدادات تغيّرت) |

> التغطية لا تُوصف بأنها «خالية من أخطاء»: بوابة `test:static` تغطي ما تغطيه،
> و23 خلية مادة فعالة فارغة تبقى معلَّمة `NEEDS_VERIFICATION` مربوطة بصفحة PDF.
