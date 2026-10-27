# إثبات مصدر حزمة APC 2025 — RECIEPT & SHA-256

## الاستلام
- **الحزمة:** `apc_cards_dataset_v2.zip` + الملفات المصاحبة داخل هذا المجلد.
- **المستودع:** `bob66aker-cpu/al-mustashar` · **الفرع:** `audit/apc-2025-data-integration`
- **إيداع الاستلام:** `e2b75fc1509413da75d9a7b851adfa0d6d261d38` — «Add files via upload»
- **تاريخ الاستلام (commit):** 2026-10-27 14:19:41 +0200 (لقطة سجل المستودع؛ تاريخ ملفات الحزمة الداخلية 2026-10-26 16:03–16:04 كما في `_zip` timestamps).
- **مصدر الكتاب الأصلي (كما في README.txt داخل الحزمة):** كتاب «التوصيات المعتمدة لمكافحة الآفات الزراعية 2025» — لجنة مبيدات الآفات الزراعية (مصر) · `http://www.apc.gov.eg/Files/Releases/Recomm25.pdf`
- **سلامة الأرشيف:** `unzip -t` ⇒ **No errors detected** (166 مدخلة).

## البصمة الرقمية SHA-256 (محسوبة في شجرة الفرع)
```
223346be41bfc8de2682fdba44cc51aaa12782ed399b58fb9b9bd5b6ecb17d57  apc_cards_dataset_v2.zip
4dc9a39e87d08033de31b5a64b98f8af56e225a3f48965da921d4f5d04f2f1c4  recommendations_audit.xlsx
00f99c8241a4080c8cf919a488391f723302b32f6d88d9f4656e9694c57c74f5  audit_report.html
3cafecd6ab8ff277cc7da221d83f7acf110bb786f7b2202738b9c105ba51254c  README.md
```
إعادة التحقق: `sha256sum apc_cards_dataset_v2.zip recommendations_audit.xlsx audit_report.html README.md`

## المحتوى (كما هو داخل ZIP — لا يُعدَّل)
- `README.txt` · `audit/audit_report.html` · `audit/audit_data.json`
- `scripts/` (SPEC.md + build.py + finalize.py + audit.py + cas_table.py + crops.tsv + notes_dict.json)
- `data/` : `crops/*.json` (68 محصولًا) + `actives.json` (273) + `appendix7_minor_crops.json` + `recommendations_audit.xlsx` + `recommendations_flat.csv` (3482)
- `source_extraction_raw/` : 79 ملف استخراج خام (338 بطاقة / 3482 صفًا)

## فكّ الحزمة وإعادة التوليد (مجلدا عمل معزولان، غير مودَعَين عمداً)
- `extracted/` = فك مباشر للـZIP (لا تعديل على أي ملف بداخله).
- `repro/` = إعادة تشغيل سلسلة `build.py ← finalize.py` من المخرجات الخام:
  `cp -r extracted/scripts repro/scripts && cp -r extracted/source_extraction_raw repro/chunks`
  ثم من `repro/scripts`: `python3 build.py && python3 finalize.py`
- النتيجة: **byte-identical** بين التشغيلات الثلاثة، و`diff -rq` بين `extracted/data/crops` و`repro/final/crops` = **0 اختلاف**.
- مجلدا `extracted/` و`repro/` مُستثنيان في `.gitignore` هذا المجلد (المصدر المودع هو الـZIP نفسه).

## ملفات «الدفعة الأولى» المُعلَنة في المهمة — غير موجودة
بُحثت بالاسم وبالنمط عبر مساحة العمل كاملة وكل الفروع والوسوم وأرشيف ZIP:
- `المستشار_الزراعي_الدفعة_1_cards.json` — **غير موجود**
- ملف المعاينة المصاحب — **غير موجود**
- `تقرير_تدقيق_الدفعة_الأولى_2026-10-19.txt` — **غير موجود**
- `recommendations_audit.xlsx` / `audit_report.html` / `apc_cards_dataset_v2.zip` — **موجودة** (داخل الحزمة، مودعة على الفرع)

أقرب مرشحات موجودة فعلاً (بديلة وثائق لا نسخ بديلة): `tmp/apc/cards2.json` و`backups/stage0-2026-10-19-1115/` و`backups/phase1-prerun-2026-10-19/` (كلها مؤرخة 2026-10-17..19 في مساحة العمل، ليست جزءاً من هذه الحزمة). **لم يُعاد إنتاج أي ترجمة ولم تُنشأ أي بديلة.**
