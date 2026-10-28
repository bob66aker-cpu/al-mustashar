# تقرير مراجعة المالك — تدقيق CAS والبيانات الناقصة في حزمة APC 2025

- **المستودع:** `bob66aker-cpu/al-mustashar` · **الفرع:** `audit/apc-2025-data-integration` (مسودة PR #6 — لم تُدمج)
- **تاريخ التحقق:** 2026-10-28 · **الحزمة:** `data/apc2025_review/apc_cards_dataset_v2.zip`
- **المصدر الزراعي المعتمد:** كتاب «التوصيات المعتمدة لمكافحة الآفات الزراعية 2025» (APC 2025) — لا مصادر زراعية أخرى.
- **حالة الإنتاج:** لم يتغير شيء — لا `data/tws` ولا `src/` ولا `index.html` ولا `sw.js` ولا إعدادات النشر؛ ولم يُحذف أي بطاقة أو صف.
- **المصدر الأصلي محفوظ كما هو:** 338 بطاقة · 3482 صف مصدر · 2033 توصية مجمّعة (لم تُمس).

> يفصل هذا التقرير ما **ثبت** عما **لم يثبت**. خانة CAS لا تُملأ إلا برقم منقول من مصدر مفتوح موثوق
> ومشروح، وما لم يثبت يبقى فارغاً أو موسوماً بحالة — لا يُعرض تقديراً كأنه نتيجة.

## أ. ملخص تنفيذي

### أرقام CAS — إجمالي المواد المفحوصة: 273

| البند | العدد | ملاحظة حاسمة |
|---|---:|---|
| إجمالي المواد التي فُحصت | **273** | من `actives.json` بالحزمة (261 برقم مرشح + 12 بلا رقم) |
| أرقام مثبتة من **مصدر أولي** (CAS Registry / Common Chemistry) | **0** | واجهة Common Chemistry أعادت `401 Unauthorized` بتاريخ 2026-10-28 — **لم يُنفَّذ تحقق من المصدر الأولي إطلاقاً** ولا يُدّعى خلافه |
| أرقام مثبتة من **مصدر ثانوي موثوق** (PPDB — جامعة هيرتفوردشاير: صفحة مادة مفتوحة ونُقل رقمها كما هو) | **245** | منها 237 مدعومة أيضاً بقائمة RN في PubChem (درجة عالية)، و8 بلا سجل PubChem بالاسم — خليط/زيت/بوليمر (درجة متوسطة) |
| أرقام **مرشحة غير محسومة** | **16** | 7 تعارض · 7 متوافقة بـPubChem فقط · 1 هوية بالرقم دون مطابقة اسم · 1 بلا أي دليل مفتوح — كلها في الجدول (ج) |
| مواد **لم يُعثر لها على CAS** في المصادر التي فُحصت | **12** | 7 حيوية بلا رقم في الحزمة + 5 كيميائية بلا رقم في الحزمة (4 منها لها مرشح PubChem، و1 بلا نتيجة) |
| حالات ثبت فيها **صراحةً عدم تعيين CAS** (`NO_CAS_ASSIGNED`) | **0** | **لا دليل صريح واحد** — قاعدة: عدم العثور على رقم ≠ إثبات عدم التعيين |
| **المواد الحيوية** — مؤكد (اسم كائن علمي) | **8** | 7 بلا رقم في الحزمة + Bacillus thuringiensis برقم في الحزمة |
| **المواد الحيوية** — محتمل (منتج مشتق حيائياً/نباتياً) | **5** | زيوت/مستخلصات + streptomycin — لا تصنيف نهائي لهما |

### الحقول الأخرى الناقصة أو المتعارضة — 2104 صف مراجعة

| نوع الحقل | العدد |
|---|---:|
| صف مكرر مقترح داخل البطاقة | 1137 |
| phi_days | 427 |
| pest_group | 162 |
| بطاقة فصل الحشائش بلا مقابل في التطبيق | 80 |
| هجاء/صياغة (active name) | 70 |
| قراءة غير مؤكدة (row) | 35 |
| concentration_sum | 20 |
| قراءة غير مؤكدة (card) | 15 |
| formulation_type | 14 |
| who | 13 |
| محصول الحزمة بلا معرّف مقابل في التطبيق | 13 |
| تقاطع معرّف محصول مرفوض ظاهرياً | 8 |
| concentration | 5 |
| هجاء/صياغة (onion-pests-02) | 4 |
| mrl | 3 |
| بطاقة مكررة مقترحة | 2 |
| هجاء/صياغة (sugar-beet-pests-05:guidance_ar) | 2 |
| هجاء/صياغة (potato-pests-10:appearance_ar) | 2 |
| هجاء/صياغة (carrot-pests-03:appearance_ar) | 2 |
| هجاء/صياغة (snap-bean-pests-04:appearance_ar) | 2 |
| هجاء/صياغة (mango-pests-06:appearance_ar) | 2 |
| هجاء/صياغة (snails-pests-01:onset_ar) | 2 |
| هجاء/صياغة (roselle-pests-01:appearance_ar) | 2 |
| هجاء/صياغة (maize-pests-02:guidance_ar) | 2 |
| هجاء/صياغة (sugar-beet-pests-05) | 2 |
| هجاء/صياغة (seed-watermelon-pests-06) | 2 |
| هجاء/صياغة (wheat-weeds-09) | 2 |
| هجاء/صياغة (wheat-pests-03:appearance_ar) | 1 |
| هجاء/صياغة (faba-bean-pests-03:pest_name_ar) | 1 |
| هجاء/صياغة (onion-pests-03:control_timing_ar) | 1 |
| هجاء/صياغة (onion-pests-05:appearance_ar) | 1 |
| هجاء/صياغة (garlic-pests-01:appearance_ar) | 1 |
| هجاء/صياغة (cotton-pests-01:appearance_ar) | 1 |
| هجاء/صياغة (sugarcane-pests-04:control_timing_ar) | 1 |
| هجاء/صياغة (peanut-pests-04:onset_ar) | 1 |
| هجاء/صياغة (peanut-pests-05:onset_ar) | 1 |
| هجاء/صياغة (sesame-pests-01:appearance_ar) | 1 |
| هجاء/صياغة (sesame-pests-01:onset_ar) | 1 |
| هجاء/صياغة (tomato-pests-02:appearance_ar) | 1 |
| هجاء/صياغة (tomato-pests-12:appearance_ar) | 1 |
| هجاء/صياغة (tomato-pests-14:appearance_ar) | 1 |
| هجاء/صياغة (potato-pests-12:appearance_ar) | 1 |
| هجاء/صياغة (pepper-pests-02:appearance_ar) | 1 |
| هجاء/صياغة (cucumber-pests-01:onset_ar) | 1 |
| هجاء/صياغة (seed-squash-pests-01:appearance_ar) | 1 |
| هجاء/صياغة (shammam-pests-02:guidance_ar) | 1 |
| هجاء/صياغة (cantaloupe-pests-03:appearance_ar) | 1 |
| هجاء/صياغة (cantaloupe-pests-08:appearance_ar) | 1 |
| هجاء/صياغة (honeydew-pests-02:appearance_ar) | 1 |
| هجاء/صياغة (strawberry-pests-02:onset_ar) | 1 |
| هجاء/صياغة (strawberry-pests-03:appearance_ar) | 1 |
| هجاء/صياغة (turf-pests-01:appearance_ar) | 1 |
| هجاء/صياغة (turf-pests-01:control_timing_ar) | 1 |
| هجاء/صياغة (citrus-pests-05:appearance_ar) | 1 |
| هجاء/صياغة (citrus-pests-10:pest_name_ar) | 1 |
| هجاء/صياغة (mango-pests-06:onset_ar) | 1 |
| هجاء/صياغة (grape-pests-02:appearance_ar) | 1 |
| هجاء/صياغة (grape-pests-06:appearance_ar) | 1 |
| هجاء/صياغة (pomegranate-pests-03:onset_ar) | 1 |
| هجاء/صياغة (apple-pests-01:appearance_ar) | 1 |
| هجاء/صياغة (apple-pests-02:pest_name_ar) | 1 |
| هجاء/صياغة (pear-pests-03:pest_name_ar) | 1 |
| هجاء/صياغة (pear-pests-03:appearance_ar) | 1 |
| هجاء/صياغة (apricot-pests-01:appearance_ar) | 1 |
| هجاء/صياغة (banana-pests-01:guidance_ar) | 1 |
| هجاء/صياغة (stored-products-pests-02:appearance_ar) | 1 |
| هجاء/صياغة (snails-pests-01:guidance_ar) | 1 |
| هجاء/صياغة (rice-pests-02:appearance_ar) | 1 |
| هجاء/صياغة (maize-pests-01:onset_ar) | 1 |
| هجاء/صياغة (maize-pests-01:guidance_ar) | 1 |
| هجاء/صياغة (maize-pests-04:appearance_ar) | 1 |
| هجاء/صياغة (maize-pests-04:guidance_ar) | 1 |
| هجاء/صياغة (wheat-pests-01) | 1 |
| هجاء/صياغة (wheat-pests-02) | 1 |
| هجاء/صياغة (wheat-pests-05) | 1 |
| هجاء/صياغة (wheat-pests-06) | 1 |
| هجاء/صياغة (garlic-pests-02) | 1 |
| هجاء/صياغة (sugar-beet-pests-01) | 1 |
| هجاء/صياغة (sugar-beet-pests-02) | 1 |
| هجاء/صياغة (cotton-pests-01) | 1 |
| هجاء/صياغة (sugarcane-pests-01) | 1 |
| هجاء/صياغة (peanut-pests-01) | 1 |
| هجاء/صياغة (peanut-pests-02) | 1 |
| هجاء/صياغة (peanut-pests-03) | 1 |
| هجاء/صياغة (sunflower-pests-02) | 1 |
| هجاء/صياغة (tomato-pests-01) | 1 |
| هجاء/صياغة (tomato-pests-13) | 1 |
| هجاء/صياغة (tomato-pests-14) | 1 |
| هجاء/صياغة (potato-pests-11) | 1 |
| هجاء/صياغة (cucumber-pests-09) | 1 |
| هجاء/صياغة (watermelon-pests-01) | 1 |
| هجاء/صياغة (grape-pests-08) | 1 |
| هجاء/صياغة (guava-pests-03) | 1 |
| هجاء/صياغة (pomegranate-pests-02) | 1 |
| هجاء/صياغة (wheat-weeds-07) | 1 |
| هجاء/صياغة (flax-weeds-01) | 1 |
| هجاء/صياغة (rice-weeds-08) | 1 |
| هجاء/صياغة (rice-weeds-12) | 1 |
| هجاء/صياغة (tomato-weeds-18) | 1 |
| هجاء/صياغة (potato-weeds-18) | 1 |
| هجاء/صياغة (grape-weeds-12) | 1 |
| **المجموع** | **2104** |

**قرارات حاسمة تنتظر المالك:** 7 تعارضات CAS (منها 3 يثبت فحص الهوية أنها أرقام أشكال/ملحات مختلفة) · 5 مواد كيميائية بلا رقم في الحزمة ·
80 بطاقة حشائش بلا مقابل في التطبيق · 381 مجموعة تكرار مقترح داخل البطاقات · 427 خانة فترة أمان فارغة أو متعارضة (منها 266 في العنب) · 3 محاصيل بلا معرّف مقابل.

## ب. جدول CAS المثبتة

عدد الصفوف: **245** من 273. «مثبت» هنا = **نُقل رقم CAS من صفحة مادة PPDB مفتوحة فعلياً وطابق الرقم الذي يعيده PubChem للاسم نفسه** — ولا يعني «مثبتاً من المرجعية الأمريكية CAS Registry» لأن تلك الواجهة مغلقة (انظر (و)). الدرجة الكاملة وسبب المطابقة وملاحظات اختلاف الشكل/الملح في `owner-review-cas.csv`.

**المفتاح:** «عالية» = مصدران مستقلان (PPDB + PubChem) · «متوسطة» = PPDB وحده وبلا سجل PubChem بالاسم.

| # | الاسم الأصلي (الكتاب) | الاسم المطابق في المصدر | رقم CAS | الدرجة | المصدر والرابط المباشر | صفحات الطباعة | صفوف المصدر |
|---:|---|---|---|---|---|---|---:|
| 1 | 1,3-Dichloropropene | 1,3-dichloropropene | `542-75-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1.htm) | 111 + 196 | 2 |
| 2 | Acequinocyl | Acequinocyl | `57960-19-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/10.htm) | 74 + 75 + 76 + 77 | 1 |
| 3 | Acetamiprid | Acetamiprid | `135410-20-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/11.htm) | 20 + 21 + 22 + 23 + 24 + 31 + 32 + 46 + 47 + 50 + 62 + 63 + 64 + 65 + 66 + 67 + 68 + 69 + 70 + 71 + 91 + 113 + 114 + 117 + 124 + 125 + 126 + 127 + 150 + 168 + 175 + 178 + 179 + 185 + 188 + 189 + 197 + 198 + 199 + 200 + 203 + 238 | 125 |
| 4 | Aclonifen | Aclonifen | `74070-46-5` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/15.htm) | 315 | 1 |
| 5 | Afidopyropen | Afidopyropen | `915972-17-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2636.htm) | 62 + 63 + 64 + 65 + 91 + 92 | 2 |
| 6 | Alpha-cypermethrin | Alpha-cypermethrin | `67375-30-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/24.htm) | 35 + 36 + 37 + 61 + 201 + 202 + 245 | 24 |
| 7 | Aluminium phosphide | Aluminium phosphide | `20859-73-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/523.htm) | 263 + 264 | 8 |
| 8 | Ametoctradin | Ametoctradin | `865318-97-4` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1648.htm) | 11 + 12 + 106 + 107 + 108 + 109 + 110 + 231 + 232 + 233 + 234 + 235 | 4 |
| 9 | Amicarbazone | Amicarbazone | `129909-90-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1159.htm) | 308 | 1 |
| 10 | Amisulbrom | Amisulbrom | `348635-87-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1137.htm) | 106 + 107 + 108 + 109 + 110 | 1 |
| 11 | Azadirachtin | Azadirachtin A | `11141-17-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/46.htm) | 62 + 63 + 64 + 65 + 87 + 88 | 3 |
| 12 | Azoxystrobin | Azoxystrobin | `131860-33-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/54.htm) | 5 + 6 + 11 + 12 + 17 + 18 + 26 + 27 + 28 + 43 + 48 + 49 + 54 + 55 + 56 + 59 + 78 + 79 + 80 + 81 + 82 + 83 + 84 + 85 + 86 + 97 + 101 + 102 + 103 + 104 + 105 + 106 + 107 + 108 + 109 + 110 + 116 + 121 + 131 + 132 + 133 + 134 + 135 + 136 + 137 + 138 + 139 + 142 + 143 + 147 + 151 + 152 + 158 + 159 + 160 + 162 + 192 + 198 + 212 + 215 + 216 + 217 + 224 + 225 + 226 + 227 + 228 + 229 + 230 + 231 + 232 + 233 + 234 + 235 + 243 + 250 + 251 + 257 + 258 + 259 + 260 + 261 | 200 |
| 13 | Bacillus thuringiensis | Bacillus thuringiensis Berliner subsp. japonensis | `68038-71-1` | متوسطة | PPDB · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1943.htm) | 30 + 33 + 46 + 47 + 67 + 68 + 69 + 70 + 71 + 93 + 94 + 190 + 221 + 222 + 240 + 245 | 21 |
| 14 | Benalaxyl | Benalaxyl | `71626-11-4` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/59.htm) | 84 + 85 + 86 + 106 + 107 + 108 + 109 + 110 + 231 + 232 + 233 + 234 + 235 | 5 |
| 15 | Bensulfuron-methyl | Bensulfuron-methyl | `83055-99-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/68.htm) | 294 + 295 + 296 + 299 + 300 + 301 | 5 |
| 16 | Bentazone | Bentazone | `25057-89-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/71.htm) | 276 + 294 + 295 + 296 + 300 + 301 + 302 + 309 + 310 + 311 + 320 + 326 | 32 |
| 17 | Benthiavalicarb-isopropyl | Benthiavalicarb-isopropyl | `177406-68-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2172.htm) | 106 + 107 + 108 + 109 + 110 | 1 |
| 18 | Beta-cyfluthrin | Beta-cyfluthrin | `1820573-27-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/74.htm) | 62 + 63 + 64 + 65 + 90 + 178 + 183 + 184 + 197 + 198 + 201 + 202 + 214 | 15 |
| 19 | Bifenazate | Bifenazate | `149877-41-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/76.htm) | 74 + 75 + 76 + 77 + 120 + 129 + 130 + 190 + 191 + 203 + 204 + 205 + 206 + 207 + 223 + 248 + 249 | 38 |
| 20 | Bifenthrin | Bifenthrin | `82657-04-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/78.htm) | 17 + 20 + 21 + 22 + 23 + 24 + 46 + 47 + 62 + 63 + 64 + 65 + 67 + 68 + 69 + 70 + 71 + 89 + 114 + 115 + 119 + 120 + 124 + 125 + 126 + 127 + 128 + 168 + 170 + 175 + 185 + 188 + 189 + 197 + 198 + 220 + 238 + 245 + 246 | 36 |
| 21 | Bispyribac-sodium | Bispyribac-sodium | `125401-92-5` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/83.htm) | 293 + 294 + 295 + 296 + 297 + 298 + 299 + 300 + 301 | 21 |
| 22 | Bistrifluron | Bistrifluron | `201593-84-2` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1018.htm) | 62 + 63 + 64 + 65 | 1 |
| 23 | Bordeaux mixture | Bordeaux mixture | `8011-63-0` | متوسطة | PPDB · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/85.htm) | 81 + 82 + 83 + 231 + 232 + 233 + 234 + 235 | 4 |
| 24 | Boscalid | Boscalid | `188425-85-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/86.htm) | 26 + 27 + 28 + 78 + 79 + 81 + 82 + 83 + 101 + 102 + 103 + 104 + 105 + 121 + 134 + 135 + 136 + 137 + 138 + 139 + 146 + 154 + 161 + 162 + 182 + 192 + 212 + 224 + 225 + 226 + 227 + 228 + 229 + 230 + 231 + 232 + 233 + 234 + 235 + 250 + 251 + 252 + 253 + 257 + 258 | 59 |
| 25 | Bromadiolone | Bromadiolone | `28772-56-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/89.htm) | 265 + 266 | 2 |
| 26 | Bromoxynil | Bromoxynil | `1689-84-5` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/96.htm) | 269 + 270 | 1 |
| 27 | Bromoxynil octanoate | Bromoxynil-octanoate | `1689-99-2` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/746.htm) | 269 + 270 + 276 + 305 + 306 | 8 |
| 28 | Bupirimate | Bupirimate | `41483-43-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/99.htm) | 215 + 216 | 1 |
| 29 | Butralin | Butralin | `33629-47-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/104.htm) | 290 + 303 + 304 + 319 + 325 | 5 |
| 30 | Cadusafos | Cadusafos | `95465-99-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/106.htm) | 29 + 87 + 88 + 111 + 197 + 210 + 261 + 262 | 8 |
| 31 | Captan | Captan | `133-06-2` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/114.htm) | 59 + 195 + 231 + 232 + 233 + 234 + 235 + 252 + 253 | 9 |
| 32 | Carboxin | Carboxin | `5234-68-4` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/122.htm) | 4 | 1 |
| 33 | Carfentrazone-ethyl | Carfentrazone-ethyl | `128639-02-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/123.htm) | 269 + 270 + 271 + 272 + 273 + 292 + 293 + 294 + 295 + 296 + 302 + 303 + 304 + 322 | 15 |
| 34 | Chlorantraniliprole | Chlorantraniliprole | `500008-45-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1138.htm) | 46 + 47 + 67 + 68 | 2 |
| 35 | Chlorfenapyr | Chlorfenapyr | `122453-73-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/136.htm) | 17 + 21 + 22 + 23 + 24 + 38 + 46 + 47 + 69 + 70 + 71 + 74 + 75 + 76 + 77 + 96 + 114 + 115 + 170 + 180 + 205 + 206 + 207 + 223 + 256 + 257 | 45 |
| 36 | Chlorfluazuron | Chlorfluazuron | `71422-67-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/139.htm) | 33 + 34 + 95 | 5 |
| 37 | Chloropicrin | Chloropicrin | `76-06-2` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/148.htm) | 196 | 1 |
| 38 | Chlorothalonil | Chlorothalonil | `1897-45-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/150.htm) | 11 + 12 + 14 + 15 + 56 + 79 + 80 + 81 + 82 + 83 + 84 + 85 + 86 + 101 + 102 + 103 + 104 + 105 + 106 + 107 + 108 + 109 + 110 + 121 + 136 + 137 + 138 + 139 + 148 + 151 + 152 + 153 + 154 + 160 + 193 + 194 + 231 + 232 + 233 + 234 + 235 | 57 |
| 39 | Chromafenozide | Chromafenozide | `143807-66-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1136.htm) | 21 + 22 + 23 + 24 + 69 + 70 + 71 | 2 |
| 40 | Citronella oil | Citronella oil | `8000-29-1` | متوسطة | PPDB · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1463.htm) | 237 | 1 |
| 41 | Clethodim | Clethodim | `99129-21-2` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/164.htm) | 277 + 279 + 280 + 282 + 286 + 287 + 310 + 313 + 316 + 317 + 318 + 321 + 324 + 332 + 343 | 52 |
| 42 | Clodinafop-propargyl | Clodinafop-propargyl | `105512-06-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/165.htm) | 271 + 272 + 273 + 274 + 275 | 19 |
| 43 | Clofentezine | Clofentezine | `74115-24-5` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/167.htm) | 74 + 75 + 76 + 77 + 129 + 130 + 205 + 206 + 207 | 6 |
| 44 | Clomazone | Clomazone | `81777-89-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/168.htm) | 311 + 319 + 327 + 328 + 334 | 5 |
| 45 | Clopyralid | Clopyralid | `1702-17-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/169.htm) | 303 + 304 | 1 |
| 46 | Clothianidin | Clothianidin | `210880-92-5` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/171.htm) | 69 + 70 + 71 + 119 + 120 + 128 + 164 | 6 |
| 47 | CO2 | Carbon dioxide | `124-38-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/119.htm) | 263 + 264 | 2 |
| 48 | Copper hydroxide | Copper II hydroxide | `20427-59-2` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/175.htm) | 11 + 12 + 26 + 27 + 28 + 81 + 82 + 83 + 101 + 102 + 103 + 104 + 105 + 106 + 107 + 108 + 109 + 110 + 136 + 137 + 138 + 139 + 207 + 208 + 212 + 217 + 231 + 232 + 233 + 234 + 235 + 260 | 29 |
| 49 | Copper oxychloride | Copper oxychloride | `1332-40-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/177.htm) | 11 + 12 + 26 + 27 + 28 + 42 + 43 + 81 + 82 + 83 + 84 + 85 + 86 + 101 + 102 + 103 + 104 + 105 + 106 + 107 + 108 + 109 + 110 + 136 + 137 + 138 + 139 + 158 + 159 + 207 + 208 + 217 + 218 + 231 + 232 + 233 + 234 + 235 + 240 + 254 | 79 |
| 50 | Cyantraniliprole | Cyantraniliprole | `736994-63-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1662.htm) | 46 + 47 + 62 + 63 + 64 + 65 | 2 |
| 51 | Cyazofamid | Cyazofamid | `120116-88-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/186.htm) | 11 + 12 + 81 + 82 + 83 + 106 + 107 + 108 + 109 + 110 + 136 + 137 + 138 + 139 + 141 + 192 | 9 |
| 52 | Cycloxydim | Cycloxydim | `101205-02-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/189.htm) | 286 + 287 | 1 |
| 53 | Cyflufenamid | Cyflufenamid | `180409-60-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/191.htm) | 79 + 80 + 134 + 135 + 226 + 227 + 228 + 229 + 230 + 231 | 5 |
| 54 | Cyflumetofen | Cyflumetofen | `400882-07-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1143.htm) | 60 + 144 + 145 + 247 + 248 | 3 |
| 55 | Cyhalofop-butyl | Cyhalofop-butyl | `122008-85-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/193.htm) | 293 + 294 + 295 + 296 + 297 + 298 + 299 + 300 + 301 | 21 |
| 56 | Cymoxanil | Cymoxanil | `57966-95-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/196.htm) | 11 + 12 + 79 + 80 + 81 + 82 + 83 + 84 + 85 + 86 + 101 + 102 + 103 + 104 + 105 + 106 + 107 + 108 + 109 + 110 + 136 + 137 + 138 + 139 + 153 + 154 + 158 + 159 + 231 + 232 + 233 + 234 + 235 | 85 |
| 57 | Cypermethrin | Cypermethrin | `52315-07-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/197.htm) | 35 + 36 + 37 + 45 + 61 | 10 |
| 58 | Cyproconazole | Cyproconazole | `94361-06-5` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/198.htm) | 5 + 6 + 26 + 27 + 28 + 55 + 56 + 158 + 159 + 192 + 193 + 194 + 231 + 232 + 233 + 234 + 235 + 259 + 260 + 261 | 14 |
| 59 | Cyprodinil | Cyprodinil | `121552-61-2` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/199.htm) | 14 + 15 + 122 + 131 + 192 + 224 + 225 | 15 |
| 60 | Cyprosulfamide | Cyprosulfamide | `221667-31-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1283.htm) | 303 + 304 | 1 |
| 61 | Cyromazine | Cyromazine | `66215-27-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/200.htm) | 25 + 67 + 68 + 74 + 93 + 94 + 163 | 7 |
| 62 | Dazomet | Dazomet | `533-74-4` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/203.htm) | 196 | 1 |
| 63 | Deltamethrin | Deltamethrin | `52918-63-5` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/205.htm) | 35 + 36 + 37 + 61 + 178 + 201 + 202 | 7 |
| 64 | Desmedipham | Desmedipham | `13684-56-5` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/207.htm) | 283 + 284 + 285 + 286 + 287 | 18 |
| 65 | Dicamba | Dicamba | `1918-00-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/213.htm) | 269 + 270 + 300 + 301 + 302 + 305 + 306 + 341 + 344 + 345 | 9 |
| 66 | Difenoconazole | Difenoconazole | `119446-68-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/230.htm) | 4 + 5 + 6 + 7 + 11 + 12 + 17 + 18 + 26 + 27 + 28 + 55 + 56 + 79 + 80 + 81 + 82 + 83 + 84 + 85 + 86 + 91 + 101 + 102 + 103 + 104 + 105 + 106 + 107 + 108 + 109 + 110 + 115 + 134 + 135 + 139 + 142 + 143 + 151 + 158 + 159 + 160 + 166 + 195 + 198 + 212 + 215 + 216 + 217 + 226 + 227 + 228 + 229 + 230 + 231 + 232 + 233 + 234 + 235 + 243 + 250 + 251 + 252 + 253 + 257 + 258 | 152 |
| 67 | Diflubenzuron | Diflubenzuron | `35367-38-5` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/234.htm) | 21 + 22 + 23 + 24 + 33 + 34 + 69 + 70 + 71 + 93 + 94 | 11 |
| 68 | Diflufenican | Diflufenican | `83164-33-4` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/235.htm) | 269 + 270 + 274 + 275 + 294 + 295 + 296 + 300 + 301 + 309 | 7 |
| 69 | Dimethomorph | Dimethomorph | `110488-70-5` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/245.htm) | 11 + 12 + 17 + 18 + 19 + 79 + 80 + 81 + 82 + 83 + 84 + 85 + 86 + 101 + 102 + 103 + 104 + 105 + 106 + 107 + 108 + 109 + 110 + 136 + 137 + 138 + 139 + 147 + 148 + 152 + 157 + 158 + 159 + 181 + 192 + 193 + 194 + 224 + 225 + 226 + 227 + 228 + 229 + 230 + 231 + 232 + 233 + 234 + 235 | 97 |
| 70 | Dimethyl disulfide | Dimethyl disulfide | `624-92-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2886.htm) | 196 | 1 |
| 71 | Dinotefuran | Dinotefuran | `165252-70-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1195.htm) | 8 + 62 + 63 + 64 + 65 + 66 + 119 + 126 + 127 + 169 | 14 |
| 72 | Diquat dibromide | Diquat dibromide | `85-00-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/256.htm) | 322 | 7 |
| 73 | Dithianon | Dithianon | `3347-22-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/258.htm) | 84 + 85 + 86 + 172 + 217 + 257 + 258 | 4 |
| 74 | Dodine | Dodine | `2439-10-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/263.htm) | 252 + 253 | 1 |
| 75 | Emamectin benzoate | Emamectin benzoate | `155569-91-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1326.htm) | 16 + 20 + 21 + 22 + 23 + 24 + 35 + 36 + 37 + 46 + 47 + 51 + 67 + 68 + 69 + 70 + 71 + 73 + 74 + 75 + 76 + 77 + 93 + 94 + 95 + 112 + 113 + 143 + 173 + 175 + 178 + 184 + 201 + 202 + 221 + 222 | 127 |
| 76 | Esfenvalerate | Esfenvalerate | `66230-04-4` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/269.htm) | 73 | 2 |
| 77 | Ethofumesate | Ethofumesate | `26225-79-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/278.htm) | 283 + 284 + 285 + 286 + 287 | 17 |
| 78 | Ethoprophos | Ethoprophos | `13194-48-4` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/279.htm) | 41 + 87 + 88 + 111 + 112 + 177 + 210 + 236 + 261 + 262 | 15 |
| 79 | Etofenprox | Etofenprox | `80844-07-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/283.htm) | 62 + 63 + 64 + 65 + 91 + 122 + 156 | 8 |
| 80 | Etoxazole | Etoxazole | `153233-91-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/284.htm) | 74 + 75 + 76 + 77 + 157 + 165 + 190 + 191 + 197 + 198 + 203 + 204 + 205 + 206 + 207 + 247 + 248 + 249 | 16 |
| 81 | Famoxadone | Famoxadone | `131807-57-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/287.htm) | 79 + 80 + 81 + 82 + 83 + 84 + 85 + 86 + 101 + 102 + 103 + 104 + 105 + 106 + 107 + 108 + 109 + 110 + 136 + 137 + 138 + 139 + 231 + 232 + 233 + 234 + 235 | 28 |
| 82 | Fenazaquin | Fenazaquin | `120928-09-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/292.htm) | 74 + 75 + 76 + 77 | 2 |
| 83 | Fenhexamid | Fenhexamid | `126833-17-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/298.htm) | 77 + 131 + 192 + 224 + 225 | 6 |
| 84 | Fenoxaprop-P-ethyl | Fenoxaprop-P-ethyl | `71283-80-2` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/303.htm) | 269 + 270 + 271 + 272 + 273 + 296 + 297 + 298 + 299 + 316 | 14 |
| 85 | Fenoxasulfone | Fenoxasulfone | `639826-16-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1653.htm) | 293 + 298 | 2 |
| 86 | Fenpropathrin | Fenpropathrin | `39515-41-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/306.htm) | 197 + 198 | 1 |
| 87 | Fenpyrazamine | Fenpyrazamine | `473798-59-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2010.htm) | 192 + 224 + 225 | 2 |
| 88 | Fenpyroximate | Fenpyroximate | `134098-61-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/309.htm) | 38 + 60 + 62 + 63 + 64 + 65 + 123 + 144 + 145 + 203 + 204 + 205 + 206 + 207 + 223 + 242 + 243 + 247 + 248 + 249 | 32 |
| 89 | Flometoquin | Flometoquin | `875775-74-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2922.htm) | 62 + 63 + 64 + 65 | 1 |
| 90 | Flonicamid | Flonicamid | `158062-67-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/321.htm) | 3 + 10 + 66 + 69 + 70 + 71 + 91 + 92 + 149 | 13 |
| 91 | Florasulam | Florasulam | `145701-23-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/322.htm) | 269 + 270 + 271 + 272 + 273 + 274 + 275 + 302 + 303 + 304 | 18 |
| 92 | Fluazifop-P-butyl | Fluazifop-P-butyl | `79241-46-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/324.htm) | 279 + 280 + 286 + 287 + 294 + 310 + 313 + 318 + 320 + 321 + 327 + 330 + 339 + 349 | 25 |
| 93 | Fluazinam | Fluazinam | `79622-59-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/325.htm) | 5 + 6 + 11 + 12 + 55 + 56 + 84 + 85 + 86 + 97 + 100 + 106 + 107 + 108 + 109 + 110 + 186 + 231 + 232 + 233 + 234 + 235 + 250 + 251 | 23 |
| 94 | Flubendiamide | Flubendiamide | `272451-65-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1132.htm) | 48 + 67 + 68 + 69 + 70 + 71 | 3 |
| 95 | Fludioxonil | Fludioxonil | `131341-86-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/330.htm) | 4 + 7 + 14 + 15 + 39 + 43 + 48 + 49 + 54 + 55 + 57 + 78 + 79 + 91 + 92 + 97 + 99 + 122 + 126 + 127 + 131 + 134 + 135 + 192 + 224 + 225 | 54 |
| 96 | Flufenacet | Flufenacet | `142459-58-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/331.htm) | 274 + 275 | 1 |
| 97 | Flufenoxuron | Flufenoxuron | `101463-69-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/332.htm) | 33 + 34 + 69 + 70 + 71 + 95 | 4 |
| 98 | Flumetsulam | Flumetsulam | `98967-40-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/334.htm) | 269 + 270 + 274 + 275 + 288 + 300 + 301 + 303 + 304 + 320 + 325 | 15 |
| 99 | Fluopicolide | Fluopicolide | `239110-15-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/337.htm) | 106 + 107 + 108 + 109 + 110 + 136 + 137 + 138 + 139 + 231 + 232 + 233 + 234 + 235 | 4 |
| 100 | Fluopyram | Fluopyram | `658066-35-4` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1362.htm) | 79 + 80 + 87 + 88 + 101 + 102 + 103 + 104 + 105 + 112 + 131 + 140 + 192 + 193 + 194 + 226 + 227 + 228 + 229 + 230 + 231 + 261 + 262 | 10 |
| 101 | Fluoxastrobin | Fluoxastrobin | `361377-29-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/340.htm) | 106 + 107 + 108 + 109 + 110 + 226 + 227 + 228 + 229 + 230 + 231 + 232 + 233 + 234 + 235 | 3 |
| 102 | Flupyradifurone | Flupyradifurone | `951659-40-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2620.htm) | 62 + 63 + 64 + 65 + 126 + 127 | 2 |
| 103 | Fluroxypyr | Fluroxypyr | `69377-81-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/347.htm) | 302 + 307 | 3 |
| 104 | Fluroxypyr-meptyl | Fluroxypyr-meptyl | `81406-37-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1120.htm) | 296 + 297 + 300 + 301 + 302 + 303 + 304 | 5 |
| 105 | Flutolanil | Flutolanil | `66332-96-5` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/352.htm) | 39 + 56 + 78 + 79 | 3 |
| 106 | Flutriafol | Flutriafol | `76674-21-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/353.htm) | 48 + 49 + 226 + 227 + 228 + 229 + 230 + 231 | 2 |
| 107 | Fluxapyroxad | Fluxapyroxad | `907204-31-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2002.htm) | 134 + 135 + 226 + 227 + 228 + 229 + 230 + 231 | 3 |
| 108 | Folpet | Folpet | `133-07-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/354.htm) | 106 + 107 + 108 + 109 + 110 + 195 + 231 + 232 + 233 + 234 + 235 | 5 |
| 109 | Fomesafen | Fomesafen | `72178-02-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/355.htm) | 309 + 310 + 311 + 319 | 5 |
| 110 | Foramsulfuron | Foramsulfuron | `173159-57-4` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/357.htm) | 283 + 284 + 303 + 304 | 2 |
| 111 | Formetanate | Formetanate | `22259-30-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/360.htm) | 10 | 1 |
| 112 | Fosetyl-aluminium | Fosetyl-aluminium | `39148-24-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/363.htm) | 11 + 12 + 26 + 27 + 28 + 78 + 79 + 131 + 132 + 133 + 136 + 137 + 138 + 139 + 194 + 208 + 231 + 232 + 233 + 234 + 235 | 33 |
| 113 | Fosthiazate | Fosthiazate | `98886-44-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/364.htm) | 29 + 44 + 56 + 57 + 87 + 88 + 140 + 210 + 236 + 261 + 262 | 38 |
| 114 | Glufosinate ammonium | Glufosinate-ammonium | `77182-82-2` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/372.htm) | 322 + 335 + 336 + 337 + 338 + 341 + 342 + 344 + 345 + 346 | 34 |
| 115 | Glyphosate ammonium | Glyphosate-monoammonium | `114370-14-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/3314.htm) | 335 + 336 + 337 + 338 + 341 + 344 + 345 + 346 | 12 |
| 116 | Glyphosate diammonium | Glyphosate-diammonium | `69254-40-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/3312.htm) | 344 + 345 | 1 |
| 117 | Glyphosate isopropylammonium | Glyphosate-isopropylamine | `38641-94-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2395.htm) | 335 + 336 + 337 + 338 + 341 + 344 + 345 + 346 + 350 | 69 |
| 118 | Halauxifen-methyl | Halauxifen-methyl | `943831-98-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2631.htm) | 269 + 270 + 274 + 275 | 3 |
| 119 | Halosulfuron-methyl | Halosulfuron-methyl | `100784-20-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1117.htm) | 294 + 295 + 296 + 300 + 301 + 305 | 8 |
| 120 | Haloxyfop-P-methyl | Haloxyfop-P-methyl | `72619-32-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1068.htm) | 279 + 280 + 283 + 284 + 286 + 287 + 310 + 316 + 320 + 321 + 343 | 23 |
| 121 | Hexaflumuron | Hexaflumuron | `86479-06-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/383.htm) | 33 + 34 + 67 + 68 | 8 |
| 122 | Hexythiazox | Hexythiazox | `78587-05-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/385.htm) | 54 + 74 + 75 + 76 + 77 + 129 + 130 + 144 + 145 + 157 + 165 + 190 + 191 + 203 + 204 + 223 + 242 + 243 + 247 + 248 + 249 + 256 + 257 | 36 |
| 123 | Hymexazol | Hymexazol | `10004-44-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/388.htm) | 54 + 55 + 78 + 79 + 97 + 98 + 131 + 132 + 133 + 194 | 35 |
| 124 | Imazalil | Imazalil | `35554-44-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/390.htm) | 101 | 1 |
| 125 | Imazamox | Imazamox | `114311-32-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/392.htm) | 311 | 1 |
| 126 | Imazapic | Imazapic | `104098-48-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1152.htm) | 309 + 312 + 347 + 348 | 10 |
| 127 | Imazethapyr | Imazethapyr | `81335-77-5` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/395.htm) | 311 + 314 + 328 | 3 |
| 128 | Imicyafos | Imicyafos | `140163-89-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1365.htm) | 87 + 88 | 1 |
| 129 | Imidacloprid | Imidacloprid | `138261-41-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/397.htm) | 62 + 63 + 64 + 65 + 66 + 91 + 92 + 119 + 124 + 125 + 126 + 127 + 129 + 130 + 197 + 198 | 71 |
| 130 | Indaziflam | Indaziflam | `950782-86-2` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1663.htm) | 338 | 1 |
| 131 | Iodosulfuron-methyl-sodium | Iodosulfuron-methyl-sodium | `144550-36-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/401.htm) | 274 + 275 | 4 |
| 132 | Iprovalicarb | Iprovalicarb | `140923-17-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/404.htm) | 11 + 12 + 84 + 85 + 86 + 231 + 232 + 233 + 234 + 235 | 3 |
| 133 | Isoprothiolane | Isoprothiolane | `50512-35-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/408.htm) | 42 | 2 |
| 134 | Isoxaflutole | Isoxaflutole | `141112-29-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/412.htm) | 303 + 304 + 306 | 3 |
| 135 | Jojoba oil | Jojoba oil | `61789-91-1` | متوسطة | PPDB · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2056.htm) | 67 + 68 | 1 |
| 136 | Kasugamycin | Kasugamycin | `6980-18-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2195.htm) | 26 + 27 + 28 + 255 | 5 |
| 137 | Kresoxim-methyl | Kresoxim-methyl | `143390-89-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/414.htm) | 134 + 135 + 136 + 137 + 138 + 139 + 146 + 167 + 171 + 226 + 227 + 228 + 229 + 230 + 231 + 250 + 251 + 252 + 253 | 21 |
| 138 | Lambda-cyhalothrin | Lambda-cyhalothrin | `91465-08-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/415.htm) | 20 + 31 + 32 + 33 + 34 + 35 + 36 + 37 + 46 + 47 + 61 + 62 + 63 + 64 + 65 + 66 + 89 + 113 + 114 + 149 + 150 + 168 + 169 + 187 + 197 + 198 + 199 + 200 + 201 + 202 + 213 + 214 + 242 + 244 + 245 + 265 | 48 |
| 139 | Lenacil | Lenacil | `2164-08-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/417.htm) | 283 + 284 + 285 + 286 | 2 |
| 140 | Lufenuron | Lufenuron | `103055-07-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/420.htm) | 21 + 22 + 23 + 24 + 33 + 34 + 46 + 47 + 48 + 51 + 67 + 68 + 69 + 70 + 71 + 93 + 94 + 95 + 170 + 221 + 222 + 238 | 45 |
| 141 | Magnesium phosphide | Magnesium phosphide | `12057-74-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1090.htm) | 263 + 264 | 1 |
| 142 | Mancozeb | Mancozeb | `8018-01-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/424.htm) | 9 + 11 + 12 + 81 + 82 + 83 + 84 + 85 + 86 + 101 + 102 + 103 + 104 + 105 + 106 + 107 + 108 + 109 + 110 + 136 + 137 + 138 + 139 + 152 + 158 + 159 + 172 + 231 + 232 + 233 + 234 + 235 | 98 |
| 143 | Mandipropamid | Mandipropamid | `374726-62-2` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/425.htm) | 81 + 82 + 83 + 84 + 85 + 86 + 106 + 107 + 108 + 109 + 110 + 136 + 137 + 138 + 139 + 158 + 159 | 7 |
| 144 | MCPA | MCPA | `94-74-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/427.htm) | 300 + 301 + 309 + 320 + 344 + 345 + 346 + 347 | 7 |
| 145 | MCPA-isooctyl | MCPA-isoctyl | `26544-20-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/3438.htm) | 269 + 270 | 1 |
| 146 | MCPA-sodium | MCPA-sodium | `3653-48-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/3443.htm) | 269 + 270 + 346 | 3 |
| 147 | Mefenpyr-diethyl | Mefenpyr-diethyl | `135590-91-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/3143.htm) | 274 + 275 | 1 |
| 148 | Mefentrifluconazole | Mefentrifluconazole | `1417782-03-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/3098.htm) | 81 + 82 + 83 + 226 + 227 + 228 + 229 + 230 + 231 | 2 |
| 149 | Mesosulfuron-methyl | Mesosulfuron-methyl | `208465-21-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/441.htm) | 269 + 270 + 274 + 275 | 7 |
| 150 | Mesotrione | Mesotrione | `104206-82-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/442.htm) | 296 + 297 + 300 + 301 + 303 + 304 + 305 + 306 + 308 | 7 |
| 151 | Metaflumizone | Metaflumizone | `139968-49-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/443.htm) | 21 + 22 + 23 + 24 + 35 + 36 + 37 + 67 + 68 + 73 + 95 | 11 |
| 152 | Metalaxyl | Metalaxyl | `57837-19-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/444.htm) | 11 + 12 + 81 + 82 + 83 + 84 + 85 + 86 + 101 + 102 + 103 + 104 + 105 + 106 + 107 + 108 + 109 + 110 + 136 + 137 + 138 + 139 + 148 + 231 + 232 + 233 + 234 + 235 | 49 |
| 153 | Metalaxyl-M | Metalaxyl-M | `70630-17-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/445.htm) | 4 + 7 + 11 + 12 + 39 + 43 + 48 + 49 + 54 + 55 + 78 + 79 + 84 + 85 + 86 + 97 + 98 + 101 + 102 + 103 + 104 + 105 + 106 + 107 + 108 + 109 + 110 + 131 + 132 + 133 + 136 + 137 + 138 + 139 + 158 + 159 | 63 |
| 154 | Metaldehyde | Metaldehyde | `108-62-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/446.htm) | 266 | 4 |
| 155 | Metam sodium | Metam-sodium | `137-42-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/447.htm) | 196 | 1 |
| 156 | Metamitron | Metamitron | `41394-05-2` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/448.htm) | 283 + 284 + 285 + 286 | 4 |
| 157 | Methoxyfenozide | Methoxyfenozide | `161050-58-4` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/461.htm) | 21 + 22 + 23 + 24 + 46 + 47 + 69 + 70 + 71 + 93 + 94 + 95 + 179 + 180 + 183 + 190 + 221 + 222 | 25 |
| 158 | Methyl eugenol | Methyleugenol | `93-15-2` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2504.htm) | 201 + 202 | 1 |
| 159 | Metiram | Metiram | `9006-42-2` | متوسطة | PPDB · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/463.htm) | 81 + 82 + 83 + 84 + 85 + 86 + 101 + 102 + 103 + 104 + 105 + 136 + 137 + 138 + 139 + 217 + 226 + 227 + 228 + 229 + 230 + 231 + 232 + 233 + 234 + 235 | 14 |
| 160 | Metrafenone | Metrafenone | `220899-03-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/468.htm) | 226 + 227 + 228 + 229 + 230 + 231 | 1 |
| 161 | Metribuzin | Metribuzin | `21087-64-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/469.htm) | 303 + 304 + 317 + 319 | 23 |
| 162 | Metsulfuron-methyl | Metsulfuron-methyl | `74223-64-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/470.htm) | 269 + 270 | 1 |
| 163 | Myclobutanil | Myclobutanil | `88671-89-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/478.htm) | 79 + 80 + 134 + 135 + 193 + 194 + 215 + 216 + 226 + 227 + 228 + 229 + 230 + 231 + 259 | 15 |
| 164 | Nicosulfuron | Nicosulfuron | `111991-09-4` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/484.htm) | 303 + 304 + 305 + 306 | 13 |
| 165 | Novaluron | Novaluron | `116714-46-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/487.htm) | 21 + 22 + 23 + 24 + 46 + 47 + 67 + 68 + 69 + 70 + 71 + 73 + 93 + 94 + 190 | 9 |
| 166 | Orange oil | Orange oil | `8028-48-6` | متوسطة | PPDB · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2511.htm) | 62 + 63 + 64 + 65 + 66 + 134 + 135 | 3 |
| 167 | Oxamyl | Oxamyl | `23135-22-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/498.htm) | 29 + 87 + 88 + 111 + 117 + 210 + 211 + 236 + 261 + 262 | 30 |
| 168 | Oxathiapiprolin | Oxathiapiprolin | `1003318-67-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2618.htm) | 84 + 85 + 86 + 106 + 107 + 108 + 109 + 110 + 136 + 137 + 138 + 139 + 231 + 232 + 233 + 234 + 235 | 7 |
| 169 | Oxine-copper | Oxine-copper | `10380-28-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2930.htm) | 255 | 1 |
| 170 | Oxyfluorfen | Oxyfluorfen | `42874-03-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/502.htm) | 277 + 278 + 280 + 281 + 338 + 344 + 345 + 346 | 31 |
| 171 | Penconazole | Penconazole | `66246-88-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/509.htm) | 79 + 80 + 121 + 134 + 135 + 141 + 157 + 158 + 171 + 215 + 216 + 226 + 227 + 228 + 229 + 230 + 231 + 250 + 251 + 260 + 261 | 24 |
| 172 | Pencycuron | Pencycuron | `66063-05-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/510.htm) | 91 + 92 + 97 | 2 |
| 173 | Pendimethalin | Pendimethalin | `40487-42-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/511.htm) | 277 + 278 + 281 + 283 + 284 + 290 + 291 + 294 + 295 + 296 + 300 + 301 + 303 + 304 + 309 + 311 + 315 + 317 + 319 + 320 + 323 + 324 + 325 + 327 + 328 + 329 + 333 + 334 | 49 |
| 174 | Penflufen | Penflufen | `494793-67-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1655.htm) | 97 | 1 |
| 175 | Penoxsulam | Penoxsulam | `219714-96-2` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/512.htm) | 293 + 294 + 295 + 296 + 297 + 298 + 299 + 300 + 301 | 29 |
| 176 | Penthiopyrad | Penthiopyrad | `183675-82-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1210.htm) | 134 + 135 | 1 |
| 177 | Phenmedipham | Phenmedipham | `13684-63-4` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/516.htm) | 283 + 284 + 285 + 286 + 287 | 18 |
| 178 | Phosmet | Phosmet | `732-11-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/521.htm) | 199 + 200 | 1 |
| 179 | Phosphine | Phosphane | `7803-51-2` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1456.htm) | 263 + 264 | 2 |
| 180 | Phosphorous acid salts | Phosphonic acid | `13598-36-2` | متوسطة | PPDB · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2600.htm) | 231 + 232 + 233 + 234 + 235 | 1 |
| 181 | Picoxystrobin | Picoxystrobin | `117428-22-5` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/527.htm) | 5 + 6 + 81 + 82 + 83 + 146 + 192 + 231 + 232 + 233 + 234 + 235 + 257 + 258 | 6 |
| 182 | Pinoxaden | Pinoxaden | `243973-20-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/528.htm) | 271 + 272 + 273 + 274 + 275 | 8 |
| 183 | Pirimicarb | Pirimicarb | `23103-98-2` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/530.htm) | 66 + 91 + 92 + 164 | 3 |
| 184 | Pretilachlor | Pretilachlor | `51218-49-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/534.htm) | 293 | 1 |
| 185 | Prochloraz | Prochloraz | `67747-09-5` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/536.htm) | 5 + 6 + 26 + 27 + 28 + 40 + 42 + 79 + 80 + 121 + 134 + 135 + 141 + 146 + 148 + 166 + 193 + 194 + 215 + 216 + 257 + 258 + 259 | 20 |
| 186 | Prodiamine | Prodiamine | `29091-21-2` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1202.htm) | 349 + 350 | 1 |
| 187 | Propamocarb hydrochloride | Propamocarb hydrochloride | `25606-41-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/544.htm) | 78 + 79 + 84 + 85 + 86 + 101 + 102 + 103 + 104 + 105 + 106 + 107 + 108 + 109 + 110 + 131 + 132 + 133 + 136 + 137 + 138 + 139 + 231 + 232 + 233 + 234 + 235 | 23 |
| 188 | Propanil | Propanil | `709-98-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/545.htm) | 298 | 1 |
| 189 | Propaquizafop | Propaquizafop | `111479-05-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/546.htm) | 316 | 1 |
| 190 | Propiconazole | Propiconazole | `60207-90-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/551.htm) | 5 + 6 + 19 + 26 + 27 + 28 + 55 + 56 + 81 + 82 + 83 + 101 + 102 + 103 + 104 + 105 + 106 + 107 + 108 + 109 + 110 + 121 + 134 + 135 + 142 + 148 + 166 + 193 + 194 + 198 + 212 + 215 + 216 + 226 + 227 + 228 + 229 + 230 + 231 + 250 + 251 + 258 + 259 | 86 |
| 191 | Propyzamide | Propyzamide | `23950-58-5` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/556.htm) | 289 | 1 |
| 192 | Proquinazid | Proquinazid | `189278-12-4` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/555.htm) | 134 + 135 + 226 + 227 + 228 + 229 + 230 + 231 | 2 |
| 193 | Prosulfocarb | Prosulfocarb | `52888-80-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/557.htm) | 271 | 1 |
| 194 | Pydiflumetofen | Pydiflumetofen | `1228284-64-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/3086.htm) | 81 + 82 + 83 + 101 + 102 + 103 + 104 + 105 + 226 + 227 + 228 + 229 + 230 + 231 | 3 |
| 195 | Pyraclostrobin | Pyraclostrobin | `175013-18-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/564.htm) | 5 + 6 + 11 + 12 + 19 + 26 + 27 + 28 + 78 + 79 + 81 + 82 + 83 + 84 + 85 + 86 + 101 + 102 + 103 + 104 + 105 + 106 + 107 + 108 + 109 + 110 + 134 + 135 + 136 + 137 + 138 + 139 + 147 + 157 + 158 + 161 + 162 + 172 + 182 + 192 + 193 + 194 + 212 + 217 + 224 + 225 + 226 + 227 + 228 + 229 + 230 + 231 + 232 + 233 + 234 + 235 + 250 + 251 + 252 + 253 + 257 + 258 | 118 |
| 196 | Pyraflufen-ethyl | Pyraflufen-ethyl | `129630-19-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/565.htm) | 279 + 320 + 340 | 5 |
| 197 | Pyrazosulfuron-ethyl | Pyrazosulfuron-ethyl | `93697-74-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1148.htm) | 294 + 295 + 296 + 297 + 300 + 301 | 6 |
| 198 | Pyridaben | Pyridaben | `96489-71-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/569.htm) | 9 + 60 + 74 + 75 + 76 + 77 + 116 + 176 + 190 + 191 + 205 + 206 + 207 + 247 + 248 + 249 | 23 |
| 199 | Pyridalyl | Pyridalyl | `179101-81-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1139.htm) | 10 + 21 + 22 + 23 + 24 + 69 + 70 + 71 | 3 |
| 200 | Pyrimethanil | Pyrimethanil | `53112-28-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/573.htm) | 101 + 102 + 103 + 104 + 105 + 131 + 192 + 224 + 225 | 16 |
| 201 | Pyriproxyfen | Pyriproxyfen | `95737-68-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/574.htm) | 50 + 62 + 63 + 64 + 65 + 124 + 125 + 180 + 199 + 200 | 29 |
| 202 | Pyroxasulfone | Pyroxasulfone | `447399-55-5` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1367.htm) | 271 + 272 + 273 + 303 + 304 | 2 |
| 203 | Pyroxsulam | Pyroxsulam | `422556-08-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1133.htm) | 269 + 270 + 271 + 272 + 273 + 274 + 275 | 3 |
| 204 | Quinclorac | Quinclorac | `84087-01-4` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/577.htm) | 293 + 294 + 295 + 296 + 297 + 299 + 300 + 301 | 6 |
| 205 | Quizalofop-P-ethyl | Quizalofop-P-ethyl | `100646-51-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/583.htm) | 279 + 280 + 309 + 310 + 311 + 316 + 319 + 339 + 349 | 16 |
| 206 | Quizalofop-P-tefuryl | Quizalofop-P-tefuryl | `200509-41-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/584.htm) | 291 + 320 + 321 | 2 |
| 207 | Rimsulfuron | Rimsulfuron | `122931-48-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/586.htm) | 305 + 306 + 316 + 317 + 318 + 319 + 321 + 323 + 331 | 15 |
| 208 | S-metolachlor | S-metolachlor | `87392-12-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1027.htm) | 271 + 283 + 284 + 303 + 304 + 308 | 8 |
| 209 | Spinetoram | Spinetoram | `935545-74-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1144.htm) | 10 + 20 + 21 + 22 + 23 + 24 + 46 + 47 + 67 + 68 + 69 + 70 + 71 + 72 + 93 + 94 + 118 + 178 + 179 + 180 + 221 + 222 | 14 |
| 210 | Spirodiclofen | Spirodiclofen | `148477-71-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/597.htm) | 38 + 74 + 75 + 76 + 77 + 114 + 115 + 116 + 144 + 145 + 205 + 206 + 207 + 223 + 237 + 238 + 242 + 243 + 247 + 248 + 249 + 256 + 257 | 42 |
| 211 | Spiromesifen | Spiromesifen | `283594-90-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/598.htm) | 62 + 63 + 64 + 65 + 74 + 75 + 76 + 77 + 118 + 119 + 123 + 124 + 125 + 190 + 191 + 223 | 12 |
| 212 | Spirotetramat | Spirotetramat | `203313-25-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1119.htm) | 10 + 62 + 63 + 64 + 65 + 190 + 191 + 199 + 200 + 219 | 5 |
| 213 | Spiroxamine | Spiroxamine | `118134-30-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/599.htm) | 226 + 227 + 228 + 229 + 230 + 231 | 2 |
| 214 | Streptomycin sulfate | Streptomycin sulphate | `3810-74-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2472.htm) | 255 | 1 |
| 215 | Sulfosulfuron | Sulfosulfuron | `141776-32-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/603.htm) | 269 + 270 | 1 |
| 216 | Sulfoxaflor | Sulfoxaflor | `946578-00-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1669.htm) | 62 + 63 + 64 + 65 + 66 + 91 + 92 + 126 + 127 + 140 + 179 + 199 + 200 + 219 + 246 | 9 |
| 217 | Sulfur | Sulphur | `7704-34-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/605.htm) | 59 + 74 + 75 + 76 + 77 + 79 + 80 + 116 + 121 + 134 + 135 + 141 + 146 + 157 + 158 + 161 + 162 + 171 + 172 + 193 + 194 + 215 + 216 + 224 + 225 + 226 + 227 + 228 + 229 + 230 + 231 + 250 + 251 | 76 |
| 218 | Tebuconazole | Tebuconazole | `107534-96-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/610.htm) | 4 + 5 + 6 + 11 + 12 + 13 + 14 + 15 + 26 + 27 + 28 + 39 + 43 + 48 + 49 + 52 + 55 + 56 + 57 + 59 + 78 + 79 + 80 + 81 + 82 + 83 + 101 + 102 + 103 + 104 + 105 + 106 + 107 + 108 + 109 + 110 + 116 + 121 + 134 + 135 + 136 + 137 + 138 + 139 + 148 + 153 + 166 + 167 + 171 + 182 + 193 + 194 + 215 + 216 + 217 + 226 + 227 + 228 + 229 + 230 + 231 + 243 + 250 + 251 + 257 + 258 | 94 |
| 219 | Tebufenozide | Tebufenozide | `112410-23-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/611.htm) | 221 + 222 | 1 |
| 220 | Tebufenpyrad | Tebufenpyrad | `119168-77-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/612.htm) | 190 + 191 + 203 + 204 | 5 |
| 221 | Teflubenzuron | Teflubenzuron | `83121-18-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/616.htm) | 21 + 22 + 23 + 24 + 95 | 3 |
| 222 | Terbuthylazine | Terbuthylazine | `5915-41-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/623.htm) | 303 + 304 + 306 + 308 | 4 |
| 223 | Tetraconazole | Tetraconazole | `112281-77-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/626.htm) | 26 + 27 + 28 + 55 + 56 + 79 + 80 + 101 + 102 + 103 + 104 + 105 + 134 + 135 + 141 + 146 + 166 + 226 + 227 + 228 + 229 + 230 + 231 + 260 + 261 | 16 |
| 224 | Thiabendazole | Thiabendazole | `148-79-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/629.htm) | 209 | 1 |
| 225 | Thiamethoxam | Thiamethoxam | `153719-23-4` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/631.htm) | 62 + 63 + 64 + 65 + 67 + 68 + 91 + 92 + 97 + 118 + 119 + 124 + 125 + 126 + 127 + 128 + 134 + 135 + 164 | 42 |
| 226 | Thiencarbazone-methyl | Thiencarbazone-methyl | `317815-83-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1241.htm) | 283 + 284 + 303 + 304 | 2 |
| 227 | Thifensulfuron-methyl | Thifensulfuron-methyl | `79277-27-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/635.htm) | 305 + 306 | 1 |
| 228 | Thifluzamide | Thifluzamide | `130000-40-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1209.htm) | 98 | 1 |
| 229 | Thiobencarb | Thiobencarb | `28249-77-6` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/636.htm) | 292 + 293 + 296 + 297 | 16 |
| 230 | Thiocyclam hydrogen oxalate | Thiocyclam oxalate | `31895-22-4` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/753.htm) | 62 + 63 + 64 + 65 + 67 + 68 + 74 | 6 |
| 231 | Thiophanate-methyl | Thiophanate-methyl | `23564-05-8` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/640.htm) | 26 + 27 + 28 + 53 + 58 + 78 + 79 + 97 + 131 + 132 + 133 + 182 + 193 + 194 + 215 + 216 + 224 + 225 + 226 + 227 + 228 + 229 + 230 + 231 + 250 + 251 + 252 + 253 + 257 + 258 | 79 |
| 232 | Tolclofos-methyl | Tolclofos-methyl | `57018-04-9` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/644.htm) | 54 + 55 | 3 |
| 233 | Tolfenpyrad | Tolfenpyrad | `129558-76-5` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1687.htm) | 237 | 1 |
| 234 | Tralkoxydim | Tralkoxydim | `87820-88-0` | متوسطة | PPDB · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/646.htm) | 269 + 270 + 271 + 272 + 273 | 7 |
| 235 | Triadimenol | Triadimenol | `55219-65-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/649.htm) | 226 + 227 + 228 + 229 + 230 + 231 | 1 |
| 236 | Tribenuron-methyl | Tribenuron-methyl | `101200-48-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/655.htm) | 269 + 270 | 9 |
| 237 | Triclopyr | Triclopyr | `55335-06-3` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/659.htm) | 307 | 1 |
| 238 | Triclopyr-butotyl | Triclopyr-butotyl | `64700-56-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2398.htm) | 294 + 295 + 296 + 299 + 300 + 301 + 307 | 5 |
| 239 | Tricyclazole | Tricyclazole | `41814-78-2` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/660.htm) | 42 + 193 + 194 | 4 |
| 240 | Trifloxystrobin | Trifloxystrobin | `141517-21-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/664.htm) | 5 + 6 + 11 + 12 + 19 + 26 + 27 + 28 + 79 + 80 + 81 + 82 + 83 + 101 + 102 + 103 + 104 + 105 + 106 + 107 + 108 + 109 + 110 + 131 + 134 + 135 + 136 + 137 + 138 + 139 + 148 + 171 + 182 + 193 + 194 + 215 + 216 + 217 + 226 + 227 + 228 + 229 + 230 + 231 + 257 + 258 | 36 |
| 241 | Triflumizole | Triflumizole | `68694-11-1` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/665.htm) | 134 + 135 + 250 + 251 | 3 |
| 242 | Triflumuron | Triflumuron | `64628-44-0` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/666.htm) | 21 + 22 + 23 + 24 + 33 + 34 + 221 + 222 | 3 |
| 243 | Triticonazole | Triticonazole | `131983-72-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/673.htm) | 4 + 7 + 48 + 49 | 5 |
| 244 | Zinc phosphide | Zinc phosphide | `1314-84-7` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1730.htm) | 265 + 266 | 4 |
| 245 | Zoxamide | Zoxamide | `156052-68-5` | عالية | PPDB+PubChem · [صفحة المصدر](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/685.htm) | 84 + 85 + 86 + 106 + 107 + 108 + 109 + 110 + 231 + 232 + 233 + 234 + 235 | 4 |

