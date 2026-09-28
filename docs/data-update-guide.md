# دليل تحديث القواعد — كل قاعدة في المشروع

> كُتب ليُستخدم **بلا مؤلفه الأصلي**. كل ما يلزم لتجديد أي قاعدة موجود هنا:
> من أين تأتي، بالأمر الذي يجلبها، ما الذي يُكتب، وكيف تُراجَع الفروق قبل أن
> تصل إلى المزارع.
>
> قاعدة واحدة حاكمة: **لا تصحّح قيمة رسمية من تلقاءك.** أي رقم أو اسم يظهر
> مخالفاً في مصدر رسمي يُبلَّغ في سجل الفروق ويُترك حرفياً — نفس سياسة EU/EPA
> المعتمدة في `tools/check-cas-checksums.mjs`.

---

## 0) ما الذي يُبنى ومتى

| القاعدة | في المستودع | تُجلب بـ | تُحدَّث |
|---|---|---|---|
| ليبيا 248 | `data/libya-248.json` | يدوي من المرسوم الرسمي | عند صدور تعديل |
| ليبيا 500 | `data/libya-500.json` | يدوي من المرسوم الرسمي | عند صدور تعديل |
| الاتحاد الأوروبي | `data/eu.json` | `scripts/update-intl-dbs.mjs` | أسبوعياً |
| أمريكا (EPA) | `data/epa.json` + `epa-cancelled.json` | `tools/build-epa-master.js` من دفتر EPA Master | ربعياً |
| كندا (اختياري) | `data-optional/canada.json` | `scripts/build-canada.mjs` | أسبوعياً |
| أستراليا (اختياري) | `data-optional/australia.json` | `scripts/build-australia.mjs` | أسبوعياً |

القواعد الأساسية الخمس **مخزَّنة مسبقاً** في عامل الخدمة. القاعدتان
الاختياريتان **غير مخزَّنتين**: تُنزَّل بطلب المزارع وتُحفظ في IndexedDB بعد
التحقق من بصمة sha256.

---

## 1) القواعد الإلزامية داخل هذا المستودع

```bash
node tools/check-cas-checksums.mjs     # فحص أرقام CAS + اكتمال طبقة التصحيح
node tools/build-epa-master.js         # إعادة بناء America من الدفتر الرسمي
```

`check-cas-checksums` **يُبلّغ ولا يُصحّح**. مخرجه المتوقع: بند لكل قاعدة،
و`checksum-fail` يجب أن يبقى صفراً في القواعد المراجَعة يدوياً. أي قيمة جديدة
فاشلة تُنقل إلى سجل الفروق (القسم 4) قبل أي شيء آخر.

---

## 2) كندا — `scripts/build-canada.mjs`

- **المصدر:** سجل المبيدات الوطني الكندي (Pest Management Regulatory Agency /
  Health Canada)، نقطة الاستخراج العامة **بدون تسجيل دخول**:
  - `https://pest-control.canada.ca/pesticide-registry-api/api/extract/ingredient`
  - `https://pest-control.canada.ca/pesticide-registry-api/api/extract/product`
- **الترخيص:** Open Government Licence – Canada. **الإسناد إلزامي** ويظهر
  حرفياً على بطاقة كل نتيجة من هذه القاعدة:
  `Contains information licensed under the Open Government Licence – Canada.`
- **التشغيل:**

```bash
node scripts/build-canada.mjs            # يكتب data-optional/canada.json + canada.manifest.json
node scripts/build-canada.mjs --out /tmp # تجربة بلا لمس المستودع
```

- **ما يفعله:** يقرأ CSV بترميز **windows-1252** (ليس UTF-8 — التحويل صريح)،
  يوحّد الاسم الإنجليزي، ينقل CAS حرفياً، ويطبع أعداداً:

