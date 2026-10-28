# تقرير مقارنة المخطط — حزمة APC 2025 مقابل مخطط التطبيق الفعلي

المرجعان: الحزمة `data/apc2025_review/extracted/data/crops/*.json` (schema_version=2) ·
التطبيق `data/tws/{manifest,crops,sections,labels}.json` (schema=2، بناء 2026-10-25) على فرع الفرع المقارن `work-branch` (1.19.31) — وهو سلف فرع المراجعة.
**لم يُغيَّر أي مخطط في هذه الجولة.**

## 1) الحجم العام

| البعد | الحزمة | التطبيق | ملاحظة |
|---|---|---|---|
| محاصيل (crop_id) | 68 | 60 | مخططتَي تسمية مختلفتان — جدول §4 |
| بطاقات | 338 (258 آفات + 80 حشائش) | 258 (فصل الآفات فقط) | التطبيق لا يغطي فصل الحشائش إطلاقاً |
| توصيات مجمّعة | 2033 | — (التطبيق يخزّن «منتجات» مسطّحة) | تجميع الحزمة تجميع صفوف لا حذف |
| صفوف/خيارات | 3482 | 2993 منتجاً | مجموعتان غير متكافئتين بنيوياً (انظر §3) |
| مواد فعالة | 273 (فهرس مستقل) | مدمجة في كل منتج + مصادر مطابقة | |

التحقق: **كل بطاقة تطبيق (258/258) لها بطاقة حزمة على نفس صفحة الطباعة**، وكل صفحة PDF = مطبوع + 13 في الطرفين.

## 2) تطابق حقول البطاقة (حقل بحقل)

| حقل الحزمة | حقل التطبيق | الحالة |
|---|---|---|
| `crop_id` | `crop_id` | ✅ الاسم مختلف في 18+26 حالة (§4) |
| `pest_name_ar` | `name_ar` | ⚠️ متطابق معنوياً في 209/258 فقط — 49 بطاقة تختلف في الهجاء (§5) |
| `pest_group_ar` | `group` | ⚠️ موجود في الطرفين؛ التطبيق يحوي أخطاء استخراج مثل «احلشرات» والحزمة «الحشرات» |
| `pest_type` | `type` | ⚠️ **مفردتان مختلفتان**: الحزمة `fungal/bacterial/rodent/snail/weed` · التطبيق `fungus` ولا يعرف `bacterial/rodent/snail/weed` |
| `printed_pages[]` | `printed_page` + `pages[]` + `page` | ✅ فرق: الحزمة مصفوفة صفحات، التطبيق مفرد + اشتقاق PDF |
| `appearance_ar` (مظهر الإصابة) | `symptom[]` | ✅ محتوى مطابق — **لكن الأسماء مزاحة** (انظر §3) |
| `onset_ar` (ميعاد الظهور) | `appearance` | ⚠️ حقل التطبيق «appearance» يحمل ميعاد الظهور فعلياً |
| `control_timing_ar` (توقيت المكافحة) | `timing` | ⚠️ اسم مختلف للمعنى نفسه |
| `guidance_ar` | `guidance` | ✅ |
| `part` (pests/weeds) | — | ❌ لا مقابل في التطبيق (فصل الحشائش خارج نطاقه) |
| `uncertain` + `notes` | `notes[]` + `_verify` | ⚠️ نظامَي وسم مختلفان؛ التطبيق يوثّق الإسناد، والحزمة توثّق عدم اليقين |
| `footnotes` / `extra_sections` / `examples_ar` | — | ❌ غائبة في التطبيق |
| `tables[].recommendations[].actives[{name_en,pct,cas,name_as_printed}]` | `products[].اسم المادة الفعالة` (نص مركّب) + `مكونات فعالة[]` | ⚠️ الحزمة تفصل المادة/النسبة/التركيبة؛ التطبيق يدمجها في سطر واحد ثم يفكّكه |
| `formulation_type` + `formulation_total_pct` | مُستمدة من عمود الاسم التجاري داخل `_verify.harvest` | ⚠️ الحزمة حقول صريحة؛ التطبيق يستخرجها ضمن نص |
| `options[].rate_text_ar` + `rate_parts[]` | `معدل الاستخدام` (نص «جم / فدان 80» بترتيب معكوس) | ⚠️ الحزمة منظّمة (قيمة/وحدة/مقسوم/ملاحظة/نطاق)؛ التطبيق نص فقط |
| `options[].phi_days` (عدد) + `phi_conservative` | `فترة الأمان` (نص) | ⚠️ نوع مختلف + الحزمة تحتفظ بالقيم المتعددة للمجموعة |
| `options[].mrl[{cas,epa,eu,codex}]` | `قيم MRL {EPA,EU,Codex}` نصوص بـ«-» | ⚠️ مصفوفة لكل مادة مقابل كائن واحد |
| `options[].who_class` | `تصنيف WHO` | ⚠️ الحزمة **موحّدة** إلى `FM,High Ib,Low III,Mod II,U` · التطبيق يحوي قيم ملوّثة بترويسات (`الآفات`,`الفطر`,`عشوائيا .`…) وصيغاً مختلطة (`Mod ll`,`Med II`,`High lb`) — **خلل في التطبيق لا في الحزمة** |
| `id` (`<crop>-<part>-NN`) + `source_order` | `crop_id`+`n` (رقم تسلسلي داخل المحصول) | ⚠️ مخططتا معرّف مختلفتان |
| — | `images[]` (256 صورة webp) | ❌ الحزمة بلا صور (README: الصور لم تُعالج) |
| — | `crop_evidence` / `name_status` / `name_fix` / `text_fix` / `timing_fix` / `_verify` | ❌ الحزمة بلا طبقة إسناد مكانية |
| — | حقول الترجمة `tws.card.*` + `labels.json` | ❌ الحزمة بلا أي حقل ترجمة (§6) |

