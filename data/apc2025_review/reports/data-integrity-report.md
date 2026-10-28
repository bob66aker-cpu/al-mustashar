# تقرير سلامة بيانات حزمة APC 2025 — قبل التحويل وبعده

التاريخ: 2026-10-27 · الفرع: `audit/apc-2025-data-integration` · المرجع: `extracted/` (فك الـZIP كما هو).

## 1) الأعداد قبل التحويل وبعده

| المرحلة | محاصيل | بطاقات | صفوف مصدر | توصيات مجمّعة | خيارات/صفوف CSV | مواد |
|---|---|---|---|---|---|---|
| خام (`source_extraction_raw/`، 79 ملفاً) | — | **338** | **3482** (`rows` = `rows_seen` = 3482) | — | — | — |
| بعد `build.py` (merged_raw) | — | 338 | 3482 | 2033 | — | 273 |
| بعد `finalize.py` (`repro/final`) | **68** | **338** (258 آفات + 80 حشائش) | **3482** | 2033 | **3482** | 273 |
| CSV المشحون | 68 | 338 | — | — | **3482** | 273 |
| Excel `recommendations` | 68 | 338 (ورقة cards) | — | — | **3482** | 273 (ورقة actives_cas) |

- **فقد السجلات: صفر** (3482 = 3482 = 3482 = 3482). التجميع 3482 → 2033 هو **دمج صفوف متطابقة داخل البطاقة نفسها** مع حفظ كل خيار (`source_row_count` يوثّق عدد الصفوف المدموجة) — لا حذف ولا دمج عبر تشابه اسم.
- أوراق Excel بحسب القياس المباشر: recommendations 3483×22 · cards 339×15 · actives_cas 274×10 · uncertain 51×7 · missing_conflicts 645×7 · dups_same_card 1138×9 · dups_cross_card 1×1 · dup_cards 3×5 · spelling 171×6 — **مطابقة لجرد التسليم في `docs/apc2025-integration-handoff.md` بالظبط**.

## 2) قابلية التكرار (إثبات)

- تشغيلان توالياً + تشغيل ثالث بعد مسح `final`: `sha256sum` لكل ملف ⇒ **byte-identical**.
- `diff -rq extracted/data/crops repro/final/crops` ⇒ **0 اختلاف** (مخرج الإعادة = ملفات الحزمة المشحونة حرفياً).
- مقارنة `actives` (name/cas/status) بين بناء الإعادة والملف المشحون ⇒ **متطابقة**؛ الفرق حقول إضافية أضافها `audit.py` (`cas_verification`, `source_vs_reference`).
- **لم تُشغَّل عمليات حذف:** `finalize.py` يمسح `../final` فقط (مخرج عمل معزول داخل `repro/`) — تحققنا من مساره قبل التشغيل؛ `audit.py` يمسح `../package` وهو غير موجود ولم يُشغَّل.

## 3) المواد الفعالة وحالات CAS

- **273 مادة** · بها CAS: **261** · بلا CAS: **12** (مُعلَّمة لا مُخمَّنة).
- حالات البناء: `cas_assigned_checkdigit_ok` 254 · `variant_mapped_checkdigit_ok` 7 · `microbial_no_cas` 7 · `printed_name_unmatched_review` 4 · `ambiguous_no_cas` 1.
- مستويات التحقق في `actives.json`: **`needs_verification` 250** · `verified_secondary_source` 11 · `no_cas_assigned` 12.
- أرقام التحقق الحسابي: **0 خاطئ** بقاعدة CAS الرسمية (أوزان تصاعدية 1,2,3… من اليمين — نفس `cas_table.check`). تنبيه منهجي: **صحة الرقم الحسابي ليست دليل مطابقة**؛ 250 رقماً تبقى `NEEDS_VERIFICATION` مهما كانت الخانة سليمة.
- الحزمة لا تستنتج تسجيلاً ليبياً من كتاب مصري (لا حقل «مسجل/مسموح» في الحزمة إطلاقاً؛ حقول «status=مسموح» في التطبيق مصدرها قواعد ليبيا 248/500 لا هذه الحزمة).

## 4) السجلات غير المؤكدة والتعارضات (لم تُحسم ولم تُحذف)

| البند | العدد | الإجراء |
|---|---|---|
| بطاقات `uncertain` | 15 (و35 خياراً = 50 صفاً في ورقة uncertain) | مُوثَّقة — `nv-02-uncertain-rows.csv` |
| نواقص/تعارضات | **644**: phi_days 427 · pest_group 162 · concentration_sum 20 · formulation_type 14 · who 13 · concentration 5 · mrl 3 | `nv-03-missing-conflicts.csv` |
| تكرارات مقترحة داخل بطاقة | **1137** صفاً | **لم تُحذف** — تُركت للمراجعة (`nv-06-dups-same-card.csv`) |
| تكرارات عبر بطاقات | **0** | — |
| بطاقات مكرّرة مقترحة | **2** | `nv-04-dup-cards.csv` |
| اختلافات إملائية | **170** (كلها `needs_human_review`) | `nv-05-spelling-review.csv` |
| مجموعات جمع تركيز ≠ تركيز المستحضر | 19 | داخل التقرير فقط — لم تُعدَّل قيم |
| MRL بطول مختلف عن عدد المواد | 3 | `issues` في build.py — مسجّلة |
| مواد CAS بحاجة تحقق أو بلا رقم | **262** | `nv-01-actives-cas.csv` |