## ج. جدول CAS التي تحتاج إلى مراجعة المالك

عدد الصفوف: **21** (7 تعارض · 7 مساند واحد · 1 هوية بالرقم فقط · 1 بلا دليل · 5 مواد كيميائية بلا رقم في الحزمة).
**الرقم المثبت ≠ الرقم المقترح:** «رقم الحزمة» غير محسوم مهما كان صحيحاً حسابياً — صحة خانة check digit ليست دليل إسناد.

| الاسم الأصلي | رقم الحزمة (غير محسوم) | الرقم الآخر في المصادر | المصدر والرابط | سبب عدم الحسم | القرار المطلوب من المالك |
|---|---|---|---|---|---|
| Buprofezin | `69327-76-0` | رقم PPDB: 953030-84-7 | PPDB — Aeru، جامعة هيرتفوردشاير + PubChem (NIH/NLM) · [رابط](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/100.htm) | الحزمة: 69327-76-0 (2-(Tert-butylimino)-5-phenyl-3-(propan-2-yl)-1,3,5-thiadiazinan-4-one) · PPDB: 953030-84-7 (2-(Tert-butylimino)-5-phenyl-3-(propan-2-yl)-1,3,5-thiadiazinan-4-one) · قائمة RN للاسم في PubChem: 107484-86-6 / 69327-76-0 / 953030-84-7 | كلا الرقمين 69327-76-0 و953030-84-7 يعودان في PubChem إلى عنوان واحد (بنية/تاوتومر نفسه) — أيّ الرقمين يُعتمد؟ (PPDB يعرض 953030-84-7) |
| Florpyrauxifen-benzyl | `943832-81-3` | رقم PPDB: 1390661-72-9 | PPDB — Aeru، جامعة هيرتفوردشاير + PubChem (NIH/NLM) · [رابط](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/3097.htm) | الحزمة: 943832-81-3 (Florpyrauxifen) · PPDB: 1390661-72-9 (Florpyrauxifen-benzyl) · قائمة RN للاسم في PubChem: 1390661-72-9 | رقم الحزمة 943832-81-3 يعيد PubChem بعنوان «Florpyrauxifen» أي الحمض، ورقم PPDB 1390661-72-9 بعنوان «Florpyrauxifen-benzyl» أي الفعل البنزيلي — هل رقم الكتاب للحمض خطأً؟ حسم الرقم المعتمد |
| Flutianil | `304900-25-2` | رقم PPDB: 958647-10-4 | PPDB — Aeru، جامعة هيرتفوردشاير + PubChem (NIH/NLM) · [رابط](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2608.htm) | الحزمة: 304900-25-2 (2-[[2-Fluoro-5-(trifluoromethyl)phenyl]thio]-2-[3-(2-methoxyphenyl)-2-thiazolidinylidene]acetonitrile) · PPDB: 958647-10-4 (Flutianil) · قائمة RN للاسم في PubChem: 958647-10-4 | رقم الحزمة 304900-25-2 له CID في PubChem لكنه غير مدرج ضمن قائمة RN للاسم؛ PPDB وPubChem يسجلان 958647-10-4 للاسم «Flutianil» — حسم الرقم المعتمد |
| Glyphosate potassium | `70901-12-1` | رقم PPDB: 39600-42-5 | PPDB — Aeru، جامعة هيرتفوردشاير + PubChem (NIH/NLM) · [رابط](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2396.htm) | الحزمة: 70901-12-1 (Glyphosate potassium) · PPDB: 39600-42-5 (Potassium 2-((phosphonomethyl)amino)acetate) · قائمة RN للاسم في PubChem: 39600-42-5 / 70901-12-1 / 813-293-2 | كلا الرقمين 70901-12-1 و39600-42-5 يعيدان في PubChem إلى بوتاسيوم جلايفوسات واحد؛ PPDB يعرض 39600-42-5 — أيّهما يُعتمد؟ |
| Iminoctadine tris(albesilate) | `169202-06-6` | رقم PPDB: 99257-43-9 | PPDB — Aeru، جامعة هيرتفوردشاير + PubChem (NIH/NLM) · [رابط](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2397.htm) | الحزمة: 169202-06-6 (Iminoctadine trialbesilate) · PPDB: 99257-43-9 (Iminoctadine tris(albesilate)) · قائمة RN للاسم في PubChem: 99257-43-9 | رقم الحزمة 169202-06-6 بعنوان PubChem «Iminoctadine trialbesilate»؛ رقم PPDB 99257-43-9 بعنوان «tris(albesilate)» لكن اسمه الكيميائي في الصفحة tris(dodecylbenzenesulfonate) — احتمال ملح/مزيج مختلف — حسم بعد فحص صفحة الكتاب |
| Indoxacarb | `144171-61-9` | رقم PPDB: 173584-44-6 | PPDB — Aeru، جامعة هيرتفوردشاير + PubChem (NIH/NLM) · [رابط](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/399.htm) | الحزمة: 144171-61-9 (Indoxacarb, (+-)-) · PPDB: 173584-44-6 (Indoxacarb) · قائمة RN للاسم في PubChem: 144171-61-9 / 173584-44-6 / 174060-41-4 / 605-683-4 | 144171-61-9 («Indoxacarb, (+-)») و173584-44-6 («Indoxacarb») كلاهما في PubChem ضمن قائمة RN للاسم؛ PPDB يعرض 173584-44-6 — أيّهما يُعتمد؟ |
| Mineral oil | `8042-47-5` | رقم PPDB: 64742-46-7 | PPDB — Aeru، جامعة هيرتفوردشاير + PubChem (NIH/NLM) · [رابط](https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1376.htm) | الحزمة: 8042-47-5 (بلا عنوان في PubChem) · PPDB: 64742-46-7 (distillates (petroleum), hydrotreated middle) · قائمة RN للاسم في PubChem: بلا نتيجة | رقم الحزمة 8042-47-5 بلا CID في PubChem (404 بالاسم والرقم)، وصفحة PPDB لـParaffin oil تعرض 64742-46-7 — لا تأكيد لأي منهما في المصادر المفتوحة — يلزم CAS Registry |
| 8-Hydroxyquinoline sulfate | `134-31-6` | قائمة RN للاسم: 134-31-6 | PubChem (NIH/NLM) · [رابط](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/8-Hydroxyquinoline%20sulfate/xrefs/RN/JSON) | الرقم يظهر ضمن قائمة RN للاسم في PubChem، ولم يُعثر على مدخل مطابق في فهرس PPDB — مساعد وحده لا يكفي للحسم عند وجود التباس | قبول المساندة الوحيدة أم طلب رقم من CAS Registry قبل الاعتماد |
| Abamectin | `71751-41-2` | قائمة RN للاسم: 71751-41-2 | PubChem (NIH/NLM) · [رابط](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/Abamectin/xrefs/RN/JSON) | الرقم يظهر ضمن قائمة RN للاسم في PubChem، ولم يُعثر على مدخل مطابق في فهرس PPDB — مساعد وحده لا يكفي للحسم عند وجود التباس | قبول المساندة الوحيدة أم طلب رقم من CAS Registry قبل الاعتماد |
| Copper sulfate | `7758-98-7` | قائمة RN للاسم: 7758-98-7 | PubChem (NIH/NLM) · [رابط](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/Copper%20sulfate/xrefs/RN/JSON) | الرقم يظهر ضمن قائمة RN للاسم في PubChem، ولم يُعثر على مدخل مطابق في فهرس PPDB — مساعد وحده لا يكفي للحسم عند وجود التباس | قبول المساندة الوحيدة أم طلب رقم من CAS Registry قبل الاعتماد |
| Copper sulfate pentahydrate | `7758-99-8` | قائمة RN للاسم: 7758-99-8 | PubChem (NIH/NLM) · [رابط](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/Copper%20sulfate%20pentahydrate/xrefs/RN/JSON) | الرقم يظهر ضمن قائمة RN للاسم في PubChem، ولم يُعثر على مدخل مطابق في فهرس PPDB — مساعد وحده لا يكفي للحسم عند وجود التباس | قبول المساندة الوحيدة أم طلب رقم من CAS Registry قبل الاعتماد |
| Iodosulfuron-methyl | `144550-06-1` | قائمة RN للاسم: 144550-06-1 | PubChem (NIH/NLM) · [رابط](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/Iodosulfuron-methyl/xrefs/RN/JSON) | الرقم يظهر ضمن قائمة RN للاسم في PubChem، ولم يُعثر على مدخل مطابق في فهرس PPDB — مساعد وحده لا يكفي للحسم عند وجود التباس | قبول المساندة الوحيدة أم طلب رقم من CAS Registry قبل الاعتماد |
| Milbemectin | `51596-10-2` | قائمة RN للاسم: 51596-10-2 | PubChem (NIH/NLM) · [رابط](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/Milbemectin/xrefs/RN/JSON) | الرقم يظهر ضمن قائمة RN للاسم في PubChem، ولم يُعثر على مدخل مطابق في فهرس PPDB — مساعد وحده لا يكفي للحسم عند وجود التباس | قبول المساندة الوحيدة أم طلب رقم من CAS Registry قبل الاعتماد |
| Spinosad | `168316-95-8` | قائمة RN للاسم: 168316-95-8 | PubChem (NIH/NLM) · [رابط](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/Spinosad/xrefs/RN/JSON) | الرقم يظهر ضمن قائمة RN للاسم في PubChem، ولم يُعثر على مدخل مطابق في فهرس PPDB — مساعد وحده لا يكفي للحسم عند وجود التباس | قبول المساندة الوحيدة أم طلب رقم من CAS Registry قبل الاعتماد |
| Copper sulfate (tribasic) | `1344-73-6` | هوية الرقم في PubChem معروضة في سبب عدم الحسم | PubChem (NIH/NLM) · [رابط](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/1344-73-6/property/Title,IUPACName/JSON) | الاستعلام بالرقم 1344-73-6 في PubChem يرجع: «Sulfuric acid, copper salt, basic» — تطابق الصيغة مع اسم الحزمة «Copper sulfate (tribasic)» يحتاج إقراراً | الاستعلام بالرقم 1344-73-6 يعيد «Sulfuric acid, copper salt, basic» — تطابق «tribasic» مع «basic» يستدعي إقراراً لا يُفترض |
| Jasmine oil | `8022-96-6` | لا نتيجة | PPDB + PubChem (بلا نتيجة) · [رابط](https://pubchem.ncbi.nlm.nih.gov/) | الرقم 8022-96-6 في الحزمة بلا تأكيد: بلا مدخل PPDB مطابق، والاستعلام بالاسم والرقم في PubChem 404 | رقم الحزمة 8022-96-6 بلا تأكيد (PPDB بلا مدخل مطابق، PubChem 404 بالاسم والرقم) — يلزم CAS Registry أو قبول بقاءه بلا تأكيد خارجي |
| Chlorimuron-methyl | `` | لا مرشح | PPDB + PubChem (بلا نتيجة) · [رابط](https://pubchem.ncbi.nlm.nih.gov/) | لم يُعثر على رقم في المصادر التي فُحصت | PubChem يرجع 128569-20-0 للاسم — مرشح فقط؛ قرار: يُثبت بمصدر إضافي أم يبقى فارغاً |
| Clodinafop-butyl | `` | لا مرشح | PPDB + PubChem (بلا نتيجة) · [رابط](https://pubchem.ncbi.nlm.nih.gov/) | PUG 404 — لا يوجد تطابق اسم في PubChem | PubChem لا يعرف الإستر butyl (اقتراحه الآلي Clodinafop-propargyl الموجود في الحزمة برقم منفصل) — قرار: رقم من CAS Registry أو إقرار عدم توفّره |
| Copper complex | `` | لا مرشح | PPDB + PubChem (بلا نتيجة) · [رابط](https://pubchem.ncbi.nlm.nih.gov/) | PUG 404 — لا يوجد تطابق اسم في PubChem | مادة غير معرَّفة تركيبياً في الكتاب (اقتراح PubCHEM الآلي بلا صلة) — تحديد التركيبة من الصفحة أولاً ثم بحث الرقم |
| Fenoxaprop-P-butyl | `` | لا مرشح | PPDB + PubChem (بلا نتيجة) · [رابط](https://pubchem.ncbi.nlm.nih.gov/) | PUG 404 — لا يوجد تطابق اسم في PubChem | PubChem لا يعرف الإستر butyl (اقتراحه الآلي Fenoxaprop-P-ethyl الموجود في الحزمة برقم منفصل) — قرار: رقم من CAS Registry أو إقرار عدم توفّره |
| Thioahatate-methyl | `` | لا مرشح | PPDB + PubChem (بلا نتيجة) · [رابط](https://pubchem.ncbi.nlm.nih.gov/) | PUG 404 — لا يوجد تطابق اسم في PubChem | الاسم محرف في الكتاب؛ اقتراح PubChem الآلي thiophanate-methyl الموجود في الحزمة برقم 23564-05-8 — قرار: تصحيف أم مادة مستقلة؟ (لا يُسند رقم دون قرار صريح) |

## د. جدول المواد الحيوية

**8 مؤكد** (اسم كائن علمي) + **5 محتمل** (منتج مشتق حيائياً/نباتياً — يبقى غير مصنَّف حتى قرار المالك).
الخانة تبقى **فارغةً** حيث لا رقم: عدم العثور على رقم في PPDB/PubChem ليس دليلاً على عدم التعيين، ولم يُستخدم `NO_CAS_ASSIGNED` في أي صف.

| الاسم كما طُبع | التصنيف | المصادر التي فُحصت | النتيجة | سبب بقاء CAS فارغاً | صفحات الطباعة | ما يحتاج مراجعة المالك |
|---|---|---|---|---|---|---|
| Bacillus amyloliquefaciens Strain F Z B 24 \| Bacillus amyloliquefaciens Strain FZB24 | مؤكد حيوي | فهرس PPDB وصفحاته (لا مدخل مطابق للاسم العام) \| PubChem بالاسم: PUG 404 — لا يوجد تطابق اسم في PubChem · PUG 404 — لا يوجد تطابق اسم في PubChem · PUG 404 — لا يوجد تطابق اسم في PubChem | لا رقم في الحزمة ولم يُعثر على رقم في المصادر المفتوحة | لم يُعثر على رقم — وهذا ليس دليلاً على أن CAS غير معيّن (لا يُستخدم NO_CAS_ASSIGNED بلا دليل صريح) | 87 + 226 + 227 + 228 + 229 + 230 + 231 | قرار المالك: هل يُترك فارغاً، أو يُبحث في CAS Registry/مراجع السلالات، أو يُسجَّل كائن بلا رقم |
| Bacillus amyloliquefaciens Strain MBI 600 | مؤكد حيوي | فهرس PPDB وصفحاته (مطابقة: Bacillus amyloliquefaciens MBI 600 — يعرض -) \| PubChem بالاسم: PUG 404 — لا يوجد تطابق اسم في PubChem · PUG 404 — لا يوجد تطابق اسم في PubChem | لا رقم في الحزمة ولم يُعثر على رقم في المصادر المفتوحة | لم يُعثر على رقم — وهذا ليس دليلاً على أن CAS غير معيّن (لا يُستخدم NO_CAS_ASSIGNED بلا دليل صريح) | 192 + 224 + 225 | قرار المالك: هل يُترك فارغاً، أو يُبحث في CAS Registry/مراجع السلالات، أو يُسجَّل كائن بلا رقم |
| Bacillus megaterium \| Bacillus megaterum | مؤكد حيوي | فهرس PPDB وصفحاته (لا مدخل مطابق للاسم العام) \| PubChem بالاسم: PUG 404 — لا يوجد تطابق اسم في PubChem · PUG 404 — لا يوجد تطابق اسم في PubChem | لا رقم في الحزمة ولم يُعثر على رقم في المصادر المفتوحة | لم يُعثر على رقم — وهذا ليس دليلاً على أن CAS غير معيّن (لا يُستخدم NO_CAS_ASSIGNED بلا دليل صريح) | 81 + 82 + 83 + 192 | قرار المالك: هل يُترك فارغاً، أو يُبحث في CAS Registry/مراجع السلالات، أو يُسجَّل كائن بلا رقم |
| Bacillus subtilis | مؤكد حيوي | فهرس PPDB وصفحاته (لا مدخل مطابق للاسم العام) \| PubChem بالاسم: PUG 404 — لا يوجد تطابق اسم في PubChem | لا رقم في الحزمة ولم يُعثر على رقم في المصادر المفتوحة | لم يُعثر على رقم — وهذا ليس دليلاً على أن CAS غير معيّن (لا يُستخدم NO_CAS_ASSIGNED بلا دليل صريح) | 97 + 131 + 132 + 133 + 192 | قرار المالك: هل يُترك فارغاً، أو يُبحث في CAS Registry/مراجع السلالات، أو يُسجَّل كائن بلا رقم |
| Bacillus Thuringiensis \| Bacillus thuringiensis | مؤكد حيوي | فهرس PPDB وصفحاته (مطابقة: Bacillus thuringiensis Berliner subsp. japonensis — يعرض 68038-71-1) \| PubChem بالاسم: PUG 404 — لا يوجد تطابق اسم في PubChem · PUG 404 — لا يوجد تطابق اسم في PubChem \| PubChem بالرقم: 404 بلا CID | رقم في الحزمة: 68038-71-1 — مطابق لصفحة PPDB | — (الحزمة تحوي رقماً) | 30 + 33 + 46 + 47 + 67 + 68 + 69 + 70 + 71 + 93 + 94 + 190 + 221 + 222 + 240 + 245 | تحديد إن كان الرقم مناسباً للكائن/السلالة العامة في الكتاب أم لنوع فرعي محدد (PPDB يعرضه على صفحة نوع فرعي) |
| Citronella oil | محتمل حيوي — يحتاج قرار تصنيف | فهرس PPDB وصفحاته (مطابقة: Citronella oil — يعرض 8000-29-1) \| PubChem بالاسم: PUG 404 — لا يوجد تطابق اسم في PubChem \| PubChem بالرقم: 404 بلا CID | رقم في الحزمة: 8000-29-1 — مطابق لصفحة PPDB | — (الحزمة تحوي رقماً) | 237 | تصنيف المادة: هل تُعدّ حيوية؟ |
| Jasmine oil | محتمل حيوي — يحتاج قرار تصنيف | فهرس PPDB وصفحاته (لا مدخل مطابق للاسم العام) \| PubChem بالاسم: PUG 404 — لا يوجد تطابق اسم في PubChem \| PubChem بالرقم: 404 بلا CID | رقم في الحزمة: 8022-96-6 — بلا تأكيد خارجي | — (الحزمة تحوي رقماً) | 237 | حسم التعارض/الإثبات |
| Jojoba oil | محتمل حيوي — يحتاج قرار تصنيف | فهرس PPDB وصفحاته (مطابقة: Jojoba oil — يعرض 61789-91-1) \| PubChem بالاسم: PUG 404 — لا يوجد تطابق اسم في PubChem \| PubChem بالرقم: 404 بلا CID | رقم في الحزمة: 61789-91-1 — مطابق لصفحة PPDB | — (الحزمة تحوي رقماً) | 67 + 68 | تصنيف المادة: هل تُعدّ حيوية؟ |
| Orange oil \| Orange oil (d-limonene) | محتمل حيوي — يحتاج قرار تصنيف | فهرس PPDB وصفحاته (مطابقة: Orange oil — يعرض 8028-48-6) \| PubChem بالاسم: PUG 404 — لا يوجد تطابق اسم في PubChem · PUG 404 — لا يوجد تطابق اسم في PubChem \| PubChem بالرقم: 404 بلا CID | رقم في الحزمة: 8028-48-6 — مطابق لصفحة PPDB | — (الحزمة تحوي رقماً) | 62 + 63 + 64 + 65 + 66 + 134 + 135 | تصنيف المادة: هل تُعدّ حيوية؟ |
| Streptomycin sulfate | محتمل حيوي — يحتاج قرار تصنيف | فهرس PPDB وصفحاته (مطابقة: Streptomycin sulphate — يعرض 3810-74-0) \| PubChem بالاسم: RN=16103-16-5/223-286-0/3810-74-0/85027-84-5 \| PubChem بالرقم: 404 بلا CID | رقم في الحزمة: 3810-74-0 — مطابق لصفحة PPDB | — (الحزمة تحوي رقماً) | 255 | تصنيف المادة: هل تُعدّ حيوية؟ |
| Trichoderma album | مؤكد حيوي | فهرس PPDB وصفحاته (لا مدخل مطابق للاسم العام) \| PubChem بالاسم: PUG 404 — لا يوجد تطابق اسم في PubChem | لا رقم في الحزمة ولم يُعثر على رقم في المصادر المفتوحة | لم يُعثر على رقم — وهذا ليس دليلاً على أن CAS غير معيّن (لا يُستخدم NO_CAS_ASSIGNED بلا دليل صريح) | 134 + 135 + 215 + 216 | قرار المالك: هل يُترك فارغاً، أو يُبحث في CAS Registry/مراجع السلالات، أو يُسجَّل كائن بلا رقم |
| Trichoderma asperellum | مؤكد حيوي | فهرس PPDB وصفحاته (لا مدخل مطابق للاسم العام) \| PubChem بالاسم: PUG 404 — لا يوجد تطابق اسم في PubChem | لا رقم في الحزمة ولم يُعثر على رقم في المصادر المفتوحة | لم يُعثر على رقم — وهذا ليس دليلاً على أن CAS غير معيّن (لا يُستخدم NO_CAS_ASSIGNED بلا دليل صريح) | 97 + 167 + 224 + 225 | قرار المالك: هل يُترك فارغاً، أو يُبحث في CAS Registry/مراجع السلالات، أو يُسجَّل كائن بلا رقم |
| Trichoderma virde | مؤكد حيوي | فهرس PPDB وصفحاته (لا مدخل مطابق للاسم العام) \| PubChem بالاسم: PUG 404 — لا يوجد تطابق اسم في PubChem · PUG 404 — لا يوجد تطابق اسم في PubChem | لا رقم في الحزمة ولم يُعثر على رقم في المصادر المفتوحة | لم يُعثر على رقم — وهذا ليس دليلاً على أن CAS غير معيّن (لا يُستخدم NO_CAS_ASSIGNED بلا دليل صريح) | 78 + 79 | قرار المالك: هل يُترك فارغاً، أو يُبحث في CAS Registry/مراجع السلالات، أو يُسجَّل كائن بلا رقم |

> المواد الـ5 غير الحيوية بلا رقم مدرجة في الجدول (ج) وفي `owner-review-biologicals.csv` بتصنيف «غير حيوية» للتمييز فقط.

## هـ. جميع البيانات الأخرى الناقصة أو المتعارضة

كل صف أدناه موجود حرفياً في ورقة **owner-review-missing-fields.csv** (2104 صف). المصدر الداعم والإجراء المطلوب ثابتان لكل قسم (مكتوبان فوق جدوله، وفي CSV مكرَّران صفراً بصف).
القيم معروضة **كما وردت في المصدر** دون استبدال أو استنتاج، وقسم التكرار مجمَّع بمفتاحه مع حجم المجموعة — قرار واحد لكل مجموعة.

### 1. فترة الأمان phi_days — فارغة أو متعارضة — 427 صفاً

**المصدر الداعم:** حزمة التدقيق (recommendations_audit.xlsx — ورقة missing_conflicts) مقابل كتاب APC 2025 · **الإجراء المطلوب من المالك:** فتح الصفحة المطبوعة وحسم القيمة من الأصل — لا تُملأ بتقدير ولا تُستنتج من مادة أخرى

| معرف البطاقة | المحصول | صفحات المصدر | الحقل | القيمة الأصلية | وصف المشكلة |
|---|---|---|---|---|---|
| egyptian-clover-pests-01 | egyptian-clover | 30 | phi_days | Bacillus thuringiensis 6.4% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| sugarcane-pests-02 | sugarcane | 51 | phi_days | Lufenuron 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| sugarcane-pests-02 | sugarcane | 51 | phi_days | Emamectin benzoate 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| sugarcane-pests-04 | sugarcane | 53 | phi_days | Thiophanate-methyl 70% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| sesame-pests-02 | sesame | 58 | phi_days | Thiophanate-methyl 70% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| sunflower-pests-02 | sunflower | 59 | phi_days | Azoxystrobin 20% + Tebuconazole 30% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| tomato-pests-04 | tomato | 67,68 | phi_days | Bacillus thuringiensis 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| tomato-pests-04 | tomato | 67,68 | phi_days | Bacillus thuringiensis 6.4% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| tomato-pests-04 | tomato | 67,68 | phi_days | Bacillus thuringiensis 9.4% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| tomato-pests-04 | tomato | 67,68 | phi_days | Bacillus thuringiensis 9.4% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| tomato-pests-05 | tomato | 69,70,71 | phi_days | Acetamiprid 6.4% + Emamectin benzoate 4.8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| tomato-pests-05 | tomato | 69,70,71 | phi_days | Bacillus thuringiensis 6.4% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| tomato-pests-05 | tomato | 69,70,71 | phi_days | Bacillus thuringiensis 54% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| tomato-pests-11 | tomato | 78,79 | phi_days | Trichoderma viride 1.15% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| tomato-pests-11 | tomato | 78,79 | phi_days | Flutolanil 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| tomato-pests-11 | tomato | 78,79 | phi_days | Azoxystrobin 28.2% + Metalaxyl-M 10.8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| tomato-pests-13 | tomato | 81,82,83 | phi_days | Bacillus megaterium 66% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| tomato-pests-15 | tomato | 87 | phi_days | Bacillus amyloliquefaciens FZB24 13% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| tomato-pests-16 | tomato | 87,88 | phi_days | Cadusafos 20% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| tomato-pests-16 | tomato | 87,88 | phi_days | Fosthiazate 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| potato-pests-05 | potato | 93,94 | phi_days | Bacillus thuringiensis 5.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| potato-pests-05 | potato | 93,94 | phi_days | Bacillus thuringiensis 54% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| potato-pests-05 | potato | 93,94 | phi_days | Bacillus thuringiensis 9.4% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| potato-pests-05 | potato | 93,94 | phi_days | Bacillus thuringiensis 6.4% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| potato-pests-05 | potato | 93,94 | phi_days | Bacillus thuringiensis 6.4% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| potato-pests-08 | potato | 97 | phi_days | Trichoderma asperellum 12% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| potato-pests-08 | potato | 97 | phi_days | Trichoderma asperellum 12% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| potato-pests-08 | potato | 97 | phi_days | Fludioxonil 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| potato-pests-08 | potato | 97 | phi_days | Pencycuron 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| potato-pests-08 | potato | 97 | phi_days | Bacillus subtilis 1.34% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| potato-pests-10 | potato | 99 | phi_days | Fludioxonil 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| potato-pests-13 | potato | 101,102,103,104,105 | phi_days | Difenoconazole 12.5% + Pydiflumetofen 7.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| potato-pests-14 | potato | 106,107,108,109,110 | phi_days | Copper oxychloride 47.89% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| potato-pests-14 | potato | 106,107,108,109,110 | phi_days | Copper hydroxide 38.37% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| potato-pests-16 | potato | 111 | phi_days | 1,3-Dichloropropene 93% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| potato-pests-17 | potato | 112 | phi_days | Ethoprophos 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cucumber-pests-02 | cucumber | 126,127 | phi_days | Thiamethoxam 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cucumber-pests-02 | cucumber | 126,127 | phi_days | Thiamethoxam 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cucumber-pests-07 | cucumber | 131,132,133 | phi_days | Hymexazol 30% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cucumber-pests-07 | cucumber | 131,132,133 | phi_days | Thiophanate-methyl 70% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cucumber-pests-07 | cucumber | 131,132,133 | phi_days | Thiophanate-methyl 70% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cucumber-pests-07 | cucumber | 131,132,133 | phi_days | Bacillus subtilis 1.34% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cucumber-pests-08 | cucumber | 134,135 | phi_days | Trichoderma album 2.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cucumber-pests-08 | cucumber | 134,135 | phi_days | Prochloraz 40% + Propiconazole 6% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cucumber-pests-09 | cucumber | 136,137,138,139 | phi_days | Mancozeb 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cucumber-pests-10 | cucumber | 139 | phi_days | Difenoconazole 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cucumber-pests-11 | cucumber | 140 | phi_days | Abamectin 2% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cantaloupe-pests-04 | cantaloupe | 157 | phi_days | Sulfur 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| snap-bean-pests-02 | snap-bean | 164 | phi_days | Thiamethoxam 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| snap-bean-pests-06 | snap-bean | 167 | phi_days | Trichoderma asperellum 12% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cowpea-pests-04 | cowpea | 170 | phi_days | Chlorfenapyr 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| okra-pests-03 | okra | 175 | phi_days | Acetamiprid 5% + Bifenthrin 2.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cabbage-pests-06 | cabbage | 181 | phi_days | Abamectin 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| lettuce-pests-01 | lettuce | 188 | phi_days | Acetamiprid 22.7% + Bifenthrin 27.3% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| spinach-pests-01 | spinach | 189 | phi_days | Acetamiprid 22.7% + Bifenthrin 27.3% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| strawberry-pests-01 | strawberry | 190 | phi_days | Bacillus thuringiensis 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| strawberry-pests-03 | strawberry | 192 | phi_days | Bacillus megaterium 6% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| strawberry-pests-03 | strawberry | 192 | phi_days | Bacillus amyloliquefaciens MBI 600 11% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| strawberry-pests-03 | strawberry | 192 | phi_days | Bacillus subtilis 1.34% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| protected-crops-pests-01 | protected-crops | 196 | phi_days | 1,3-Dichloropropene 60.8% + Chloropicrin 33.3% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| protected-crops-pests-01 | protected-crops | 196 | phi_days | Dimethyl disulfide 94.8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| protected-crops-pests-01 | protected-crops | 196 | phi_days | Metam sodium 51% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| protected-crops-pests-02 | protected-crops | 197 | phi_days | Cadusafos 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| protected-crops-pests-02 | protected-crops | 197 | phi_days | Cadusafos 20% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| turf-pests-01 | turf | 197,198 | phi_days | Lambda-cyhalothrin 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| turf-pests-01 | turf | 197,198 | phi_days | Lambda-cyhalothrin 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| turf-pests-01 | turf | 197,198 | phi_days | Lambda-cyhalothrin 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| turf-pests-01 | turf | 197,198 | phi_days | Etoxazole 10% + Fenpropathrin 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| turf-pests-01 | turf | 197,198 | phi_days | Acetamiprid 22.7% + Bifenthrin 27.3% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| turf-pests-01 | turf | 197,198 | phi_days | Acetamiprid 22.7% + Bifenthrin 27.3% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| turf-pests-01 | turf | 197,198 | phi_days | Acetamiprid 5% + Bifenthrin 2.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| turf-pests-01 | turf | 197,198 | phi_days | Acetamiprid 5% + Bifenthrin 2.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| turf-pests-01 | turf | 197,198 | phi_days | Buprofezin 10% + Imidacloprid 20% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| turf-pests-01 | turf | 197,198 | phi_days | Abamectin 1.3% + Bifenthrin 8.8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| turf-pests-01 | turf | 197,198 | phi_days | Beta-cyfluthrin 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| turf-pests-02 | turf | 198 | phi_days | Azoxystrobin 6.25% + Propiconazole 10.4% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| turf-pests-02 | turf | 198 | phi_days | Azoxystrobin 20% + Difenoconazole 12.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| citrus-pests-08 | citrus | 208 | phi_days | Fosetyl-aluminium 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| citrus-pests-08 | citrus | 208 | phi_days | Fosetyl-aluminium 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| mango-pests-04 | mango | 215,216 | phi_days | Trichoderma album 2.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-01 | grape | 219 | phi_days | Spirotetramat 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-01 | grape | 219 | phi_days | Sulfoxaflor 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-01 | grape | 219 | phi_days | Mineral oil 82% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-03 | grape | 220 | phi_days | Bifenthrin 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Emamectin benzoate 2.3% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Spinosad 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Bacillus thuringiensis 6.4% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Spinetoram 12% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Methoxyfenozide 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Methoxyfenozide 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Methoxyfenozide 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Methoxyfenozide 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Lufenuron 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Lufenuron 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Lufenuron 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Lufenuron 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Lufenuron 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Indoxacarb 15% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Indoxacarb 15% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Indoxacarb 15% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Indoxacarb 15% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Indoxacarb 15% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Indoxacarb 30% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Indoxacarb 14.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Lufenuron 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Lufenuron 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Indoxacarb 30% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Indoxacarb 30% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Indoxacarb 30% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Methoxyfenozide 30% + Spinetoram 6% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Triflumuron 40% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Bacillus thuringiensis 54% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Spinosad 22.8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Spinosad 22.8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Spinosad 48% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Tebufenozide 20% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-04 | grape | 221,222 | phi_days | Spinosad 2.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-05 | grape | 223 | phi_days | Chlorfenapyr 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-05 | grape | 223 | phi_days | Chlorfenapyr 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-05 | grape | 223 | phi_days | Chlorfenapyr 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-05 | grape | 223 | phi_days | Chlorfenapyr 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-05 | grape | 223 | phi_days | Chlorfenapyr 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-05 | grape | 223 | phi_days | Hexythiazox 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-05 | grape | 223 | phi_days | Hexythiazox 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-05 | grape | 223 | phi_days | Fenpyroximate 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-05 | grape | 223 | phi_days | Fenpyroximate 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-05 | grape | 223 | phi_days | Fenpyroximate 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-05 | grape | 223 | phi_days | Bifenazate 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-05 | grape | 223 | phi_days | Bifenazate 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-05 | grape | 223 | phi_days | Chlorfenapyr 36% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-05 | grape | 223 | phi_days | Chlorfenapyr 36% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-05 | grape | 223 | phi_days | Spirodiclofen 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-05 | grape | 223 | phi_days | Bifenazate 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-05 | grape | 223 | phi_days | Spiromesifen 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Fenpyrazamine 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Boscalid 25.2% + Pyraclostrobin 12.8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Boscalid 25.2% + Pyraclostrobin 12.8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Boscalid 25.2% + Pyraclostrobin 12.8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Trichoderma asperellum 12% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Fenhexamid 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Fenhexamid 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Azoxystrobin 22.8% + Dimethomorph 57.2% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Azoxystrobin 22.8% + Dimethomorph 57.2% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Cyprodinil 37% + Fludioxonil 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Cyprodinil 37% + Fludioxonil 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Cyprodinil 37% + Fludioxonil 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Cyprodinil 37.5% + Fludioxonil 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Cyprodinil 37.5% + Fludioxonil 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Cyprodinil 37.5% + Fludioxonil 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Pyrimethanil 20% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Pyrimethanil 20% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Thiophanate-methyl 70% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Boscalid 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Boscalid 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Boscalid 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Pyrimethanil 40% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Boscalid 25% + Pyraclostrobin 13% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Boscalid 25% + Pyraclostrobin 13% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Bacillus amyloliquefaciens MBI 600 11% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Pyrimethanil 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Pyrimethanil 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Pyrimethanil 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Pyraclostrobin 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Pyraclostrobin 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Pyrimethanil 45% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-06 | grape | 224,225 | phi_days | Boscalid 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Sulfur 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Sulfur 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Sulfur 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Boscalid 20% + Kresoxim-methyl 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Boscalid 20% + Kresoxim-methyl 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Thiophanate-methyl 70% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Thiophanate-methyl 70% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Thiophanate-methyl 70% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Thiophanate-methyl 70% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Thiophanate-methyl 70% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Thiophanate-methyl 70% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Thiophanate-methyl 70% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Thiophanate-methyl 70% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Thiophanate-methyl 70% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Thiophanate-methyl 70% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Sulfur 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Sulfur 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Sulfur 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Sulfur 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Sulfur 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Sulfur 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Sulfur 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Sulfur 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Sulfur 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Sulfur 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Penconazole 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Penconazole 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Penconazole 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Penconazole 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Penconazole 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Azoxystrobin 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Azoxystrobin 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Tebuconazole 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Boscalid 25% + Pyraclostrobin 13% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Propiconazole 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Propiconazole 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Propiconazole 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Propiconazole 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Propiconazole 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Propiconazole 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Propiconazole 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Boscalid 25.2% + Pyraclostrobin 12.8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Boscalid 25.2% + Pyraclostrobin 12.8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Boscalid 25.2% + Pyraclostrobin 12.8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Boscalid 25.2% + Pyraclostrobin 12.8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Tebuconazole 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Bacillus amyloliquefaciens FZB24 13% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Myclobutanil 12.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Myclobutanil 12.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Azoxystrobin 20% + Difenoconazole 12.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Azoxystrobin 20% + Difenoconazole 12.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Azoxystrobin 20% + Difenoconazole 12.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Azoxystrobin 20% + Difenoconazole 12.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Azoxystrobin 20% + Difenoconazole 12.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Azoxystrobin 20% + Difenoconazole 12.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Proquinazid 20% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Trifloxystrobin 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Difenoconazole 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Tetraconazole 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Sulfur 71.76% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Flutianil 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Myclobutanil 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Myclobutanil 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Myclobutanil 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Myclobutanil 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Dimethomorph 12% + Pyraclostrobin 6.7% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Dimethomorph 12% + Pyraclostrobin 6.7% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Dimethomorph 12% + Pyraclostrobin 6.7% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Dimethomorph 12% + Pyraclostrobin 6.7% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Dimethomorph 12% + Pyraclostrobin 6.7% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Dimethomorph 12% + Pyraclostrobin 6.7% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Dimethomorph 12% + Pyraclostrobin 6.7% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Dimethomorph 12% + Pyraclostrobin 6.7% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Spiroxamine 30% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Myclobutanil 40% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Difenoconazole 15% + Propiconazole 15% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Metiram 55% + Pyraclostrobin 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Metiram 55% + Pyraclostrobin 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Metiram 55% + Pyraclostrobin 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Cyflufenamid 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Sulfur 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Sulfur 70% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Boscalid 20% + Pyraclostrobin 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Flutriafol 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Trifloxystrobin 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Metrafenone 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Spiroxamine 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Fluxapyroxad 30% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Boscalid 25.5% + Pyraclostrobin 12.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Difenoconazole 12.5% + Pydiflumetofen 7.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Fluopyram 25% + Trifloxystrobin 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Trifloxystrobin 25% + Tebuconazole 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Fluoxastrobin 48% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-07 | grape | 226,227,228,229,230,231 | phi_days | Mefentrifluconazole 7.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Azoxystrobin 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Azoxystrobin 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Azoxystrobin 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Azoxystrobin 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Azoxystrobin 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Azoxystrobin 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Mancozeb 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Mancozeb 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Mancozeb 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Mancozeb 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Mancozeb 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Mancozeb 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper oxychloride 67.7% + Dimethomorph 6% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Azoxystrobin 20% + Dimethomorph 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Azoxystrobin 20% + Dimethomorph 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Cymoxanil 30% + Famoxadone 22.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Cymoxanil 30% + Famoxadone 22.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Cymoxanil 30% + Famoxadone 22.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Cymoxanil 30% + Famoxadone 22.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper oxychloride 69% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper hydroxide 77% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper hydroxide 24.4% + Copper oxychloride 24.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper hydroxide 46% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Metalaxyl 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Propamocarb hydrochloride 72.2% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Cymoxanil 8% + Mancozeb 64% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Cymoxanil 8% + Mancozeb 64% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Cymoxanil 8% + Mancozeb 64% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Cymoxanil 8% + Mancozeb 64% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Benalaxyl 5% + Copper oxychloride 26.32% + Copper hydroxide 26.18% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Fluoxastrobin 48% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Azoxystrobin 20% + Cyproconazole 8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Azoxystrobin 20% + Cyproconazole 8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Picoxystrobin 22.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Fluopicolide 4.44% + Fosetyl-aluminium 66.67% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper oxychloride 85% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper oxychloride 85% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper oxychloride 85% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Dimethomorph 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Dimethomorph 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper sulfate 23.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Mancozeb 64% + Metalaxyl 8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Mancozeb 64% + Metalaxyl 8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Mancozeb 64% + Metalaxyl 8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Cymoxanil 30% + Famoxadone 22.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Cymoxanil 3% + Bordeaux mixture 22.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Azoxystrobin 6% + Chlorothalonil 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Oxathiapiprolin 4% + Zoxamide 30% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Fluazinam 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Pyraclostrobin 5% + Metiram 55% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Boscalid 25.2% + Pyraclostrobin 12.8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Iprovalicarb 8.4% + Copper oxychloride 70% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Captan 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Captan 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Cymoxanil 45% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Benalaxyl 4% + Mancozeb 65% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper oxychloride 60.06% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Phosphorous acid salts 53.6% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper oxychloride 67% + Dimethomorph 6% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper oxychloride 30% + Cymoxanil 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper hydroxide 61.4% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper oxychloride 68.95% + Cymoxanil 4.2% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper sulfate 25.63% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Azoxystrobin 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Azoxystrobin 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Fosetyl-aluminium 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper sulfate (tribasic) 34.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper oxychloride 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper hydroxide 53.8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Cymoxanil 4% + Folpet 25% + Fosetyl-aluminium ?% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Dimethomorph 12% + Pyraclostrobin 6.7% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Dimethomorph 12% + Pyraclostrobin 6.7% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Ametoctradin 20% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Captan 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Azoxystrobin 20% + Difenoconazole 12.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper oxychloride 84.04% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Cymoxanil 8% + Metalaxyl 64% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Azoxystrobin 20% + Dimethomorph 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Copper sulfate (tribasic) 70% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Fosetyl-aluminium 90% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-08 | grape | 231,232,233,234,235 | phi_days | Folpet 40% + Metalaxyl 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-09 | grape | 236 | phi_days | Oxamyl 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-09 | grape | 236 | phi_days | Oxamyl 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-09 | grape | 236 | phi_days | Fosthiazate 90% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-pests-09 | grape | 236 | phi_days | Fosthiazate 20% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| olive-pests-02 | olive | 240 | phi_days | Bacillus thuringiensis 6.4% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| pomegranate-pests-03 | pomegranate | 245 | phi_days | Bacillus thuringiensis 6.4% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| banana-pests-01 | banana | 261,262 | phi_days | Cadusafos 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| banana-pests-01 | banana | 261,262 | phi_days | Cadusafos 20% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| stored-products-pests-01 | stored-products | 263,264 | phi_days | Aluminium phosphide 56% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| stored-products-pests-01 | stored-products | 263,264 | phi_days | Aluminium phosphide 56% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| stored-products-pests-01 | stored-products | 263,264 | phi_days | Aluminium phosphide 56% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| stored-products-pests-01 | stored-products | 263,264 | phi_days | Aluminium phosphide 56% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| stored-products-pests-01 | stored-products | 263,264 | phi_days | Aluminium phosphide 56% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| stored-products-pests-01 | stored-products | 263,264 | phi_days | Aluminium phosphide 56% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| stored-products-pests-01 | stored-products | 263,264 | phi_days | Aluminium phosphide 56% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| stored-products-pests-01 | stored-products | 263,264 | phi_days | Aluminium phosphide 56% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| stored-products-pests-01 | stored-products | 263,264 | phi_days | Phosphine 2% + CO2 98% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| stored-products-pests-01 | stored-products | 263,264 | phi_days | Magnesium phosphide 66% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| stored-products-pests-02 | stored-products | 264 | phi_days | Phosphine 2% + CO2 98% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| buildings-pests-01 | buildings | 265 | phi_days | Lambda-cyhalothrin 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| buildings-pests-01 | buildings | 265 | phi_days | Indoxacarb 30% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| buildings-pests-01 | buildings | 265 | phi_days | Lambda-cyhalothrin 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| fields-orchards-pests-01 | fields-orchards | 265,266 | phi_days | Zinc phosphide 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| fields-orchards-pests-01 | fields-orchards | 265,266 | phi_days | Zinc phosphide 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| fields-orchards-pests-01 | fields-orchards | 265,266 | phi_days | Zinc phosphide 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| fields-orchards-pests-01 | fields-orchards | 265,266 | phi_days | Zinc phosphide 80% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| fields-orchards-pests-01 | fields-orchards | 265,266 | phi_days | Bromadiolone 0.005% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| fields-orchards-pests-01 | fields-orchards | 265,266 | phi_days | Bromadiolone 0.005% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| snails-pests-01 | snails | 266 | phi_days | Metaldehyde 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| wheat-weeds-07 | wheat | 269,270 | phi_days | Tribenuron-methyl 75% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| wheat-weeds-07 | wheat | 269,270 | phi_days | Bromoxynil octanoate 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| wheat-weeds-07 | wheat | 269,270 | phi_days | Florasulam 7.5% + Flumetsulam 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| wheat-weeds-09 | wheat | 271,272,273 | phi_days | Clodinafop-propargyl 15% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| wheat-weeds-09 | wheat | 271,272,273 | phi_days | Clodinafop-propargyl 15% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| wheat-weeds-09 | wheat | 271,272,273 | phi_days | Clodinafop-propargyl 15% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| flax-weeds-01 | flax | 276 | phi_days | Bromoxynil octanoate 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cotton-pests-02 | cotton | 32 | phi_days | Buprofezin 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cotton-pests-04 | cotton | 33 | phi_days | Bacillus thuringiensis 9.4% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cotton-pests-04 | cotton | 33 | phi_days | Bacillus thuringiensis 9.4% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cotton-pests-05 | cotton | 33,34 | phi_days | Chlorfluazuron 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cotton-pests-05 | cotton | 33,34 | phi_days | Diflubenzuron 48% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cotton-pests-05 | cotton | 33,34 | phi_days | Hexaflumuron 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cotton-pests-06 | cotton | 35,36,37 | phi_days | Lambda-cyhalothrin 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cotton-pests-06 | cotton | 35,36,37 | phi_days | Alpha-cypermethrin 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cotton-pests-06 | cotton | 35,36,37 | phi_days | Alpha-cypermethrin 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cotton-pests-06 | cotton | 35,36,37 | phi_days | Lambda-cyhalothrin 2.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cotton-pests-06 | cotton | 35,36,37 | phi_days | Cypermethrin 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cotton-pests-06 | cotton | 35,36,37 | phi_days | Cypermethrin 20% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cotton-pests-07 | cotton | 38 | phi_days | Fenpyroximate 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cotton-pests-07 | cotton | 38 | phi_days | Abamectin 1.8% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cotton-pests-08 | cotton | 39 | phi_days | Fludioxonil 2.5% + Metalaxyl-M 1% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cotton-pests-08 | cotton | 39 | phi_days | Flutolanil 25% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| rice-pests-05 | rice | 44 | phi_days | Fosthiazate 75% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| maize-pests-02 | maize | 46 | phi_days | Lufenuron 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| maize-pests-03 | maize | 46,47 | phi_days | Indoxacarb 30% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| maize-pests-03 | maize | 46,47 | phi_days | Chlorfenapyr 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| maize-pests-03 | maize | 46,47 | phi_days | Emamectin benzoate 5.7% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| maize-pests-03 | maize | 46,47 | phi_days | Chlorantraniliprole 20% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| maize-pests-03 | maize | 46,47 | phi_days | Bacillus thuringiensis 9.4% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| maize-pests-03 | maize | 46,47 | phi_days | Acetamiprid 22.7% + Bifenthrin 27.3% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| maize-pests-03 | maize | 46,47 | phi_days | Bacillus thuringiensis 6.4% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| maize-pests-03 | maize | 46,47 | phi_days | Lambda-cyhalothrin 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| maize-pests-04 | maize | 48 | phi_days | Lufenuron 5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| maize-pests-05 | maize | 48,49 | phi_days | Fludioxonil 2.5% + Metalaxyl-M 1% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cotton-weeds-09 | cotton | 290 | phi_days | Pendimethalin 45.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| cotton-weeds-10 | cotton | 291 | phi_days | Quizalofop-P-tefuryl 4% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| rice-weeds-07 | rice | 293 | phi_days | Penoxsulam 24% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| rice-weeds-07 | rice | 293 | phi_days | Thiobencarb 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| rice-weeds-09 | rice | 294,295,296 | phi_days | Halosulfuron-methyl 75% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| rice-weeds-09 | rice | 294,295,296 | phi_days | Bentazone 48% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| rice-weeds-09 | rice | 294,295,296 | phi_days | Pyrazosulfuron-ethyl 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| rice-weeds-10 | rice | 296,297 | phi_days | Penoxsulam 2.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| rice-weeds-10 | rice | 296,297 | phi_days | Thiobencarb 50% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| rice-weeds-13 | rice | 300,301 | phi_days | Pyrazosulfuron-ethyl 10% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| maize-weeds-07 | maize | 303,304 | phi_days | Pendimethalin 45.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| sugarcane-weeds-05 | sugarcane | 307 | phi_days | Fluroxypyr 20% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| peanut-weeds-07 | peanut | 310 | phi_days | Fluazifop-P-butyl 12.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| peanut-weeds-07 | peanut | 310 | phi_days | Fluazifop-P-butyl 12.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| peanut-weeds-10 | peanut | 313 | phi_days | Clethodim 12.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| peanut-weeds-10 | peanut | 313 | phi_days | Fluazifop-P-butyl 12.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| tomato-weeds-20 | tomato | 318 | phi_days | Fluazifop-P-butyl 12.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| potato-weeds-18 | potato | 319 | phi_days | Metribuzin 48% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| potato-weeds-20 | potato | 320,321 | phi_days | Quizalofop-P-tefuryl 4% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| grape-weeds-12 | grape | 343 | phi_days | Clethodim 12.5% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| turf-weeds-03 | turf | 349,350 | phi_days | Prodiamine 65% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |
| canal-banks-drains-weeds-01 | canal-banks-drains | 350 | phi_days | Glyphosate isopropylammonium 48% | فترة الأمان فارغة (أو أكثر من قيمة في الأصل بحسب الملاحظة) |

### 2. مجموعة الآفات pest_group — 162 صفاً

**المصدر الداعم:** حزمة التدقيق (recommendations_audit.xlsx — ورقة missing_conflicts) مقابل كتاب APC 2025 · **الإجراء المطلوب من المالك:** تصحيح الإسناد يدوياً من الصفحة — لا يُستنتج من اسم الآفة أو نوعها

| معرف البطاقة | المحصول | صفحات المصدر | الحقل | القيمة الأصلية | وصف المشكلة |
|---|---|---|---|---|---|
| wheat-pests-03 | wheat | 5 | pest_group |  | مجموعة الآفة فارغة |
| wheat-pests-04 | wheat | 5,6 | pest_group |  | مجموعة الآفة فارغة |
| wheat-pests-05 | wheat | 7 | pest_group |  | مجموعة الآفة فارغة |
| wheat-pests-06 | wheat | 7 | pest_group |  | مجموعة الآفة فارغة |
| onion-pests-03 | onion | 13,14 | pest_group |  | مجموعة الآفة فارغة |
| onion-pests-04 | onion | 14,15 | pest_group |  | مجموعة الآفة فارغة |
| onion-pests-05 | onion | 15 | pest_group |  | مجموعة الآفة فارغة |
| garlic-pests-04 | garlic | 19 | pest_group |  | مجموعة الآفة فارغة |
| sugar-beet-pests-02 | sugar-beet | 21,22,23,24 | pest_group |  | مجموعة الآفة فارغة |
| sugar-beet-pests-03 | sugar-beet | 24 | pest_group |  | مجموعة الآفة فارغة |
| sugar-beet-pests-04 | sugar-beet | 25 | pest_group |  | مجموعة الآفة فارغة |
| sugarcane-pests-02 | sugarcane | 51 | pest_group |  | مجموعة الآفة فارغة |
| sugarcane-pests-04 | sugarcane | 53 | pest_group |  | مجموعة الآفة فارغة |
| peanut-pests-03 | peanut | 55,56 | pest_group |  | مجموعة الآفة فارغة |
| peanut-pests-04 | peanut | 56 | pest_group |  | مجموعة الآفة فارغة |
| sesame-pests-02 | sesame | 58 | pest_group |  | مجموعة الآفة فارغة |
| sunflower-pests-02 | sunflower | 59 | pest_group |  | مجموعة الآفة فارغة |
| tomato-pests-02 | tomato | 62,63,64,65 | pest_group |  | مجموعة الآفة فارغة |
| tomato-pests-03 | tomato | 66 | pest_group |  | مجموعة الآفة فارغة |
| tomato-pests-04 | tomato | 67,68 | pest_group |  | مجموعة الآفة فارغة |
| tomato-pests-05 | tomato | 69,70,71 | pest_group |  | مجموعة الآفة فارغة |
| tomato-pests-06 | tomato | 72 | pest_group |  | مجموعة الآفة فارغة |
| tomato-pests-07 | tomato | 73 | pest_group |  | مجموعة الآفة فارغة |
| tomato-pests-08 | tomato | 74 | pest_group |  | مجموعة الآفة فارغة |
| tomato-pests-11 | tomato | 78,79 | pest_group |  | مجموعة الآفة فارغة |
| tomato-pests-12 | tomato | 79,80 | pest_group |  | مجموعة الآفة فارغة |
| tomato-pests-13 | tomato | 81,82,83 | pest_group |  | مجموعة الآفة فارغة |
| tomato-pests-14 | tomato | 84,85,86 | pest_group |  | مجموعة الآفة فارغة |
| tomato-pests-15 | tomato | 87 | pest_group |  | مجموعة الآفة فارغة |
| potato-pests-03 | potato | 91 | pest_group |  | مجموعة الآفة فارغة |
| potato-pests-04 | potato | 91,92 | pest_group |  | مجموعة الآفة فارغة |
| potato-pests-05 | potato | 93,94 | pest_group |  | مجموعة الآفة فارغة |
| potato-pests-06 | potato | 95 | pest_group |  | مجموعة الآفة فارغة |
| potato-pests-09 | potato | 98 | pest_group |  | مجموعة الآفة فارغة |
| potato-pests-10 | potato | 99 | pest_group |  | مجموعة الآفة فارغة |
| potato-pests-11 | potato | 100 | pest_group |  | مجموعة الآفة فارغة |
| potato-pests-12 | potato | 101 | pest_group |  | مجموعة الآفة فارغة |
| potato-pests-13 | potato | 101,102,103,104,105 | pest_group |  | مجموعة الآفة فارغة |
| potato-pests-14 | potato | 106,107,108,109,110 | pest_group |  | مجموعة الآفة فارغة |
| potato-pests-15 | potato | 111 | pest_group |  | مجموعة الآفة فارغة |
| potato-pests-16 | potato | 111 | pest_group |  | مجموعة الآفة فارغة |
| sweet-potato-pests-02 | sweet-potato | 113,114 | pest_group |  | مجموعة الآفة فارغة |
| pepper-pests-02 | pepper | 118,119 | pest_group |  | مجموعة الآفة فارغة |
| pepper-pests-03 | pepper | 119 | pest_group |  | مجموعة الآفة فارغة |
| pepper-pests-04 | pepper | 120 | pest_group |  | مجموعة الآفة فارغة |
| pepper-pests-07 | pepper | 122 | pest_group |  | مجموعة الآفة فارغة |
| cucumber-pests-11 | cucumber | 140 | pest_group |  | مجموعة الآفة فارغة |
| cabbage-pests-03 | cabbage | 179 | pest_group |  | مجموعة الآفة فارغة |
| cabbage-pests-04 | cabbage | 179,180 | pest_group |  | مجموعة الآفة فارغة |
| cabbage-pests-05 | cabbage | 180 | pest_group |  | مجموعة الآفة فارغة |
| cabbage-pests-06 | cabbage | 181 | pest_group |  | مجموعة الآفة فارغة |
| strawberry-pests-04 | strawberry | 193,194 | pest_group |  | مجموعة الآفة فارغة |
| strawberry-pests-05 | strawberry | 194 | pest_group |  | مجموعة الآفة فارغة |
| strawberry-pests-06 | strawberry | 195 | pest_group |  | مجموعة الآفة فارغة |
| citrus-pests-02 | citrus | 201,202 | pest_group |  | مجموعة الآفة فارغة |
| citrus-pests-03 | citrus | 203 | pest_group |  | مجموعة الآفة فارغة |
| citrus-pests-05 | citrus | 205 | pest_group |  | مجموعة الآفة فارغة |
| citrus-pests-06 | citrus | 205,206,207 | pest_group |  | مجموعة الآفة فارغة |
| citrus-pests-07 | citrus | 207,208 | pest_group |  | مجموعة الآفة فارغة |
| citrus-pests-08 | citrus | 208 | pest_group |  | مجموعة الآفة فارغة |
| citrus-pests-09 | citrus | 209 | pest_group |  | مجموعة الآفة فارغة |
| citrus-pests-11 | citrus | 211 | pest_group |  | مجموعة الآفة فارغة |
| mango-pests-05 | mango | 217 | pest_group |  | مجموعة الآفة فارغة |
| mango-pests-06 | mango | 218 | pest_group |  | مجموعة الآفة فارغة |
| grape-pests-02 | grape | 220 | pest_group |  | مجموعة الآفة فارغة |
| grape-pests-03 | grape | 220 | pest_group |  | مجموعة الآفة فارغة |
| grape-pests-04 | grape | 221,222 | pest_group |  | مجموعة الآفة فارغة |
| grape-pests-07 | grape | 226,227,228,229,230,231 | pest_group |  | مجموعة الآفة فارغة |
| grape-pests-08 | grape | 231,232,233,234,235 | pest_group |  | مجموعة الآفة فارغة |
| apple-pests-05 | apple | 248,249 | pest_group |  | مجموعة الآفة فارغة |
| apple-pests-06 | apple | 250,251 | pest_group |  | مجموعة الآفة فارغة |
| apple-pests-07 | apple | 252,253 | pest_group |  | مجموعة الآفة فارغة |
| peach-pests-06 | peach | 260 | pest_group |  | مجموعة الآفة فارغة |
| wheat-weeds-07 | wheat | 269,270 | pest_group |  | مجموعة الآفة فارغة |
| wheat-weeds-08 | wheat | 271 | pest_group |  | مجموعة الآفة فارغة |
| wheat-weeds-09 | wheat | 271,272,273 | pest_group |  | مجموعة الآفة فارغة |
| wheat-weeds-10 | wheat | 274,275 | pest_group |  | مجموعة الآفة فارغة |
| barley-weeds-01 | barley | 275 | pest_group |  | مجموعة الآفة فارغة |
| flax-weeds-01 | flax | 276 | pest_group |  | مجموعة الآفة فارغة |
| faba-bean-weeds-04 | faba-bean | 277 | pest_group |  | مجموعة الآفة فارغة |
| onion-weeds-06 | onion | 277,278 | pest_group |  | مجموعة الآفة فارغة |
| onion-weeds-07 | onion | 279 | pest_group |  | مجموعة الآفة فارغة |
| onion-weeds-08 | onion | 279,280 | pest_group |  | مجموعة الآفة فارغة |
| garlic-weeds-05 | garlic | 280,281 | pest_group |  | مجموعة الآفة فارغة |
| garlic-weeds-06 | garlic | 281 | pest_group |  | مجموعة الآفة فارغة |
| garlic-weeds-07 | garlic | 282 | pest_group |  | مجموعة الآفة فارغة |
| sugar-beet-weeds-07 | sugar-beet | 283,284 | pest_group |  | مجموعة الآفة فارغة |
| sugar-beet-weeds-08 | sugar-beet | 284,285,286 | pest_group |  | مجموعة الآفة فارغة |
| sugar-beet-weeds-09 | sugar-beet | 286,287 | pest_group |  | مجموعة الآفة فارغة |
| cotton-pests-02 | cotton | 32 | pest_group |  | مجموعة الآفة فارغة |
| cotton-pests-03 | cotton | 32 | pest_group |  | مجموعة الآفة فارغة |
| cotton-pests-04 | cotton | 33 | pest_group |  | مجموعة الآفة فارغة |
| cotton-pests-05 | cotton | 33,34 | pest_group |  | مجموعة الآفة فارغة |
| cotton-pests-06 | cotton | 35,36,37 | pest_group |  | مجموعة الآفة فارغة |
| rice-pests-03 | rice | 42,43 | pest_group |  | مجموعة الآفة فارغة |
| rice-pests-04 | rice | 43 | pest_group |  | مجموعة الآفة فارغة |
| maize-pests-02 | maize | 46 | pest_group |  | مجموعة الآفة فارغة |
| maize-pests-03 | maize | 46,47 | pest_group |  | مجموعة الآفة فارغة |
| maize-pests-04 | maize | 48 | pest_group |  | مجموعة الآفة فارغة |
| chickpea-weeds-01 | chickpea | 288 | pest_group |  | مجموعة الآفة فارغة |
| egyptian-clover-weeds-02 | egyptian-clover | 289 | pest_group |  | مجموعة الآفة فارغة |
| cotton-weeds-09 | cotton | 290 | pest_group |  | مجموعة الآفة فارغة |
| cotton-weeds-10 | cotton | 291 | pest_group |  | مجموعة الآفة فارغة |
| sunflower-weeds-03 | sunflower | 291 | pest_group |  | مجموعة الآفة فارغة |
| rice-weeds-06 | rice | 292 | pest_group |  | مجموعة الآفة فارغة |
| rice-weeds-07 | rice | 293 | pest_group |  | مجموعة الآفة فارغة |
| rice-weeds-08 | rice | 294 | pest_group |  | مجموعة الآفة فارغة |
| rice-weeds-09 | rice | 294,295,296 | pest_group |  | مجموعة الآفة فارغة |
| rice-weeds-10 | rice | 296,297 | pest_group |  | مجموعة الآفة فارغة |
| rice-weeds-11 | rice | 298 | pest_group |  | مجموعة الآفة فارغة |
| rice-weeds-12 | rice | 299 | pest_group |  | مجموعة الآفة فارغة |
| rice-weeds-13 | rice | 300,301 | pest_group |  | مجموعة الآفة فارغة |
| maize-weeds-06 | maize | 302 | pest_group |  | مجموعة الآفة فارغة |
| maize-weeds-07 | maize | 303,304 | pest_group |  | مجموعة الآفة فارغة |
| maize-weeds-08 | maize | 305 | pest_group |  | مجموعة الآفة فارغة |
| maize-weeds-09 | maize | 305,306 | pest_group |  | مجموعة الآفة فارغة |
| yellow-maize-weeds-01 | yellow-maize | 306 | pest_group |  | مجموعة الآفة فارغة |
| sugarcane-weeds-05 | sugarcane | 307 | pest_group |  | مجموعة الآفة فارغة |
| sugarcane-weeds-06 | sugarcane | 308 | pest_group |  | مجموعة الآفة فارغة |
| peanut-weeds-06 | peanut | 309 | pest_group |  | مجموعة الآفة فارغة |
| peanut-weeds-07 | peanut | 310 | pest_group |  | مجموعة الآفة فارغة |
| peanut-weeds-08 | peanut | 311 | pest_group |  | مجموعة الآفة فارغة |
| peanut-weeds-09 | peanut | 312 | pest_group |  | مجموعة الآفة فارغة |
| peanut-weeds-10 | peanut | 313 | pest_group |  | مجموعة الآفة فارغة |
| soybean-weeds-02 | soybean | 314 | pest_group |  | مجموعة الآفة فارغة |
| tomato-weeds-17 | tomato | 315 | pest_group |  | مجموعة الآفة فارغة |
| tomato-weeds-18 | tomato | 316 | pest_group |  | مجموعة الآفة فارغة |
| tomato-weeds-19 | tomato | 317 | pest_group |  | مجموعة الآفة فارغة |
| tomato-weeds-20 | tomato | 318 | pest_group |  | مجموعة الآفة فارغة |
| tomato-weeds-21 | tomato | 318 | pest_group |  | مجموعة الآفة فارغة |
| potato-weeds-18 | potato | 319 | pest_group |  | مجموعة الآفة فارغة |
| potato-weeds-19 | potato | 320 | pest_group |  | مجموعة الآفة فارغة |
| potato-weeds-20 | potato | 320,321 | pest_group |  | مجموعة الآفة فارغة |
| potato-weeds-21 | potato | 321 | pest_group |  | مجموعة الآفة فارغة |
| potato-weeds-22 | potato | 322 | pest_group |  | مجموعة الآفة فارغة |
| potato-weeds-23 | potato | 323 | pest_group |  | مجموعة الآفة فارغة |
| potato-weeds-24 | potato | 323,324 | pest_group |  | مجموعة الآفة فارغة |
| potato-weeds-25 | potato | 324 | pest_group |  | مجموعة الآفة فارغة |
| pea-weeds-05 | pea | 325 | pest_group |  | مجموعة الآفة فارغة |
| pea-weeds-06 | pea | 326 | pest_group |  | مجموعة الآفة فارغة |
| snap-bean-weeds-07 | snap-bean | 327 | pest_group |  | مجموعة الآفة فارغة |
| snap-bean-weeds-08 | snap-bean | 327,328 | pest_group |  | مجموعة الآفة فارغة |
| cowpea-weeds-05 | cowpea | 328 | pest_group |  | مجموعة الآفة فارغة |
| seed-watermelon-weeds-08 | seed-watermelon | 329 | pest_group |  | مجموعة الآفة فارغة |
| eggplant-weeds-03 | eggplant | 330 | pest_group |  | مجموعة الآفة فارغة |
| eggplant-weeds-04 | eggplant | 331 | pest_group |  | مجموعة الآفة فارغة |
| cabbage-weeds-10 | cabbage | 332 | pest_group |  | مجموعة الآفة فارغة |
| cabbage-weeds-11 | cabbage | 333 | pest_group |  | مجموعة الآفة فارغة |
| carrot-weeds-04 | carrot | 334 | pest_group |  | مجموعة الآفة فارغة |
| citrus-weeds-12 | citrus | 335,336,337,338 | pest_group |  | مجموعة الآفة فارغة |
| citrus-weeds-13 | citrus | 338 | pest_group |  | مجموعة الآفة فارغة |
| citrus-weeds-14 | citrus | 339 | pest_group |  | مجموعة الآفة فارغة |
| citrus-weeds-15 | citrus | 340 | pest_group |  | مجموعة الآفة فارغة |
| grape-weeds-10 | grape | 341 | pest_group |  | مجموعة الآفة فارغة |
| grape-weeds-11 | grape | 342 | pest_group |  | مجموعة الآفة فارغة |
| grape-weeds-12 | grape | 343 | pest_group |  | مجموعة الآفة فارغة |
| orchards-pome-stone-weeds-01 | orchards-pome-stone | 344,345 | pest_group |  | مجموعة الآفة فارغة |
| orchards-pome-stone-weeds-02 | orchards-pome-stone | 346 | pest_group |  | مجموعة الآفة فارغة |
| orchards-pome-stone-weeds-03 | orchards-pome-stone | 347 | pest_group |  | مجموعة الآفة فارغة |
| orchards-pome-stone-weeds-04 | orchards-pome-stone | 348 | pest_group |  | مجموعة الآفة فارغة |
| orchards-pome-stone-weeds-05 | orchards-pome-stone | 349 | pest_group |  | مجموعة الآفة فارغة |
| turf-weeds-03 | turf | 349,350 | pest_group |  | مجموعة الآفة فارغة |

### 3. مجموع التركيزات مقابل نسبة المستحضر concentration_sum — 20 صفاً

**المصدر الداعم:** حزمة التدقيق (recommendations_audit.xlsx — ورقة missing_conflicts) مقابل كتاب APC 2025 · **الإجراء المطلوب من المالك:** مطابقة القيمتين بالأصل المطبوع — قد تكون النسبة المطبوعة صحيحة رغم عدم تطابق المجموع

| معرف البطاقة | المحصول | صفحات المصدر | الحقل | القيمة الأصلية | وصف المشكلة |
|---|---|---|---|---|---|
| onion-pests-02 | onion | 11,12 | concentration_sum | Dimethomorph 30% + Fosetyl-aluminium 45% | مجموع تراكيز المواد 75 ≠ نسبة المستحضر 60 (قد يكون من الأصل المطبوع) |
| tomato-pests-12 | tomato | 79,80 | concentration_sum | Tebuconazole 25% + Trifloxystrobin 25% | مجموع تراكيز المواد 50 ≠ نسبة المستحضر 75 (قد يكون من الأصل المطبوع) |
| tomato-pests-13 | tomato | 81,82,83 | concentration_sum | Chlorothalonil 25% + Difenoconazole 5% | مجموع تراكيز المواد 30 ≠ نسبة المستحضر 55 (قد يكون من الأصل المطبوع) |
| tomato-pests-16 | tomato | 87,88 | concentration_sum | Oxamyl 24% | مجموع تراكيز المواد 24 ≠ نسبة المستحضر 10 (قد يكون من الأصل المطبوع) |
| potato-pests-13 | potato | 101,102,103,104,105 | concentration_sum | Cymoxanil 8% + Mancozeb 68% | مجموع تراكيز المواد 76 ≠ نسبة المستحضر 72 (قد يكون من الأصل المطبوع) |
| potato-pests-13 | potato | 101,102,103,104,105 | concentration_sum | Dimethomorph 7.2% + Pyraclostrobin 5% | مجموع تراكيز المواد 12.2 ≠ نسبة المستحضر 11.2 (قد يكون من الأصل المطبوع) |
| potato-pests-14 | potato | 106,107,108,109,110 | concentration_sum | Copper oxychloride 40% + Metalaxyl-M 4% | مجموع تراكيز المواد 44 ≠ نسبة المستحضر 45 (قد يكون من الأصل المطبوع) |
| potato-pests-14 | potato | 106,107,108,109,110 | concentration_sum | Azoxystrobin 16.8% + Cyazofamid 7.4% | مجموع تراكيز المواد 24.200000000000003 ≠ نسبة المستحضر 26 (قد يكون من الأصل المطبوع) |
| cucumber-pests-01 | cucumber | 124,125 | concentration_sum | Abamectin 2% + Thiamethoxam 12% | مجموع تراكيز المواد 14 ≠ نسبة المستحضر 12 (قد يكون من الأصل المطبوع) |
| cucumber-pests-02 | cucumber | 126,127 | concentration_sum | Fludioxonil 2% + Thiamethoxam 10% | مجموع تراكيز المواد 12 ≠ نسبة المستحضر 22 (قد يكون من الأصل المطبوع) |
| cucumber-pests-07 | cucumber | 131,132,133 | concentration_sum | Fosetyl-aluminium 31% + Propamocarb hydrochloride 43% | مجموع تراكيز المواد 74 ≠ نسبة المستحضر 84 (قد يكون من الأصل المطبوع) |
| grape-pests-08 | grape | 231,232,233,234,235 | concentration_sum | Mancozeb 60% + Metalaxyl 8% | مجموع تراكيز المواد 68 ≠ نسبة المستحضر 72 (قد يكون من الأصل المطبوع) |
| peach-pests-04 | peach | 258,259 | concentration_sum | Prochloraz 10% + Propiconazole 6% | مجموع تراكيز المواد 16 ≠ نسبة المستحضر 46 (قد يكون من الأصل المطبوع) |
| wheat-weeds-07 | wheat | 269,270 | concentration_sum | Florasulam 5.7% + Flumetsulam 10% | مجموع تراكيز المواد 15.7 ≠ نسبة المستحضر 17.5 (قد يكون من الأصل المطبوع) |
| wheat-weeds-10 | wheat | 274,275 | concentration_sum | Diflufenican 5% + Iodosulfuron-methyl-sodium 0.25% + Mesosulfuron-methyl 0.75% + Mefenpyr-diethyl 2.25% | مجموع تراكيز المواد 8.25 ≠ نسبة المستحضر 6 (قد يكون من الأصل المطبوع) |
| sugar-beet-weeds-08 | sugar-beet | 284,285,286 | concentration_sum | Phenmedipham 9.1% + Desmedipham 7.1% + Ethofumesate 11.2% | مجموع تراكيز المواد 27.4 ≠ نسبة المستحضر 24.7 (قد يكون من الأصل المطبوع) |
| sugar-beet-weeds-08 | sugar-beet | 284,285,286 | concentration_sum | Phenmedipham 9.1% + Desmedipham 7.1% + Ethofumesate 11.2% | مجموع تراكيز المواد 27.4 ≠ نسبة المستحضر 24.7 (قد يكون من الأصل المطبوع) |
| peanut-weeds-06 | peanut | 309 | concentration_sum | MCPA 28.5% + Imazapic 2.5% | مجموع تراكيز المواد 31.0 ≠ نسبة المستحضر 24 (قد يكون من الأصل المطبوع) |
| orchards-pome-stone-weeds-03 | orchards-pome-stone | 347 | concentration_sum | Imazapic 2.5% + MCPA 25.5% | مجموع تراكيز المواد 28.0 ≠ نسبة المستحضر 31 (قد يكون من الأصل المطبوع) |
| orchards-pome-stone-weeds-04 | orchards-pome-stone | 348 | concentration_sum | Imazapic 2.5% | مجموع تراكيز المواد 2.5 ≠ نسبة المستحضر 24 (قد يكون من الأصل المطبوع) |

### 4. تركيز مادة مفرد concentration — 5 صفاً

**المصدر الداعم:** حزمة التدقيق (recommendations_audit.xlsx — ورقة missing_conflicts) مقابل كتاب APC 2025 · **الإجراء المطلوب من المالك:** قراءة التركيز من الجدول في الصفحة المطبوعة

| معرف البطاقة | المحصول | صفحات المصدر | الحقل | القيمة الأصلية | وصف المشكلة |
|---|---|---|---|---|---|
| peanut-pests-03 | peanut | 55,56 | concentration | Difenoconazole ?% + Propiconazole ?% | تركيز مادة فعالة غير مطبوع/غير محدد |
| cucumber-pests-07 | cucumber | 131,132,133 | concentration | Hymexazol ?% + Metalaxyl-M ?% | تركيز مادة فعالة غير مطبوع/غير محدد |
| shammam-pests-01 | shammam | 153 | concentration | Chlorothalonil 16.6% + Tebuconazole ?% | تركيز مادة فعالة غير مطبوع/غير محدد |
| pea-pests-04 | pea | 172 | concentration | Mancozeb ?% | تركيز مادة فعالة غير مطبوع/غير محدد |
| grape-pests-08 | grape | 231,232,233,234,235 | concentration | Cymoxanil 4% + Folpet 25% + Fosetyl-aluminium ?% | تركيز مادة فعالة غير مطبوع/غير محدد |

### 5. حدود المتبقيات MRL — 3 صفاً

**المصدر الداعم:** حزمة التدقيق (recommendations_audit.xlsx — ورقة missing_conflicts) مقابل كتاب APC 2025 · **الإجراء المطلوب من المالك:** مطابقة عدد أسطر MRL بعدد المواد — لا يُشتق حدّ غير مطبوع

| معرف البطاقة | المحصول | صفحات المصدر | الحقل | القيمة الأصلية | وصف المشكلة |
|---|---|---|---|---|---|
| peanut-pests-03 | peanut | 55,56 | mrl | Difenoconazole ?% + Propiconazole ?% | عدد أسطر MRL (1) ≠ عدد المواد (2) |
| stored-products-pests-01 | stored-products | 263,264 | mrl | Phosphine 2% + CO2 98% | عدد أسطر MRL (1) ≠ عدد المواد (2) |
| stored-products-pests-02 | stored-products | 264 | mrl | Phosphine 2% + CO2 98% | عدد أسطر MRL (1) ≠ عدد المواد (2) |

### 6. نوع التركيبة formulation_type — 14 صفاً

**المصدر الداعم:** حزمة التدقيق (recommendations_audit.xlsx — ورقة missing_conflicts) مقابل كتاب APC 2025 · **الإجراء المطلوب من المالك:** قراءة عمود التركيبة من الصفحة كما هو

| معرف البطاقة | المحصول | صفحات المصدر | الحقل | القيمة الأصلية | وصف المشكلة |
|---|---|---|---|---|---|
| watermelon-pests-01 | watermelon | 144,145 | formulation_type | Hexythiazox 5% | نوع المستحضر غير موجود |
| citrus-pests-01 | citrus | 199,200 | formulation_type | Mineral oil 80% | نوع المستحضر غير موجود |
| citrus-pests-01 | citrus | 199,200 | formulation_type | Mineral oil 80% | نوع المستحضر غير موجود |
| citrus-pests-01 | citrus | 199,200 | formulation_type | Mineral oil 85% | نوع المستحضر غير موجود |
| mango-pests-01 | mango | 213 | formulation_type | Mineral oil 85% | نوع المستحضر غير موجود |
| mango-pests-01 | mango | 213 | formulation_type | Mineral oil 82% | نوع المستحضر غير موجود |
| mango-pests-02 | mango | 213,214 | formulation_type | Mineral oil 85% | نوع المستحضر غير موجود |
| mango-pests-02 | mango | 213,214 | formulation_type | Mineral oil 82% | نوع المستحضر غير موجود |
| grape-pests-01 | grape | 219 | formulation_type | Mineral oil 82% | نوع المستحضر غير موجود |
| guava-pests-01 | guava | 241 | formulation_type | Mineral oil 80% | نوع المستحضر غير موجود |
| guava-pests-01 | guava | 241 | formulation_type | Mineral oil 80% | نوع المستحضر غير موجود |
| pear-pests-01 | pear | 253,254 | formulation_type | Mineral oil 80% | نوع المستحضر غير موجود |
| fields-orchards-pests-01 | fields-orchards | 265,266 | formulation_type | Bromadiolone 0.005% | نوع المستحضر غير موجود |
| fields-orchards-pests-01 | fields-orchards | 265,266 | formulation_type | Bromadiolone 0.005% | نوع المستحضر غير موجود |

### 7. تصنيف WHO — 13 صفاً

**المصدر الداعم:** حزمة التدقيق (recommendations_audit.xlsx — ورقة missing_conflicts) مقابل كتاب APC 2025 · **الإجراء المطلوب من المالك:** النقل كما في الكتاب؛ لا يُصحَّح بالتخمين ولا بمصدر خارجي

| معرف البطاقة | المحصول | صفحات المصدر | الحقل | القيمة الأصلية | وصف المشكلة |
|---|---|---|---|---|---|
| olive-pests-02 | olive | 240 | who | Bacillus thuringiensis 6.4% | تصنيف WHO فارغ |
| tomato-pests-04 | tomato | 67,68 | who | Cyromazine | تصنيف WHO مختلف بين صفوف نفس المادة/المستحضر: Low III/U (قد يعود لاختلاف المنتجات؛ يلزم تدقيق الأصل) |
| tomato-pests-13 | tomato | 81,82,83 | who | Difenoconazole | تصنيف WHO مختلف بين صفوف نفس المادة/المستحضر: Mod II/U (قد يعود لاختلاف المنتجات؛ يلزم تدقيق الأصل) |
| potato-pests-13 | potato | 101,102,103,104,105 | who | Cymoxanil + Mancozeb | تصنيف WHO مختلف بين صفوف نفس المادة/المستحضر: Low III/Mod II (قد يعود لاختلاف المنتجات؛ يلزم تدقيق الأصل) |
| potato-pests-14 | potato | 106,107,108,109,110 | who | Copper oxychloride | تصنيف WHO مختلف بين صفوف نفس المادة/المستحضر: Low III/Mod II (قد يعود لاختلاف المنتجات؛ يلزم تدقيق الأصل) |
| cucumber-pests-07 | cucumber | 131,132,133 | who | Hymexazol | تصنيف WHO مختلف بين صفوف نفس المادة/المستحضر: Low III/U (قد يعود لاختلاف المنتجات؛ يلزم تدقيق الأصل) |
| cucumber-pests-07 | cucumber | 131,132,133 | who | Hymexazol | تصنيف WHO مختلف بين صفوف نفس المادة/المستحضر: Low III/U (قد يعود لاختلاف المنتجات؛ يلزم تدقيق الأصل) |
| strawberry-pests-02 | strawberry | 190,191 | who | Pyridaben | تصنيف WHO مختلف بين صفوف نفس المادة/المستحضر: Low III/Mod II (قد يعود لاختلاف المنتجات؛ يلزم تدقيق الأصل) |
| citrus-pests-02 | citrus | 201,202 | who | Deltamethrin | تصنيف WHO مختلف بين صفوف نفس المادة/المستحضر: Low III/U (قد يعود لاختلاف المنتجات؛ يلزم تدقيق الأصل) |
| citrus-pests-04 | citrus | 203,204 | who | Hexythiazox | تصنيف WHO مختلف بين صفوف نفس المادة/المستحضر: Mod II/U (قد يعود لاختلاف المنتجات؛ يلزم تدقيق الأصل) |
| citrus-pests-04 | citrus | 203,204 | who | Hexythiazox | تصنيف WHO مختلف بين صفوف نفس المادة/المستحضر: Mod II/U (قد يعود لاختلاف المنتجات؛ يلزم تدقيق الأصل) |
| citrus-pests-04 | citrus | 203,204 | who | Hexythiazox | تصنيف WHO مختلف بين صفوف نفس المادة/المستحضر: Mod II/U (قد يعود لاختلاف المنتجات؛ يلزم تدقيق الأصل) |
| citrus-pests-06 | citrus | 205,206,207 | who | Clofentezine | تصنيف WHO مختلف بين صفوف نفس المادة/المستحضر: Low III/U (قد يعود لاختلاف المنتجات؛ يلزم تدقيق الأصل) |

### 8. قراءات غير مؤكدة من صورة PDF (بما فيها صيغ المعدل) — 50 صفاً

**المصدر الداعم:** حزمة التدقيق (ورقة uncertain) · **الإجراء المطلوب من المالك:** فتح الصفحة المطبوعة والتأكد يدوياً — النص قُرئ من صورة بدقة محدودة

| معرف البطاقة | المحصول | صفحات المصدر | الحقل | القيمة الأصلية | وصف المشكلة |
|---|---|---|---|---|---|
| potato-pests-05 | potato | 93,94 | قراءة غير مؤكدة (card) |  | نصوص الوصف مقروءة من صورة 110dpi دون تكبير؛ صف Bt الأول (WP 5.5%) صيغة معدله غير واضحة |
| potato-pests-13 | potato | 101,102,103,104,105 | قراءة غير مؤكدة (card) |  |  |
| seed-squash-pests-01 | seed-squash | 143 | قراءة غير مؤكدة (card) |  | PHI مطبوعة 01 |
| seed-watermelon-pests-06 | seed-watermelon | 151,152 | قراءة غير مؤكدة (card) |  | pest_group مستنتج من القسم السابق؛ المعدل 850 في الصف الثاني كما طُبع (قد يكون خطأ مطبعي) |
| citrus-pests-09 | citrus | 209 | قراءة غير مؤكدة (card) |  | نص مظهر الإصابة وميعاد الظهور مقروء من صورة 110 dpi؛ قد توجد فروق إملائية بسيطة (مثل: المواله/الموالح، ظروف تخزين سيئة). |
| citrus-pests-10 | citrus | 210 | قراءة غير مؤكدة (card) |  | صف Fosthiazate EC 50 معدله مقروء 3 لتر/فدان (مرتين) من صورة 110 dpi؛ الصفوف الأخرى بلا شك. |
| grape-pests-07 | grape | 226,227,228,229,230,231 | قراءة غير مؤكدة (card) |  | ترويسة الصفحة 227 (المطبوعة) تحمل اسم اعفان الثمار رغم أن الجدول تكملة لجدول البياض الدقيقى (نفس المبيدات)؛ عُدّ تكملة للبطاقة. عنوان الإرشادات: إرشادات خاصة. |
| grape-pests-08 | grape | 231,232,233,234,235 | قراءة غير مؤكدة (card) |  | صفوف فيها قيم غير معتادة موضحة في ملاحظاتها (Fosetyl بلا نسبة، Metalaxyl 64%، MRL للمانكوزيب 50). 4 صفوف PHI فيها قيمتان متساويتان (14/14، 21/21، 6/6). |
| apple-pests-05 | apple | 248,249 | قراءة غير مؤكدة (card) |  | العنوان الفرعي للإرشادات في الكتاب: إرشادات خاصة |
| peach-pests-04 | peach | 258,259 | قراءة غير مؤكدة (card) |  | المجموعة (الفطريات) مأخوذة من عنوان القسم السابق وليست مطبوعة فوق البطاقة |
| peach-pests-05 | peach | 259 | قراءة غير مؤكدة (card) |  | المجموعة (الفطريات) مأخوذة من عنوان القسم السابق |
| peach-pests-06 | peach | 260 | قراءة غير مؤكدة (card) |  | لا يوجد سطر «الآفة :» فوق العنوان في الصفحة؛ المجموعة غير مطبوعة (null) |
| stored-products-pests-02 | stored-products | 264 | قراءة غير مؤكدة (card) |  | المجموعة (الحشرات) من عنوان القسم السابق |
| rice-pests-05 | rice | 44 | قراءة غير مؤكدة (card) |  | كلمة (تقزم) في سطر المظهر غير واضحة تماما في الصورة |
| tomato-weeds-18 | tomato | 316 | قراءة غير مؤكدة (card) |  | ترويسة الصفحة المطبوعة 316 تذكر الذرة الشامية بدل الطماطم (خطأ ترويسة على الأرجح)؛ وضع البطاقة تحت الطماطم لأنها بين صفحتين للطماطم |
| onion-pests-02 | onion | 11,12 | قراءة غير مؤكدة (row) | Dimethomorph 30% + Fosetyl-aluminium 45% | النسب المكتوبة 30% + 45% لا تطابق التركيز الكلي المطبوع 60% — نُقلت كما طُبعت |
| sugar-beet-pests-05 | sugar-beet | 26,27,28 | قراءة غير مؤكدة (row) | Cyproconazole 8.9% + Pyraclostrobin 28.5% | مجموع النسب المطبوعة 8.9+28.5=37.4 بينما المطبوع للمستحضر EC %37؛ نُقل كما طُبع |
| peanut-pests-03 | peanut | 55,56 | قراءة غير مؤكدة (row) | Difenoconazole ?% + Propiconazole ?% | نسبة كل مادة غير مكتوبة؛ سطر MRL واحد فقط لمادتين فعالتين. |
| tomato-pests-03 | tomato | 66 | قراءة غير مؤكدة (row) | Buprofezin 10% + Imidacloprid 20% | MRL للبيوبروفيزين مطبوعة 0.15/0.3/0.3 وتختلف عن صفوفه الأخرى |
| tomato-pests-07 | tomato | 73 | قراءة غير مؤكدة (row) | Emamectin benzoate 0.5% | WHO مطبوعة U وليست Mod II كبقية صفوف الإيماميكتين |
| potato-pests-05 | potato | 93,94 | قراءة غير مؤكدة (row) | Bacillus thuringiensis 5.5% | صيغة المعدل غير واضحة: مطبوع "150 جم/1.25 لتر ماء" وتحته "طن درنات فى النوالات" |
| potato-pests-13 | potato | 101,102,103,104,105 | قراءة غير مؤكدة (row) | Cymoxanil 30% + Famoxadone 22.5% | خلايا MRL مطبوعة بشكل مشوّه: EPA 0.05/0.02، EU '-' و'0.-2' (مشوّهة، سُجّلت null)، Codex 0.01/0.2 |
| cucumber-pests-01 | cucumber | 124,125 | قراءة غير مؤكدة (row) | Abamectin 2% + Thiamethoxam 12% | الصف مطبوع SC 12% وتركيب Abamectin 2% + Thiamethoxam 12% (14% بالجمع) |
| cucumber-pests-01 | cucumber | 124,125 | قراءة غير مؤكدة (row) | Abamectin 2.2% + Imidacloprid 30% | SC 32.8% مطبوعة؛ مجموع المادتين 32.2 |
| cucumber-pests-01 | cucumber | 124,125 | قراءة غير مؤكدة (row) | Abamectin 2.2% + Imidacloprid 30% | SC 32.8% مطبوعة؛ مجموع المادتين 32.2 |
| cucumber-pests-07 | cucumber | 131,132,133 | قراءة غير مؤكدة (row) | Hymexazol ?% + Metalaxyl-M ?% | نسب المواد الفعالة غير مكتوبة بجوار الأسماء العامة؛ المطبوع فقط تركيز المستحضر SL 30% |
| cucumber-pests-09 | cucumber | 136,137,138,139 | قراءة غير مؤكدة (row) | Azoxystrobin 23% | الاسم التجارى مكتوب SC %23 كما في الصورة |
| cucumber-pests-09 | cucumber | 136,137,138,139 | قراءة غير مؤكدة (row) | Azoxystrobin 50% | الاسم التجارى مكتوب SC %50 كما في الصورة |
| seed-squash-pests-01 | seed-squash | 143 | قراءة غير مؤكدة (row) | Emamectin benzoate 2.3% | فترة الأمان مطبوعة 01 في الصورة وطبقة النص (قد تعني 10) |
| watermelon-pests-01 | watermelon | 144,145 | قراءة غير مؤكدة (row) | Hexythiazox 5% | لا يوجد رمز نوع المستحضر في الاسم التجارى (مطبوع % 5 فقط) |
| seed-watermelon-pests-06 | seed-watermelon | 151,152 | قراءة غير مؤكدة (row) | Azoxystrobin 8% + Chlorothalonil 40% | المعدل 850 سم³ كما طُبع (الصف المجاور 250) |
| snap-bean-pests-06 | snap-bean | 167 | قراءة غير مؤكدة (row) | Trichoderma asperellum 12% | الخانة في عمود الاسم التجاري مطبوعة WP % 12 T34؛ T34 جزء من النص ولم يُنقل وربما سلالة؛ النسبة 12 مأخوذة من form_pct |
| strawberry-pests-02 | strawberry | 190,191 | قراءة غير مؤكدة (row) | Bifenazate 50% | الوحدة المطبوعة سم³ مع مستحضر WG كما في الصورة |
| citrus-pests-01 | citrus | 199,200 | قراءة غير مؤكدة (row) | Buprofezin 25% | الخانة EPA مطبوعة «§-» (رمز غريب مع شرطة)؛ فُسّرت شرطة (null) |
| grape-pests-08 | grape | 231,232,233,234,235 | قراءة غير مؤكدة (row) | Mancozeb 64% + Metalaxyl 8% | قيم MRL كما هي مطبوعة: السطر الأول (-، 50، -) للمانكوزيب والثاني (2، 2، 1) للميتالاكسيل؛ القيمة 50 للمانكوزيب غير معتادة مقارنة بصفوف أخرى (1.5، 5، 5)؛ فترة الأمان مطبوعة: 7 يوم للأوراق و3 يوم للثمار (phi_days=null لأنها قيمتان) |
| grape-pests-08 | grape | 231,232,233,234,235 | قراءة غير مؤكدة (row) | Cymoxanil 4% + Folpet 25% + Fosetyl-aluminium ?% | نسبة Fosetyl غير مطبوعة؛ الاسم مطبوع Fosetyl- Aluminicom في الأصل؛ فترة الأمان مطبوعة: 15 يوم للأوراق و10 يوم للثمار (phi_days=null لأنها قيمتان) |
| grape-pests-08 | grape | 231,232,233,234,235 | قراءة غير مؤكدة (row) | Cymoxanil 8% + Metalaxyl 64% | الاسم الثاني مطبوع Metalaxyl 64% (ومن المرجح أنه Mancozeb لكنه نُقل كما طُبع)؛ فترة الأمان مطبوعة: 15 يوم للأوراق و10 يوم للثمار (phi_days=null لأنها قيمتان) |
| date-palm-pests-01 | date-palm | 237 | قراءة غير مؤكدة (row) | Citronella oil 5% + Jasmine oil 5% + Mineral oil 15% | ثلاثة أسطر MRL: الأول والثاني '-' والثالث EU=0.01 (مطبوع بجوار السطر الأخير) |
| apple-pests-05 | apple | 248,249 | قراءة غير مؤكدة (row) | Bifenazate 24% | قيمة EU مطبوعة "7 .0" ورُجّح أنها 0.7 |
| pear-pests-01 | pear | 253,254 | قراءة غير مؤكدة (row) | Mineral oil 80% | نوع المستحضر غير واضح في عمود الاسم التجاري |
| pear-pests-03 | pear | 255 | قراءة غير مؤكدة (row) | Oxine-copper 33.5% | الاسم العام مطبوع Oxine-coppor |
| peach-pests-01 | peach | 256 | قراءة غير مؤكدة (row) | Spinosad 0.024% | صيغة المعدل مطبوعة "500 سم³/ 4 لتر/ فدان (رش جزئى)"؛ وحدة المقسوم عليه غير محسومة |
| stored-products-pests-01 | stored-products | 263,264 | قراءة غير مؤكدة (row) | Phosphine 2% + CO2 98% | فترة الأمان المطبوعة: التهوية لمدة كافية بعد المعاملة؛ سطر MRL واحد لمخلوط من مادتين |
| stored-products-pests-02 | stored-products | 264 | قراءة غير مؤكدة (row) | Phosphine 2% + CO2 98% | فترة الأمان المطبوعة: التهوية لمدة كافية بعد المعاملة؛ سطر MRL واحد لمخلوط من مادتين |
| wheat-weeds-07 | wheat | 269,270 | قراءة غير مؤكدة (row) | Bromoxynil octanoate 24% | PHI مطبوع 9 (قيمة غير معتادة بين 90 المجاورة؛ نُقلت كما طُبعت) |
| wheat-weeds-09 | wheat | 271,272,273 | قراءة غير مؤكدة (row) | Clodinafop-propargyl 15% | الوحدة مطبوعة سم³/فدان لمستحضر WP (غير معتاد)؛ نُقلت كما طُبعت |
| wheat-weeds-09 | wheat | 271,272,273 | قراءة غير مؤكدة (row) | Pyroxasulfone 85% | الوحدة مطبوعة سم³/فدان لمستحضر WG (غير معتاد)؛ نُقلت كما طُبعت |
| sugar-beet-weeds-07 | sugar-beet | 283,284 | قراءة غير مؤكدة (row) | Foramsulfuron 5% + Thiencarbazone-methyl 3% | صيغة المعدل مطبوعة: 400 سم³/فدان أو 200 سم³/فدان + 200 سم³/فدان؛ تقسيم الأجزاء حسب القراءة |
| maize-pests-03 | maize | 46,47 | قراءة غير مؤكدة (row) | Lambda-cyhalothrin 5% | وحدة المعدل مطبوعة جم/فدان مع مستحضر EC |
| citrus-weeds-12 | citrus | 335,336,337,338 | قراءة غير مؤكدة (row) | Glyphosate isopropylammonium 48% | رمز المستحضر مطبوع WSC |

### 9. هجاء/صياغة الأسماء (مواد فعالة وبطاقات) — 170 صفاً

**المصدر الداعم:** حزمة التدقيق (ورقة spelling) · **الإجراء المطلوب من المالك:** تأكيد الاقتراح أو رفضه — الاسم الأصلي محفوظ ولا يُستبدل تلقائياً

| معرف البطاقة | المحصول | صفحات المصدر | الحقل | القيمة الأصلية | وصف المشكلة |
|---|---|---|---|---|---|
| — | — |  | هجاء/صياغة (active name) | 1,3 Dichloropropene | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «1,3-Dichloropropene» |
| — | — |  | هجاء/صياغة (active name) | 8-Hydroxyquinoline Sulfate | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «8-Hydroxyquinoline sulfate» |
| — | — |  | هجاء/صياغة (active name) | Acetamiprd | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Acetamiprid» |
| — | — |  | هجاء/صياغة (active name) | Bacillus amyloliquefaciens Strain F Z B 24 | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Bacillus amyloliquefaciens FZB24» |
| — | — |  | هجاء/صياغة (active name) | Bacillus amyloliquefaciens Strain FZB24 | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Bacillus amyloliquefaciens FZB24» |
| — | — |  | هجاء/صياغة (active name) | Bacillus amyloliquefaciens Strain MBI 600 | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Bacillus amyloliquefaciens MBI 600» |
| — | — |  | هجاء/صياغة (active name) | Bacillus megaterum | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Bacillus megaterium» |
| — | — |  | هجاء/صياغة (active name) | Bacillus Thuringiensis | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Bacillus thuringiensis» |
| — | — |  | هجاء/صياغة (active name) | Beta-Cyfluthrin | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Beta-cyfluthrin» |
| — | — |  | هجاء/صياغة (active name) | Bispyribac sodium | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Bispyribac-sodium» |
| — | — |  | هجاء/صياغة (active name) | Bispyribac-soduim | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Bispyribac-sodium» |
| — | — |  | هجاء/صياغة (active name) | Bromoxynil-octanoate | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Bromoxynil octanoate» |
| — | — |  | هجاء/صياغة (active name) | Copper Complex | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Copper complex» |
| — | — |  | هجاء/صياغة (active name) | Cooper oxychloride | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Copper oxychloride» |
| — | — |  | هجاء/صياغة (active name) | Copper Sulfate | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Copper sulfate» |
| — | — |  | هجاء/صياغة (active name) | Copper sulfate anhydrous | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Copper sulfate» |
| — | — |  | هجاء/صياغة (active name) | Copper sulfate (Tribasic) | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Copper sulfate (tribasic)» |
| — | — |  | هجاء/صياغة (active name) | Copper sulfate Pentahydrate | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Copper sulfate pentahydrate» |
| — | — |  | هجاء/صياغة (active name) | Cayazofamid | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Cyazofamid» |
| — | — |  | هجاء/صياغة (active name) | Cymaxanil | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Cymoxanil» |
| — | — |  | هجاء/صياغة (active name) | Zeta - cypermethrin | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Cypermethrin» |
| — | — |  | هجاء/صياغة (active name) | Zeta-cypermethrin | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Cypermethrin» |
| — | — |  | هجاء/صياغة (active name) | Cyproconazde | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Cyproconazole» |
| — | — |  | هجاء/صياغة (active name) | Cyprosulfamide (safener) | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Cyprosulfamide» |
| — | — |  | هجاء/صياغة (active name) | Difenocoazole | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Difenoconazole» |
| — | — |  | هجاء/صياغة (active name) | Diflufenicon | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Diflufenican» |
| — | — |  | هجاء/صياغة (active name) | Etofrnprox | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Etofenprox» |
| — | — |  | هجاء/صياغة (active name) | Fonpyroximate | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Fenpyroximate» |
| — | — |  | هجاء/صياغة (active name) | Fluazifop-p-butyl | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Fluazifop-P-butyl» |
| — | — |  | هجاء/صياغة (active name) | Fludioxanil | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Fludioxonil» |
| — | — |  | هجاء/صياغة (active name) | Flufenoxurom | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Flufenoxuron» |
| — | — |  | هجاء/صياغة (active name) | Flumetsulom | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Flumetsulam» |
| — | — |  | هجاء/صياغة (active name) | Fosetyl - Aluminium | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Fosetyl-aluminium» |
| — | — |  | هجاء/صياغة (active name) | Fosetyl Aluminium | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Fosetyl-aluminium» |
| — | — |  | هجاء/صياغة (active name) | Fosetyl- Aluminium | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Fosetyl-aluminium» |
| — | — |  | هجاء/صياغة (active name) | Fosetyl-Aluminam | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Fosetyl-aluminium» |
| — | — |  | هجاء/صياغة (active name) | Fosetyl-Aluminicom | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Fosetyl-aluminium» |
| — | — |  | هجاء/صياغة (active name) | Fosetyl-Aluminium | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Fosetyl-aluminium» |
| — | — |  | هجاء/صياغة (active name) | Glyphosate isopropyammionium | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Glyphosate isopropylammonium» |
| — | — |  | هجاء/صياغة (active name) | Glyphosate isopropylammmonium | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Glyphosate isopropylammonium» |
| — | — |  | هجاء/صياغة (active name) | Glyphosate monopotassium | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Glyphosate potassium» |
| — | — |  | هجاء/صياغة (active name) | Glyphosate monopotassium salt | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Glyphosate potassium» |
| — | — |  | هجاء/صياغة (active name) | Glyphosate potassium salt | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Glyphosate potassium» |
| — | — |  | هجاء/صياغة (active name) | Iminoctadine tris (albesilate) | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Iminoctadine tris(albesilate)» |
| — | — |  | هجاء/صياغة (active name) | kresoxitn-methyl | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Kresoxim-methyl» |
| — | — |  | هجاء/صياغة (active name) | Lambd-cyhalothrin | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Lambda-cyhalothrin» |
| — | — |  | هجاء/صياغة (active name) | Lambda - Cyhalothyin | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Lambda-cyhalothrin» |
| — | — |  | هجاء/صياغة (active name) | Lambda-Cyhalothrin | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Lambda-cyhalothrin» |
| — | — |  | هجاء/صياغة (active name) | MCPA-Isooctyl | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «MCPA-isooctyl» |
| — | — |  | هجاء/صياغة (active name) | MCPA sodium | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «MCPA-sodium» |
| — | — |  | هجاء/صياغة (active name) | Mefenpyr-diethyl (safener) | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Mefenpyr-diethyl» |
| — | — |  | هجاء/صياغة (active name) | Menfentrifluconazole | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Mefentrifluconazole» |
| — | — |  | هجاء/صياغة (active name) | Mesosulfuron methyl | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Mesosulfuron-methyl» |
| — | — |  | هجاء/صياغة (active name) | Mesosulfuron-methyl sodium | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Mesosulfuron-methyl» |
| — | — |  | هجاء/صياغة (active name) | Mesotrine | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Mesotrione» |
| — | — |  | هجاء/صياغة (active name) | Matalaxyl-M | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Metalaxyl-M» |
| — | — |  | هجاء/صياغة (active name) | Metam Sodium | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Metam sodium» |
| — | — |  | هجاء/صياغة (active name) | myclobutanil | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Myclobutanil» |
| — | — |  | هجاء/صياغة (active name) | Orange oil (d-limonene) | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Orange oil» |
| — | — |  | هجاء/صياغة (active name) | Oxamul | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Oxamyl» |
| — | — |  | هجاء/صياغة (active name) | Oxine-coppor | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Oxine-copper» |
| — | — |  | هجاء/صياغة (active name) | Penoxulam | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Penoxsulam» |
| — | — |  | هجاء/صياغة (active name) | Phoshorous acid salts | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Phosphorous acid salts» |
| — | — |  | هجاء/صياغة (active name) | Propamocorb hydrochloride | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Propamocarb hydrochloride» |
| — | — |  | هجاء/صياغة (active name) | Pyroxsulfone | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Pyroxasulfone» |
| — | — |  | هجاء/صياغة (active name) | Sprodiclofen | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Spirodiclofen» |
| — | — |  | هجاء/صياغة (active name) | Febuconazole | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Tebuconazole» |
| — | — |  | هجاء/صياغة (active name) | Thiocyclam hydrogen oxabte | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Thiocyclam hydrogen oxalate» |
| — | — |  | هجاء/صياغة (active name) | Thiophanate methyl | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Thiophanate-methyl» |
| — | — |  | هجاء/صياغة (active name) | Trichoderma virde | اختلاف هجاء/صياغة عن الاسم الشائع؛ وُحّد عبر CAS وبقي الأصل محفوظًا — الاقتراح: «Trichoderma viride» |
| — | — |  | هجاء/صياغة (wheat-pests-03:appearance_ar) | بعدها | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (5 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «بعضها» |
| — | — |  | هجاء/صياغة (faba-bean-pests-03:pest_name_ar) | التبقع | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (40 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «البقع» |
| — | — |  | هجاء/صياغة (onion-pests-03:control_timing_ar) | الخاصة | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (8 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «الماصة» |
| — | — |  | هجاء/صياغة (onion-pests-05:appearance_ar) | بالون | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (10 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «باللون» |
| — | — |  | هجاء/صياغة (garlic-pests-01:appearance_ar) | والحد | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (4 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «واحد» |
| — | — |  | هجاء/صياغة (sugar-beet-pests-05:guidance_ar) | الحصول | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (7 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «الحقول» |
| — | — |  | هجاء/صياغة (sugar-beet-pests-05:guidance_ar) | الحصول | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (18 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «المحصول» |
| — | — |  | هجاء/صياغة (cotton-pests-01:appearance_ar) | القرى | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (11 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «الرى» |
| — | — |  | هجاء/صياغة (sugarcane-pests-04:control_timing_ar) | العقل | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (17 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «الحقل» |
| — | — |  | هجاء/صياغة (peanut-pests-04:onset_ar) | النقل | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (17 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «الحقل» |
| — | — |  | هجاء/صياغة (peanut-pests-05:onset_ar) | سواء | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (11 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «سوداء» |
| — | — |  | هجاء/صياغة (sesame-pests-01:appearance_ar) | المظاهر | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (5 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «المظهر» |
| — | — |  | هجاء/صياغة (sesame-pests-01:onset_ar) | والاثمار | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (16 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «والثمار» |
| — | — |  | هجاء/صياغة (tomato-pests-02:appearance_ar) | للأرض | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (8 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «للمرض» |
| — | — |  | هجاء/صياغة (tomato-pests-12:appearance_ar) | الأسطح | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (127 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «السطح» |
| — | — |  | هجاء/صياغة (tomato-pests-14:appearance_ar) | الطقس | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (18 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «الفقس» |
| — | — |  | هجاء/صياغة (potato-pests-10:appearance_ar) | الفرع | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (16 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «الأفرع» |
| — | — |  | هجاء/صياغة (potato-pests-10:appearance_ar) | وتتقزم | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (8 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «وتقزم» |
| — | — |  | هجاء/صياغة (potato-pests-12:appearance_ar) | التعفن | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (27 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «العفن» |
| — | — |  | هجاء/صياغة (carrot-pests-03:appearance_ar) | الاتربة | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (66 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «التربة» |
| — | — |  | هجاء/صياغة (carrot-pests-03:appearance_ar) | التفرع | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (16 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «الأفرع» |
| — | — |  | هجاء/صياغة (pepper-pests-02:appearance_ar) | وتجعد | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (8 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «وتتجعد» |
| — | — |  | هجاء/صياغة (cucumber-pests-01:onset_ar) | والنيلية | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (26 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «والنجيلية» |
| — | — |  | هجاء/صياغة (seed-squash-pests-01:appearance_ar) | الاعمار | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (4 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «الأعمار» |
| — | — |  | هجاء/صياغة (shammam-pests-02:guidance_ar) | والحارة | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (4 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «والحرارة» |
| — | — |  | هجاء/صياغة (cantaloupe-pests-03:appearance_ar) | اللب | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (5 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «القلب» |
| — | — |  | هجاء/صياغة (cantaloupe-pests-08:appearance_ar) | المناطقة | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (7 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «المنطقة» |
| — | — |  | هجاء/صياغة (honeydew-pests-02:appearance_ar) | اللبنى | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (26 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «البنى» |
| — | — |  | هجاء/صياغة (snap-bean-pests-04:appearance_ar) | المحمر | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (5 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «الاحمر» |
| — | — |  | هجاء/صياغة (snap-bean-pests-04:appearance_ar) | المحمر | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (27 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «الأحمر» |
| — | — |  | هجاء/صياغة (strawberry-pests-02:onset_ar) | الثانية | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (5 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «الثانوية» |
| — | — |  | هجاء/صياغة (strawberry-pests-03:appearance_ar) | الطرى | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (11 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «الرى» |
| — | — |  | هجاء/صياغة (turf-pests-01:appearance_ar) | النجيل | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (5 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «النخيل» |
| — | — |  | هجاء/صياغة (turf-pests-01:control_timing_ar) | المسطح | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (127 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «السطح» |
| — | — |  | هجاء/صياغة (citrus-pests-05:appearance_ar) | للاوراق | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (92 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «للأوراق» |
| — | — |  | هجاء/صياغة (citrus-pests-10:pest_name_ar) | المثمرة | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (18 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «الثمرة» |
| — | — |  | هجاء/صياغة (mango-pests-06:appearance_ar) | الحشرية | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (10 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «القشرية» |
| — | — |  | هجاء/صياغة (mango-pests-06:appearance_ar) | الحشرية | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (5 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «الحجرية» |
| — | — |  | هجاء/صياغة (mango-pests-06:onset_ar) | عرضة | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (44 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «عريضة» |
| — | — |  | هجاء/صياغة (grape-pests-02:appearance_ar) | وتحول | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (8 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «وتتحول» |
| — | — |  | هجاء/صياغة (grape-pests-06:appearance_ar) | الحبات | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (94 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «النبات» |
| — | — |  | هجاء/صياغة (pomegranate-pests-03:onset_ar) | وببداية | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (5 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «وبداية» |
| — | — |  | هجاء/صياغة (apple-pests-01:appearance_ar) | وتساقط | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (5 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «وتسقط» |
| — | — |  | هجاء/صياغة (apple-pests-02:pest_name_ar) | الصوفى | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (7 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «الصيفى» |
| — | — |  | هجاء/صياغة (pear-pests-03:pest_name_ar) | النارية | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (12 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «النامية» |
| — | — |  | هجاء/صياغة (pear-pests-03:appearance_ar) | الحاملة | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (28 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «الكاملة» |
| — | — |  | هجاء/صياغة (apricot-pests-01:appearance_ar) | وتلون | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (12 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «وتكون» |
| — | — |  | هجاء/صياغة (banana-pests-01:guidance_ar) | الموز | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (13 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «اللوز» |
| — | — |  | هجاء/صياغة (stored-products-pests-02:appearance_ar) | التمر | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (19 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «العمر» |
| — | — |  | هجاء/صياغة (snails-pests-01:onset_ar) | راحة | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (4 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «رائحة» |
| — | — |  | هجاء/صياغة (snails-pests-01:onset_ar) | القوقع | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (6 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «القواقع» |
| — | — |  | هجاء/صياغة (snails-pests-01:guidance_ar) | رطبة | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (7 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «رطوبة» |
| — | — |  | هجاء/صياغة (roselle-pests-01:appearance_ar) | البتلات | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (18 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «الشتلات» |
| — | — |  | هجاء/صياغة (roselle-pests-01:appearance_ar) | المتجاورة | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (6 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «المجاورة» |
| — | — |  | هجاء/صياغة (rice-pests-02:appearance_ar) | للزرقة | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (25 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «للورقة» |
| — | — |  | هجاء/صياغة (maize-pests-01:onset_ar) | الاولى | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (12 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «الأولى» |
| — | — |  | هجاء/صياغة (maize-pests-01:guidance_ar) | العضوى | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (45 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «العلوى» |
| — | — |  | هجاء/صياغة (maize-pests-02:guidance_ar) | الشامية | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (12 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «النامية» |
| — | — |  | هجاء/صياغة (maize-pests-02:guidance_ar) | الشامية | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (7 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «البامية» |
| — | — |  | هجاء/صياغة (maize-pests-04:appearance_ar) | المذكرة | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (5 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «المبكرة» |
| — | — |  | هجاء/صياغة (maize-pests-04:guidance_ar) | التغطية | مرشّح منخفض الثقة: كلمة وحيدة تبعد حرفًا واحدًا عن كلمة شائعة (20 مرة)؛ قد تكون خطأ طباعيًا في الكتاب أو في القراءة — الاقتراح: «التغذية» |
| — | — |  | هجاء/صياغة (wheat-pests-01) | (انظر النص) | النص منقول كما طُبع (الت = التى) — الاقتراح: «» |
| — | — |  | هجاء/صياغة (wheat-pests-02) | (انظر النص) | اسم المادة الفعالة في الصف الأخير منقول كما طُبع Fludioxanil — الاقتراح: «» |
| — | — |  | هجاء/صياغة (wheat-pests-05) | (انظر النص) | معدل الصف الثاني: 120 سم³ / 100 كجم تقاوى كما طُبع — الاقتراح: «» |
| — | — |  | هجاء/صياغة (wheat-pests-06) | (انظر النص) | نص المظهر منقول كما طُبع (قد يحوي أخطاء طباعة أصلية مثل جذيره البذيره) — الاقتراح: «» |
| — | — |  | هجاء/صياغة (onion-pests-02) | (انظر النص) | صف WP 60: النسب 30+45 لا تطابق 60 كما طُبع — الاقتراح: «» |
| — | — |  | هجاء/صياغة (onion-pests-02) | (انظر النص) | نص المظهر: ويحتمل أن تكون كلمة (الروس) بمعنى (الروسى) كما طُبعت — الاقتراح: «» |
| — | — |  | هجاء/صياغة (onion-pests-02) | (انظر النص) | اسم المادة الثانية منقول كما طُبع Matalaxyl-M — الاقتراح: «» |
| — | — |  | هجاء/صياغة (onion-pests-02) | (انظر النص) | النسب المكتوبة 30% + 45% لا تطابق التركيز الكلي المطبوع 60% — نُقلت كما طُبعت — الاقتراح: «» |
| — | — |  | هجاء/صياغة (garlic-pests-02) | (انظر النص) | عنوان الآفة منقول كما طُبع (اكاروس جفاف رؤوس الثوم) — الاقتراح: «» |
| — | — |  | هجاء/صياغة (sugar-beet-pests-01) | (انظر النص) | الاسم منقول كما طُبع Lambda- cyhalothrin — الاقتراح: «» |
| — | — |  | هجاء/صياغة (sugar-beet-pests-02) | (انظر النص) | المعدلات المكتوبة بالسم³ أو الجم مع/فدان أو/100 لتر ماء منقولة كما طُبعت — الاقتراح: «» |
| — | — |  | هجاء/صياغة (sugar-beet-pests-05) | (انظر النص) | 'الأرتباط' كما طُبعت — الاقتراح: «» |
| — | — |  | هجاء/صياغة (sugar-beet-pests-05) | (انظر النص) | نُقل كما طُبع — الاقتراح: «» |
| — | — |  | هجاء/صياغة (cotton-pests-01) | (انظر النص) | 'سرسبه' كما طُبعت — الاقتراح: «» |
| — | — |  | هجاء/صياغة (sugarcane-pests-01) | (انظر النص) | ترتيب الصفوف كما طُبع: Pyriproxyfen(10) Acetamiprid(10) Pyriproxyfen(7) Pyriproxyfen(7) Acetamiprid(10) Pyriproxyfen(7) Pyriproxyfen(10) — الاقتراح: «» |
| — | — |  | هجاء/صياغة (peanut-pests-01) | (انظر النص) | الاسم العام المطبوع Hexythiazox (كما طُبع) — الاقتراح: «» |
| — | — |  | هجاء/صياغة (peanut-pests-02) | (انظر النص) | في صفوف الثلاثي التركيب 3164/3345 الترتيب Azoxystrobin, Metalaxyl-M, Fludioxonil وفي 3798 Azoxystrobin, Fludioxonil, Metalaxyl-M كما طُبع — الاقتراح: «» |
| — | — |  | هجاء/صياغة (peanut-pests-03) | (انظر النص) | الاسم المطبوع Cyproconazde (خطأ إملائي في الكتاب) — الاقتراح: «» |
| — | — |  | هجاء/صياغة (sunflower-pests-02) | (انظر النص) | WHO مطبوعة Lwo III (خطأ طباعي) وصُحّحت إلى Low III — الاقتراح: «» |
| — | — |  | هجاء/صياغة (tomato-pests-01) | (انظر النص) | الاسم العام مطبوع Lambd- cyhalothrin (ناقص a) وأُبقي كما طُبع — الاقتراح: «» |
| — | — |  | هجاء/صياغة (tomato-pests-13) | (انظر النص) | قيم MRL للميتالاكسيل كما طُبعت (1 / 3 / 0 — الاقتراح: «» |
| — | — |  | هجاء/صياغة (tomato-pests-14) | (انظر النص) | قيم MRL كما طُبعت في الصورة (0 — الاقتراح: «» |
| — | — |  | هجاء/صياغة (potato-pests-11) | (انظر النص) | نص مظهر الإصابة نُقل كما طُبع (بما فيه 'طرية وردية ردية أو — الاقتراح: «» |
| — | — |  | هجاء/صياغة (cucumber-pests-09) | (انظر النص) | Cooper/kresoxitn/Cymaxanil كما طُبعت — الاقتراح: «» |
| — | — |  | هجاء/صياغة (watermelon-pests-01) | (انظر النص) | Sprodiclofen كما طُبعت — الاقتراح: «» |
| — | — |  | هجاء/صياغة (seed-watermelon-pests-06) | (انظر النص) | المعدل 850 في الصف الثاني كما طُبع (قد يكون خطأ مطبعي) — الاقتراح: «» |
| — | — |  | هجاء/صياغة (seed-watermelon-pests-06) | (انظر النص) | المعدل 850 سم³ كما طُبع (الصف المجاور 250) — الاقتراح: «» |
| — | — |  | هجاء/صياغة (grape-pests-08) | (انظر النص) | الاسم الثاني مطبوع Metalaxyl 64% (ومن المرجح أنه Mancozeb لكنه نُقل كما طُبع) — الاقتراح: «» |
| — | — |  | هجاء/صياغة (guava-pests-03) | (انظر النص) | الجملة 'بمجرد ظهور من 3-4 أفراد على للورقة' كما في الصورة (قراءة 'على للورقة' كما طُبعت تقريبا) — الاقتراح: «» |
| — | — |  | هجاء/صياغة (pomegranate-pests-02) | (انظر النص) | نص المظهر يذكر 'عناقيد العنب' كما طُبع — الاقتراح: «» |
| — | — |  | هجاء/صياغة (wheat-weeds-07) | (انظر النص) | نُقلت كما طُبعت) — الاقتراح: «» |
| — | — |  | هجاء/صياغة (wheat-weeds-09) | (انظر النص) | نُقلت كما طُبعت — الاقتراح: «» |
| — | — |  | هجاء/صياغة (wheat-weeds-09) | (انظر النص) | نُقلت كما طُبعت — الاقتراح: «» |
| — | — |  | هجاء/صياغة (flax-weeds-01) | (انظر النص) | الأسماء تحت الصور كما طُبعت — الاقتراح: «» |
| — | — |  | هجاء/صياغة (rice-weeds-08) | (انظر النص) | Penoxulam مطبوع بهذا الهجاء — الاقتراح: «» |
| — | — |  | هجاء/صياغة (rice-weeds-12) | (انظر النص) | هجاء كما طُبع: Bispyribac-soduim في الصف 4 وCyhalofop-butyl — الاقتراح: «» |
| — | — |  | هجاء/صياغة (tomato-weeds-18) | (انظر النص) | ترويسة الصفحة المطبوعة 316 تذكر الذرة الشامية بدل الطماطم (خطأ ترويسة على الأرجح) — الاقتراح: «» |
| — | — |  | هجاء/صياغة (potato-weeds-18) | (انظر النص) | سطور MRL الثلاثة مرتبة كما طُبعت (Clomazone ثم Fomesafen ثم Quizalofop) — الاقتراح: «» |
| — | — |  | هجاء/صياغة (grape-weeds-12) | (انظر النص) | نص الإرشادات منقول كما طُبع (بلا حرف عطف قبل: الحشائش المعمرة) — الاقتراح: «» |

### 10. بطاقات مكررة مقترحة — 2 صفاً

**المصدر الداعم:** حزمة التدقيق (ورقة dup_cards) · **الإجراء المطلوب من المالك:** قرار: تكرار فعلي (يدمج لاحقاً) أم بطاقتان مختلفتان — لا حذف

| معرف البطاقة | المحصول | صفحات المصدر | الحقل | القيمة الأصلية | وصف المشكلة |
|---|---|---|---|---|---|
| potato-weeds-18,potato-weeds-24 | potato | 319,323,324 | بطاقة مكررة مقترحة | 2 بطاقات | الحشائش الحولية عريضة الأوراق والنجيلية |
| potato-weeds-21,potato-weeds-25 | potato | 321,324 | بطاقة مكررة مقترحة | 2 بطاقات | الحشائش الحولية النجيلية |

### 11. صفوف مكررة داخل البطاقة — مجمَّعة بمفتاحها (1137 صفاً في CSV)

**المصدر الداعم:** حزمة التدقيق (ورقة dups_same_card) · **الإجراء المطلوب من المالك:** قرار لكل مجموعة: تكرار تام (يدمج) أم خياران مختلفان (يبقون) — لا يُحذف تلقائياً

| معرف البطاقة | المحصول | صفحات المصدر | القيمة الأصلية | وصف المشكلة | حجم المجموعة |
|---|---|---|---|---|---:|
| wheat-pests-02 | wheat | 4 | Tebuconazole 6% · FS 6 · 0.6 سم³ / كجم تقاوي · PHI=120 | التفحم السائب فى القمح — مجموعة التكرار بحجم 3 | ×3 |
| wheat-pests-02 | wheat | 4 | Tebuconazole 6% · FS 6 · 0.7 سم³ / كجم تقاوي · PHI=130 | التفحم السائب فى القمح — مجموعة التكرار بحجم 2 | ×2 |
| wheat-pests-04 | wheat | 5,6 | Propiconazole 25% · EC 25 · 25 سم³ / 100 لتر ماء · PHI=30 | الصدأ الأصفر المخطط — مجموعة التكرار بحجم 3 | ×3 |
| wheat-pests-04 | wheat | 5,6 | Propiconazole 25% · EC 25 · 30 سم³ / 100 لتر ماء · PHI=35 | الصدأ الأصفر المخطط — مجموعة التكرار بحجم 3 | ×3 |
| wheat-pests-04 | wheat | 5,6 | Propiconazole 25% · EC 25 · 25 سم³ / 100 لتر ماء · PHI=35 | الصدأ الأصفر المخطط — مجموعة التكرار بحجم 4 | ×4 |
| onion-pests-02 | onion | 11,12 | Azoxystrobin 20% + Difenoconazole 12.5% · SC 32.5 · 300 سم³ / فدان · PHI=7 | البياض الزغبى — مجموعة التكرار بحجم 2 | ×2 |
| garlic-pests-02 | garlic | 17 | Chlorfenapyr 36% · SC 36 · 55 سم³ / 100 لتر ماء · PHI=30 | اكاروس جفاف رؤوس الثوم — مجموعة التكرار بحجم 2 | ×2 |
| sugar-beet-pests-01 | sugar-beet | 20 | Acetamiprid 22.7% + Bifenthrin 27.3% · WP 50 · 25 جم / 100 لتر ماء · PHI=12 | خنفساء البنجر السلحفائية — مجموعة التكرار بحجم 2 | ×2 |
| sugar-beet-pests-02 | sugar-beet | 21,22,23,24 | Emamectin benzoate 5.7% · WG 5.7 · 80 جم / فدان · PHI=60 | دودة ورق القطن — مجموعة التكرار بحجم 5 | ×5 |
| sugar-beet-pests-02 | sugar-beet | 21,22,23,24 | Acetamiprid 22.7% + Bifenthrin 27.3% · WP 50 · 25 جم / 100 لتر ماء · PHI=12 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| sugar-beet-pests-02 | sugar-beet | 21,22,23,24 | Lufenuron 5% · EC 5 · 160 سم³ / فدان · PHI=7 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| sugar-beet-pests-02 | sugar-beet | 21,22,23,24 | Indoxacarb 15% · SC 15 · 25 سم³ / 100 لتر ماء · PHI=60 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| sugar-beet-pests-02 | sugar-beet | 21,22,23,24 | Indoxacarb 30% · WG 30 · 60 جم / فدان · PHI=60 | دودة ورق القطن — مجموعة التكرار بحجم 3 | ×3 |
| sugar-beet-pests-02 | sugar-beet | 21,22,23,24 | Methoxyfenozide 24% · SC 24 · 37.5 سم³ / 100 لتر ماء · PHI=3 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| sugar-beet-pests-02 | sugar-beet | 21,22,23,24 | Lufenuron 5% · EC 5 · 160 سم³ / فدان · PHI=3 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| sugar-beet-pests-02 | sugar-beet | 21,22,23,24 | Lufenuron 5% · EC 5 · 160 سم³ / فدان · PHI=14 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| sugar-beet-pests-02 | sugar-beet | 21,22,23,24 | Lufenuron 20% · EC 20 · 40 سم³ / فدان · PHI=60 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| sugar-beet-pests-04 | sugar-beet | 25 | Abamectin 1.8% · EC 1.8 · 40 سم³ / 100 لتر ماء · PHI=7 | ذبابة أوراق البنجر — مجموعة التكرار بحجم 2 | ×2 |
| sugar-beet-pests-05 | sugar-beet | 26,27,28 | Thiophanate-methyl 70% · WP 70 · 200 جم / فدان · PHI=7 | تبقع الأوراق — مجموعة التكرار بحجم 3 | ×3 |
| sugar-beet-pests-05 | sugar-beet | 26,27,28 | Difenoconazole 25% · EC 25 · 50 سم³ / 100 لتر ماء · PHI=14 | تبقع الأوراق — مجموعة التكرار بحجم 2 | ×2 |
| sugar-beet-pests-05 | sugar-beet | 26,27,28 | Difenoconazole 15% + Propiconazole 15% · EC 30 · 50 سم³ / 100 لتر ماء · PHI=3 | تبقع الأوراق — مجموعة التكرار بحجم 2 | ×2 |
| sugar-beet-pests-05 | sugar-beet | 26,27,28 | Difenoconazole 15% + Propiconazole 15% · EC 30 · 50 سم³ / 100 لتر ماء · PHI=45 | تبقع الأوراق — مجموعة التكرار بحجم 2 | ×2 |
| sugar-beet-pests-05 | sugar-beet | 26,27,28 | Difenoconazole 25% + Propiconazole 25% · EW 50 · 30 سم³ / 100 لتر ماء · PHI=7 | تبقع الأوراق — مجموعة التكرار بحجم 3 | ×3 |
| sugar-beet-pests-05 | sugar-beet | 26,27,28 | Difenoconazole 25% + Propiconazole 25% · ME 50 · 30 سم³ / 100 لتر ماء · PHI=10 | تبقع الأوراق — مجموعة التكرار بحجم 2 | ×2 |
| sugar-beet-pests-06 | sugar-beet | 29 | Fosthiazate 30% · CS 30 · 2 لتر / فدان · PHI=120 | نيماتودا تعقد الجذور — مجموعة التكرار بحجم 2 | ×2 |
| sugarcane-pests-01 | sugarcane | 50 | Pyriproxyfen 10% · EC 10 · 50 سم³/100 لتر ماء · PHI=10 | الحشرة القشرية الرخوة — مجموعة التكرار بحجم 2 | ×2 |
| sugarcane-pests-01 | sugarcane | 50 | Pyriproxyfen 10% · EC 10 · 50 سم³/100 لتر ماء · PHI=7 | الحشرة القشرية الرخوة — مجموعة التكرار بحجم 3 | ×3 |
| peanut-pests-02 | peanut | 54,55 | Tolclofos-methyl 50% · WP 50 · 3 جم/كجم تقاوى · PHI=100 | اعفان الجذور وموت البادرات — مجموعة التكرار بحجم 2 | ×2 |
| peanut-pests-02 | peanut | 54,55 | Fludioxonil 2.5% + Metalaxyl-M 1% · FS 3.5 · 1 سم³/ كجم تقاوى · PHI=88 | اعفان الجذور وموت البادرات — مجموعة التكرار بحجم 2 | ×2 |
| peanut-pests-02 | peanut | 54,55 | Hymexazol 25% + Metalaxyl-M 5% · SL 30 · 1 سم³/ كجم تقاوى · PHI=120 | اعفان الجذور وموت البادرات — مجموعة التكرار بحجم 2 | ×2 |
| peanut-pests-03 | peanut | 55,56 | Difenoconazole 25% · EC 25 · 50 سم³/100 لتر ماء · PHI=7 | تبقع الأوراق — مجموعة التكرار بحجم 2 | ×2 |
| peanut-pests-05 | peanut | 56,57 | Fosthiazate 10% · GR 10 · 12.5 كجم/فدان · PHI=90 | نيماتودا تعقد الجذور — مجموعة التكرار بحجم 2 | ×2 |
| peanut-pests-05 | peanut | 56,57 | Fosthiazate 10% · GR 10 · 12.5 كجم/فدان · PHI=120 | نيماتودا تعقد الجذور — مجموعة التكرار بحجم 2 | ×2 |
| soybean-pests-01 | soybean | 60 | Abamectin 1.8% · EC 1.8 · 40 سم³/100 لتر ماء · PHI=10 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| soybean-pests-01 | soybean | 60 | Mineral oil 97% · EC 97 · 4 لتر/فدان · PHI=10 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| soybean-pests-01 | soybean | 60 | Pyridaben 20% · WP 20 · 100 جم/100 لتر ماء · PHI=15 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-02 | tomato | 62,63,64,65 | Acetamiprid 20% · SP 20 · 25 جم / 100 لتر ماء · PHI=7 | الذبابة البيضاء — مجموعة التكرار بحجم 18 | ×18 |
| tomato-pests-02 | tomato | 62,63,64,65 | Acetamiprid 20% · SP 20 · 25 جم / 100 لتر ماء · PHI=10 | الذبابة البيضاء — مجموعة التكرار بحجم 5 | ×5 |
| tomato-pests-02 | tomato | 62,63,64,65 | Acetamiprid 20% · SP 20 · 30 جم / 100 لتر ماء · PHI=7 | الذبابة البيضاء — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-02 | tomato | 62,63,64,65 | Thiocyclam hydrogen oxalate 50% · SP 50 · 500 جم / فدان · PHI=7 | الذبابة البيضاء — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-02 | tomato | 62,63,64,65 | Imidacloprid 35% · SC 35 · 75 سم³ / 100 لتر ماء (صوب) · PHI=5 | الذبابة البيضاء — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-02 | tomato | 62,63,64,65 | Imidacloprid 70% · WG 70 · 30 جم / 100 لتر ماء (صوب) · PHI=7 | الذبابة البيضاء — مجموعة التكرار بحجم 5 | ×5 |
| tomato-pests-02 | tomato | 62,63,64,65 | Imidacloprid 70% · WG 70 · 120 جم / فدان (صوب) · PHI=7 | الذبابة البيضاء — مجموعة التكرار بحجم 3 | ×3 |
| tomato-pests-02 | tomato | 62,63,64,65 | Thiamethoxam 25% · WG 25 · 20 جم / 100 لتر ماء · PHI=7 | الذبابة البيضاء — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-02 | tomato | 62,63,64,65 | Imidacloprid 35% · SC 35 · 75 سم³ / 100 لتر ماء (صوب) · PHI=8 | الذبابة البيضاء — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-02 | tomato | 62,63,64,65 | Imidacloprid 35% · SC 35 · 50 سم³ / 100 لتر ماء (صوب) · PHI=7 | الذبابة البيضاء — مجموعة التكرار بحجم 3 | ×3 |
| tomato-pests-02 | tomato | 62,63,64,65 | Acetamiprid 70% · WG 70 · 50 جم / فدان · PHI=3 | الذبابة البيضاء — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-02 | tomato | 62,63,64,65 | Abamectin 2% + Thiamethoxam 10% · SC 12 · 200 سم³ / فدان (صوب) · PHI=8 | الذبابة البيضاء — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-02 | tomato | 62,63,64,65 | Thiamethoxam 25% · WG 25 · 20 جم / 100 لتر ماء (صوب) · PHI=7 | الذبابة البيضاء — مجموعة التكرار بحجم 4 | ×4 |
| tomato-pests-03 | tomato | 66 | Acetamiprid 20% · SP 20 · 25 جم / 100 لتر ماء · PHI=10 | المنّ — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-03 | tomato | 66 | Acetamiprid 20% · SP 20 · 25 جم / 100 لتر ماء · PHI=7 | المنّ — مجموعة التكرار بحجم 4 | ×4 |
| tomato-pests-03 | tomato | 66 | Imidacloprid 35% · SC 35 · 75 سم³ / 100 لتر ماء (صوب) · PHI=3 | المنّ — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-04 | tomato | 67,68 | Metaflumizone 24% · SC 24 · 100 سم³ / 100 لتر ماء · PHI=7 | حشرة توتا أبسليوتا — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-04 | tomato | 67,68 | Metaflumizone 24% · SC 24 · 100 سم³ / 100 لتر ماء · PHI=8 | حشرة توتا أبسليوتا — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-04 | tomato | 67,68 | Indoxacarb 30% · WG 30 · 15 جم / 100 لتر ماء · PHI=7 | حشرة توتا أبسليوتا — مجموعة التكرار بحجم 3 | ×3 |
| tomato-pests-04 | tomato | 67,68 | Cyromazine 75% · WP 75 · 50 جم / 100 لتر ماء · PHI=7 | حشرة توتا أبسليوتا — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-04 | tomato | 67,68 | Bacillus thuringiensis 9.4% · WP 9.4 · 400 جم / فدان · PHI= | حشرة توتا أبسليوتا — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-04 | tomato | 67,68 | Hexaflumuron 10% · EC 10 · 200 سم³ / فدان · PHI=7 | حشرة توتا أبسليوتا — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-05 | tomato | 69,70,71 | Emamectin benzoate 5% · SG 5 · 60 جم / فدان · PHI=3 | دودة ورق القطن — مجموعة التكرار بحجم 3 | ×3 |
| tomato-pests-05 | tomato | 69,70,71 | Emamectin benzoate 5.7% · WG 5.7 · 60 جم / فدان · PHI=3 | دودة ورق القطن — مجموعة التكرار بحجم 6 | ×6 |
| tomato-pests-05 | tomato | 69,70,71 | Emamectin benzoate 5.7% · WG 5.7 · 60 جم / فدان · PHI=8 | دودة ورق القطن — مجموعة التكرار بحجم 3 | ×3 |
| tomato-pests-05 | tomato | 69,70,71 | Emamectin benzoate 5.7% · WG 5.7 · 60 جم / فدان · PHI=7 | دودة ورق القطن — مجموعة التكرار بحجم 13 | ×13 |
| tomato-pests-05 | tomato | 69,70,71 | Emamectin benzoate 5.7% · WG 5.7 · 60 جم / فدان · PHI=5 | دودة ورق القطن — مجموعة التكرار بحجم 7 | ×7 |
| tomato-pests-05 | tomato | 69,70,71 | Emamectin benzoate 5.7% · WG 5.7 · 60 جم / فدان · PHI=14 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-05 | tomato | 69,70,71 | Emamectin benzoate 5.7% · SG 5.7 · 60 جم / فدان · PHI=3 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-05 | tomato | 69,70,71 | Emamectin benzoate 5.7% · WG 5.7 · 80 جم / فدان · PHI=7 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-05 | tomato | 69,70,71 | Emamectin benzoate 5.7% · SG 5.7 · 60 جم / فدان · PHI=7 | دودة ورق القطن — مجموعة التكرار بحجم 3 | ×3 |
| tomato-pests-05 | tomato | 69,70,71 | Methoxyfenozide 24% · SC 24 · 37.5 سم³ / 100 لتر ماء · PHI=7 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-05 | tomato | 69,70,71 | Indoxacarb 15% · SC 15 · 26.5 سم³ / 100 لتر ماء · PHI=7 | دودة ورق القطن — مجموعة التكرار بحجم 3 | ×3 |
| tomato-pests-05 | tomato | 69,70,71 | Lufenuron 5% · EC 5 · 160 سم³ / فدان · PHI=7 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-05 | tomato | 69,70,71 | Emamectin benzoate 5% · EC 5 · 60 سم³ / فدان · PHI=7 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-07 | tomato | 73 | Emamectin benzoate 5% · SG 5 · 80 جم / فدان · PHI=3 | ديدان ثمار الطماطم — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-07 | tomato | 73 | Indoxacarb 30% · WG 30 · 60 جم / فدان · PHI=8 | ديدان ثمار الطماطم — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-09 | tomato | 74,75,76,77 | Abamectin 8.4% · SC 8.4 · 60 سم³ / فدان · PHI=7 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-09 | tomato | 74,75,76,77 | Bifenazate 48% · SC 48 · 35 سم³ / 100 لتر ماء · PHI=8 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-09 | tomato | 74,75,76,77 | Chlorfenapyr 24% · SC 24 · 60 سم³ / 100 لتر ماء · PHI=7 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-09 | tomato | 74,75,76,77 | Chlorfenapyr 24% · SC 24 · 60 سم³ / 100 لتر ماء · PHI=14 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-09 | tomato | 74,75,76,77 | Chlorfenapyr 24% · SC 24 · 60 سم³ / 100 لتر ماء · PHI=10 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-09 | tomato | 74,75,76,77 | Abamectin 1.8% · EC 1.8 · 40 سم³ / 100 لتر ماء · PHI=5 | العنكبوت الأحمر — مجموعة التكرار بحجم 3 | ×3 |
| tomato-pests-09 | tomato | 74,75,76,77 | Abamectin 1.8% · EC 1.8 · 40 سم³ / 100 لتر ماء · PHI=7 | العنكبوت الأحمر — مجموعة التكرار بحجم 8 | ×8 |
| tomato-pests-09 | tomato | 74,75,76,77 | Abamectin 1.8% · EC 1.8 · 40 سم³ / 100 لتر ماء · PHI=3 | العنكبوت الأحمر — مجموعة التكرار بحجم 3 | ×3 |
| tomato-pests-09 | tomato | 74,75,76,77 | Abamectin 5% · EC 5 · 20 سم³ / 100 لتر ماء · PHI=7 | العنكبوت الأحمر — مجموعة التكرار بحجم 3 | ×3 |
| tomato-pests-09 | tomato | 74,75,76,77 | Abamectin 5% · EC 5 · 15 سم³ / 100 لتر ماء · PHI=3 | العنكبوت الأحمر — مجموعة التكرار بحجم 5 | ×5 |
| tomato-pests-09 | tomato | 74,75,76,77 | Spiromesifen 24% · SC 24 · 40 سم³ / 100 لتر ماء · PHI=7 | العنكبوت الأحمر — مجموعة التكرار بحجم 3 | ×3 |
| tomato-pests-09 | tomato | 74,75,76,77 | Bifenazate 43% · SC 43 · 35 سم³ / 100 لتر ماء · PHI=6 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-12 | tomato | 79,80 | Sulfur 80% · WG 80 · 250 جم / 100 لتر ماء · PHI=3 | البياض الدقيقي — مجموعة التكرار بحجم 5 | ×5 |
| tomato-pests-12 | tomato | 79,80 | Sulfur 98% · DP 98 · 30 كجم / فدان (تعفير) · PHI=3 | البياض الدقيقي — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-12 | tomato | 79,80 | Penconazole 10% · EC 10 · 25 سم³ / 100 لتر ماء · PHI=14 | البياض الدقيقي — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-13 | tomato | 81,82,83 | Mancozeb 80% · WP 80 · 250 جم / 100 لتر ماء · PHI=5 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-13 | tomato | 81,82,83 | Mancozeb 80% · WP 80 · 250 جم / 100 لتر ماء · PHI=7 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-13 | tomato | 81,82,83 | Mancozeb 64% + Metalaxyl 8% · WP 72 · 250 جم / 100 لتر ماء · PHI=7 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 5 | ×5 |
| tomato-pests-13 | tomato | 81,82,83 | Azoxystrobin 20% + Difenoconazole 12.5% · SC 32.5 · 50 سم³ / 100 لتر ماء · PHI=7 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 4 | ×4 |
| tomato-pests-13 | tomato | 81,82,83 | Difenoconazole 25% · EC 25 · 50 سم³ / 100 لتر ماء · PHI=7 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-13 | tomato | 81,82,83 | Trifloxystrobin 50% · WG 50 · 20 جم / 100 لتر ماء · PHI=7 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-13 | tomato | 81,82,83 | Cymoxanil 30% + Famoxadone 22.5% · WG 52.5 · 50 جم / 100 لتر ماء · PHI=7 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-14 | tomato | 84,85,86 | Azoxystrobin 20% + Difenoconazole 12.5% · SC 32.5 · 75 سم³ / 100 لتر ماء · PHI=14 | الندوة المتأخرة — مجموعة التكرار بحجم 2 | ×2 |
| tomato-pests-14 | tomato | 84,85,86 | Azoxystrobin 20% + Difenoconazole 12.5% · SC 32.5 · 75 سم³ / 100 لتر ماء · PHI=7 | الندوة المتأخرة — مجموعة التكرار بحجم 4 | ×4 |
| tomato-pests-14 | tomato | 84,85,86 | Copper oxychloride 35% + Metalaxyl 15% · WP 50 · 150 جم / 100 لتر ماء · PHI=15 | الندوة المتأخرة — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-01 | potato | 89 | Lambda-cyhalothrin 5% · EC 5 · 200 سم³ / فدان · PHI=60 | الدودة القارضة — مجموعة التكرار بحجم 4 | ×4 |
| potato-pests-04 | potato | 91,92 | Flonicamid 50% · WG 50 · 20 جم / 100 لتر ماء · PHI=7 | المنّ — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-04 | potato | 91,92 | Flonicamid 50% · WG 50 · 20 جم / 100 لتر ماء · PHI=10 | المنّ — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-05 | potato | 93,94 | Indoxacarb 15% · EC 15 · 25 سم³ / 100 لتر ماء · PHI=7 | دودة درنات البطاطس (فى الحقل) — مجموعة التكرار بحجم 3 | ×3 |
| potato-pests-05 | potato | 93,94 | Indoxacarb 30% · WG 30 · 15 جم / 100 لتر ماء · PHI=7 | دودة درنات البطاطس (فى الحقل) — مجموعة التكرار بحجم 3 | ×3 |
| potato-pests-05 | potato | 93,94 | Lufenuron 5% · EC 5 · 160 سم³ / فدان · PHI=7 | دودة درنات البطاطس (فى الحقل) — مجموعة التكرار بحجم 4 | ×4 |
| potato-pests-06 | potato | 95 | Lufenuron 5% · EC 5 · 160 سم³ / فدان · PHI=7 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-06 | potato | 95 | Chlorfluazuron 5% · EC 5 · 400 سم³ / فدان · PHI=14 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-07 | potato | 96 | Abamectin 1.8% · EC 1.8 · 40 سم³ / 100 لتر ماء · PHI=7 | العنكبوت الأحمر — مجموعة التكرار بحجم 4 | ×4 |
| potato-pests-07 | potato | 96 | Abamectin 1.8% · EC 1.8 · 40 سم³ / 100 لتر ماء · PHI=14 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-07 | potato | 96 | Abamectin 5% · EC 5 · 20 سم³ / 100 لتر ماء · PHI=7 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-07 | potato | 96 | Chlorfenapyr 24% · SC 24 · 60 سم³ / 100 لتر ماء · PHI=10 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-08 | potato | 97 | Azoxystrobin 25% · SC 25 · 1 لتر / طن درنات · PHI=70 | القشرة السوداء (فطريات التربة) — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-13 | potato | 101,102,103,104,105 | Cymoxanil 30% + Famoxadone 22.5% · WG 52.5 · 40 جم / 100 لتر ماء · PHI=7 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-13 | potato | 101,102,103,104,105 | Mancozeb 80% · WP 80 · 250 جم / 100 لتر ماء · PHI=10 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-13 | potato | 101,102,103,104,105 | Mancozeb 80% · WP 80 · 250 جم / 100 لتر ماء · PHI=7 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-13 | potato | 101,102,103,104,105 | Difenoconazole 25% · EC 25 · 50 سم³ / 100 لتر ماء · PHI=5 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-13 | potato | 101,102,103,104,105 | Difenoconazole 25% · EC 25 · 50 سم³ / 100 لتر ماء · PHI=14 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 3 | ×3 |
| potato-pests-13 | potato | 101,102,103,104,105 | Difenoconazole 25% · EC 25 · 50 سم³ / 100 لتر ماء · PHI=7 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 8 | ×8 |
| potato-pests-13 | potato | 101,102,103,104,105 | Mancozeb 75% · WG 75 · 200 جم / 100 لتر ماء · PHI=7 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-13 | potato | 101,102,103,104,105 | Tebuconazole 50% + Trifloxystrobin 25% · WG 75 · 25 جم / 100 لتر ماء · PHI=7 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-13 | potato | 101,102,103,104,105 | Mancozeb 64% + Metalaxyl 8% · WP 72 · 250 جم / 100 لتر ماء · PHI=14 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-13 | potato | 101,102,103,104,105 | Mancozeb 64% + Metalaxyl 8% · WP 72 · 250 جم / 100 لتر ماء · PHI=7 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 4 | ×4 |
| potato-pests-13 | potato | 101,102,103,104,105 | Mancozeb 75% · WP 75 · 250 جم / 100 لتر ماء · PHI=7 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-13 | potato | 101,102,103,104,105 | Azoxystrobin 20% + Difenoconazole 12.5% · SC 32.5 · 300 سم³ / فدان · PHI=7 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 5 | ×5 |
| potato-pests-13 | potato | 101,102,103,104,105 | Pyraclostrobin 50% · WG 50 · 70 جم / 100 لتر ماء · PHI=7 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 3 | ×3 |
| potato-pests-13 | potato | 101,102,103,104,105 | Tebuconazole 25% · EC 25 · 60 سم³ / 100 لتر ماء · PHI=10 | الندوة المبكرة (البدرية) — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-14 | potato | 106,107,108,109,110 | Fluazinam 50% · SC 50 · 50 سم³ / 100 لتر ماء · PHI=7 | الندوة المتأخرة — مجموعة التكرار بحجم 5 | ×5 |
| potato-pests-14 | potato | 106,107,108,109,110 | Fluazinam 50% · SC 50 · 50 سم³ / 100 لتر ماء · PHI=5 | الندوة المتأخرة — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-14 | potato | 106,107,108,109,110 | Dimethomorph 50% · WG 50 · 50 جم / 100 لتر ماء · PHI=10 | الندوة المتأخرة — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-14 | potato | 106,107,108,109,110 | Azoxystrobin 25% · SC 25 · 50 سم³ / 100 لتر ماء · PHI=7 | الندوة المتأخرة — مجموعة التكرار بحجم 5 | ×5 |
| potato-pests-14 | potato | 106,107,108,109,110 | Propamocarb hydrochloride 72.2% · SL 72.2 · 250 سم³ / 100 لتر ماء · PHI=7 | الندوة المتأخرة — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-14 | potato | 106,107,108,109,110 | Mancozeb 80% · WP 80 · 250 جم / 100 لتر ماء · PHI=7 | الندوة المتأخرة — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-14 | potato | 106,107,108,109,110 | Mancozeb 80% · WP 80 · 250 جم / 100 لتر ماء · PHI=10 | الندوة المتأخرة — مجموعة التكرار بحجم 2 | ×2 |
| potato-pests-14 | potato | 106,107,108,109,110 | Chlorothalonil 50% + Metalaxyl-M 3.75% · SC 53.75 · 300 سم³ / 100 لتر ماء · PHI=7 | الندوة المتأخرة — مجموعة التكرار بحجم 2 | ×2 |
| sweet-potato-pests-01 | sweet-potato | 112,113 | Emamectin benzoate 5.7% · WG 5.7 · 60 جم / فدان · PHI=7 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| sweet-potato-pests-01 | sweet-potato | 112,113 | Emamectin benzoate 9.1% · WG 9.1 · 50 جم / فدان · PHI=7 | دودة ورق القطن — مجموعة التكرار بحجم 3 | ×3 |
| sweet-potato-pests-01 | sweet-potato | 112,113 | Indoxacarb 30% · WG 30 · 60 جم / فدان · PHI=7 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| sweet-potato-pests-03 | sweet-potato | 114,115 | Abamectin 1.8% · EC 1.8 · 40 سم³ / 100 لتر ماء · PHI=5 | العنكبوت الاحمر — مجموعة التكرار بحجم 2 | ×2 |
| pepper-pests-03 | pepper | 119 | Imidacloprid 35% · SC 35 · 75 سم³ / 100 لتر ماء (صوب) · PHI=8 | المن — مجموعة التكرار بحجم 2 | ×2 |
| pepper-pests-06 | pepper | 121 | Azoxystrobin 6% + Chlorothalonil 50% · SC 56 · 250 سم³ / 100 لتر ماء · PHI=10 | البياض الدقيق — مجموعة التكرار بحجم 3 | ×3 |
| cucumber-pests-01 | cucumber | 124,125 | Pyriproxyfen 10% · EC 10 · 75 سم³ / 100 لتر ماء · PHI=7 | الذبابة البيضاء — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-01 | cucumber | 124,125 | Imidacloprid 35% · SC 35 · 200 سم³ / فدان (صوب) · PHI=5 | الذبابة البيضاء — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-02 | cucumber | 126,127 | Acetamiprid 20% · SP 20 · 25 جم / 100 لتر ماء · PHI=7 | المن — مجموعة التكرار بحجم 7 | ×7 |
| cucumber-pests-02 | cucumber | 126,127 | Acetamiprid 20% · SP 20 · 25 جم / 100 لتر ماء · PHI=5 | المن — مجموعة التكرار بحجم 8 | ×8 |
| cucumber-pests-02 | cucumber | 126,127 | Acetamiprid 20% · SP 20 · 25 جم / 100 لتر ماء · PHI=3 | المن — مجموعة التكرار بحجم 3 | ×3 |
| cucumber-pests-02 | cucumber | 126,127 | Imidacloprid 35% · SC 35 · 75 سم³ / 100 لتر ماء (صوب) · PHI=7 | المن — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-02 | cucumber | 126,127 | Imidacloprid 70% · WG 70 · 35 جم / فدان (صوب) · PHI=5 | المن — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-02 | cucumber | 126,127 | Imidacloprid 70% · WG 70 · 35 جم / فدان (صوب) · PHI=7 | المن — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-02 | cucumber | 126,127 | Acetamiprid 20% · SL 20 · 25 سم³ / 100 لتر ماء · PHI=7 | المن — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-03 | cucumber | 128 | Thiamethoxam 25% · WG 25 · 80 جم / فدان (صوب) · PHI=7 | صانعات الأنفاق — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-03 | cucumber | 128 | Thiamethoxam 25% · WG 25 · 60 جم / فدان (صوب) · PHI=7 | صانعات الأنفاق — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-05 | cucumber | 129,130 | Abamectin 1.8% · EC 1.8 · 40 سم³ / 100 لتر ماء · PHI=7 | العنكبوت الأحمر — مجموعة التكرار بحجم 9 | ×9 |
| cucumber-pests-05 | cucumber | 129,130 | Abamectin 5% · EC 5 · 20 سم³ / 100 لتر ماء · PHI=4 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-05 | cucumber | 129,130 | Clofentezine 50% · SC 50 · 30 سم³ / 100 لتر ماء · PHI=7 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-06 | cucumber | 131 | Pyrimethanil 40% · SC 40 · 100 سم³ / 100 لتر ماء · PHI=7 | اعفان الثمار — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-07 | cucumber | 131,132,133 | Hymexazol 30% · SL 30 · 1 سم³ / 1 لتر ماء · PHI=45 | اعفان الجذور وموت البادرات — مجموعة التكرار بحجم 8 | ×8 |
| cucumber-pests-07 | cucumber | 131,132,133 | Thiophanate-methyl 70% · WP 70 · 1 جم / 1 لتر ماء · PHI= | اعفان الجذور وموت البادرات — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-07 | cucumber | 131,132,133 | Thiophanate-methyl 70% · WP 70 · 1 جم / 1 لتر ماء · PHI=45 | اعفان الجذور وموت البادرات — مجموعة التكرار بحجم 4 | ×4 |
| cucumber-pests-07 | cucumber | 131,132,133 | Hymexazol 70% · WP 70 · 0.5 جم / 1 لتر ماء · PHI=45 | اعفان الجذور وموت البادرات — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-07 | cucumber | 131,132,133 | Azoxystrobin 28.2% + Metalaxyl-M 10.8% · SC 39 · 650 سم³ / فدان · PHI=45 | اعفان الجذور وموت البادرات — مجموعة التكرار بحجم 4 | ×4 |
| cucumber-pests-08 | cucumber | 134,135 | Sulfur 80% · WG 80 · 200 جم / 100 لتر ماء · PHI=3 | البياض الدقيقى — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-08 | cucumber | 134,135 | Sulfur 80% · WG 80 · 250 جم / 100 لتر ماء · PHI=3 | البياض الدقيقى — مجموعة التكرار بحجم 3 | ×3 |
| cucumber-pests-08 | cucumber | 134,135 | Boscalid 20% + Kresoxim-methyl 10% · SC 30 · 50 سم³ / 100 لتر ماء · PHI=7 | البياض الدقيقى — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-08 | cucumber | 134,135 | Boscalid 20% + Kresoxim-methyl 10% · SC 30 · 50 سم³ / 100 لتر ماء · PHI=5 | البياض الدقيقى — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-08 | cucumber | 134,135 | Penconazole 10% · EC 10 · 25 سم³ / 100 لتر ماء · PHI=5 | البياض الدقيقى — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-08 | cucumber | 134,135 | Azoxystrobin 20% + Difenoconazole 12.5% · SC 32.5 · 200 سم³ / فدان · PHI=7 | البياض الدقيقى — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-09 | cucumber | 136,137,138,139 | Fosetyl-aluminium 80% · WP 80 · 250 جم / 100 لتر ماء · PHI=7 | البياض الزغبى — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-09 | cucumber | 136,137,138,139 | Fosetyl-aluminium 80% · WP 80 · 250 جم / 100 لتر ماء · PHI=3 | البياض الزغبى — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-09 | cucumber | 136,137,138,139 | Azoxystrobin 25% · SC 25 · 50 سم³ / 100 لتر ماء · PHI=3 | البياض الزغبى — مجموعة التكرار بحجم 8 | ×8 |
| cucumber-pests-09 | cucumber | 136,137,138,139 | Cymoxanil 10% + Copper oxychloride 30% · WP 40 · 250 جم / 100 لتر ماء · PHI=7 | البياض الزغبى — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-09 | cucumber | 136,137,138,139 | Cymoxanil 50% · WG 50 · 50 جم / 100 لتر ماء · PHI=7 | البياض الزغبى — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-09 | cucumber | 136,137,138,139 | Cymoxanil 50% · WP 50 · 50 جم / 100 لتر ماء · PHI=7 | البياض الزغبى — مجموعة التكرار بحجم 2 | ×2 |
| cucumber-pests-09 | cucumber | 136,137,138,139 | Propamocarb hydrochloride 72.2% · SL 72.2 · 250 سم³ / 100 لتر ماء · PHI=7 | البياض الزغبى — مجموعة التكرار بحجم 3 | ×3 |
| squash-pests-02 | squash | 141 | Sulfur 80% · WG 80 · 250 جم / 100 لتر ماء · PHI=3 | البياض الدقيق — مجموعة التكرار بحجم 2 | ×2 |
| watermelon-pests-01 | watermelon | 144,145 | Abamectin 1.8% · EC 1.8 · 40 سم³ / 100 لتر ماء · PHI=5 | العنكبوت الأحمر — مجموعة التكرار بحجم 3 | ×3 |
| watermelon-pests-01 | watermelon | 144,145 | Abamectin 1.8% · EC 1.8 · 40 سم³ / 100 لتر ماء · PHI=7 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| watermelon-pests-01 | watermelon | 144,145 | Fenpyroximate 5% · SC 5 · 50 سم³ / 100 لتر ماء · PHI=10 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| watermelon-pests-01 | watermelon | 144,145 | Fenpyroximate 5% · SC 5 · 50 سم³ / 100 لتر ماء · PHI=3 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| watermelon-pests-01 | watermelon | 144,145 | Fenpyroximate 5% · SC 5 · 50 سم³ / 100 لتر ماء · PHI=7 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| watermelon-pests-02 | watermelon | 146 | Sulfur 80% · WG 80 · 250 جم / 100 لتر ماء · PHI=10 | البياض الدقيق — مجموعة التكرار بحجم 2 | ×2 |
| watermelon-pests-03 | watermelon | 147 | Dimethomorph 12% + Pyraclostrobin 6.7% · WG 18.7 · 100 جم / 100 لتر ماء · PHI=7 | البياض الزغبي — مجموعة التكرار بحجم 2 | ×2 |
| watermelon-pests-03 | watermelon | 147 | Dimethomorph 12% + Pyraclostrobin 6.7% · WG 18.7 · 100 جم / 100 لتر ماء · PHI=10 | البياض الزغبي — مجموعة التكرار بحجم 2 | ×2 |
| cantaloupe-pests-06 | cantaloupe | 158,159 | Azoxystrobin 20% + Difenoconazole 12.5% · SC 32.5 · 200 سم³ / فدان · PHI=7 | البياض الزغبى — مجموعة التكرار بحجم 4 | ×4 |
| cantaloupe-pests-08 | cantaloupe | 160 | Azoxystrobin 6% + Chlorothalonil 50% · SC 56 · 250 سم³ / 100 لتر ماء · PHI=7 | لفحة الساق الصمغية — مجموعة التكرار بحجم 4 | ×4 |
| cantaloupe-pests-08 | cantaloupe | 160 | Azoxystrobin 6% + Chlorothalonil 50% · SC 56 · 250 سم³ / 100 لتر ماء · PHI=10 | لفحة الساق الصمغية — مجموعة التكرار بحجم 4 | ×4 |
| honeydew-pests-02 | honeydew | 161,162 | Sulfur 80% · WG 80 · 250 جم / 100 لتر ماء · PHI=5 | البياض الدقيق — مجموعة التكرار بحجم 2 | ×2 |
| honeydew-pests-02 | honeydew | 161,162 | Boscalid 25.2% + Pyraclostrobin 12.8% · WG 38 · 50 جم / 100 لتر ماء · PHI=7 | البياض الدقيق — مجموعة التكرار بحجم 2 | ×2 |
| cowpea-pests-01 | cowpea | 168 | Acetamiprid 5% + Bifenthrin 2.5% · EC 7.5 · 50 سم³ / 100 لتر ماء · PHI=10 | المنّ — مجموعة التكرار بحجم 2 | ×2 |
| cowpea-pests-02 | cowpea | 168,169 | Lambda-cyhalothrin 5% · EC 5 · 370 سم³ / فدان · PHI=14 | دودة قرون اللوبيا — مجموعة التكرار بحجم 2 | ×2 |
| pea-pests-03 | pea | 171,172 | Sulfur 80% · WG 80 · 250 جم / 100 لتر ماء · PHI=3 | الصدأ — مجموعة التكرار بحجم 2 | ×2 |
| cabbage-pests-01 | cabbage | 178 | Emamectin benzoate 1.9% · EC 1.9 · 250 سم³ / فدان · PHI=10 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| cabbage-pests-01 | cabbage | 178 | Indoxacarb 15% · SC 15 · 25 سم³ / 100 لتر ماء · PHI=7 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| cauliflower-pests-01 | cauliflower | 184 | Emamectin benzoate 5.7% · WG 5.7 · 60 جم / فدان · PHI=7 | دودة ورق القطن — مجموعة التكرار بحجم 3 | ×3 |
| lettuce-pests-01 | lettuce | 188 | Acetamiprid 5% + Bifenthrin 2.5% · EC 7.5 · 100 سم³ / 100 لتر ماء · PHI=7 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| strawberry-pests-02 | strawberry | 190,191 | Bifenazate 48% · SC 48 · 35 سم³ / 100 لتر ماء · PHI=7 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| strawberry-pests-02 | strawberry | 190,191 | Bifenazate 43% · SC 43 · 35 سم³ / 100 لتر ماء · PHI=7 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| strawberry-pests-02 | strawberry | 190,191 | Bifenazate 24% · SC 24 · 70 سم³ / 100 لتر ماء · PHI=7 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| strawberry-pests-04 | strawberry | 193,194 | Thiophanate-methyl 70% · WP 70 · 60 جم / 100 لتر ماء · PHI=3 | البياض الدقيق — مجموعة التكرار بحجم 3 | ×3 |
| strawberry-pests-04 | strawberry | 193,194 | Thiophanate-methyl 70% · WP 70 · 80 جم / 100 لتر ماء · PHI=3 | البياض الدقيق — مجموعة التكرار بحجم 3 | ×3 |
| strawberry-pests-04 | strawberry | 193,194 | Thiophanate-methyl 70% · WP 70 · 80 جم / 100 لتر ماء · PHI=10 | البياض الدقيق — مجموعة التكرار بحجم 2 | ×2 |
| strawberry-pests-04 | strawberry | 193,194 | Thiophanate-methyl 70% · WP 70 · 80 جم / 100 لتر ماء · PHI=15 | البياض الدقيق — مجموعة التكرار بحجم 3 | ×3 |
| turf-pests-01 | turf | 197,198 | Lambda-cyhalothrin 5% · EC 5 · 375 سم³/فدان · PHI= | آفات المسطحات الخضراء — مجموعة التكرار بحجم 2 | ×2 |
| turf-pests-01 | turf | 197,198 | Acetamiprid 22.7% + Bifenthrin 27.3% · WP 50 · 100 جم/فدان · PHI= | آفات المسطحات الخضراء — مجموعة التكرار بحجم 2 | ×2 |
| turf-pests-01 | turf | 197,198 | Acetamiprid 5% + Bifenthrin 2.5% · EC 7.5 · 375 سم³/فدان · PHI= | آفات المسطحات الخضراء — مجموعة التكرار بحجم 2 | ×2 |
| citrus-pests-01 | citrus | 199,200 | Mineral oil 80% · 80 · 2.5 لتر/100 لتر ماء (رش شتوى) · PHI=8 | الحشرات القشرية — مجموعة التكرار بحجم 2 | ×2 |
| citrus-pests-01 | citrus | 199,200 | Pyriproxyfen 10% · EC 10 · 50 سم³/100 لتر ماء · PHI=7 | الحشرات القشرية — مجموعة التكرار بحجم 2 | ×2 |
| citrus-pests-01 | citrus | 199,200 | Pyriproxyfen 10% · EC 10 · 50 سم³/100 لتر ماء · PHI=10 | الحشرات القشرية — مجموعة التكرار بحجم 9 | ×9 |
| citrus-pests-01 | citrus | 199,200 | Mineral oil 95% · EC 95 · 1.5 لتر/100 لتر ماء (رش صيفى) · PHI=12 | الحشرات القشرية — مجموعة التكرار بحجم 4 | ×4 |
| citrus-pests-01 | citrus | 199,200 | Pyriproxyfen 10% · EW 10 · 50 سم³/100 لتر ماء · PHI=10 | الحشرات القشرية — مجموعة التكرار بحجم 2 | ×2 |
| citrus-pests-02 | citrus | 201,202 | Alpha-cypermethrin 10% · EC 10 · 75 سم³/20 لتر ماء+5% مادة جاذبة · PHI=2 | ذباب الفاكهة — مجموعة التكرار بحجم 16 | ×16 |
| citrus-pests-02 | citrus | 201,202 | Beta-cyfluthrin 12.5% · SC 12.5 · 15 سم³/20 لتر ماء+5% مادة جاذبة · PHI=2 | ذباب الفاكهة — مجموعة التكرار بحجم 6 | ×6 |
| citrus-pests-04 | citrus | 203,204 | Fenpyroximate 5% · SC 5 · 50 سم³/100 لتر ماء · PHI=14 | اكاروس الموالح البنى — مجموعة التكرار بحجم 3 | ×3 |
| citrus-pests-04 | citrus | 203,204 | Tebufenpyrad 20% · WP 20 · 40 جم/100 لتر ماء · PHI=10 | اكاروس الموالح البنى — مجموعة التكرار بحجم 2 | ×2 |
| citrus-pests-06 | citrus | 205,206,207 | Spirodiclofen 24% · SC 24 · 30 سم³/100 لتر ماء · PHI=10 | اكاروس صدأ الموالح — مجموعة التكرار بحجم 5 | ×5 |
| citrus-pests-06 | citrus | 205,206,207 | Spirodiclofen 24% · SC 24 · 30 سم³/100 لتر ماء · PHI=14 | اكاروس صدأ الموالح — مجموعة التكرار بحجم 2 | ×2 |
| citrus-pests-06 | citrus | 205,206,207 | Spirodiclofen 24% · SC 24 · 30 سم³/100 لتر ماء · PHI=7 | اكاروس صدأ الموالح — مجموعة التكرار بحجم 6 | ×6 |
| citrus-pests-06 | citrus | 205,206,207 | Spirodiclofen 24% · SC 24 · 30 سم³/100 لتر ماء · PHI=5 | اكاروس صدأ الموالح — مجموعة التكرار بحجم 2 | ×2 |
| citrus-pests-06 | citrus | 205,206,207 | Pyridaben 20% · WP 20 · 50 جم/100 لتر ماء · PHI=10 | اكاروس صدأ الموالح — مجموعة التكرار بحجم 3 | ×3 |
| citrus-pests-06 | citrus | 205,206,207 | Abamectin 1.8% · EC 1.8 · 30 سم³/100 لتر ماء · PHI=10 | اكاروس صدأ الموالح — مجموعة التكرار بحجم 2 | ×2 |
| citrus-pests-06 | citrus | 205,206,207 | Abamectin 1.8% · EC 1.8 · 30 سم³/100 لتر ماء · PHI=7 | اكاروس صدأ الموالح — مجموعة التكرار بحجم 3 | ×3 |
| citrus-pests-06 | citrus | 205,206,207 | Abamectin 5% · EC 5 · 20 سم³/100 لتر ماء · PHI=5 | اكاروس صدأ الموالح — مجموعة التكرار بحجم 3 | ×3 |
| citrus-pests-06 | citrus | 205,206,207 | Abamectin 1% + Bifenazate 19% · SC 20 · 70 سم³/100 لتر ماء · PHI=14 | اكاروس صدأ الموالح — مجموعة التكرار بحجم 3 | ×3 |
| citrus-pests-08 | citrus | 208 | Fosetyl-aluminium 80% · WP 80 · 1 كجم/فدان (دهان) · PHI=7 | التصمغ — مجموعة التكرار بحجم 2 | ×2 |
| citrus-pests-08 | citrus | 208 | Fosetyl-aluminium 80% · WG 80 · 1 كجم/فدان (دهان) · PHI=7 | التصمغ — مجموعة التكرار بحجم 2 | ×2 |
| citrus-pests-10 | citrus | 210 | Oxamyl 24% · SL 24 · 4 لتر/فدان (مرتين) · PHI=7 | نيماتودا التدهور البطئ (فى الأشجار المثمرة) — مجموعة التكرار بحجم 2 | ×2 |
| citrus-pests-10 | citrus | 210 | Oxamyl 24% · SL 24 · 4 لتر/فدان (مرتين) · PHI=60 | نيماتودا التدهور البطئ (فى الأشجار المثمرة) — مجموعة التكرار بحجم 2 | ×2 |
| citrus-orange-pests-01 | citrus-orange | 212 | Difenoconazole 15% + Propiconazole 15% · EC 30 · 40 سم³/100 لتر ماء · PHI=10 | عفن السرة — مجموعة التكرار بحجم 3 | ×3 |
| mango-pests-02 | mango | 213,214 | Mineral oil 97% · EC 97 · 1.5 لتر/100 لتر ماء (رش صيفى) · PHI=12 | الحشرات القشرية — مجموعة التكرار بحجم 2 | ×2 |
| mango-pests-02 | mango | 213,214 | Mineral oil 95% · EC 95 · 1.5 لتر/100 لتر ماء (رش صيفى) · PHI=12 | الحشرات القشرية — مجموعة التكرار بحجم 2 | ×2 |
| mango-pests-04 | mango | 215,216 | Sulfur 80% · WP 80 · 250 جم/100 لتر ماء · PHI=3 | البياض الدقيقى — مجموعة التكرار بحجم 2 | ×2 |
| mango-pests-04 | mango | 215,216 | Difenoconazole 25% · EC 25 · 50 سم³/100 لتر ماء · PHI=10 | البياض الدقيقى — مجموعة التكرار بحجم 2 | ×2 |
| mango-pests-04 | mango | 215,216 | Propiconazole 25% · EC 25 · 15 سم³/100 لتر ماء · PHI=20 | البياض الدقيقى — مجموعة التكرار بحجم 2 | ×2 |
| mango-pests-04 | mango | 215,216 | Propiconazole 25% · EC 25 · 15 سم³/100 لتر ماء · PHI=19 | البياض الدقيقى — مجموعة التكرار بحجم 4 | ×4 |
| mango-pests-04 | mango | 215,216 | Propiconazole 25% · EC 25 · 15 سم³/100 لتر ماء · PHI=10 | البياض الدقيقى — مجموعة التكرار بحجم 2 | ×2 |
| mango-pests-04 | mango | 215,216 | Propiconazole 25% · EC 25 · 15 سم³/100 لتر ماء · PHI=90 | البياض الدقيقى — مجموعة التكرار بحجم 4 | ×4 |
| mango-pests-04 | mango | 215,216 | Thiophanate-methyl 70% · WP 70 · 60 جم/100 لتر ماء · PHI=7 | البياض الدقيقى — مجموعة التكرار بحجم 2 | ×2 |
| mango-pests-04 | mango | 215,216 | Thiophanate-methyl 70% · WP 70 · 65 جم/100 لتر ماء · PHI=7 | البياض الدقيقى — مجموعة التكرار بحجم 2 | ×2 |
| mango-pests-05 | mango | 217 | Tebuconazole 50% + Trifloxystrobin 25% · WG 75 · 30 جم/100 لتر ماء · PHI=90 | لفحة الأزهار (الأنثراكنوز) — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-04 | grape | 221,222 | Spinosad 24% · SC 24 · 100 سم³/فدان · PHI=3 | دودة ثمار العنب — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-04 | grape | 221,222 | Methoxyfenozide 24% · SC 24 · 25 سم³/100 لتر ماء · PHI= | دودة ثمار العنب — مجموعة التكرار بحجم 4 | ×4 |
| grape-pests-04 | grape | 221,222 | Lufenuron 5% · EC 5 · 40 سم³/100 لتر ماء · PHI= | دودة ثمار العنب — مجموعة التكرار بحجم 5 | ×5 |
| grape-pests-04 | grape | 221,222 | Indoxacarb 15% · SC 15 · 25 سم³/100 لتر ماء · PHI= | دودة ثمار العنب — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-04 | grape | 221,222 | Indoxacarb 15% · EC 15 · 25 سم³/100 لتر ماء · PHI= | دودة ثمار العنب — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-04 | grape | 221,222 | Lufenuron 10% · EC 10 · 20 سم³/100 لتر ماء · PHI= | دودة ثمار العنب — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-05 | grape | 223 | Chlorfenapyr 24% · SC 24 · 60 سم³/100 لتر ماء · PHI= | العنكبوت الأحمر — مجموعة التكرار بحجم 5 | ×5 |
| grape-pests-05 | grape | 223 | Fenpyroximate 5% · SC 5 · 50 سم³/100 لتر ماء · PHI= | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-05 | grape | 223 | Bifenazate 24% · SC 24 · 70 سم³/100 لتر ماء · PHI= | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-05 | grape | 223 | Chlorfenapyr 36% · SC 36 · 40 سم³/100 لتر ماء · PHI= | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-06 | grape | 224,225 | Boscalid 25.2% + Pyraclostrobin 12.8% · WG 38 · 50 جم/100 لتر ماء · PHI=15 | اعفان الثمار — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-06 | grape | 224,225 | Boscalid 25.2% + Pyraclostrobin 12.8% · WG 38 · 50 جم/100 لتر ماء · PHI= | اعفان الثمار — مجموعة التكرار بحجم 3 | ×3 |
| grape-pests-06 | grape | 224,225 | Fenhexamid 50% · SC 50 · 50 سم³/100 لتر ماء · PHI= | اعفان الثمار — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-06 | grape | 224,225 | Azoxystrobin 22.8% + Dimethomorph 57.2% · WG 80 · 35 جم/100 لتر ماء · PHI= | اعفان الثمار — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-06 | grape | 224,225 | Cyprodinil 37% + Fludioxonil 25% · WG 62 · 50 جم/100 لتر ماء · PHI= | اعفان الثمار — مجموعة التكرار بحجم 3 | ×3 |
| grape-pests-06 | grape | 224,225 | Cyprodinil 37.5% + Fludioxonil 25% · WG 62.5 · 50 جم/100 لتر ماء · PHI= | اعفان الثمار — مجموعة التكرار بحجم 3 | ×3 |
| grape-pests-06 | grape | 224,225 | Boscalid 50% · WG 50 · 100 جم/100 لتر ماء · PHI= | اعفان الثمار — مجموعة التكرار بحجم 3 | ×3 |
| grape-pests-06 | grape | 224,225 | Boscalid 25% + Pyraclostrobin 13% · WG 38 · 50 جم/100 لتر ماء · PHI= | اعفان الثمار — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-06 | grape | 224,225 | Pyrimethanil 80% · WG 80 · 75 جم/100 لتر ماء · PHI= | اعفان الثمار — مجموعة التكرار بحجم 3 | ×3 |
| grape-pests-07 | grape | 226,227,228,229,230,231 | Sulfur 80% · WP 80 · 250 جم/100 لتر ماء · PHI= | البياض الدقيقى — مجموعة التكرار بحجم 3 | ×3 |
| grape-pests-07 | grape | 226,227,228,229,230,231 | Boscalid 20% + Kresoxim-methyl 10% · SC 30 · 50 سم³/100 لتر ماء · PHI= | البياض الدقيقى — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-07 | grape | 226,227,228,229,230,231 | Thiophanate-methyl 70% · WP 70 · 80 جم/100 لتر ماء · PHI= | البياض الدقيقى — مجموعة التكرار بحجم 7 | ×7 |
| grape-pests-07 | grape | 226,227,228,229,230,231 | Thiophanate-methyl 70% · WP 70 · 65 جم/100 لتر ماء · PHI= | البياض الدقيقى — مجموعة التكرار بحجم 3 | ×3 |
| grape-pests-07 | grape | 226,227,228,229,230,231 | Sulfur 80% · WG 80 · 250 جم/100 لتر ماء · PHI= | البياض الدقيقى — مجموعة التكرار بحجم 9 | ×9 |
| grape-pests-07 | grape | 226,227,228,229,230,231 | Sulfur 80% · WG 80 · 250 جم/100 لتر ماء · PHI=3 | البياض الدقيقى — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-07 | grape | 226,227,228,229,230,231 | Penconazole 10% · EC 10 · 10 سم³/100 لتر ماء · PHI= | البياض الدقيقى — مجموعة التكرار بحجم 4 | ×4 |
| grape-pests-07 | grape | 226,227,228,229,230,231 | Azoxystrobin 25% · SC 25 · 50 سم³/100 لتر ماء · PHI= | البياض الدقيقى — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-07 | grape | 226,227,228,229,230,231 | Propiconazole 25% · EC 25 · 15 سم³/100 لتر ماء · PHI= | البياض الدقيقى — مجموعة التكرار بحجم 7 | ×7 |
| grape-pests-07 | grape | 226,227,228,229,230,231 | Boscalid 25.2% + Pyraclostrobin 12.8% · SC 38 · 50 سم³/100 لتر ماء · PHI= | البياض الدقيقى — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-07 | grape | 226,227,228,229,230,231 | Boscalid 25.2% + Pyraclostrobin 12.8% · WG 38 · 50 جم/100 لتر ماء · PHI= | البياض الدقيقى — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-07 | grape | 226,227,228,229,230,231 | Myclobutanil 12.5% · EC 12.5 · 30 سم³/100 لتر ماء · PHI= | البياض الدقيقى — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-07 | grape | 226,227,228,229,230,231 | Azoxystrobin 20% + Difenoconazole 12.5% · SC 32.5 · 75 سم³/100 لتر ماء · PHI= | البياض الدقيقى — مجموعة التكرار بحجم 6 | ×6 |
| grape-pests-07 | grape | 226,227,228,229,230,231 | Myclobutanil 25% · EC 25 · 15 سم³/100 لتر ماء · PHI= | البياض الدقيقى — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-07 | grape | 226,227,228,229,230,231 | Dimethomorph 12% + Pyraclostrobin 6.7% · WG 18.7 · 100 جم/100 لتر ماء · PHI= | البياض الدقيقى — مجموعة التكرار بحجم 8 | ×8 |
| grape-pests-07 | grape | 226,227,228,229,230,231 | Metiram 55% + Pyraclostrobin 5% · WG 60 · 100 جم/100 لتر ماء · PHI= | البياض الدقيقى — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-08 | grape | 231,232,233,234,235 | Azoxystrobin 25% · SC 25 · 50 سم³/100 لتر ماء · PHI= | البياض الزغبى — مجموعة التكرار بحجم 6 | ×6 |
| grape-pests-08 | grape | 231,232,233,234,235 | Mancozeb 80% · WP 80 · 250 جم/100 لتر ماء · PHI= | البياض الزغبى — مجموعة التكرار بحجم 6 | ×6 |
| grape-pests-08 | grape | 231,232,233,234,235 | Azoxystrobin 20% + Dimethomorph 50% · WG 70 · 50 جم/100 لتر ماء · PHI= | البياض الزغبى — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-08 | grape | 231,232,233,234,235 | Cymoxanil 30% + Famoxadone 22.5% · WG 52.5 · 40 جم/100 لتر ماء · PHI= | البياض الزغبى — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-08 | grape | 231,232,233,234,235 | Cymoxanil 30% + Famoxadone 22.5% · WG 52.5 · 30 جم/100 لتر ماء · PHI= | البياض الزغبى — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-08 | grape | 231,232,233,234,235 | Cymoxanil 8% + Mancozeb 64% · WP 72 · 150 جم/100 لتر ماء · PHI= | البياض الزغبى — مجموعة التكرار بحجم 2 | ×4 |
| grape-pests-08 | grape | 231,232,233,234,235 | Azoxystrobin 20% + Cyproconazole 8% · SC 28 · 300 سم³/فدان · PHI= | البياض الزغبى — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-08 | grape | 231,232,233,234,235 | Copper oxychloride 85% · WP 85 · 250 جم/100 لتر ماء · PHI= | البياض الزغبى — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-08 | grape | 231,232,233,234,235 | Dimethomorph 50% · WG 50 · 50 جم/100 لتر ماء · PHI= | البياض الزغبى — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-08 | grape | 231,232,233,234,235 | Captan 80% · WG 80 · 150 جم/100 لتر ماء · PHI= | البياض الزغبى — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-08 | grape | 231,232,233,234,235 | Azoxystrobin 80% · WG 80 · 16 جم/100 لتر ماء · PHI= | البياض الزغبى — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-08 | grape | 231,232,233,234,235 | Dimethomorph 12% + Pyraclostrobin 6.7% · WG 18.7 · 100 جم/100 لتر ماء · PHI= | البياض الزغبى — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-09 | grape | 236 | Oxamyl 24% · SL 24 · 5 لتر/فدان (رشتين) · PHI=60 | نيماتودا تعقد الجذور — مجموعة التكرار بحجم 3 | ×3 |
| grape-pests-09 | grape | 236 | Oxamyl 24% · SL 24 · 5 لتر/فدان (رشتين) · PHI= | نيماتودا تعقد الجذور — مجموعة التكرار بحجم 2 | ×2 |
| grape-pests-09 | grape | 236 | Fosthiazate 10% · GR 10 · 12.5 كجم/فدان · PHI=30 | نيماتودا تعقد الجذور — مجموعة التكرار بحجم 2 | ×2 |
| guava-pests-01 | guava | 241 | Mineral oil 80% · 80 · 2.5 لتر/100 لتر ماء (رش شتوي) · PHI=8 | الحشرة القشرية الرخوة (البولفيناريا) — مجموعة التكرار بحجم 2 | ×2 |
| guava-pests-03 | guava | 242 | Abamectin 5% · EC 5 · 40 سم³/100 لتر ماء · PHI=7 | حلم صدأ أوراق الجوافة — مجموعة التكرار بحجم 2 | ×2 |
| apple-pests-05 | apple | 248,249 | Spirodiclofen 24% · SC 24 · 30 سم³/100 لتر ماء · PHI=7 | العنكبوت الأحمر — مجموعة التكرار بحجم 3 | ×3 |
| apple-pests-05 | apple | 248,249 | Etoxazole 20% · SC 20 · 12.5 سم³/100 لتر ماء · PHI=12 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| apple-pests-06 | apple | 250,251 | Penconazole 10% · EC 10 · 25 سم³/100 لتر ماء · PHI=7 | البياض الدقيقي — مجموعة التكرار بحجم 2 | ×2 |
| apple-pests-06 | apple | 250,251 | Pyraclostrobin 50% · WG 50 · 50 جم/100 لتر ماء · PHI=7 | البياض الدقيقي — مجموعة التكرار بحجم 2 | ×2 |
| apple-pests-06 | apple | 250,251 | Propiconazole 25% · EC 25 · 15 سم³/100 لتر ماء · PHI=70 | البياض الدقيقي — مجموعة التكرار بحجم 2 | ×2 |
| apple-pests-07 | apple | 252,253 | Thiophanate-methyl 70% · WP 70 · 65 جم/100 لتر ماء · PHI=7 | الجرب — مجموعة التكرار بحجم 11 | ×11 |
| apple-pests-07 | apple | 252,253 | Thiophanate-methyl 70% · WP 70 · 65 جم/100 لتر ماء · PHI=14 | الجرب — مجموعة التكرار بحجم 3 | ×3 |
| apple-pests-07 | apple | 252,253 | Boscalid 25.2% + Pyraclostrobin 12.8% · WG 38 · 30 جم/100 لتر ماء · PHI=7 | الجرب — مجموعة التكرار بحجم 2 | ×2 |
| peach-pests-02 | peach | 256,257 | Chlorfenapyr 24% · SC 24 · 60 سم³/100 لتر ماء · PHI=15 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| peach-pests-02 | peach | 256,257 | Chlorfenapyr 36% · SC 36 · 40 سم³/100 لتر ماء · PHI=10 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| peach-pests-02 | peach | 256,257 | Spirodiclofen 24% · SC 24 · 30 سم³/100 لتر ماء · PHI=5 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| banana-pests-01 | banana | 261,262 | Oxamyl 24% · SL 24 · 15 سم³/جورة (مرتين) · PHI=7 | نيماتودا تعقد الجذور — مجموعة التكرار بحجم 4 | ×4 |
| banana-pests-01 | banana | 261,262 | Oxamyl 24% · SL 24 · 15 سم³/جورة (مرتين) · PHI=30 | نيماتودا تعقد الجذور — مجموعة التكرار بحجم 2 | ×2 |
| stored-products-pests-01 | stored-products | 263,264 | Aluminium phosphide 56% · Tab 56 · 3 أقراص/م³ · PHI= | حشرات الحبوب المخزونة — مجموعة التكرار بحجم 7 | ×7 |
| fields-orchards-pests-01 | fields-orchards | 265,266 | Zinc phosphide 80% · D 80 · 0.7 كجم/فدان · PHI= | الفئران — مجموعة التكرار بحجم 4 | ×4 |
| fields-orchards-pests-01 | fields-orchards | 265,266 | Bromadiolone 0.005% · 0.005 · 1.85 كجم/فدان · PHI= | الفئران — مجموعة التكرار بحجم 2 | ×2 |
| wheat-weeds-07 | wheat | 269,270 | Bromoxynil octanoate 24% · EC 24 · 1 لتر/فدان · PHI=90 | الحشائش الحولية عريضة الأوراق — مجموعة التكرار بحجم 2 | ×2 |
| wheat-weeds-07 | wheat | 269,270 | Bromoxynil octanoate 25% · EC 25 · 1 لتر/فدان · PHI=90 | الحشائش الحولية عريضة الأوراق — مجموعة التكرار بحجم 2 | ×2 |
| wheat-weeds-07 | wheat | 269,270 | Tribenuron-methyl 75% · WG 75 · 8 جم/فدان · PHI=120 | الحشائش الحولية عريضة الأوراق — مجموعة التكرار بحجم 2 | ×2 |
| wheat-weeds-07 | wheat | 269,270 | Florasulam 7.5% + Flumetsulam 10% · SC 17.5 · 30 سم³/فدان · PHI=90 | الحشائش الحولية عريضة الأوراق — مجموعة التكرار بحجم 2 | ×2 |
| wheat-weeds-07 | wheat | 269,270 | Dicamba 48% · SL 48 · 250 سم³/فدان · PHI=90 | الحشائش الحولية عريضة الأوراق — مجموعة التكرار بحجم 3 | ×3 |
| wheat-weeds-09 | wheat | 271,272,273 | Pinoxaden 5% · EC 5 · 500 سم³/فدان · PHI=90 | الحشائش الحولية النجيلية — مجموعة التكرار بحجم 3 | ×3 |
| wheat-weeds-09 | wheat | 271,272,273 | Clodinafop-propargyl 15% · WP 15 · 140 جم/فدان · PHI= | الحشائش الحولية النجيلية — مجموعة التكرار بحجم 3 | ×3 |
| wheat-weeds-09 | wheat | 271,272,273 | Clodinafop-propargyl 15% · WP 15 · 140 جم/فدان · PHI=90 | الحشائش الحولية النجيلية — مجموعة التكرار بحجم 3 | ×3 |
| wheat-weeds-09 | wheat | 271,272,273 | Clodinafop-propargyl 24% · EC 24 · 100 سم³/فدان · PHI=120 | الحشائش الحولية النجيلية — مجموعة التكرار بحجم 2 | ×2 |
| wheat-weeds-10 | wheat | 274,275 | Iodosulfuron-methyl 0.2% + Mesosulfuron-methyl 1% · OD 1.2 · 400 سم³/فدان · PHI=90 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 2 | ×2 |
| flax-weeds-01 | flax | 276 | Bentazone 48% · SL 48 · 500 سم³/فدان · PHI=100 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 2 | ×2 |
| onion-weeds-06 | onion | 277,278 | Oxyfluorfen 24% · EC 24 · 750 سم³/فدان · PHI=30 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 8 | ×8 |
| onion-weeds-06 | onion | 277,278 | Oxyfluorfen 24% · EC 24 · 750 سم³/فدان · PHI=60 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 6 | ×6 |
| onion-weeds-06 | onion | 277,278 | Oxyfluorfen 24% · EC 24 · 750 سم³/فدان · PHI=45 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 2 | ×2 |
| onion-weeds-06 | onion | 277,278 | Pendimethalin 33% · EC 33 · 2.5 لتر/فدان · PHI=30 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 2 | ×2 |
| onion-weeds-06 | onion | 277,278 | Pendimethalin 45% · CS 45 · 1.5 لتر/فدان · PHI=30 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 2 | ×2 |
| garlic-weeds-05 | garlic | 280,281 | Oxyfluorfen 24% · EC 24 · 750 سم³/فدان · PHI=100 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 2 | ×2 |
| sugar-beet-weeds-08 | sugar-beet | 284,285,286 | Desmedipham 7.1% + Ethofumesate 11.2% + Phenmedipham 9.1% · EC 27.4 · 1 لتر/فدان · PHI=90 | الحشائش الحولية عريضة الأوراق — مجموعة التكرار بحجم 4 | ×4 |
| sugar-beet-weeds-08 | sugar-beet | 284,285,286 | Desmedipham 7.1% + Ethofumesate 11.2% + Phenmedipham 9.1% · EC 27.4 · 1 لتر/فدان · PHI=60 | الحشائش الحولية عريضة الأوراق — مجموعة التكرار بحجم 2 | ×2 |
| sugar-beet-weeds-09 | sugar-beet | 286,287 | Clethodim 24% · EC 24 · 250 سم³/فدان · PHI=90 | الحشائش الحولية النجيلية — مجموعة التكرار بحجم 6 | ×6 |
| cotton-pests-03 | cotton | 32 | Acetamiprid 20% · SP 20 · 25 جم/100 لتر ماء · PHI=60 | المن — مجموعة التكرار بحجم 2 | ×2 |
| cotton-pests-04 | cotton | 33 | Bacillus thuringiensis 9.4% · WP 9.4 · 300 جم/فدان · PHI= | دودة ورق القطن (فقس حديث) — مجموعة التكرار بحجم 2 | ×2 |
| cotton-pests-05 | cotton | 33,34 | Indoxacarb 30% · WG 30 · 60 جم/فدان · PHI=60 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| cotton-pests-05 | cotton | 33,34 | Diflubenzuron 48% · SC 48 · 125 سم³/فدان · PHI=60 | دودة ورق القطن — مجموعة التكرار بحجم 2 | ×2 |
| cotton-pests-05 | cotton | 33,34 | Lufenuron 5% · EC 5 · 100 سم³/فدان · PHI=60 | دودة ورق القطن — مجموعة التكرار بحجم 4 | ×4 |
| cotton-pests-06 | cotton | 35,36,37 | Lambda-cyhalothrin 5% · EC 5 · 375 سم³/فدان · PHI=30 | ديدان اللوز — مجموعة التكرار بحجم 4 | ×4 |
| cotton-pests-06 | cotton | 35,36,37 | Alpha-cypermethrin 10% · EC 10 · 250 سم³/فدان · PHI= | ديدان اللوز — مجموعة التكرار بحجم 2 | ×2 |
| cotton-pests-07 | cotton | 38 | Chlorfenapyr 24% · SC 24 · 60 سم³/100 لتر ماء · PHI=90 | العنكبوت الأحمر — مجموعة التكرار بحجم 2 | ×2 |
| rice-pests-01 | rice | 41 | Ethoprophos 10% · GR 10 · 3 كجم/فدان · PHI=100 | الديدان الدموية (فى الأرز الشتل) — مجموعة التكرار بحجم 4 | ×4 |
| rice-pests-02 | rice | 42 | Isoprothiolane 40% · EC 40 · 400 سم³/فدان (رشتين) · PHI=30 | اللفحة — مجموعة التكرار بحجم 2 | ×2 |
| maize-pests-05 | maize | 48,49 | Fludioxonil 2.5% + Metalaxyl-M 1% · FS 3.5 · 1 سم³/كجم تقاوى · PHI=90 | اعفان الجذور وموت البادرات — مجموعة التكرار بحجم 3 | ×3 |
| maize-pests-05 | maize | 48,49 | Azoxystrobin 6.6% + Fludioxonil 1.1% + Metalaxyl-M 3.3% · FS 11 · 1.5 سم³/كجم تقاوى · PHI=90 | اعفان الجذور وموت البادرات — مجموعة التكرار بحجم 2 | ×2 |
| maize-pests-05 | maize | 48,49 | Tebuconazole 6% · FS 6 · 1 سم³/كجم تقاوى · PHI=90 | اعفان الجذور وموت البادرات — مجموعة التكرار بحجم 2 | ×2 |
| cotton-weeds-09 | cotton | 290 | Pendimethalin 50% · EC 50 · 1.7 لتر/فدان · PHI=90 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 2 | ×2 |
| rice-weeds-07 | rice | 293 | Thiobencarb 50% · EC 50 · 2 لتر/فدان · PHI=100 | حشائش الأرز الشتل (الدنيبة - أبو ركبة - العجيرة) — مجموعة التكرار بحجم 3 | ×3 |
| rice-weeds-09 | rice | 294,295,296 | Bentazone 48% · SL 48 · 1.5 لتر/فدان · PHI=100 | حشائش الأرز الشتل (العجيرة - السمار - السعد - عريضة الأوراق) — مجموعة التكرار بحجم 4 | ×4 |
| rice-weeds-09 | rice | 294,295,296 | Cyhalofop-butyl 10.5% + Bispyribac-sodium 2% + Penoxsulam 1.5% · OD 14 · 600 سم³/فدان · PHI=100 | حشائش الأرز الشتل (العجيرة - السمار - السعد - عريضة الأوراق) — مجموعة التكرار بحجم 2 | ×2 |
| rice-weeds-10 | rice | 296,297 | Bispyribac-sodium 2% · SL 2 · 800 سم³/فدان · PHI=100 | حشائش الأرز البدار (الدنيبة - أبو ركبة - العجيرة) — مجموعة التكرار بحجم 2 | ×2 |
| rice-weeds-12 | rice | 299 | Cyhalofop-butyl 10% · EC 10 · 1.2 لتر/فدان · PHI=100 | حشائش الأرز البدار (دنيبة - أبو ركبة) — مجموعة التكرار بحجم 2 | ×2 |
| rice-weeds-13 | rice | 300,301 | Halosulfuron-methyl 75% · WG 75 · 20 جم/فدان · PHI=100 | حشائش الأرز البدار (العجيرة - السمار - السعد - عريضة الأوراق) — مجموعة التكرار بحجم 2 | ×2 |
| rice-weeds-13 | rice | 300,301 | Bentazone 48% · SL 48 · 1.5 لتر/فدان · PHI=100 | حشائش الأرز البدار (العجيرة - السمار - السعد - عريضة الأوراق) — مجموعة التكرار بحجم 4 | ×4 |
| rice-weeds-13 | rice | 300,301 | Bentazone 48% · SL 48 · 1.5 لتر/فدان · PHI=110 | حشائش الأرز البدار (العجيرة - السمار - السعد - عريضة الأوراق) — مجموعة التكرار بحجم 2 | ×2 |
| rice-weeds-13 | rice | 300,301 | Cyhalofop-butyl 10.5% + Bispyribac-sodium 2% + Penoxsulam 1.5% · OD 14 · 750 سم³/ فدان · PHI=100 | حشائش الأرز البدار (العجيرة - السمار - السعد - عريضة الأوراق) — مجموعة التكرار بحجم 2 | ×2 |
| maize-weeds-06 | maize | 302 | Bentazone 48% · SL 48 · 750 سم³/فدان · PHI=90 | الحشائش عريضة الأوراق (الشبيط - الرجلة - أم اللبن - العليق) — مجموعة التكرار بحجم 2 | ×2 |
| maize-weeds-07 | maize | 303,304 | Nicosulfuron 75% · WG 75 · 50 جم/فدان · PHI=90 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 3 | ×3 |
| maize-weeds-07 | maize | 303,304 | Nicosulfuron 4% · OD 4 · 400 سم³/فدان · PHI=90 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 4 | ×4 |
| maize-weeds-07 | maize | 303,304 | S-metolachlor 31.25% + Terbuthylazine 18.75% · SC 50 · 2 لتر/فدان · PHI=90 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 2 | ×2 |
| maize-weeds-07 | maize | 303,304 | Nicosulfuron 6% · OD 6 · 400 سم³/فدان · PHI=90 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 2 | ×2 |
| maize-weeds-08 | maize | 305 | Halosulfuron-methyl 75% · WG 75 · 25 جم/فدان · PHI=90 | حشيشة السعد — مجموعة التكرار بحجم 2 | ×2 |
| peanut-weeds-07 | peanut | 310 | Clethodim 24% · EC 24 · 500 سم³/فدان · PHI=90 | الحشائش الحولية النجيلية — مجموعة التكرار بحجم 5 | ×5 |
| peanut-weeds-07 | peanut | 310 | Clethodim 15% + Haloxyfop-P-methyl 7.5% · EC 22.5 · 400 سم³/فدان · PHI=90 | الحشائش الحولية النجيلية — مجموعة التكرار بحجم 2 | ×2 |
| peanut-weeds-09 | peanut | 312 | Imazapic 24% · SL 24 · 100 سم³/فدان · PHI=90 | حشيشة السعد — مجموعة التكرار بحجم 4 | ×4 |
| tomato-weeds-19 | tomato | 317 | Pendimethalin 45% · CS 45 · 1.7 لتر/فدان · PHI=55 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 2 | ×2 |
| tomato-weeds-19 | tomato | 317 | Metribuzin 70% · WG 70 · 300 جم/فدان · PHI=45 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 2 | ×2 |
| potato-weeds-18 | potato | 319 | Metribuzin 70% · WP 70 · 300 جم/فدان · PHI=60 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 6 | ×6 |
| potato-weeds-18 | potato | 319 | Pendimethalin 45% · CS 45 · 1.5 لتر/فدان · PHI=60 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 2 | ×2 |
| potato-weeds-18 | potato | 319 | Metribuzin 48% · SC 48 · 450 سم³/فدان · PHI=60 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 2 | ×2 |
| potato-weeds-18 | potato | 319 | Metribuzin 60% · SC 60 · 350 سم³/فدان · PHI=60 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 2 | ×2 |
| potato-weeds-18 | potato | 319 | Metribuzin 70% · WG 70 · 300 جم/فدان · PHI=60 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 3 | ×3 |
| potato-weeds-20 | potato | 320,321 | Fluazifop-P-butyl 12.5% · EC 12.5 · 2 لتر/فدان · PHI=60 | الحشائش النجيلية الحولية والمعمرة — مجموعة التكرار بحجم 2 | ×2 |
| potato-weeds-22 | potato | 322 | Diquat dibromide 20% · SL 20 · 1.5 لتر/فدان · PHI=7 | تجفيف المجموع الخضرى للنبات — مجموعة التكرار بحجم 4 | ×4 |
| potato-weeds-23 | potato | 323 | Rimsulfuron 25% · WG 25 · 25 جم/فدان · PHI=60 | حشيشة السعد — مجموعة التكرار بحجم 3 | ×3 |
| pea-weeds-05 | pea | 325 | Flumetsulam 80% · WG 80 · 30 جم/فدان · PHI=50 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 2 | ×2 |
| cabbage-weeds-10 | cabbage | 332 | Clethodim 24% · EC 24 · 500 سم³/فدان · PHI=60 | الحشائش الحولية النجيلية — مجموعة التكرار بحجم 3 | ×3 |
| citrus-weeds-12 | citrus | 335,336,337,338 | Glyphosate isopropylammonium 48% · SL 48 · 2.5 لتر/فدان · PHI=15 | الحشائش الحولية والمعمرة — مجموعة التكرار بحجم 2 | ×2 |
| citrus-weeds-12 | citrus | 335,336,337,338 | Glyphosate isopropylammonium 48% · SL 48 · 2.5 لتر/فدان · PHI=30 | الحشائش الحولية والمعمرة — مجموعة التكرار بحجم 9 | ×9 |
| citrus-weeds-12 | citrus | 335,336,337,338 | Glyphosate isopropylammonium 48% · SL 48 · 2.5 لتر/فدان · PHI=10 | الحشائش الحولية والمعمرة — مجموعة التكرار بحجم 12 | ×12 |
| citrus-weeds-12 | citrus | 335,336,337,338 | Glyphosate isopropylammonium 48% · SL 48 · 2.5 لتر/فدان · PHI=20 | الحشائش الحولية والمعمرة — مجموعة التكرار بحجم 8 | ×8 |
| citrus-weeds-12 | citrus | 335,336,337,338 | Glufosinate ammonium 20% · SL 20 · 1.5 لتر/فدان · PHI=30 | الحشائش الحولية والمعمرة — مجموعة التكرار بحجم 5 | ×5 |
| citrus-weeds-12 | citrus | 335,336,337,338 | Glyphosate isopropylammonium 41% · SL 41 · 2.5 لتر/فدان · PHI=30 | الحشائش الحولية والمعمرة — مجموعة التكرار بحجم 3 | ×3 |
| citrus-weeds-12 | citrus | 335,336,337,338 | Glyphosate ammonium 20% · SL 20 · 1.5 لتر/فدان · PHI=30 | الحشائش الحولية والمعمرة — مجموعة التكرار بحجم 3 | ×3 |
| grape-weeds-10 | grape | 341 | Glyphosate isopropylammonium 48% · SL 48 · 2.5 لتر/فدان لتر/فدان · PHI=10 | الحشائش الحولية والمعمرة — مجموعة التكرار بحجم 7 | ×7 |
| grape-weeds-11 | grape | 342 | Glufosinate ammonium 20% · SL 20 · 1.5 لتر/فدان لتر/فدان · PHI=30 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 2 | ×2 |
| orchards-pome-stone-weeds-01 | orchards-pome-stone | 344,345 | Glyphosate isopropylammonium 48% · SL 48 · 2.5 لتر/فدان لتر/فدان · PHI=10 | الحشائش الحولية والمعمرة — مجموعة التكرار بحجم 8 | ×8 |
| orchards-pome-stone-weeds-01 | orchards-pome-stone | 344,345 | Glyphosate isopropylammonium 48% · SL 48 · 2.5 لتر/فدان لتر/فدان · PHI=30 | الحشائش الحولية والمعمرة — مجموعة التكرار بحجم 5 | ×5 |
| orchards-pome-stone-weeds-02 | orchards-pome-stone | 346 | Oxyfluorfen 24% · EC 24 · 1 لتر/فدان لتر/فدان · PHI=30 | الحشائش الحولية عريضة الأوراق والنجيلية — مجموعة التكرار بحجم 2 | ×2 |

عدد المجموعات: **381** · عدد الصفوف في CSV: 1137.

### 12. بطاقات فصل الحشائش بلا مقابل في التطبيق — 80 صفاً

**المصدر الداعم:** الحزمة (extracted/data/crops/*.json) + تقرير schema-compatibility.md §1 · **الإجراء المطلوب من المالك:** قرار: بناء بطاقات الحشائش في التطبيق أو استثناء الفصل صراحةً

| معرف البطاقة | المحصول | صفحات المصدر | الحقل | القيمة الأصلية | وصف المشكلة |
|---|---|---|---|---|---|
| barley-weeds-01 | barley | 275 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| cabbage-weeds-10 | cabbage | 332 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية النجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| cabbage-weeds-11 | cabbage | 333 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| canal-banks-drains-weeds-01 | canal-banks-drains | 350 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية والمعمرة | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| carrot-weeds-04 | carrot | 334 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| chickpea-weeds-01 | chickpea | 288 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| citrus-weeds-12 | citrus | 335 + 336 + 337 + 338 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية والمعمرة | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| citrus-weeds-13 | citrus | 338 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| citrus-weeds-14 | citrus | 339 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش النجيلية الحولية والمعمرة ماعدا (الحجنه - الحلفا - الغاب) | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| citrus-weeds-15 | citrus | 340 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| cotton-weeds-09 | cotton | 290 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| cotton-weeds-10 | cotton | 291 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية النجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| cowpea-weeds-05 | cowpea | 328 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| eggplant-weeds-03 | eggplant | 330 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية النجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| eggplant-weeds-04 | eggplant | 331 | بطاقة فصل الحشائش بلا مقابل في التطبيق | حشيشة السعد | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| egyptian-clover-weeds-02 | egyptian-clover | 289 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| faba-bean-weeds-04 | faba-bean | 277 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية النجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| flax-weeds-01 | flax | 276 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| garlic-weeds-05 | garlic | 280 + 281 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| garlic-weeds-06 | garlic | 281 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| garlic-weeds-07 | garlic | 282 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية النجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| grape-weeds-10 | grape | 341 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية والمعمرة | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| grape-weeds-11 | grape | 342 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| grape-weeds-12 | grape | 343 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش النجيلية الحولية والمعمرة ماعدا (الحجنه - الحلفا - الغاب) | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| maize-weeds-06 | maize | 302 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش عريضة الأوراق (الشبيط - الرجلة - أم اللبن - العليق) | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| maize-weeds-07 | maize | 303 + 304 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| maize-weeds-08 | maize | 305 | بطاقة فصل الحشائش بلا مقابل في التطبيق | حشيشة السعد | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| maize-weeds-09 | maize | 305 + 306 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الاوراق | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| onion-weeds-06 | onion | 277 + 278 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| onion-weeds-07 | onion | 279 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| onion-weeds-08 | onion | 279 + 280 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية النجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| orchards-pome-stone-weeds-01 | orchards-pome-stone | 344 + 345 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية والمعمرة | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| orchards-pome-stone-weeds-02 | orchards-pome-stone | 346 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| orchards-pome-stone-weeds-03 | orchards-pome-stone | 347 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| orchards-pome-stone-weeds-04 | orchards-pome-stone | 348 | بطاقة فصل الحشائش بلا مقابل في التطبيق | حشيشة السعد | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| orchards-pome-stone-weeds-05 | orchards-pome-stone | 349 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش النجيلية الحولية والمعمرة ماعدا (الحجنه - الحلفا - الغاب) | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| pea-weeds-05 | pea | 325 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| pea-weeds-06 | pea | 326 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| peanut-weeds-06 | peanut | 309 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| peanut-weeds-07 | peanut | 310 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية النجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| peanut-weeds-08 | peanut | 311 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| peanut-weeds-09 | peanut | 312 | بطاقة فصل الحشائش بلا مقابل في التطبيق | حشيشة السعد | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| peanut-weeds-10 | peanut | 313 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش النجيلية الحولية والمعمرة | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| potato-weeds-18 | potato | 319 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| potato-weeds-19 | potato | 320 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| potato-weeds-20 | potato | 320 + 321 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش النجيلية الحولية والمعمرة | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| potato-weeds-21 | potato | 321 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية النجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| potato-weeds-22 | potato | 322 | بطاقة فصل الحشائش بلا مقابل في التطبيق | تجفيف المجموع الخضرى للنبات | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| potato-weeds-23 | potato | 323 | بطاقة فصل الحشائش بلا مقابل في التطبيق | حشيشة السعد | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| potato-weeds-24 | potato | 323 + 324 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| potato-weeds-25 | potato | 324 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية النجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| rice-weeds-06 | rice | 292 | بطاقة فصل الحشائش بلا مقابل في التطبيق | حشائش مشاتل الأرز (الدنيبة - أبو ركبة - العجيرة) | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| rice-weeds-07 | rice | 293 | بطاقة فصل الحشائش بلا مقابل في التطبيق | حشائش الأرز الشتل (الدنيبة - أبو ركبة - العجيرة) | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| rice-weeds-08 | rice | 294 | بطاقة فصل الحشائش بلا مقابل في التطبيق | حشائش الأرز الشتل (دنيبة - أبو ركبة) | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| rice-weeds-09 | rice | 294 + 295 + 296 | بطاقة فصل الحشائش بلا مقابل في التطبيق | حشائش الأرز الشتل (العجيرة - السمار - السعد - عريضة الأوراق) | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| rice-weeds-10 | rice | 296 + 297 | بطاقة فصل الحشائش بلا مقابل في التطبيق | حشائش الأرز البدار (الدنيبة - أبو ركبة - العجيرة) | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| rice-weeds-11 | rice | 298 | بطاقة فصل الحشائش بلا مقابل في التطبيق | حشائش الأرز البدار (دنيبة - ابو ركبة - عجيرة - عريضة الاوراق) | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| rice-weeds-12 | rice | 299 | بطاقة فصل الحشائش بلا مقابل في التطبيق | حشائش الأرز البدار (دنيبة - أبو ركبة) | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| rice-weeds-13 | rice | 300 + 301 | بطاقة فصل الحشائش بلا مقابل في التطبيق | حشائش الأرز البدار (العجيرة - السمار - السعد - عريضة الأوراق) | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| seed-watermelon-weeds-08 | seed-watermelon | 329 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| snap-bean-weeds-07 | snap-bean | 327 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش النجيلية الحولية والمعمرة ماعدا (الحجنه - الحلفا - الفاب) | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| snap-bean-weeds-08 | snap-bean | 327 + 328 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| soybean-weeds-02 | soybean | 314 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| sugar-beet-weeds-07 | sugar-beet | 283 + 284 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| sugar-beet-weeds-08 | sugar-beet | 284 + 285 + 286 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| sugar-beet-weeds-09 | sugar-beet | 286 + 287 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية النجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| sugarcane-weeds-05 | sugarcane | 307 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش عريضة الأوراق (الشبيط - الرجلة - أم اللبن - العليق) | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| sugarcane-weeds-06 | sugarcane | 308 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| sunflower-weeds-03 | sunflower | 291 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| tomato-weeds-17 | tomato | 315 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| tomato-weeds-18 | tomato | 316 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية النجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| tomato-weeds-19 | tomato | 317 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| tomato-weeds-20 | tomato | 318 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش النجيلية الحولية والمعمرة | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| tomato-weeds-21 | tomato | 318 | بطاقة فصل الحشائش بلا مقابل في التطبيق | السعد | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| turf-weeds-03 | turf | 349 + 350 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية الصيفية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| wheat-weeds-07 | wheat | 269 + 270 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| wheat-weeds-08 | wheat | 271 | بطاقة فصل الحشائش بلا مقابل في التطبيق | حشيشة الصامة | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| wheat-weeds-09 | wheat | 271 + 272 + 273 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية النجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| wheat-weeds-10 | wheat | 274 + 275 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |
| yellow-maize-weeds-01 | yellow-maize | 306 | بطاقة فصل الحشائش بلا مقابل في التطبيق | الحشائش الحولية عريضة الأوراق والنجيلية | التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق |

### 13. تقاطعات معرّفات المحاصيل المرفوضة ظاهرياً — 8 صفاً

**المصدر الداعم:** تقرير schema-compatibility.md §4 · **الإجراء المطلوب من المالك:** حسم: هل يقابل التطبيق المحصول فعلاً أم تقاطع صدفة من صفحة واحدة

| معرف البطاقة | المحصول | صفحات المصدر | الحقل | القيمة الأصلية | وصف المشكلة |
|---|---|---|---|---|---|
| — | alfalfa ↔ egyptian-clover |  | تقاطع معرّف محصول مرفوض ظاهرياً | alfalfa (تطبيق) ↔ egyptian-clover (حزمة) | تطابق صفحة واحدة فقط وبأسماء غير متوافقة ظاهرياً — تقاطع صدفة محتمل |
| — | sykes_palm ↔ date-palm |  | تقاطع معرّف محصول مرفوض ظاهرياً | sykes_palm (تطبيق) ↔ date-palm (حزمة) | تطابق صفحة واحدة فقط وبأسماء غير متوافقة ظاهرياً — تقاطع صدفة محتمل |
| — | sorghum ↔ maize |  | تقاطع معرّف محصول مرفوض ظاهرياً | sorghum (تطبيق) ↔ maize (حزمة) | تطابق صفحة واحدة فقط وبأسماء غير متوافقة ظاهرياً — تقاطع صدفة محتمل |
| — | banana ↔ apricot |  | تقاطع معرّف محصول مرفوض ظاهرياً | banana (تطبيق) ↔ apricot (حزمة) | تطابق صفحة واحدة فقط وبأسماء غير متوافقة ظاهرياً — تقاطع صدفة محتمل |
| — | open_fields ↔ buildings |  | تقاطع معرّف محصول مرفوض ظاهرياً | open_fields (تطبيق) ↔ buildings (حزمة) | تطابق صفحة واحدة فقط وبأسماء غير متوافقة ظاهرياً — تقاطع صدفة محتمل |
| — | leafbeet ↔ carrot |  | تقاطع معرّف محصول مرفوض ظاهرياً | leafbeet (تطبيق) ↔ carrot (حزمة) | تطابق صفحة واحدة فقط وبأسماء غير متوافقة ظاهرياً — تقاطع صدفة محتمل |
| — | snails ↔ fields-orchards |  | تقاطع معرّف محصول مرفوض ظاهرياً | snails (تطبيق) ↔ fields-orchards (حزمة) | تطابق صفحة واحدة فقط وبأسماء غير متوافقة ظاهرياً — تقاطع صدفة محتمل |
| — | koosa_labb ↔ pumpkin |  | تقاطع معرّف محصول مرفوض ظاهرياً | koosa_labb (تطبيق) ↔ pumpkin (حزمة) | تطابق صفحة واحدة فقط وبأسماء غير متوافقة ظاهرياً — تقاطع صدفة محتمل |

### 14. محاصيل الحزمة بلا معرّف مقابل في التطبيق — 13 صفاً

**المصدر الداعم:** تقرير schema-compatibility.md §4 · **الإجراء المطلوب من المالك:** قرار: إضافة المحصول للتطبيق أو استثناؤه

| معرف البطاقة | المحصول | صفحات المصدر | الحقل | القيمة الأصلية | وصف المشكلة |
|---|---|---|---|---|---|
| — | barley |  | محصول الحزمة بلا معرّف مقابل في التطبيق | barley | محصول موجود في الحزمة ولا يقابله معرّف في data/twsmanifest الحالي |
| — | chickpea |  | محصول الحزمة بلا معرّف مقابل في التطبيق | chickpea | محصول موجود في الحزمة ولا يقابله معرّف في data/twsmanifest الحالي |
| — | flax |  | محصول الحزمة بلا معرّف مقابل في التطبيق | flax | محصول موجود في الحزمة ولا يقابله معرّف في data/twsmanifest الحالي |
| — | turnip |  | محصول الحزمة بلا معرّف مقابل في التطبيق | turnip | محصول موجود في الحزمة ولا يقابله معرّف في data/twsmanifest الحالي |
| — | sweet-potato |  | محصول الحزمة بلا معرّف مقابل في التطبيق | sweet-potato | محصول موجود في الحزمة ولا يقابله معرّف في data/twsmanifest الحالي |
| — | citrus-orange |  | محصول الحزمة بلا معرّف مقابل في التطبيق | citrus-orange | محصول موجود في الحزمة ولا يقابله معرّف في data/twsmanifest الحالي |
| — | seed-squash |  | محصول الحزمة بلا معرّف مقابل في التطبيق | seed-squash | محصول موجود في الحزمة ولا يقابله معرّف في data/twsmanifest الحالي |
| — | yellow-maize |  | محصول الحزمة بلا معرّف مقابل في التطبيق | yellow-maize | محصول موجود في الحزمة ولا يقابله معرّف في data/twsmanifest الحالي |
| — | orchards-pome-stone |  | محصول الحزمة بلا معرّف مقابل في التطبيق | orchards-pome-stone | محصول موجود في الحزمة ولا يقابله معرّف في data/twsmanifest الحالي |
| — | canal-banks-drains |  | محصول الحزمة بلا معرّف مقابل في التطبيق | canal-banks-drains | محصول موجود في الحزمة ولا يقابله معرّف في data/twsmanifest الحالي |
| — | snails |  | محصول الحزمة بلا معرّف مقابل في التطبيق | snails | محصول موجود في الحزمة ولا يقابله معرّف في data/twsmanifest الحالي |
| — | sykes-palm |  | محصول الحزمة بلا معرّف مقابل في التطبيق | sykes-palm | محصول موجود في الحزمة ولا يقابله معرّف في data/twsmanifest الحالي |
| — | banana |  | محصول الحزمة بلا معرّف مقابل في التطبيق | banana | محصول موجود في الحزمة ولا يقابله معرّف في data/twsmanifest الحالي |

## و. المصادر والمنهج

### ما فُتح فعلاً وتحققت منه (كله بتاريخ 2026-10-28)

| المصدر | ماذا فُتح | ما تحقق منه |
|---|---|---|
| PPDB — Aeru، جامعة هيرتفوردشاير | فهرس البحث (3207 مدخلاً) + **253 صفحة مادة مفتوحة فعلياً** | نُقل عمودا CAS RN وCAS name من كل صفحة كما يظهران؛ رابط كل صفحة في CSV |
| PubChem (NIH/NLM) — PUG REST | ~343 استعلام «اسم ← قائمة RN» لـ273 مادة · 16 استعلام «رقم ← Title/IUPAC» للحالات المتعارضة والمرشحة · 5 استعلام autocomplete للأسماء الناقصة | هوية كل رقم متعارض (فصل حمض/ملح/شكل) وقائمة الأرقام المرتبطة بالاسم |
| الحزمة الداخلية | actives.json · audit_data.json · nv-01..nv-06 · recommendations_audit.xlsx · audit_report.html | الحالة قبل التحقق؛ أعداد المصدر 338/3482/2033 لم تتغير |

### ما تعذر فتحه — ولم يُعتمد منه أي قيمة

- **CAS Registry / CAS Common Chemistry (واجهة API):** أعادت 401 Unauthorized مع محاولة مكررة بترويسات متصفح (2026-10-28) ⇒ **صفر أرقام من مصدر أولي**، معلن في الملخص لا مخفي.
- **EPA (api-ccte / CompTox / PPLS):** 503 أو واجهات تفاعلية بلا مسار آلي موثوق ⇒ لم يُفتح سجل مادة حكومي فعلي.
- **قاعدة مبيدات الاتحاد الأوروبي:** واجهة تفاعلية (SPA) بلا API ظاهر ⇒ فحص كل مادة يلزم فتحها يدوياً — لم يُنفَّذ ولا يُدّعى.
- **PubChem بلا سجل لبعض الأسماء** (خالط/زيوت/بوليمرات): سُجِّل «بلا نتيجة في المصادر التي فُحصت» — وليس «بلا CAS».

### المنهج — قواعد طُبِّقت فعلياً

1. مطابقة الاسم ثلاثي الطبقة: عنوان PPDB ← مرادف/هجئة ← رقم داخل كلمات الفهرس؛ ثم **فتح الصفحة نفسها** لا اقتباس محرّك بحث.
2. تثبيت كل رقم مرتين حيث أمكن: صفحة PPDB + قائمة RN في PubChem؛ وحين يغيب أحدهما يُوثَّق سبب الغياب في CSV.
3. للحالات المتعارضة: استعلام «بالرقم» في PubChem لمعرفة هوية الرقم نفسه — به انفصل الحمض عن الفعل البنزيلي في Florpyrauxifen، وانكشفت أرقام RRN المزدوجة.
4. صحة خانة check digit شرط لازم لا كافٍ — ولم تُستخدم كدليل إسناد في أي صف.
5. رمز NO_CAS_ASSIGNED لم يُستخدم إطلاقاً: لا دليل صريح على عدم تعيين رقم لأي مادة من المصادر المفتوحة.
6. صفر حذف أو دمج صفوف؛ صفر تعديل على بيانات التطبيق أو الإنتاج؛ لا خلط لبيانات الكتاب المصري بقراري ليبيا 248/2024 و500/2026 أو قواعد EU/US.
7. PPDB وPubChem مصدرا تعريف للهوية ورقم CAS فقط — لا يُقرأ منهما أي ادعاء بتسجيل المبيد في ليبيا أو مصر أو الاتحاد أو أمريكا.

### الحقائق المنقولة مقابل استنتاجات الوكيل

- **حقائق منقولة من المصادر:** أرقام CAS وعمود CAS name من الصفحات المفتحة، وقوائم RN وعنوان الكيان من PubChem، وأعداد وأسماء الحزمة من ملفاتها.
- **استنتاجات الوكيل (تحت إقراركم):** تصنيف كل مادة إلى (مثبت/مرشح/تعارض/بلا دليل)، ووصف سبب عدم الحسم في (ج)، وقائمة الحيوي المحتمل في (د)، وجدول تقاطعات المحاصيل في (هـ/13).

### الاختبارات الفعلية (بيئة معزولة — شجرة المراجعة)

| الأمر | النتيجة الفعلية |
|---|---|
| node data/apc2025_review/scripts/verify-package.mjs | EXIT=0 · **ALL PASS (22/22)** |
| bun run test:static | EXIT=0 · **423 PASS · 0 FAIL** (منها ADVICE-TEST: 35 PASS / 0 FAIL) |
| node scripts/verify-cas.mjs | EXIT=0 · 273/273 مادة · 253 صفحة PPDB مطابقة · يتجاوز المحفوظ في الكاش (قابل للاستئناف) |
| node scripts/make-owner-review.mjs ثم node scripts/make-owner-report.mjs | EXIT=0 · توليد قابل للتكرار من مدخلات ثابتة بلا تغيير في extracted/ |

**لم يُشغَّل** أي سكربت تحويل داخل extracted/ ولا أي نشر؛ ولم تُمس إعدادات Cloudflare أو فرع الإنتاج.

---

**ملفات التسليم:** reports/owner-review-report-ar.md (هذا التقرير) · reports/owner-review-cas.csv (273 صف) · reports/owner-review-missing-fields.csv (2104 صف) · reports/owner-review-biologicals.csv (18 صف) — الثلاثة UTF-8 مع BOM لعرض العربية في Excel.