## 3) ملاحظتان بنيويتان تستحقان قراراً

1. **إزاحة أسماء الحقول:** في التطبيق `symptom`=مظهر الإصابة، `appearance`=ميعاد الظهور، `timing`=توقيت المكافحة؛ وفي الحزمة `appearance_ar`=المظهر، `onset_ar`=الميعاد، `control_timing_ar`=التوقيت. أي ربط مستقبلي يجب أن يُبنى على **المعنى لا على تطابق الأسماء**، وإلا انقلبت الحقول الثلاثة.
2. **المجموعتان العدّيتان غير متكافئتين:** 3482 خياراً في الحزمة (صفوف جدول الكتاب) مقابل 2993 منتجاً في التطبيق (منتجات مجمّعة بعد دمج مُطبَّق في جولة سابقة). المطابقة الحقيقية على مستوى «صف المصدر» لا على مستوى «المنتج المعروض».

## 4) تقابل معرّفات المحاصيل (مرشحات للمراجعة — ليست اعتماداً)

مقترح آلي من تقاطع صفحات الطباعة؛ **يحتاج تأكيداً بشرياً**، و8 صفوف منه مرفوضة ظاهرياً كتقاطع صدفة (مُعلَّمة ⚠):

| تطبيق | الحزمة | صفحات مشتركة | | تطبيق | الحزمة | صفحات مشتركة |
|---|---|---|---|---|---|---|
| wheat | wheat | 4/4 | | protected | protected-crops | 2/2 |
| fieldbean | faba-bean | 2/2 | | green_areas | turf | 2/2 |
| onion | onion | 5/5 | | citrus | citrus | 9/10 |
| garlic | garlic | 3/3 | | mango | mango | 5/5 |
| sugarbeet | sugar-beet | 6/6 | | grape | grape | 8/8 |
| alfalfa | egyptian-clover | 1/1 ⚠ | | dates | date-palm | 1/1 |
| cotton | cotton | 6/6 | | sykes_palm | date-palm | 1/1 ⚠ |
| roselle | roselle | 1/1 | | olive | olive | 2/2 |
| rice | rice | 4/4 | | guava | guava | 3/3 |
| sorghum | maize | 3/3 ⚠ | | pomegranate | pomegranate | 2/2 |
| sugarcane | sugarcane | 4/4 | | apple | apple | 6/6 |
| groundnut | peanut | 3/3 | | pear | pear | 3/3 |
| sesame | sesame | 2/2 | | peach | peach | 5/5 |
| sunflower | sunflower | 1/1 | | apricot | apricot | 1/1 |
| soybean | soybean | 1/1 | | banana | apricot | 1/1 ⚠ |
| tomato | tomato | 14/14 | | stored_crops | stored-products | 2/2 |
| potato | potato | 14/17 | | buildings | buildings | 1/1 |
| carrot | carrot | 2/2 | | open_fields | buildings | 1/1 ⚠ |
| leafbeet | carrot | 1/1 ⚠ | | snails | fields-orchards | 1/1 ⚠ |
| pepper | pepper | 5/5 | | bean | snap-bean | 5/5 |
| eggplant | eggplant | 2/2 | | cowpea | cowpea | 3/3 |
| cucumber | cucumber | 9/9 | | pea | pea | 3/3 |
| koosa | squash | 2/2 | | okra | okra | 5/5 |
| pumpkin | pumpkin | 1/1 | | cabbage | cabbage | 5/5 |
| koosa_labb | pumpkin | 1/1 ⚠ | | broccoli | broccoli | 1/1 |
| watermelon | watermelon | 4/4 | | cauliflower | cauliflower | 3/3 |
| melo_labb | seed-watermelon | 4/4 | | artichoke | artichoke | 1/1 |
| melon | shammam | 2/2 | | lettuce | lettuce | 1/1 |
| cantaloupe | cantaloupe | 6/6 | | spinach | spinach | 1/1 |
| shahd | honeydew | 2/2 | | strawberry | strawberry | 5/5 |