**إجمالي ملف الحالات المولَّد: 2265 صفاً موزَّعة على 6 ملفات CSV** (تُولَّد بـ`scripts/make-review-csvs.mjs` وتكرارها لا يُضاعف السجلات).

## 5) مقارنة سجل بسجل (مصدر ↔ ناتج ↔ تطبيق)

- **مصدر ↔ ناتج الحزمة:** 338 بطاقة و3482 صفّاً قبل وبعد؛ `source_order` متتابع 1..338 بلا ثغرة؛ معرّفات البطاقات فريدة؛ اسم كل ملف = `crop_id` بداخله. **لا فقد معلومة.**
- **حزمة ↔ تطبيق:** كل بطاقة تطبيق (258/258) لها بطاقة حزمة على نفس صفحة الطباعة؛ المطابقة الاسمية بعد التطبيع 209/258 والباقي فروق هجاء (§5 من تقرير المخطط). 80 بطاقة حشائش بلا مقابل في التطبيق. الاختلافات البنيوية موثّقة في `schema-compatibility.md` — **لم تُجرِ أي محاولة استيراد، ففقد المعلومات بين الطرفين = 0 (لم يُكتب شيء)**.
- **بيانات التطبيق لم تمس:** `git status -- data/ src/ index.html sw.js version.json` ⇒ نظيف (غير المتتبَّع الوحيد: مجلدا العمل `extracted/` و`repro/` المُستثنيان بالـ`.gitignore`).

## 6) ما لم يُشغَّل ولماذا (إقرار صريح)

- **`audit.py` لم يُشغَّل:** مدخله `../out/actives.json` غير موجود في الحزمة (مرحلة وسيطة لم تُرفق)، ويستورد `xlsxwriter`. بُنيَت وظيفته مُتحقَّقاً بديلاً: عدّ أوراق Excel مباشرة + تحقق بنكي في `verify-package.mjs`.
- **`scripts/build.py` و`finalize.py` شُغِّلا فعلياً** (§2).
- ملفات «الدفعة الأولى» الأربعة المُعلَنة غير موجودة في المساحة ولا الفروع (§SOURCE-PROVENANCE.md) — **لم تُستبدل ولم تُنشأ بديلة**.

## 7) نتائج الاختبارات الفعلية (شُغِّلت جميعها)

| الاختبار | النتيجة |
|---|---|
| `bun run test:static` (سلسلة كاملة: ui-icons، no-hardcoded-arabic، data-health، judge، namepairs، nearpairs-regression، بوابات OCR الست، stage-a، stage-b، stats-local، tawsiyat، test:advice) | **EXIT=0 · 423 PASS · 0 FAIL** (judge 40 · near-pair 400 · reference-guard 69 · stats-local 35 · ADVICE-VALIDATE 4 · ADVICE-TEST 35) |
| `node tests/data-packs.test.mjs` | **51/51** |
| `node tests/pack-guard.test.mjs` | **29/29** |
| `node tests/data-packs-browser.test.mjs` (خادم اختبار محلي + Chromium) | **23/23** |
| `node tests/fb12-packs-primary.mjs` | **23/23** |
| `node tests/cas-sweep.test.mjs` | **140/140** |
| `node tests/a11y.test.mjs` | **42/42** (axe: critical 0 / serious 0 / moderate 0 / minor 0) |
| **`node data/apc2025_review/scripts/verify-package.mjs` (جديد)** | **22/22 ALL PASS** (JSON 151/151 · ربط 338↔2033↔3482 · CAS · فصل الترجمة · سلامة مخطط التطبيق 258/258) |
| اختبارات اللغات الأربع `tws-lang.test.mjs` | **غير موجودة على هذا الفرع** (تعيش على `experimental-v2-2026-10-25`) — لم تُشغَّل ولم تُدَّعَ |

فشل واحد عابر وُثِّق وأُصلح خلال الجولة: تشغيل `test:packs` الأول توقف عند اختبار المتصفح لعدم وجود خادم على 8080 — أُعيد بخادم الاختبار المرفق `tests/static-server.mjs` مؤقتاً ضمن الأمر نفسه فنجح.

## 8) حدود هذه الجولة

لا دمج · لا نشر · لا تغيير فرع إنتاج · لا تعديل `sw.js`/`version.json` · لا تعديل بيانات التطبيق · لا استيراد مسودة إلى مسار بيانات الإنتاج · لا تغيير مخطط الواجهة.
