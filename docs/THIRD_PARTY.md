# سجل مكوّنات الطرف الثالث — المستشار الزراعي

> وُثّق بالفحص المباشر للملفات المستضافة ذاتيًا في `vendor/` بتاريخ 2026-09-20.
> عند تحديث أي مكوّن: حدّث هذا الجدول وملف الترخيص المرافق معًا.

| المكوّن | الملفات | الإصدار | الترخيص | الأصل | ملاحظات التحقق |
|---|---|---|---|---|---|
| tesseract.js | `vendor/tesseract/tesseract.min.js` · `worker.min.js` | 6.0.1 (موثّق في ترويسة `src/ocr.js` ومنطق المحرك) | Apache-2.0 | https://github.com/naptha/tesseract.js | ترويسة الملف تشير إلى `tesseract.min.js.LICENSE.txt` — الملف مستعاد في هذا المستودع |
| Tesseract WASM core (lstm) | `vendor/tesseract/core/tesseract-core-lstm.wasm{,.js}` | متزامن مع tesseract.js 6.0.1 ❓ (لا رقم داخل الملف) | Apache-2.0 | بنيات tesseract-ocr الرسمية عبر حزمة tesseract.js | حجم الملفات 2.87MB/3.95MB (مقاس بالتشغيل) |
| Tesseract WASM core (simd-lstm) | `vendor/tesseract/core/tesseract-core-simd-lstm.wasm{,.js}` | كما أعلاه | Apache-2.0 | كما أعلاه | يُختار تلقائيًا عند دعم SIMD |
| نموذج العربية | `vendor/tesseract/lang/ara.traineddata.gz` | tessdata_fast ❓ (لا رقم داخل الملف) | Apache-2.0 | https://github.com/tesseract-ocr/tessdata_fast | 1.66MB |
| نموذج الإنجليزية | `vendor/tesseract/lang/eng.traineddata.gz` | كما أعلاه | Apache-2.0 | كما أعلاه | 2.95MB |

## إجراء التحقق المستخدم

1. `grep` على ترويسات الملفات للبحث عن إشارات الترخيص — وُجدت في `tesseract.min.js` و`worker.min.js`.
2. الترويسة: `/*! For license information please see tesseract.min.js.LICENSE.txt */` → استعادنا النص الكامل (Apache-2.0) اللازم قانونيًا لأي توزيع.
3. ملفات `.wasm` و`.traineddata.gz` ثنائية ولا تحمل ترويسة نصية → الترخيص موثّق من مصدرها الأصلي (مستودعات tesseract-ocr/tessdata_fast، جميعها Apache-2.0)؛ **رقم الإصدار الدقيق للنماذج غير معروف** من الملفات نفسها (❓) وسجّلناه كما هو دون تخمين.

## قواعد الترخيص في هذا المشروع

- شيفرة التطبيق نفسها: **بلا ملف ترخيص حاليًا** بقرار المستخدم (بوابة السؤال 4) — الحقوق محفوظة للمطوّر.
- تراخيص بيانات القواعد الأربع موثّقة في `docs/data-provenance.md`.
- إعادة توزيع مكوّنات `vendor/` تستلزم إبقاء `tesseract.min.js.LICENSE.txt` معها (شرط Apache-2.0 §4(a)).