⚠ = تقابل من صفحة واحدة فقط وبأسماء/محاصيل غير متوافقة ظاهرياً — **للمراجعة البشرية لا للاعتماد**.

**13 محصولاً في الحزمة بلا مقابل في التطبيق:** barley, chickpea, flax, turnip, sweet-potato, citrus-orange, seed-squash, yellow-maize, orchards-pome-stone, canal-banks-drains, snails, sykes-palm, banana(+صغير الملحق السابع).

## 5) فروق الأسماء على نفس الصفحة (49 بطاقة)

التطبيق يحوي أسماءً مشوّهة من الاستخراج المبكر، والحزمة تحمل صيغة القراءة النظيفة، مثل:
`الرتبس/التربس` · `العنكبوت الحمر/العنكبوت الاحمر` · `البياض الدقيقى/البياض الدقيق` · `مرضض اجلذر القرنفلى/مرض الجذر القرنفلى` · `امراض الرتبة/أمراض التربة` · `الذبول الفيوزاريومي/الذبول الفيزاريومي`.
**لا تُغيَّر بيانات التطبيق في هذه المهمة** — مسجَّلة للمراجعة فقط (`nv-05-spelling-review.csv` = 170 صفاً على مستوى الحزمة).

## 6) الترجمة (حقول تبديل اللغة)

- الحزمة: **صفر حقول ترجمة** — نص عربي + أسماء مادة لاتينية فقط (أكدها فحص [5] في `scripts/verify-package.mjs`).
- التطبيق: `labels.json` (ar/en) لسمات الواجهة + `src/i18n.js` (ar/en/fr/zh) + مفاتيح محتوى البطاقة `tws.card.<crop>/<type>.<n>.<field>` **غير موجودة على هذا الفرع** — توجد على `experimental-v2-2026-10-25` فقط (`tws.content_ar_fallback` = 4 مرات هناك، صفر هنا).
- معرّف بطاقات الحزمة `<crop>-<part>-NN` يختلف عن مفتاح الترجمة `<crop>/<type>/<n>` — أي دمج مستقبلي يحتاج جدول تقابل معرّفات أولاً.
- **لم تُخلط أي تغييرات ترجمة مع هذه المهمة** (قيد §7 من طلب العمل).

## 7) الحكم

الحزمة **قابلة للربط** مع التطبيق لكن غير **مطابقة** له: 12 حقل حزمة بلا مقابل، و9 حقول تطبيق بلا مقابل، ومزاحة أسماء في ثلاثة حقول، ومفردتا نوع وWHO مختلفتان، ومخططتا معرّف مختلفتان. التبعية الأكبر لقرار بشري: هوية `sorghum↔maize` و`alfalfa↔egyptian-clover` ونظائر الصف الواحد في §4، وفصل الحشائش (80 بطاقة) الذي يحتاج بطاقات جديدة في التطبيق. **لا تُعدَّل واجهة التطبيق أو مخططه لمجرد تسهيل الاستيراد.**
