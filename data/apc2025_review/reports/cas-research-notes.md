# مراجعة CAS وملاحظة المواد الحيوية — APC 2025

التاريخ: 2026-10-28  
الفرع: `audit/apc-2025-data-integration`  
النطاق: تدقيق معرفات CAS فقط؛ لا تعديل لبيانات الإنتاج ولا استيراد تلقائي للبطاقات.

## نتيجة البحث الخارجي

1. **CAS Registry / CAS Common Chemistry** يوضح أن CAS RN معرّف فريد لمادة محددة، وأن غياب نتيجة في مورد مفتوح لا يثبت عدم وجود رقم. CAS يصف Common Chemistry بأنه مورد مفتوح يغطي قرابة 500,000 مادة، بينما السجل الكامل أوسع بكثير. المصدر: https://www.cas.org/cas-data/cas-registry
2. **PubChem** يوضح صراحة أن أرقام CAS الظاهرة فيه قد تأتي من مزودين خارجيين، وأن تغطيته غير كاملة وأنه ليس مرجعاً نهائياً للتحقق من CAS. لذلك يستخدم كقرينة مساعدة لا كدليل وحيد. المصدر: https://pubchem.ncbi.nlm.nih.gov/assay
3. **University of Hertfordshire AERU PPDB/BPDB** قواعد متخصصة في المبيدات والمواد الحيوية؛ تصف AERU قواعد PPDB وBPDB، كما يذكر FAO أن PPDB/BPDB من قواعد خصائص المبيدات التي يمكن الرجوع إليها. المصادر:
   - https://sitem.herts.ac.uk/aeru/asdb/
   - https://www.fao.org/pesticide-registration-toolkit/information-sources/pesticide-properties/en/
4. **US EPA** تنشر قائمة بالمكونات الفعالة للمبيدات الحيوية، بما فيها البكتيريا والفطريات والفيروسات والكائنات/السلالات؛ القائمة تستخدم أسماء المادة/السلالة ورمز PC في بعض الحالات، ولا ينبغي تحويل رمز PC إلى CAS أو افتراض أن لكل سلالة CAS منفرداً. المصدر: https://www.epa.gov/ingredients-used-pesticide-products/biopesticide-active-ingredients

## قرار التعامل مع الأرقام الناقصة

- ملاحظة المستخدم بأن عدداً من الأسماء الناقصة مواد حيوية معقولة ومتسقة مع طبيعة هذه المنتجات، لكنها **ليست إثباتاً تلقائياً** أن CAS غير مُعيّن لكل اسم.
- لا يُكتب `NO_CAS_ASSIGNED` إلا إذا وُجد دليل صريح موثوق على أن الرقم غير مُعيّن؛ عدم العثور في بحث عام يصنّف `NOT_FOUND_IN_CHECKED_SOURCES` أو `NEEDS_VERIFICATION`، لا `NO_CAS_ASSIGNED`.
- بالنسبة إلى الكائنات الدقيقة، الفيروسات، السلالات، المستخلصات، الخلطات، والمواد ذات التركيب المتغير: لا يُستنتج CAS من اسم النوع وحده، ولا يُنقل CAS لمادة/سلالة قريبة. يجب أن تتطابق هوية المادة، السلالة/العزلة عند ذكرها، الشكل الكيميائي/الملح، والتركيز/التركيب حيث يؤثر ذلك في الهوية.
- لا يُعد رقم CAS صحيحاً لمجرد أن رقم التحقق الحسابي (check digit) صحيح.
- هذه الجولة البحثية لم تنتج مطابقة خارجية موثقة جديدة على مستوى كل اسم في قائمة `nv-01-actives-cas.csv`؛ لذلك **لم أضف أرقام CAS جديدة إلى بيانات البطاقات**. هذا قرار مقصود لمنع اختلاق أو إسناد رقم لمادة مشابهة. الأرقام الموسومة أصلاً `verified_secondary_source` تبقى كما هي إلى أن يُعاد تدقيق مصدرها.

## الإجراء الآمن للوكيل

1. احتفظ بملف المصدر ZIP وملفات CSV/JSON الأصلية دون تغيير.
2. راجع كل اسم في `nv-01-actives-cas.csv` في هذا الترتيب: CAS Common Chemistry/CAS Registry (إن أمكن)، سجل المادة في PPDB أو BPDB، مصدر حكومي تنظيمي (مثل EPA أو EU)، ثم PubChem كمصدر مساعد فقط.
3. سجّل لكل محاولة: الاسم كما طُبع، الاسم المطابق في المصدر، CAS كما نشره المصدر، رابط صفحة المادة، اسم الجهة، تاريخ الوصول، حالة المطابقة، وملاحظة سبب القبول/الرفض.
4. لا تعتمد نتيجة بحث عامة أو مقتطف محرك بحث وحده إذا أمكن فتح صفحة المادة نفسها.
5. افصل الحالات إلى: `VERIFIED_PRIMARY`, `VERIFIED_AUTHORITATIVE_SECONDARY`, `AMBIGUOUS_IDENTITY`, `NOT_FOUND_IN_CHECKED_SOURCES`, `NO_CAS_ASSIGNED_EVIDENCE`. لا تستخدم الحالة الأخيرة إلا مع دليل صريح.
6. ادمج CAS فقط بعد مطابقة الهوية؛ لا تملأ الخانة بقيمة تخمينية. أبقِ القيم غير المحسومة فارغة، مع حالة التحقق ومصدرها.
7. لا تغيّر بيانات الإنتاج أو تدمج PR #6 أو تنشر التطبيق.

## مراجع البحث

- CAS Registry: https://www.cas.org/cas-data/cas-registry
- PubChem — حدود بيانات CAS: https://pubchem.ncbi.nlm.nih.gov/assay
- University of Hertfordshire AERU agricultural substances databases: https://sitem.herts.ac.uk/aeru/asdb/
- FAO Pesticide Registration Toolkit — pesticide property databases: https://www.fao.org/pesticide-registration-toolkit/information-sources/pesticide-properties/en/
- US EPA — Biopesticide Active Ingredients: https://www.epa.gov/ingredients-used-pesticide-products/biopesticide-active-ingredients
