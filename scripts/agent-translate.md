# تكليف وكيل ذكاء اصطناعي لإضافة لغات جديدة (Translation Agent)

التطبيق يدعم حاليًا: **العربية (الأساسية) · English · Français · 中文**.
إضافة أي لغة جديدة = ترجمة قاموس واحد فقط، دون لمس أي كود آخر.

## كيف يعمل الوكيل

1. افتح `src/i18n.js` — القاموس العربي `ar` هو المصدر الأم (source of truth).
2. أعطِ الوكيل هذا الموجّه (prompt) مع ملف `src/i18n.js` كاملًا:

```
You are a professional localization agent for "المستشار الزراعي" (Agricultural
Advisor), an offline-first pesticide-safety lookup PWA for farmers.

Task: translate the `ar` dictionary in src/i18n.js into <LANGUAGE>.

Rules:
- Translate UI strings only. Keep the same flat keys.
- Keep `{placeholder}` tokens exactly as-is (e.g. {name}, {n}, {a}, {b}).
- Do NOT translate or reinterpret regulatory status values that come from
  databases (they are shown verbatim by design and are not in this dict).
- Keep safety-critical wording conservative: an uncertain match must never
  sound like an approval. Preserve all warnings verbatim in meaning.
- Keep emojis and Arabic numerals/units where present.
- Tone: clear, respectful, simple enough for a farmer; precise enough for
  an agronomist.
- Output: a single JS object literal `<lang>: { ... }` ready to paste as a
  new entry in DICTS, plus a one-line RTL note if the language is RTL.
```

3. أضف الناتج كمدخل جديد في `DICTS` داخل `src/i18n.js`.
4. إن كانت اللغة RTL أضفها إلى كائن `RTL` في نفس الملف.
5. أضف خيارها في قائمة اللغة داخل `index.html`:

```html
<select id="langSelect" ...>
  <option value="<lang>">رمز اللغة</option>
</select>
```

6. شغّل `node tests/verify.mjs` — يجب أن يبقى 99 PASS / 0 FAIL.

## قواعد أمان لا يجوز للوكيل خرقها

- ممنوع تعديل `src/search-core.js` أو `src/ocr.js` أو أي قاعدة بيانات.
- ممنوع "تحسين" نص التحذير الأحمر لقرار 248 أو التخفيف منه.
- الحد الأدنى 80% والتطابق يبقى كما هو — الترجمة لا تمس المنطق أبدًا.
