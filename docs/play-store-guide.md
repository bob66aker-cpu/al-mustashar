# دليل متجر Play — خطوات يدوية (لا تقديم فعلي)

> هذا **دليل للمالك**، لا عمل منجَّز. لا حساب فُتح، ولا ملف رُفع، ولا تطبيق قدُّم.
> كل خطوة هنا ينفّذها المالك بنفسه من حسابه هو. التطبيق الآن **PWA على رابط
> `https://al-mustashar.pages.dev`** بلا خطوة بناء بقرار المالك، فالتغليف يتم
> بـ**Trusted Web Activity (TWA)** لا بتطبيق أصلي.

## 0) ما تم التحقق منه وما لم يُتحقق

| البند | ما تقوله الوثيقة الرسمية | تاريخ التحقق |
|---|---|---|
| رسم تسجيل حساب المطوّر | `US$25` لمرة واحدة | **2026-09-30** (صفحة «Get started with Play Console») |
| السن الأدنى | 18 سنة على الأقل | 2026-09-30 |
| نوعا الحساب | شخصي أو مؤسسي، والمتطلبات تختلف بينهما | 2026-09-30 |
| البطاقات المقبولة | Mastercard · Visa · American Express · Discover (الولايات المتحدة فقط) · Visa Electron (خارجها). **البطاقات المسبقة الدفع غير مقبولة** | 2026-09-30 |
| متطلبات الحساب الشخصي | حسابات شخصية أُنشئت بعد **2023-11-13** عليها شروط اختبار، والتحقق من إتاحة جهاز أندرويد عبر تطبيق Play Console للجوال | 2026-09-30 |
| الهوية | قد يُطلب **بطاقة هوية حكومية وبطاقة ائتمان** بالاسم القانوني نفسه، و**الرسوم لا تُسترد** إن رُفضت البيانات | 2026-09-30 |

**مصدر التحقق:** صفحة مساعدة Google Play الرسمية `Get started with Play Console`
(استُرجعت في تاريخ التحقق أعلاه). **قبل أي خطوة، تُعاد قراءة الصفحة نفسها** —
Google يغيّر المتطلبات، وهذه لقطة بتاريخها لا بديل عن المراجعة.

## 1) فتح حساب مطوّر

1. حساب Google واحد باسم المالك القانوني.
2. `play.google.com/console` ← إنشاء حساب.
3. قبول اتفاقية التوزيع.
4. دفع رسم التسجيل 25 دولاراً أمريكياً ببطاقة مصرَّح بها (لا مسبقة الدفع).
5. اختيار نوع الحساب: **شخصي أم مؤسسي؟** — هذا قرار المالك، وله أثر على شروط
   الاختبار وطلب وثيقة الكيان.
6. إكمال التحقق من الهوية (قد يطلب وثيقة حكومية + بطاقة ائتمان بالاسم نفسه).
7. إن كان الحساب شخصياً: استيفاء شروط الاختبار والتحقق من الجهاز عبر تطبيق
   Play Console للجوال قبل جعل التطبيق متاحاً.

## 2) تغليف التطبيق بـTWA (PWABuilder)

المشروع **بلا خطوة بناء بقرار المالك**، فالجذر المُنشر هو جذر المستودع نفسه.

1. من `pwabuilder.com`: لصق رابط التطبيق `https://al-mustashar.pages.dev`.
2. اختيار «Package for Stores» ← ثم «Android App Bundle».
3. تنزيل الحزمة المضغوطة (`.zip`).
4. فكّ الضغط، ثم فتح المشروع في Android Studio، ومراجعة:
   - `appId` = معرّف حزمة يختاره المالك (لا يُختَرع هنا).
   - اسم الحزمة ورقم الإصدار — يكتبهما المالك، ولا يُختَرع هنا.
5. التوقيع: مفتاح upload ثم مفتاح توقيع التطبيق — **يُنشآن بحساب المالك ولا
   يُشارَكان ولا يُدوَّنان في هذا المستودع**.

## 3) الأصول المطلوبة

| الأصل | المقاس | الحالة في المستودع |
|---|---|---|
| أيقونة التطبيق | **512×512** PNG | `icons/icon-512.png` **موجود** (وكذلك `maskable-512.png` و`icon-192.png` و`icon-180.png`) |
| أيقونة مكيّفة (Play Store) | 512×512 PNG بلا شفافية وبلا زوايا مستديرة | تُصدَّر من الأصل |
| لقطات شاشة الهاتف | على الأقل 2، و8 مُستحسَنة | `docs/ui-screenshots/` فيها **37 ملفاً** بمقاسي 360 و1024 لكل شاشة (ar/en/fr) من جولات سابقة |
| أيقونة متجر 1024×1024 | للعرض في Play Console | تُصدَّر من الأصل |

**لا تُنشأ صورة اصطناعية هنا.** كل ما يُذكر أصولٌ موجودة أو خطوات يصدّرها المالك.