```
CANADA build — source: PMRA / Health Canada (no login)
  ingredients: 1311 unique (duplicates collapsed: 2)
  products in registry: 21786
  CAS present: 968 | empty: 343 | non-standard (kept verbatim, reported): 0
WROTE data-optional/canada.json
  count=1311  sha256=…
```

- **مراجعة الفروق:** `count` ينقص أو يزيد بأكثر من ~2%؟ اطبع الصفوف
  الجديدة/المحذوفة واقرأها. ارتفاع مفاجئ في `CAS present` يعني غالباً تغيّر
  عمود في المصدر.

---

## 3) أستراليا — `scripts/build-australia.mjs`

- **المصدر:** حزمة APVMA الأسبوعية (PUBCRIS) بلا تسجيل دخول:
  `https://permits.apvma.gov.au/pubcris.zip` (~27 ميغابايت، تُحدَّث أسبوعياً).
也是在 data.gov.au (CKAN) 上按单文件提供，若只想取其中一个文件。
- **الترخيص:** CC-BY 3.0 Australia. **الإسناد إلزامي**:
  `Contains information licensed under the Creative Commons Attribution 3.0 Australia licence.`
- **التشغيل:**

```bash
node scripts/build-australia.mjs                        # ينزّل الحزمة (27MB)
node scripts/build-australia.mjs --zip /tmp/pubcris.zip # يعيد استخدام نسخة محلية
```

- **ما يفعله:** يفك الضغط **في الذاكرة** (zlib المدمج، بلا اعتمادية)، يقرأ
  `product.csv` و`prodcon.csv` و`constit.csv` فقط، ويدمجها إلى صف لكل مادة
  فعّالة مع حالة التسجيل وعدد المنتجات.
- **نقطة أمانة دائمة:** **PUBCRIS لا ينشر أرقام CAS إطلاقاً.** لذلك يبقى
  `cas` فارغاً ولا يُملأ بالاستنتاج من قواعد أخرى — رقم مُستنتَج هوية خاطئة
  محتملة. سكربت الفحص يطبع ذلك صراحةً:
  `NOTE australia: the source publishes no CAS numbers`.

---

## 4) سجل الفروق — البوابة البشرية الإلزامية

قبل أي إيداع يغيّر نتيجة تظهر للمزارع، اكتب هنا:

| التاريخ | القاعدة | ما تغيّر | العدد قبل → بعد | القرار |
|---|---|---|---|---|
| 2026-09-28 | كندا | بناء أولي | 0 → 1311 | قبل: 3 أرقام CAS فاشلة فحص التحقق (DICHLORPROP 53404-23-3، OXYDIETHYLENE… 68609-28-3، OZONE 10028-15-1) — **تُبلَّغ ولا تُصحَّح**، كما هي في المصدر |

القاعدة: كل اختلاف يظهر في `docs/DECISIONS.md` بسطر **قرار** (تُعتمد / تُؤجَّل)
لا بسطر ملاحظة.

---

## 5) بعد البناء — التحقق الإلزامي

```bash
node tools/check-cas-checksums.mjs      # كل القواعد، بما فيها الاختيارية
node tests/data-packs.test.mjs          # المخطّط، الإسناد، بوابة التفعيل
node tests/verify.mjs                   # حوارس السطح
```

ثم **إصدار + كاش** في الإيداع نفسه إن تغيّر أي ملف shell:

- `version.json` و`package.json` للإصدار،
- `const CACHE = 'mustashar-vNN'` في `sw.js`،
- حوارس `verify` / `stage-b` / `stage2-ux` / `stage3-ux` / `preview-live`.

## 6) ما لا يُفعل أبداً

- لا تعديل على `cas_raw` أو قرارا 248/500 الأرقام الرسمية.
- لا استكمال CAS من مصدر آخر بلا سند مُوثَّق.
- لا إدخال نتائج من قاعدة اختيارية لم يضغط المزارع زرها.
- لا نشر إلى `main` ودفع من أي فرع عمل.