## 4) `assetlinks.json` — ببصمة مؤقتة صريحة

هذا الملف يربط التطبيق بموقعه، و**بدونه يفتح TWA في متصفح عادي**.

> **PLACEHOLDER — بصمة غير معروفة**
> **لا تُبصَم حقيقية متاحة، ولم تُختلق واحدة.** البصمة الحقيقية تُستخرج من
> مفتاح توقيع التطبيق الذي ينشئه المالك بأمر `keytool` على جهازه.
>
> **القاعدة: لا يُنشر هذا الملف في `.well-known/` ولا في أي مكان بالمستودع قبل أن
> يزوّد المالك الـJSON الحقيقي.** إنشاء بصمة من عندنا = ربط ملفنا بمفتاح لا
> نملكه، وهو خطأ يُكتشف عند التثبيت لا قبله.

المسار والخطوة التي ينفّذها المالك:
1. `keytool -list -v -keystore upload.keystore -alias <alias>` ←Recovery.
2. بناء `https://al-mustashar.pages.dev/.well-known/assetlinks.json` بمحتوى:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "PACKAGE_NAME_PLACEHOLDER",
      "sha256_cert_fingerprints": ["SHA256_PLACEHOLDER_NOT_A_REAL_FINGERPRINT"]
    }
  }
]
```

3. التحقق من المطابقة: `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://al-mustashar.pages.dev&relation=delegate_permission/common.handle_all_urls`

## 5) الرفع

1. في Play Console: «إنشاء تطبيق» ← إكمال بيانات المتجر.
2. رفع `app-release.aab` في مسار الإصدار المغلق أو الداخلي (الاختبار الداخلي
   أولاً — دائمًا).
3. التتبّع: كل نسخة باسم إصدار يميّزها (مثل `1.19.0`).

## 6) نصوص وصف المتجر — جاهزة للنسخ

### ar — العنوان (30 حرفاً) · الوصف المختصر (80) · الوصف الكامل
- **العنوان:** المستشار الزراعي — فحص المبيدات
- **مختصر:** تحقّق من حالة مادة مبيد في ليبيا بقرار الوزارة — الحكم من النص الرسمي.
- **كامل:** يعرض التطبيق حالة المواد حسب قرارات وزارة الزراعة الليبية 248/2024 و500/2026، ويقارنها بقواعد مرجعية دولية (الاتحاد الأوروبي ووكالة حماية البيئة الأمريكية). يعمل على جهازك دون إنترنت بعد أول تحميل، ولا يرفع صور الملصقات ولا نصوص البحث. **مساندة فقط وليست حكماً قانونياً**؛ المرجع الملزم هو نصوص القرارات الرسمية.

### en
- **Title:** Al-Mustashar — Pesticide Check
- **Short:** Substance status from the Libyan agriculture decrees — the ruling is the official text.
- **Full:** Shows substance status under Libyan Ministry of Agriculture decrees 248/2024 and 500/2026, and compares them with international reference databases (EU and US EPA). Runs on your device and works offline after the first load; it uploads neither label photos nor search text. **A support tool, not a legal ruling** — the binding reference is the official text of the decrees.

### fr
- **Titre:** Al-Mustashar — Vérification des pesticides
- **Court :** Statut des substances selon les décrets agricoles libyens — la référence est le texte officiel.
- **Complet :** Affiche le statut des substances selon les décrets 248/2024 et 500/2026 du ministère libyen de l'Agriculture, et le compare aux bases de référence internationales (UE, EPA américain). Fonctionne sur votre appareil et hors ligne après le premier chargement ; ni photos d'étiquettes ni texte de recherche ne sont envoyés. **Outil d'aide, pas une décision juridique** — la référence opposable est le texte officiel des décrets.

### zh
- **标题：** Al-Mustashar — 农药查询
- **简介：** 依据利比亚农业部决议显示物质状态 — 判定以官方文本为准。
- **完整：** 依据利比亚农业部第248/2024号与第500/2026号决议显示物质状态，并与国际参考数据库（欧盟、美国环保署）对比。首次加载后即可离线在设备上运行；不上传标签照片或搜索文字。**本工具仅供辅助，不构成法律裁决** — 具有约束力的参考是决议官方文本。

## 7) قبل أي نشر — قائمة تحقّق

- [ ] الحساب الشخصي استوفى شروط الاختبار وتحقق الجهاز.
- [ ] `assetlinks.json` فيه **بصمة حقيقية من مفتاح المالك**، لا PLACEHOLDER.
- [ ] التطبيق مثبَّت من **الاختبار الداخلي** فقط، ومُجرَّب على جهاز حقيقي.
- [ ] الوصف لا يدّعي اعتماداً رسمياً ولا حكماً قانونياً — النص أعلاه مكتوب بهذا القصد.
- [ ] الأصول (512 · لقطات) موجودة قبل البناء لا بعده.
- [ ] **لا رفع من هذا المستودع ولا باسمه**: كل خطوة من حساب المالك.
