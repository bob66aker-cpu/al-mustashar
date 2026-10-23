# سجل تدقيق الأسماء المشوهة وصفوف غير المنتجات — Recomm25.pdf

> المرحلة الأولى · جزء الأسماء. كل تصحيح مشروط بدليل من سطر الطباعة
> نفسه في `tmp/apc/Recomm25.final.pdf` (جرعات المحارف لا OCR).
> القيم الخام في `_verify.audit.raw` و`_verify.audit.names` داخل
> `tmp/apc/cards2.json`. السجل قابل لإعادة الإنشاء:
> `python3 tmp/apc/names_apply.py --register`.

## أ) تصحيحات مقروءة من المصدر

| # | المعرّف | الحقل | قبل | بعد | الدليل والسبب |
|---|---|---|---|---|---|
| 1 | `p17-y735.7` | اسم المادة الفعالة | + %10 FS | Fludioxanil 4% + Tebuconazole 6% %10 FS | كلا المكوّنين في سطرَي الصف والجمع 4+6=10؛ الأعلى أولاً كترتيب الطباعة |
| 2 | `p19-y295.5` | اسم المادة الفعالة | Difenoconazole 15% + %30 EC | Difenoconazole 15% + Propiconazole 15% %30 EC | المكوّن الناقص مقيّد بالمجموع 30−15=15 وسطر المصدر يحمل Propiconazole 15% وحده |
| 3 | `p19-y420.5` | اسم المادة الفعالة | Azoxystrobin 16% + %40 | Azoxystrobin 16% + Propiconazole 24% %40 | المكوّن الناقص مقيّد بالمجموع 40−16=24 وسطر المصدر يحمل Propiconazole 24% وحده |
| 4 | `p19-y566.2` | اسم المادة الفعالة | Azoxystrobin 20% + %28 SC | Azoxystrobin 20% + Cyproconazole 8% %28 SC | المكوّن الناقص مقيّد بالمجموع 28−20=8 وسطر المصدر يحمل Cyproconazole 8% وحده |
| 5 | `p19-y656.9` | اسم المادة الفعالة | Trifloxystrobin 11.4% + %22.8 EC | Trifloxystrobin 11.4% + Propiconazole 11.4% %22.8 EC | المكوّن الناقص مقيّد بالمجموع 22.8−11.4=11.4 وسطر المصدر يحمل Propiconazole 11.4% وحده |
| 6 | `p24-y483.9` | اسم المادة الفعالة | + Difenoconazole 12.5% %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−12.5=20 وسطر المصدر يحمل Azoxystrobin 20% وحده |
| 7 | `p25-y603.9` | اسم المادة الفعالة | Ametoctradin 30% + %52.5 SC | Ametoctradin 30% + Dimethomorph 22.5% %52.5 SC | المكوّن الناقص مقيّد بالمجموع 52.5−30=22.5 وسطر المصدر يحمل Dimethomorph 22.5% وحده |
| 8 | `p28-y285.3` | اسم المادة الفعالة | + Fludioxonil 25% %62.5 WG | Cyprodinil 37.5% + Fludioxonil 25% %62.5 WG | المكوّن الناقص مقيّد بالمجموع 62.5−25=37.5 وسطر المصدر يحمل Cyprodinil 37.5% وحده |
| 9 | `p28-y732.9` | اسم المادة الفعالة | + Tebuconazole 6% %10 FS | Fludioxanil 4% + Tebuconazole 6% %10 FS | المكوّن الناقص مقيّد بالمجموع 10−6=4 وسطر المصدر يحمل Fludioxanil 4% وحده |
| 10 | `p31-y439.0` | اسم المادة الفعالة | + Dimethomorph 50% %70 WG | Azoxystrobin 20% + Dimethomorph 50% %70 WG | المكوّن الناقص مقيّد بالمجموع 70−50=20 وسطر المصدر يحمل Azoxystrobin 20% وحده |
| 11 | `p31-y540.4` | اسم المادة الفعالة | + Difenoconazole 12.5% %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−12.5=20 وسطر المصدر يحمل Azoxystrobin 20% وحده |
| 12 | `p31-y609.1` | اسم المادة الفعالة | + Dimethomorph 50% %70 WG مر V ض ال ü مرضض | Azoxystrobin 20% + Dimethomorph 50% %70 WG | اسما المكوّنين في سطرَي الصف 20+50=%70؛ الزيادة العربية و"صدع" من سطر مجاور ليست في سطر الطباعة |
| 13 | `p31-y609.1` | معدل الاستخدام | جم / فدان 200 صد � فى الثوم الصصداأ فى الثوم | جم / فدان 200 | اسما المكوّنين في سطرَي الصف 20+50=%70؛ الزيادة العربية و"صدع" من سطر مجاور ليست في سطر الطباعة |
| 14 | `p32-y682.6` | اسم المادة الفعالة | + Pyraclostrobin 6.7% %18.7 WG | Dimethomorph 12% + Pyraclostrobin 6.7% %18.7 WG | المكوّن الناقص مقيّد بالمجموع 18.7−6.7=12 وسطر المصدر يحمل Dimethomorph 12% وحده |
| 15 | `p33-y620.6` | اسم المادة الفعالة | + Bifenthrin 27.3% %50 WP | Acetamiprid 22.7% + Bifenthrin 27.3% %50 WP | المكوّن الناقص مقيّد بالمجموع 50−27.3=22.7 وسطر المصدر يحمل Acetamiprid 22.7% وحده |
| 16 | `p33-y735.4` | اسم المادة الفعالة | + Bifenthrin 27.3% %50 WP | Acetamiprid 22.7% + Bifenthrin 27.3% %50 WP | المكوّن الناقص مقيّد بالمجموع 50−27.3=22.7 وسطر المصدر يحمل Acetamiprid 22.7% وحده |
| 17 | `p35-y202.0` | اسم المادة الفعالة | + Bifenthrin 27.3% %50 WP | Acetamiprid 22.7% + Bifenthrin 27.3% %50 WP | المكوّن الناقص مقيّد بالمجموع 50−27.3=22.7 وسطر المصدر يحمل Acetamiprid 22.7% وحده |
| 18 | `p37-y305.9` | اسم المادة الفعالة | Indoxacarb 4.5% + %9.75 SC | Indoxacarb 4.5% + Novaluron 5.25% %9.75 SC | المكوّن الناقص مقيّد بالمجموع 9.75−4.5=5.25 وسطر المصدر يحمل Novaluron 5.25% وحده |
| 19 | `p40-y200.8` | اسم المادة الفعالة | Difenoconazole 15% + %30 EC | Difenoconazole 15% + Propiconazole 15% %30 EC | المكوّن الناقص مقيّد بالمجموع 30−15=15 وسطر المصدر يحمل Propiconazole 15% وحده |
| 20 | `p40-y256.8` | اسم المادة الفعالة | Difenoconazole 25% + %50 EC | Difenoconazole 25% + Propiconazole 25% %50 EC | المكوّن الناقص مقيّد بالمجموع 50−25=25 وسطر المصدر يحمل Propiconazole 25% وحده |
| 21 | `p40-y289.4` | اسم المادة الفعالة | Difenoconazole 25% + %50 EW | Difenoconazole 25% + Propiconazole 25% %50 EW | المكوّن الناقص مقيّد بالمجموع 50−25=25 وسطر المصدر يحمل Propiconazole 25% وحده |
| 22 | `p40-y322.0` | اسم المادة الفعالة | Azoxystrobin 20% + %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−20=12.5 وسطر المصدر يحمل Difenoconazole 12.5% وحده |
| 23 | `p40-y374.4` | اسم المادة الفعالة | Azoxystrobin 20% + %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−20=12.5 وسطر المصدر يحمل Difenoconazole 12.5% وحده |
| 24 | `p40-y439.6` | اسم المادة الفعالة | Difenoconazole 25% + %50 EW | Difenoconazole 25% + Propiconazole 25% %50 EW | المكوّن الناقص مقيّد بالمجموع 50−25=25 وسطر المصدر يحمل Propiconazole 25% وحده |
| 25 | `p40-y472.2` | اسم المادة الفعالة | Difenoconazole 25% + %50 ME | Difenoconazole 25% + Propiconazole 25% %50 ME | المكوّن الناقص مقيّد بالمجموع 50−25=25 وسطر المصدر يحمل Propiconazole 25% وحده |
| 26 | `p40-y504.8` | اسم المادة الفعالة | Difenoconazole 15% + %30 EC | Difenoconazole 15% + Propiconazole 15% %30 EC | المكوّن الناقص مقيّد بالمجموع 30−15=15 وسطر المصدر يحمل Propiconazole 15% وحده |
| 27 | `p40-y557.2` | اسم المادة الفعالة | Difenoconazole 15% + %30 EC | Difenoconazole 15% + Propiconazole 15% %30 EC | المكوّن الناقص مقيّد بالمجموع 30−15=15 وسطر المصدر يحمل Propiconazole 15% وحده |
| 28 | `p41-y201.1` | اسم المادة الفعالة | Difenoconazole 25% + %50 ME | Difenoconazole 25% + Propiconazole 25% %50 ME | المكوّن الناقص مقيّد بالمجموع 50−25=25 وسطر المصدر يحمل Propiconazole 25% وحده |
| 29 | `p41-y235.1` | اسم المادة الفعالة | Difenoconazole 25% + %50 EW | Difenoconazole 25% + Propiconazole 25% %50 EW | المكوّن الناقص مقيّد بالمجموع 50−25=25 وسطر المصدر يحمل Propiconazole 25% وحده |
| 30 | `p41-y325.8` | اسم المادة الفعالة | Difenoconazole 15% + %30 EC | Difenoconazole 15% + Propiconazole 15% %30 EC | المكوّن الناقص مقيّد بالمجموع 30−15=15 وسطر المصدر يحمل Propiconazole 15% وحده |
| 31 | `p41-y424.3` | اسم المادة الفعالة | Azoxystrobin 20% + %28 SC | Azoxystrobin 20% + Cyproconazole 8% %28 SC | المكوّن الناقص مقيّد بالمجموع 28−20=8 وسطر المصدر يحمل Cyproconazole 8% وحده |
| 32 | `p41-y634.8` | اسم المادة الفعالة | Difenoconazole 25% + %50 EC | Difenoconazole 25% + Propiconazole 25% %50 EC | المكوّن الناقص مقيّد بالمجموع 50−25=25 وسطر المصدر يحمل Propiconazole 25% وحده |
| 33 | `p41-y702.8` | اسم المادة الفعالة | Azoxystrobin 20% + %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−20=12.5 وسطر المصدر يحمل Difenoconazole 12.5% وحده |
| 34 | `p52-y615.9` | اسم المادة الفعالة | Fludioxonil 2.5% + %3.5 FS | Fludioxonil 2.5% + Metalaxyl-M 1% %3.5 FS | المكوّن الناقص مقيّد بالمجموع 3.5−2.5=1 وسطر المصدر يحمل Metalaxyl-M 1% وحده |
| 35 | `p68-y143.8` | اسم المادة الفعالة | Fludioxonil 2 ٫ 5% + Metalaxyl -M 1% %3.5 FS | Fludioxonil 2.5% + Metalaxyl -M 1% %3.5 FS |  |
| 36 | `p68-y194.9` | اسم المادة الفعالة | Fludioxonil 2 ٫ 5% + Metalaxyl -M 1% + Metalaxyl -M 3.3% | Fludioxonil 2.5% + Metalaxyl -M 1% + Metalaxyl -M 3.3% |  |
| 37 | `p68-y294.1` | اسم المادة الفعالة | Fludioxonil 2 ٫ 5% + Metalaxyl -M 1% %3.5 FS | Fludioxonil 2.5% + Metalaxyl -M 1% %3.5 FS |  |
| 38 | `p68-y319.6` | اسم المادة الفعالة | Fludioxonil 2 ٫ 5% + Metalaxyl -M 1% + Fludioxonil 1.1% | Fludioxonil 2.5% + Metalaxyl -M 1% + Fludioxonil 1.1% |  |
| 39 | `p68-y664.4` | اسم المادة الفعالة | + Tetraconazole 8% %18 SC | Azoxystrobin 10% + Tetraconazole 8% %18 SC | المكوّن الناقص مقيّد بالمجموع 18−8=10 وسطر المصدر يحمل Azoxystrobin 10% وحده |
| 40 | `p69-y144.3` | تصنيف WHO | لرت ما . ء | U | السطر الكثيف y154.3 يعطي WHO=U؛ لتر ماء صارت خلية WHO |
| 41 | `p69-y144.3` | معدل الاستخدام | 100/3 سم 50 | لرت ماء 100/3 سم 50 | السطر الكثيف y154.3 يعطي WHO=U؛ لتر ماء صارت خلية WHO |
| 42 | `p69-y159.9` | تصنيف WHO | لرت ماء | U | السطر الكثيف y169.9 يعطي WHO=U |
| 43 | `p69-y159.9` | معدل الاستخدام | 100/3 سم 50 | لرت ماء 100/3 سم 50 | السطر الكثيف y169.9 يعطي WHO=U |
| 44 | `p69-y175.5` | تصنيف WHO | لرت ماء | U | السطر الكثيف y185.5 يعطي WHO=U |
| 45 | `p69-y175.5` | معدل الاستخدام | 100/3 سم 40 | لرت ماء 100/3 سم 40 | السطر الكثيف y185.5 يعطي WHO=U |
| 46 | `p69-y184.3` | تصنيف WHO | لرت ماء | U | السطر الكثيف y201.1 يعطي WHO=U |
| 47 | `p69-y184.3` | معدل الاستخدام | 100/3 سم 50 | لرت ماء 100/3 سم 50 | السطر الكثيف y201.1 يعطي WHO=U |
| 48 | `p69-y219.3` | تصنيف WHO | لرت ماء | Mod II | السطر الكثيف y238.6 يعطي WHO=Mod II |
| 49 | `p69-y219.3` | معدل الاستخدام | 100/3 سم 75 | لرت ماء 100/3 سم 75 | السطر الكثيف y238.6 يعطي WHO=Mod II |
| 50 | `p72-y746.8` | اسم المادة الفعالة | + Tebuconazole 30% %50 SC | Azoxystrobin 20% + Tebuconazole 30% %50 SC | المكوّن الناقص مقيّد بالمجموع 50−30=20 وسطر المصدر يحمل Azoxystrobin 20% وحده |
| 51 | `p76-y452.7` | اسم المادة الفعالة | Imidacloprid 7 ٫ 5% + Pyriproxyfen 2 ٫ 5% %10 SC | Imidacloprid 7.5% + Pyriproxyfen 2.5% %10 SC |  |
| 52 | `p76-y663.7` | اسم المادة الفعالة | Lambda-Cyhalothrin 9.4% + %22 | Lambda-Cyhalothrin 9.4% + Thiamethoxam 12.6% %22 | المكوّن الناقص مقيّد بالمجموع 22−9.4=12.6 وسطر المصدر يحمل Thiamethoxam 12.6% وحده |
| 53 | `p82-y392.5` | اسم المادة الفعالة | Methoxyfenozide 30% + 6% + Spinetoram %36 SC | Methoxyfenozide 30% + Spinetoram 6% %36 SC | المعادلة والاسم مقتطعان في الخلية نفسها («6%» و«Spinetoram») ودُمجا كما يقرّهما المجموع 36 |
| 54 | `p91-y515.8` | اسم المادة الفعالة | Azoxystrobin 32.2% + %44.7 | Azoxystrobin 32.2% + Metalaxyl-M 12.5% %44.7 | المكوّن الناقص مقيّد بالمجموع 44.7−32.2=12.5 وسطر المصدر يحمل Metalaxyl-M 12.5% وحده |
| 55 | `p91-y540.2` | اسم المادة الفعالة | Fludioxonil 2.5% + 1% + Metalaxyl-M %3 FS | Fludioxonil 2.5% + Metalaxyl-M 1% %3 FS | المعادلة والاسم مقتطعان في الخلية نفسها («1%» و«Metalaxyl-M») ودُمجا كما يقرّهما المجموع 3 |
| 56 | `p91-y571.2` | اسم المادة الفعالة | Azoxystrobin 20% + 30% + Tebuconazole %50 SC | Azoxystrobin 20% + Tebuconazole 30% %50 SC | المعادلة والاسم مقتطعان في الخلية نفسها («30%» و«Tebuconazole») ودُمجا كما يقرّهما المجموع 50 |
| 57 | `p91-y740.6` | اسم المادة الفعالة | + Thiophanat methyl 40% %56 WP | Hymexazol 16% + Thiophanat methyl 40% %56 WP | المكوّن الناقص مقيّد بالمجموع 56−40=16 وسطر المصدر يحمل Hymexazol 16% وحده |
| 58 | `p92-y230.0` | اسم المادة الفعالة | Azoxystrobin 20% + 30% + Tebuconazole %50 SC | Azoxystrobin 20% + Tebuconazole 30% %50 SC | المعادلة والاسم مقتطعان في الخلية نفسها («30%» و«Tebuconazole») ودُمجا كما يقرّهما المجموع 50 |
| 59 | `p92-y314.3` | اسم المادة الفعالة | Azoxystrobin 28.2% + 10.8% + Metalaxyl-M %39 | Azoxystrobin 28.2% + Metalaxyl-M 10.8% %39 | المعادلة والاسم مقتطعان في الخلية نفسها («10.8%» و«Metalaxyl-M») ودُمجا كما يقرّهما المجموع 39 |
| 60 | `p92-y341.2` | اسم المادة الفعالة | Azoxystrobin 28.2% + 10.8% + Metalaxyl-M %39 | Azoxystrobin 28.2% + Metalaxyl-M 10.8% %39 | المعادلة والاسم مقتطعان في الخلية نفسها («10.8%» و«Metalaxyl-M») ودُمجا كما يقرّهما المجموع 39 |
| 61 | `p92-y395.1` | اسم المادة الفعالة | Azoxystrobin 28.2% + 10.8% + Metalaxyl-M %39 SC | Azoxystrobin 28.2% + Metalaxyl-M 10.8% %39 SC | المعادلة والاسم مقتطعان في الخلية نفسها («10.8%» و«Metalaxyl-M») ودُمجا كما يقرّهما المجموع 39 |
| 62 | `p92-y422.0` | اسم المادة الفعالة | Azoxystrobin 28.2% + 10.8% + Metalaxyl-M %39 SC | Azoxystrobin 28.2% + Metalaxyl-M 10.8% %39 SC | المعادلة والاسم مقتطعان في الخلية نفسها («10.8%» و«Metalaxyl-M») ودُمجا كما يقرّهما المجموع 39 |
| 63 | `p92-y472.3` | اسم المادة الفعالة | Azoxystrobin 28.2% + 10.9% + Metalaxyl-M %39.1 | Azoxystrobin 28.2% + Metalaxyl-M 10.9% %39.1 | المعادلة والاسم مقتطعان في الخلية نفسها («10.9%» و«Metalaxyl-M») ودُمجا كما يقرّهما المجموع 39.1 |
| 64 | `p93-y246.3` | اسم المادة الفعالة | + 20% + Tebuconazole %32 SC | Azoxystrobin 12% + Tebuconazole 20% %32 SC | المكوّن الناقص مقيّد بالمجموع 32−20=12 وسطر المصدر يحمل Azoxystrobin 12% وحده |
| 65 | `p93-y314.3` | اسم المادة الفعالة | + 1.5% + Cyflufenamid %14 DC | Difenoconazole 12.5% + Cyflufenamid 1.5% %14 DC | المكوّن الناقص مقيّد بالمجموع 14−1.5=12.5 وسطر المصدر يحمل Difenoconazole 12.5% وحده |
| 66 | `p93-y422.1` | اسم المادة الفعالة | + 12.5% + Difenoconazole %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−12.5=20 وسطر المصدر يحمل Azoxystrobin 20% وحده |
| 67 | `p93-y539.7` | اسم المادة الفعالة | + 25% + Trifloxystrobin %50 SC | Fluopyram 25% + Trifloxystrobin 25% %50 SC | المكوّن الناقص مقيّد بالمجموع 50−25=25 وسطر المصدر يحمل Fluopyram 25% وحده |
| 68 | `p95-y570.1` | اسم المادة الفعالة | Dimetho orph 22% + Metalaxyl 8% %30 WG | Dimethomorph 22% + Metalaxyl 8% %30 WG |  |
| 69 | `p95-y643.8` | اسم المادة الفعالة | Chlorothalonil 62.5% + %75 WP | Chlorothalonil 62.5% + Tebuconazole 12.5% %75 WP | المكوّن الناقص مقيّد بالمجموع 75−62.5=12.5 وسطر المصدر يحمل Tebuconazole 12.5% وحده |
| 70 | `p95-y672.2` | اسم المادة الفعالة | Chlorothalonil 62.5% + %75 WP | Chlorothalonil 62.5% + Tebuconazole 12.5% %75 WP | المكوّن الناقص مقيّد بالمجموع 75−62.5=12.5 وسطر المصدر يحمل Tebuconazole 12.5% وحده |
| 71 | `p96-y142.1` | اسم المادة الفعالة | Difenoconazole 15% + %30 EC | Difenoconazole 15% + Propiconazole 15% %30 EC | المكوّن الناقص مقيّد بالمجموع 30−15=15 وسطر المصدر يحمل Propiconazole 15% وحده |
| 72 | `p96-y170.4` | اسم المادة الفعالة | Chlorothalonil 50% + %60 SC | Chlorothalonil 50% + Dimethomorph 10% %60 SC | المكوّن الناقص مقيّد بالمجموع 60−50=10 وسطر المصدر يحمل Dimethomorph 10% وحده |
| 73 | `p96-y183.9` | اسم المادة الفعالة | Dimetho orph 10% | Dimethomorph 10% |  |
| 74 | `p96-y323.5` | اسم المادة الفعالة | Mancozeb 64% + %72 WP | Mancozeb 64% + Metalaxyl 8% %72 WP | المكوّن الناقص مقيّد بالمجموع 72−64=8 وسطر المصدر يحمل Metalaxyl 8% وحده |
| 75 | `p96-y550.3` | اسم المادة الفعالة | Dimetho orph 30% + %45 SC | Dimethomorph 30% + %45 SC | المكوّن الناقص مقيّد بالمجموع 45−30=15 وسطر المصدر يحمل Pyraclostrobin 15% وحده |
| 76 | `p96-y550.3` | اسم المادة الفعالة | Dimethomorph 30% + %45 SC | Dimethomorph 30% + Pyraclostrobin 15% %45 SC | المكوّن الناقص مقيّد بالمجموع 45−30=15 وسطر المصدر يحمل Pyraclostrobin 15% وحده |
| 77 | `p96-y595.6` | اسم المادة الفعالة | Chlorothalonil 64% + %72 WP | Chlorothalonil 64% + Metalaxyl 8% %72 WP | المكوّن الناقص مقيّد بالمجموع 72−64=8 وسطر المصدر يحمل Metalaxyl 8% وحده |
| 78 | `p96-y645.2` | اسم المادة الفعالة | Pyraclostrobin 5% + %60 WG | Pyraclostrobin 5% + Metiram 55% %60 WG | المكوّن الناقص مقيّد بالمجموع 60−5=55 وسطر المصدر يحمل Metiram 55% وحده |
| 79 | `p96-y707.6` | اسم المادة الفعالة | Dimetho orph 12% + Pyraclostrobin 6.7% %18.7 WG | Dimethomorph 12% + Pyraclostrobin 6.7% %18.7 WG |  |
| 80 | `p96-y738.8` | اسم المادة الفعالة | Mancozeb 64% + %72 WP | Mancozeb 64% + Metalaxyl 8% %72 WP | المكوّن الناقص مقيّد بالمجموع 72−64=8 وسطر المصدر يحمل Metalaxyl 8% وحده |
| 81 | `p97-y507.8` | اسم المادة الفعالة | Copper oxychloride 67.2% + Dimetho orph 6% %73.2 WP | Copper oxychloride 67.2% + Dimethomorph 6% %73.2 WP |  |
| 82 | `p97-y603.3` | اسم المادة الفعالة | hydrochloride %72.2 SL | Propamocarb hydrochloride %72.2 SL |  |
| 83 | `p97-y632.4` | اسم المادة الفعالة | + Metalaxyl 8% %72 WP | Chlorothalonil 64% + Metalaxyl 8% %72 WP | المكوّن الناقص مقيّد بالمجموع 72−8=64 وسطر المصدر يحمل Chlorothalonil 64% وحده |
| 84 | `p98-y177.8` | اسم المادة الفعالة | Azoxystrobin 20% + 12.5% + Difenoconazole %32 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32 SC | المعادلة والاسم مقتطعان في الخلية نفسها («12.5%» و«Difenoconazole») ودُمجا كما يقرّهما المجموع 32 |
| 85 | `p99-y293.3` | اسم المادة الفعالة | Cymoxanil 5% + Dimetho orph 20% %25 WP | Cymoxanil 5% + Dimethomorph 20% %25 WP |  |
| 86 | `p99-y327.3` | اسم المادة الفعالة | Cymoxanil 20% + Dimetho orph 50% %70 WG | Cymoxanil 20% + Dimethomorph 50% %70 WG |  |
| 87 | `p99-y508.7` | اسم المادة الفعالة | Azoxystrobin 20% + %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−20=12.5 وسطر المصدر يحمل Difenoconazole 12.5% وحده |
| 88 | `p99-y576.7` | اسم المادة الفعالة | Azoxystrobin 20% + %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−20=12.5 وسطر المصدر يحمل Difenoconazole 12.5% وحده |
| 89 | `p99-y636.3` | اسم المادة الفعالة | Azoxystrobin 20% + %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−20=12.5 وسطر المصدر يحمل Difenoconazole 12.5% وحده |
| 90 | `p104-y426.5` | اسم المادة الفعالة | Fludioxonil 2% + 20% + Thiamethoxam %22 FS | Fludioxonil 2% + Thiamethoxam 20% %22 FS | المعادلة والاسم مقتطعان في الخلية نفسها («20%» و«Thiamethoxam») ودُمجا كما يقرّهما المجموع 22 |
| 91 | `p110-y561.7` | اسم المادة الفعالة | Hymexazol 16% + %56 WP | Hymexazol 16% + Thiophanate-methyl 40% %56 WP | المكوّن الناقص مقيّد بالمجموع 56−16=40 وسطر المصدر يحمل Thiophanate-methyl 40% وحده |
| 92 | `p110-y583.4` | اسم المادة الفعالة | Fludioxonil 8.4% + 33.6% + Thiamethoam %42 FS | Fludioxonil 8.4% + Thiamethoam 33.6% %42 FS | المعادلة والاسم مقتطعان في الخلية نفسها («33.6%» و«Thiamethoam») ودُمجا كما يقرّهما المجموع 42 |
| 93 | `p115-y436.4` | اسم المادة الفعالة | Cymoxanil 5% + Propamocarb h rochloride 40% %45 SC | Cymoxanil 5% + Propamocarb hydrochloride 40% %45 SC |  |
| 94 | `p116-y221.1` | اسم المادة الفعالة | Azoxystrobin 20% + 12% + Propiconazole %32 SC | Azoxystrobin 20% + Propiconazole 12% %32 SC | المعادلة والاسم مقتطعان في الخلية نفسها («12%» و«Propiconazole») ودُمجا كما يقرّهما المجموع 32 |
| 95 | `p116-y271.2` | اسم المادة الفعالة | + 12.5% + Difenoconazole %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−12.5=20 وسطر المصدر يحمل Azoxystrobin 20% وحده |
| 96 | `p116-y347.7` | اسم المادة الفعالة | + 12.5% + Difenoconazole %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−12.5=20 وسطر المصدر يحمل Azoxystrobin 20% وحده |
| 97 | `p116-y376.1` | اسم المادة الفعالة | + 12.5% + Difenoconazole %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−12.5=20 وسطر المصدر يحمل Azoxystrobin 20% وحده |
| 98 | `p116-y489.4` | اسم المادة الفعالة | Dimetho orph 22% + Metalaxyl 8% %30 WG | Dimethomorph 22% + Metalaxyl 8% %30 WG |  |
| 99 | `p116-y656.8` | اسم المادة الفعالة | Azoxystrobin 20% + 12.5% + Difenoconazole %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المعادلة والاسم مقتطعان في الخلية نفسها («12.5%» و«Difenoconazole») ودُمجا كما يقرّهما المجموع 32.5 |
| 100 | `p117-y375.9` | اسم المادة الفعالة | Boscalid.20% + %30 SC | Boscalid.20% + Pyraclostrobin 10% %30 SC | المكوّن الناقص مقيّد بالمجموع 30−20=10 وسطر المصدر يحمل Pyraclostrobin 10% وحده |
| 101 | `p117-y407.9` | اسم المادة الفعالة | Metiram 55% + %60 WG | Metiram 55% + Pyraclostrobin 5% %60 WG | المكوّن الناقص مقيّد بالمجموع 60−55=5 وسطر المصدر يحمل Pyraclostrobin 5% وحده |
| 102 | `p117-y543.1` | اسم المادة الفعالة | Mancozeb 64% + %72 WP | Mancozeb 64% + Metalaxyl 8% %72 WP | المكوّن الناقص مقيّد بالمجموع 72−64=8 وسطر المصدر يحمل Metalaxyl 8% وحده |
| 103 | `p117-y640.9` | اسم المادة الفعالة | Azoxystrobin 28.2% + %39.1 SC | Azoxystrobin 28.2% + Metalaxyl- M 10.9% %39.1 SC | المكوّن الناقص مقيّد بالمجموع 39.1−28.2=10.9 وسطر المصدر يحمل Metalaxyl- M 10.9% وحده |
| 104 | `p117-y706.1` | اسم المادة الفعالة | Difenoconazole 25% + %50 EC | Difenoconazole 25% + Propiconazole 25% %50 EC | المكوّن الناقص مقيّد بالمجموع 50−25=25 وسطر المصدر يحمل Propiconazole 25% وحده |
| 105 | `p117-y738.7` | اسم المادة الفعالة | Mancozeb 64% + %72 WP | Mancozeb 64% + Metalaxyl 8% %72 WP | المكوّن الناقص مقيّد بالمجموع 72−64=8 وسطر المصدر يحمل Metalaxyl 8% وحده |
| 106 | `p118-y188.4` | اسم المادة الفعالة | Mancozeb 64% + %72 WP | Mancozeb 64% + Metalaxyl 8% %72 WP | المكوّن الناقص مقيّد بالمجموع 72−64=8 وسطر المصدر يحمل Metalaxyl 8% وحده |
| 107 | `p118-y242.2` | اسم المادة الفعالة | Dimethomorph 12% + %18.7 WG | Dimethomorph 12% + Pyraclostrobin 6.7% %18.7 WG | المكوّن الناقص مقيّد بالمجموع 18.7−12=6.7 وسطر المصدر يحمل Pyraclostrobin 6.7% وحده |
| 108 | `p118-y389.6` | اسم المادة الفعالة | Boscalid 26.7% + %40 WG | Boscalid 26.7% + Pyraclostrobin 13.3% %40 WG | المكوّن الناقص مقيّد بالمجموع 40−26.7=13.3 وسطر المصدر يحمل Pyraclostrobin 13.3% وحده |
| 109 | `p118-y539.2` | اسم المادة الفعالة | Azoxystrobin 20% + %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−20=12.5 وسطر المصدر يحمل Difenoconazole 12.5% وحده |
| 110 | `p118-y705.0` | اسم المادة الفعالة | Mancozeb 64% + %72 WP | Mancozeb 64% + Metalaxyl 8% %72 WP | المكوّن الناقص مقيّد بالمجموع 72−64=8 وسطر المصدر يحمل Metalaxyl 8% وحده |
| 111 | `p119-y460.4` | اسم المادة الفعالة | Dimetho orph 9% + Mancozeb 60% %69 WG | Dimethomorph 9% + Mancozeb 60% %69 WG |  |
| 112 | `p119-y484.9` | اسم المادة الفعالة | Gopper oxychloride 67.2% + Dimetho orph 6% %73.2 WP | Gopper oxychloride 67.2% + Dimethomorph 6% %73.2 WP |  |
| 113 | `p119-y533.6` | اسم المادة الفعالة | Azoxystrobin 8% + 40% + Chlorothalonil %48 SC | Azoxystrobin 8% + Chlorothalonil 40% %48 SC | المعادلة والاسم مقتطعان في الخلية نفسها («40%» و«Chlorothalonil») ودُمجا كما يقرّهما المجموع 48 |
| 114 | `p119-y560.3` | اسم المادة الفعالة | Gopper oxychloride 40% + Dimetho orph 6% %46 WG | Gopper oxychloride 40% + Dimethomorph 6% %46 WG |  |
| 115 | `p119-y742.0` | اسم المادة الفعالة | 30% + Fluazinam %50 SC | Fluazinam 30% %50 SC | المعادلة والاسم مقتطعان في الخلية نفسها («30%» و«Fluazinam») ودُمجا كما يقرّهما المجموع 50 |
| 116 | `p120-y287.3` | اسم المادة الفعالة | Dimethomorph 18% + %36 SC | Dimethomorph 18% + Zoxamide 18% %36 SC | المكوّن الناقص مقيّد بالمجموع 36−18=18 وسطر المصدر يحمل Zoxamide 18% وحده |
| 117 | `p120-y366.7` | اسم المادة الفعالة | Trifloxystrobin 25% + %75 WG | Trifloxystrobin 25% + Tebuconazole 50% %75 WG | المكوّن الناقص مقيّد بالمجموع 75−25=50 وسطر المصدر يحمل Tebuconazole 50% وحده |
| 118 | `p120-y494.3` | اسم المادة الفعالة | Dimethomorph 9% + %69 WP | Dimethomorph 9% + Mancozeb 60% %69 WP | المكوّن الناقص مقيّد بالمجموع 69−9=60 وسطر المصدر يحمل Mancozeb 60% وحده |
| 119 | `p120-y542.5` | اسم المادة الفعالة | Mancozeb 64% + %68 WG | Mancozeb 64% + Metalaxyl-M 4% %68 WG | المكوّن الناقص مقيّد بالمجموع 68−64=4 وسطر المصدر يحمل Metalaxyl-M 4% وحده |
| 120 | `p120-y640.3` | اسم المادة الفعالة | + Metalaxyl 8% %72 WP | Mancozeb 64% + Metalaxyl 8% %72 WP | المكوّن الناقص مقيّد بالمجموع 72−8=64 وسطر المصدر يحمل Mancozeb 64% وحده |
| 121 | `p120-y709.5` | اسم المادة الفعالة | Azoxystrobin 16.8% + 7.4% + Cyazofamid %26 SC | Azoxystrobin 16.8% + Cyazofamid 7.4% %26 SC | المعادلة والاسم مقتطعان في الخلية نفسها («7.4%» و«Cyazofamid») ودُمجا كما يقرّهما المجموع 26 |
| 122 | `p121-y328.2` | اسم المادة الفعالة | Dimethomorph 12% + %18.7 WG | Dimethomorph 12% + Pyaclostrobin 6.7% %18.7 WG | المكوّن الناقص مقيّد بالمجموع 18.7−12=6.7 وسطر المصدر يحمل Pyaclostrobin 6.7% وحده |
| 123 | `p121-y396.3` | اسم المادة الفعالة | + Metalaxyl-M 4% %68 WG | Mancozeb 64% + Metalaxyl-M 4% %68 WG | المكوّن الناقص مقيّد بالمجموع 68−4=64 وسطر المصدر يحمل Mancozeb 64% وحده |
| 124 | `p121-y705.3` | اسم المادة الفعالة | Azoxystrobin 17% + %34 SC | Azoxystrobin 17% + Fluazinam 17% %34 SC | المكوّن الناقص مقيّد بالمجموع 34−17=17 وسطر المصدر يحمل Fluazinam 17% وحده |
| 125 | `p121-y737.8` | اسم المادة الفعالة | Dimethomorph 9% + %69 WP | Dimethomorph 9% + Mancozeb 60% %69 WP | المكوّن الناقص مقيّد بالمجموع 69−9=60 وسطر المصدر يحمل Mancozeb 60% وحده |
| 126 | `p122-y190.0` | اسم المادة الفعالة | Cymoxanil 5% + Dimetho orph20% %25 WP | Cymoxanil 5% + Dimethomorph20% %25 WP |  |
| 127 | `p122-y421.1` | اسم المادة الفعالة | Dimethomorph 7.2% + %11.2 EC | Dimethomorph 7.2% + Pyaclostrobin 4% %11.2 EC | المكوّن الناقص مقيّد بالمجموع 11.2−7.2=4 وسطر المصدر يحمل Pyaclostrobin 4% وحده |
| 128 | `p122-y735.7` | اسم المادة الفعالة | Dimethomorph 11.3% + %71.3 WG | Dimethomorph 11.3% + Folpet 60% %71.3 WG | المكوّن الناقص مقيّد بالمجموع 71.3−11.3=60 وسطر المصدر يحمل Folpet 60% وحده |
| 129 | `p123-y147.3` | اسم المادة الفعالة | Mancozeb 64% + %72 WP | Mancozeb 64% + Metalaxyl 8% %72 WP | المكوّن الناقص مقيّد بالمجموع 72−64=8 وسطر المصدر يحمل Metalaxyl 8% وحده |
| 130 | `p123-y359.9` | اسم المادة الفعالة | Fluopicolide 7% + %70 SC | Fluopicolide 7% + Propamocarb hydrochloride 63% %70 SC | المكوّن الناقص مقيّد بالمجموع 70−7=63 وسطر المصدر يحمل Propamocarb hydrochloride 63% وحده |
| 131 | `p123-y373.9` | اسم المادة الفعالة | Propamocarb h rochloride 63% | Propamocarb hydrochloride 63% |  |
| 132 | `p123-y396.7` | اسم المادة الفعالة | Difenoconazole 15% + %30 EC | Difenoconazole 15% + Propiconazole 15% %30 EC | المكوّن الناقص مقيّد بالمجموع 30−15=15 وسطر المصدر يحمل Propiconazole 15% وحده |
| 133 | `p123-y484.6` | اسم المادة الفعالة | Dimethomorph 12% + %18.7 WG | Dimethomorph 12% + Pyraclostrobin 6.7% %18.7 WG | المكوّن الناقص مقيّد بالمجموع 18.7−12=6.7 وسطر المصدر يحمل Pyraclostrobin 6.7% وحده |
| 134 | `p123-y595.1` | اسم المادة الفعالة | Cymoxanil 5% + Propamocarb h rochloride 40% %45 SC | Cymoxanil 5% + Propamocarb hydrochloride 40% %45 SC |  |
| 135 | `p124-y743.9` | اسم المادة الفعالة | 1 3 Dichloropropene ٫ %93 EC | 1.3 Dichloropropene %93 EC | المصدر يرسم 1.3 Dichloropropene؛ الفاصلة والترتيب جاءا من تجويف الاتجاه |
| 136 | `p128-y417.6` | اسم المادة الفعالة | Abamectin 1.3% + %10.1 EC | Abamectin 1.3% + Bifenthrin 8.8% %10.1 EC | المكوّن الناقص مقيّد بالمجموع 10.1−1.3=8.8 وسطر المصدر يحمل Bifenthrin 8.8% وحده |
| 137 | `p134-y492.3` | اسم المادة الفعالة | + Tebuconazole 12.5% %75 WP | Chlorothalonil 62.5% + Tebuconazole 12.5% %75 WP | المكوّن الناقص مقيّد بالمجموع 75−12.5=62.5 وسطر المصدر يحمل Chlorothalonil 62.5% وحده |
| 138 | `p134-y627.8` | اسم المادة الفعالة | Tebuconazole 7.5% + Thioahatate- ethyl 37.5% %45 SC | Tebuconazole 7.5% + Thioahatate-methyl 37.5% %45 SC |  |
| 139 | `p134-y656.8` | اسم المادة الفعالة | Boscalid 22% + %30 WP | Boscalid 22% + Prochloraz 8% %30 WP | المكوّن الناقص مقيّد بالمجموع 30−22=8 وسطر المصدر يحمل Prochloraz 8% وحده |
| 140 | `p134-y741.9` | اسم المادة الفعالة | Prochloraz 40% + %46 EC | Prochloraz 40% + Propiconazole 6% %46 EC | المكوّن الناقص مقيّد بالمجموع 46−40=6 وسطر المصدر يحمل Propiconazole 6% وحده |
| 141 | `p135-y418.3` | اسم المادة الفعالة | Cyprodinil 37.5% + %62.5 WG | Cyprodinil 37.5% + Fludioxanil 25% %62.5 WG | المكوّن الناقص مقيّد بالمجموع 62.5−37.5=25 وسطر المصدر يحمل Fludioxanil 25% وحده |
| 142 | `p143-y645.9` | اسم المادة الفعالة | Abamectin 2.2% + %45.4 SC | Abamectin 2.2% + Bifenazate 43.2% %45.4 SC | المكوّن الناقص مقيّد بالمجموع 45.4−2.2=43.2 وسطر المصدر يحمل Bifenazate 43.2% وحده |
| 143 | `p143-y744.6` | اسم المادة الفعالة | + Imidacloprid 12% %15 SC | Abamectin 3% + Imidacloprid 12% %15 SC | المكوّن الناقص مقيّد بالمجموع 15−12=3 وسطر المصدر يحمل Abamectin 3% وحده |
| 144 | `p144-y449.9` | اسم المادة الفعالة | 25% + Trifloxystrobin %50 SC | Trifloxystrobin 25% %50 SC | المعادلة والاسم مقتطعان في الخلية نفسها («25%» و«Trifloxystrobin») ودُمجا كما يقرّهما المجموع 50 |
| 145 | `p146-y750.2` | اسم المادة الفعالة | Propamocarb h rochloride 43% %84 SL | Propamocarb hydrochloride 43% %84 SL |  |
| 146 | `p147-y634.0` | اسم المادة الفعالة | Boscalid 20% + %30 SC | Boscalid 20% + Kresoxim-methyl 10% %30 SC | المكوّن الناقص مقيّد بالمجموع 30−20=10 وسطر المصدر يحمل Kresoxim-methyl 10% وحده |
| 147 | `p147-y652.5` | اسم المادة الفعالة | Kresoxim- ethyl 10% | Kresoxim-methyl 10% |  |
| 148 | `p147-y659.0` | اسم المادة الفعالة | Kresoxim- ethyl 10% Penconazole %10 EC | Kresoxim-methyl 10% Penconazole %10 EC |  |
| 149 | `p147-y718.5` | اسم المادة الفعالة | + %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | كلا المكوّنين في سطرَي الصف والجمع 20+12.5=32.5؛ الأعلى أولاً كترتيب الطباعة |
| 150 | `p148-y178.4` | اسم المادة الفعالة | Boscalid 20% + %30 SC | Boscalid 20% + Kresoxim-methyl 10% %30 SC | المكوّن الناقص مقيّد بالمجموع 30−20=10 وسطر المصدر يحمل Kresoxim-methyl 10% وحده |
| 151 | `p148-y191.9` | اسم المادة الفعالة | Kresoxim- ethyl 10% | Kresoxim-methyl 10% |  |
| 152 | `p148-y318.0` | اسم المادة الفعالة | Boscalid 20% + %30 SC | Boscalid 20% + Kresoxim-methyl 10% %30 SC | المكوّن الناقص مقيّد بالمجموع 30−20=10 وسطر المصدر يحمل Kresoxim-methyl 10% وحده |
| 153 | `p148-y331.5` | اسم المادة الفعالة | Kresoxim- ethyl 10% | Kresoxim-methyl 10% |  |
| 154 | `p148-y349.2` | اسم المادة الفعالة | Boscalid 20% + %30 SC | Boscalid 20% + Kresoxim-methyl 10% %30 SC | المكوّن الناقص مقيّد بالمجموع 30−20=10 وسطر المصدر يحمل Kresoxim-methyl 10% وحده |
| 155 | `p148-y363.2` | اسم المادة الفعالة | Kresoxim- ethyl 10% | Kresoxim-methyl 10% |  |
| 156 | `p148-y517.2` | اسم المادة الفعالة | Tebuconazole 50% + %75 WG | Tebuconazole 50% + Trifloxystrobin 25% %75 WG | المكوّن الناقص مقيّد بالمجموع 75−50=25 وسطر المصدر يحمل Trifloxystrobin 25% وحده |
| 157 | `p148-y582.4` | اسم المادة الفعالة | Boscalid 25.2% + %38 SC | Boscalid 25.2% + Pyraclostrobin 12.8% %38 SC | المكوّن الناقص مقيّد بالمجموع 38−25.2=12.8 وسطر المصدر يحمل Pyraclostrobin 12.8% وحده |
| 158 | `p148-y614.9` | اسم المادة الفعالة | Boscalid 20% + %30 SC | Boscalid 20% + Kresoxim-methyl 10% %30 SC | المكوّن الناقص مقيّد بالمجموع 30−20=10 وسطر المصدر يحمل Kresoxim-methyl 10% وحده |
| 159 | `p148-y629.0` | اسم المادة الفعالة | Kresoxim- ethyl 10% | Kresoxim-methyl 10% |  |
| 160 | `p149-y472.8` | اسم المادة الفعالة | Copper oxychloride 67.2% + Dimetho orph 6% %73.2 WP | Copper oxychloride 67.2% + Dimethomorph 6% %73.2 WP |  |
| 161 | `p149-y595.2` | اسم المادة الفعالة | Azoxystrobin 20% + Dimetho orph 40% %60 WG | Azoxystrobin 20% + Dimethomorph 40% %60 WG |  |
| 162 | `p149-y655.5` | اسم المادة الفعالة | + hydroch ride 53% %84 SL | Fosetyl Aluminium 31% + hydroch ride 53% %84 SL | المكوّن الناقص مقيّد بالمجموع 84−53=31 وسطر المصدر يحمل Fosetyl Aluminium 31% وحده |
| 163 | `p149-y686.7` | اسم المادة الفعالة | + Copper oxychloride 30% %40 WP | Cymoxanil 10% + Copper oxychloride 30% %40 WP | المكوّن الناقص مقيّد بالمجموع 40−30=10 وسطر المصدر يحمل Cymoxanil 10% وحده |
| 164 | `p149-y749.0` | اسم المادة الفعالة | + Copper oxychloride 30% %40 WP | Cymoxanil 10% + Copper oxychloride 30% %40 WP | المكوّن الناقص مقيّد بالمجموع 40−30=10 وسطر المصدر يحمل Cymoxanil 10% وحده |
| 165 | `p150-y178.8` | اسم المادة الفعالة | Azoxystrobin 20% + Dimetho orph 40% %60 WG | Azoxystrobin 20% + Dimethomorph 40% %60 WG |  |
| 166 | `p150-y324.7` | اسم المادة الفعالة | Chlorothalonil 40% + %44 SC | Chlorothalonil 40% + Metalaxyl-M 4% %44 SC | المكوّن الناقص مقيّد بالمجموع 44−40=4 وسطر المصدر يحمل Metalaxyl-M 4% وحده |
| 167 | `p150-y372.9` | اسم المادة الفعالة | Oxathiapiprolin 3% + 25% + Mandipropamid %28 SC | Oxathiapiprolin 3% + Mandipropamid 25% %28 SC | المعادلة والاسم مقتطعان في الخلية نفسها («25%» و«Mandipropamid») ودُمجا كما يقرّهما المجموع 28 |
| 168 | `p150-y687.1` | اسم المادة الفعالة | Dimetho orph 22% + %30 WG | Dimethomorph 22% + %30 WG | المكوّن الناقص مقيّد بالمجموع 30−22=8 وسطر المصدر يحمل Metalaxyl 8% وحده |
| 169 | `p150-y687.1` | اسم المادة الفعالة | Dimethomorph 22% + %30 WG | Dimethomorph 22% + Metalaxyl 8% %30 WG | المكوّن الناقص مقيّد بالمجموع 30−22=8 وسطر المصدر يحمل Metalaxyl 8% وحده |
| 170 | `p150-y719.7` | اسم المادة الفعالة | Dimetho orph 35% + %50 WG | Dimethomorph 35% + %50 WG | المكوّن الناقص مقيّد بالمجموع 50−35=15 وسطر المصدر يحمل kresoxitn- methyl 15% وحده |
| 171 | `p150-y719.7` | اسم المادة الفعالة | Dimethomorph 35% + %50 WG | Dimethomorph 35% + kresoxitn- methyl 15% %50 WG | المكوّن الناقص مقيّد بالمجموع 50−35=15 وسطر المصدر يحمل kresoxitn- methyl 15% وحده |
| 172 | `p151-y190.1` | اسم المادة الفعالة | Chlorothalonil 50% + %53.75 SC | Chlorothalonil 50% + Metalaxyl-M 3.75% %53.75 SC | المكوّن الناقص مقيّد بالمجموع 53.75−50=3.75 وسطر المصدر يحمل Metalaxyl-M 3.75% وحده |
| 173 | `p151-y224.1` | اسم المادة الفعالة | Chlorothalonil 50% + %53.75 SC | Chlorothalonil 50% + Metalaxyl-M 3.75% %53.75 SC | المكوّن الناقص مقيّد بالمجموع 53.75−50=3.75 وسطر المصدر يحمل Metalaxyl-M 3.75% وحده |
| 174 | `p151-y460.8` | اسم المادة الفعالة | Chlorothalonil 33.1% + %36.4 SC | Chlorothalonil 33.1% + Metalaxyl-M 3.3% %36.4 SC | المكوّن الناقص مقيّد بالمجموع 36.4−33.1=3.3 وسطر المصدر يحمل Metalaxyl-M 3.3% وحده |
| 175 | `p151-y635.1` | اسم المادة الفعالة | Azoxystrobin 20% + Dimetho orph 50% %70 WG | Azoxystrobin 20% + Dimethomorph 50% %70 WG |  |
| 176 | `p152-y148.1` | اسم المادة الفعالة | hydrochloride %72.2 SL | Propamocarb hydrochloride %72.2 SL | انزياح عمود واحد على الصفحة: الاسم والجرعة وتصنيف WHO و PHI في خلايا مزاحة؛ السطر y161.7 وحده يحملها كلها |
| 177 | `p152-y148.1` | تصنيف WHO | لرت ماء | U | انزياح عمود واحد على الصفحة: الاسم والجرعة وتصنيف WHO و PHI في خلايا مزاحة؛ السطر y161.7 وحده يحملها كلها |
| 178 | `p152-y148.1` | فترة الأمان | U | 3 | انزياح عمود واحد على الصفحة: الاسم والجرعة وتصنيف WHO و PHI في خلايا مزاحة؛ السطر y161.7 وحده يحملها كلها |
| 179 | `p152-y148.1` | معدل الاستخدام | Propamocarb | لرت ماء 100/3 سم 250 | انزياح عمود واحد على الصفحة: الاسم والجرعة وتصنيف WHO و PHI في خلايا مزاحة؛ السطر y161.7 وحده يحملها كلها |
| 180 | `p152-y173.6` | تصنيف WHO | لرت ماء 100 | U | انزياح عمود: WHO والجرعة و PHI في خلايا مزاحة عن السطر y187.3 |
| 181 | `p152-y173.6` | فترة الأمان | U | 3 | انزياح عمود: WHO والجرعة و PHI في خلايا مزاحة عن السطر y187.3 |
| 182 | `p152-y173.6` | معدل الاستخدام | — | لرت ماء 100/3 سم 50 | انزياح عمود: WHO والجرعة و PHI في خلايا مزاحة عن السطر y187.3 |
| 183 | `p152-y202.8` | تصنيف WHO | / فدان | U | السطر الكثيف y212.8 يقرأ 0.5/0.5/0.5/7/U ثم الجرعة والاسم |
| 184 | `p152-y202.8` | فترة الأمان | U | 7 | السطر الكثيف y212.8 يقرأ 0.5/0.5/0.5/7/U ثم الجرعة والاسم |
| 185 | `p152-y202.8` | قيم MRL | {"EPA": "0.5", "EU": "", "Codex": "0.5"} | {"EPA": "0.5", "EU": "0.5", "Codex": "0.5"} | السطر الكثيف y212.8 يقرأ 0.5/0.5/0.5/7/U ثم الجرعة والاسم |
| 186 | `p152-y202.8` | معدل الاستخدام | — | جم / فدان 200 | السطر الكثيف y212.8 يقرأ 0.5/0.5/0.5/7/U ثم الجرعة والاسم |
| 187 | `p152-y225.5` | اسم المادة الفعالة | 30% + 22.5% %52.5 WG | Cymoxanil 30% + Famoxadone 22.5% %52.5 WG | اسما المكوّنين في سطرَي الصف والجمع 30+22.5=%52.5 يثبّتهما |
| 188 | `p152-y225.5` | تصنيف WHO | / فدان | Low III | اسما المكوّنين في سطرَي الصف والجمع 30+22.5=%52.5 يثبّتهما |
| 189 | `p152-y225.5` | فترة الأمان | Low III | 7 | اسما المكوّنين في سطرَي الصف والجمع 30+22.5=%52.5 يثبّتهما |
| 190 | `p152-y225.5` | معدل الاستخدام | Cymoxanil Famoxadone | جم / فدان 200 | اسما المكوّنين في سطرَي الصف والجمع 30+22.5=%52.5 يثبّتهما |
| 191 | `p155-y514.8` | اسم المادة الفعالة | Difenoconazole 15% + %30 EC | Difenoconazole 15% + Propiconazole 15% %30 EC | المكوّن الناقص مقيّد بالمجموع 30−15=15 وسطر المصدر يحمل Propiconazole 15% وحده |
| 192 | `p156-y224.5` | اسم المادة الفعالة | Azoxystrobin 20% + %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−20=12.5 وسطر المصدر يحمل Difenoconazole 12.5% وحده |
| 193 | `p159-y600.2` | اسم المادة الفعالة | Boscalid 20% + %30 SC | Boscalid 20% + Kresoxim-methyl 10% %30 SC | المكوّن الناقص مقيّد بالمجموع 30−20=10 وسطر المصدر يحمل Kresoxim-methyl 10% وحده |
| 194 | `p159-y616.2` | اسم المادة الفعالة | Kresoxim- ethyl 10% | Kresoxim-methyl 10% |  |
| 195 | `p160-y601.7` | اسم المادة الفعالة | + Pyraclostrobin 6.7% %18.7 WG | Dimethomorph 12% + Pyraclostrobin 6.7% %18.7 WG | المكوّن الناقص مقيّد بالمجموع 18.7−6.7=12 وسطر المصدر يحمل Dimethomorph 12% وحده |
| 196 | `p160-y686.7` | اسم المادة الفعالة | Dimethomorph 7.2% + %11.2 EC | Dimethomorph 7.2% + Pyraclostrobin 4% %11.2 EC | المكوّن الناقص مقيّد بالمجموع 11.2−7.2=4 وسطر المصدر يحمل Pyraclostrobin 4% وحده |
| 197 | `p160-y729.2` | اسم المادة الفعالة | + Pyraclostrobin 6.7% %18.7 WG | Dimethomorph 12% + Pyraclostrobin 6.7% %18.7 WG | المكوّن الناقص مقيّد بالمجموع 18.7−6.7=12 وسطر المصدر يحمل Dimethomorph 12% وحده |
| 198 | `p161-y558.7` | اسم المادة الفعالة | + Trifloxystrobin 25% %75 WG | Tebuconazole 50% + Trifloxystrobin 25% %75 WG | المكوّن الناقص مقيّد بالمجموع 75−25=50 وسطر المصدر يحمل Tebuconazole 50% وحده |
| 199 | `p161-y595.6` | اسم المادة الفعالة | + Trifloxystrobin 25% %75 WG | Tebuconazole 50% + Trifloxystrobin 25% %75 WG | المكوّن الناقص مقيّد بالمجموع 75−25=50 وسطر المصدر يحمل Tebuconazole 50% وحده |
| 200 | `p161-y697.6` | اسم المادة الفعالة | + %46 EC | Prochloraz 40% + Propiconazole 6% %46 EC | كلا المكوّنين في سطرَي الصف والجمع 40+6=46؛ الأعلى أولاً كترتيب الطباعة |
| 201 | `p161-y734.5` | اسم المادة الفعالة | + Metalaxyl 9% %81 WP | Chlorothalonil 72% + Metalaxyl 9% %81 WP | المكوّن الناقص مقيّد بالمجموع 81−9=72 وسطر المصدر يحمل Chlorothalonil 72% وحده |
| 202 | `p164-y525.5` | اسم المادة الفعالة | Azoxystrobin 20% + %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−20=12.5 وسطر المصدر يحمل Difenoconazole 12.5% وحده |
| 203 | `p165-y272.2` | اسم المادة الفعالة | Azoxystrobin 6% + %56 SC | Azoxystrobin 6% + Chlorothalonil 50% %56 SC | المكوّن الناقص مقيّد بالمجموع 56−6=50 وسطر المصدر يحمل Chlorothalonil 50% وحده |
| 204 | `p165-y306.2` | اسم المادة الفعالة | Azoxystrobin 8% + %48 SC | Azoxystrobin 8% + Chlorothalonil 40% %48 SC | المكوّن الناقص مقيّد بالمجموع 48−8=40 وسطر المصدر يحمل Chlorothalonil 40% وحده |
| 205 | `p165-y663.6` | اسم المادة الفعالة | Azoxystrobin 6% + %56 SC | Azoxystrobin 6% + Chlorothalonil 50% %56 SC | المكوّن الناقص مقيّد بالمجموع 56−6=50 وسطر المصدر يحمل Chlorothalonil 50% وحده |
| 206 | `p167-y632.1` | اسم المادة الفعالة | Chlorothalonil 37.5% + %42.5 SC | Chlorothalonil 37.5% + Cymoxanil 5% %42.5 SC | المكوّن الناقص مقيّد بالمجموع 42.5−37.5=5 وسطر المصدر يحمل Cymoxanil 5% وحده |
| 207 | `p171-y262.8` | اسم المادة الفعالة | Dimetho orph 30% + Pyraclostrobin 15% %45 SC | Dimethomorph 30% + Pyraclostrobin 15% %45 SC |  |
| 208 | `p171-y560.1` | اسم المادة الفعالة | Azoxystrobin 20% + 8% + Cyproconazole %28 SC | Azoxystrobin 20% + Cyproconazole 8% %28 SC | المعادلة والاسم مقتطعان في الخلية نفسها («8%» و«Cyproconazole») ودُمجا كما يقرّهما المجموع 28 |
| 209 | `p171-y591.3` | اسم المادة الفعالة | Azoxystrobin 20% + 12.5% + Difenoconazole %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المعادلة والاسم مقتطعان في الخلية نفسها («12.5%» و«Difenoconazole») ودُمجا كما يقرّهما المجموع 32.5 |
| 210 | `p171-y653.7` | اسم المادة الفعالة | Difenoconazole 25% + 25% + Mandipropamid %50 SC | Difenoconazole 25% + Mandipropamid 25% %50 SC | المعادلة والاسم مقتطعان في الخلية نفسها («25%» و«Mandipropamid») ودُمجا كما يقرّهما المجموع 50 |
| 211 | `p171-y738.7` | اسم المادة الفعالة | Azoxystrobin 20% + 12.5% + Difenoconazole %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المعادلة والاسم مقتطعان في الخلية نفسها («12.5%» و«Difenoconazole») ودُمجا كما يقرّهما المجموع 32.5 |
| 212 | `p172-y196.6` | اسم المادة الفعالة | Azoxystrobin 20% + 12.5% + Difenoconazole %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المعادلة والاسم مقتطعان في الخلية نفسها («12.5%» و«Difenoconazole») ودُمجا كما يقرّهما المجموع 32.5 |
| 213 | `p172-y232.1` | اسم المادة الفعالة | Azoxystrobin 20% + %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−20=12.5 وسطر المصدر يحمل Difenoconazole 12.5% وحده |
| 214 | `p172-y267.5` | اسم المادة الفعالة | Azoxystrobin 20% + 12.5% + Difenoconazole %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المعادلة والاسم مقتطعان في الخلية نفسها («12.5%» و«Difenoconazole») ودُمجا كما يقرّهما المجموع 32.5 |
| 215 | `p173-y498.2` | اسم المادة الفعالة | + Chlorothalonil 50% %56 SC | Azoxystrobin 6% + Chlorothalonil 50% %56 SC | المكوّن الناقص مقيّد بالمجموع 56−50=6 وسطر المصدر يحمل Azoxystrobin 6% وحده |
| 216 | `p173-y571.7` | اسم المادة الفعالة | Azoxystrobin 6% + %56 SC | Azoxystrobin 6% + Chlorothalonil 50% %56 SC | المكوّن الناقص مقيّد بالمجموع 56−6=50 وسطر المصدر يحمل Chlorothalonil 50% وحده |
| 217 | `p173-y597.8` | اسم المادة الفعالة | Azoxystrobin 6% + %56 SC | Azoxystrobin 6% + Chlorothalonil 50% %56 SC | المكوّن الناقص مقيّد بالمجموع 56−6=50 وسطر المصدر يحمل Chlorothalonil 50% وحده |
| 218 | `p173-y634.4` | اسم المادة الفعالة | + %56 SC | Azoxystrobin 6% + Chlorothalonil 50% %56 SC | كلا المكوّنين في سطرَي الصف والجمع 6+50=56؛ الأعلى أولاً كترتيب الطباعة |
| 219 | `p173-y659.3` | اسم المادة الفعالة | Azoxystrobin 6% + %56 SC | Azoxystrobin 6% + Chlorothalonil 50% %56 SC | المكوّن الناقص مقيّد بالمجموع 56−6=50 وسطر المصدر يحمل Chlorothalonil 50% وحده |
| 220 | `p173-y739.1` | اسم المادة الفعالة | Azoxystrobin 6% + %56 SC | Azoxystrobin 6% + Chlorothalonil 50% %56 SC | المكوّن الناقص مقيّد بالمجموع 56−6=50 وسطر المصدر يحمل Chlorothalonil 50% وحده |
| 221 | `p179-y601.5` | اسم المادة الفعالة | + Tetraconazole 10% %35 EW | Prochloraz 25% + Tetraconazole 10% %35 EW | المكوّن الناقص مقيّد بالمجموع 35−10=25 وسطر المصدر يحمل Prochloraz 25% وحده |
| 222 | `p179-y669.5` | اسم المادة الفعالة | + %40 EW | Prochloraz 26.7% + Tebuconazole 13.3% %40 EW | كلا المكوّنين في سطرَي الصف والجمع 26.7+13.3=40؛ الأعلى أولاً كترتيب الطباعة |
| 223 | `p179-y706.9` | اسم المادة الفعالة | Difenoconazole 15% + %30 EC | Difenoconazole 15% + Propiconazole 15% %30 EC | المكوّن الناقص مقيّد بالمجموع 30−15=15 وسطر المصدر يحمل Propiconazole 15% وحده |
| 224 | `p180-y399.7` | اسم المادة الفعالة | + %30 SC | Kresoxim-methyl 15% + Tebuconazole 15% %30 SC | كلا المكوّنين في سطرَي الصف والجمع 15+15=30؛ الأعلى أولاً كترتيب الطباعة |
| 225 | `p181-y458.5` | اسم المادة الفعالة | Acetamiprid 5% + %7.5 EC | Acetamiprid 5% + Bifenthrin 2.5% %7.5 EC | المكوّن الناقص مقيّد بالمجموع 7.5−5=2.5 وسطر المصدر يحمل Bifenthrin 2.5% وحده |
| 226 | `p181-y489.6` | اسم المادة الفعالة | Acetamiprid 5% + %7.5 EC | Acetamiprid 5% + Bifenthrin 2.5% %7.5 EC | المكوّن الناقص مقيّد بالمجموع 7.5−5=2.5 وسطر المصدر يحمل Bifenthrin 2.5% وحده |
| 227 | `p183-y421.0` | اسم المادة الفعالة | Abamectin 1.3% + %10.1 EC | Abamectin 1.3% + Bifenthrin 8.8% %10.1 EC | المكوّن الناقص مقيّد بالمجموع 10.1−1.3=8.8 وسطر المصدر يحمل Bifenthrin 8.8% وحده |
| 228 | `p184-y501.1` | اسم المادة الفعالة | Kresoxim- ethyl 15% + %30 SC | Kresoxim-methyl 15% + %30 SC | المكوّن الناقص مقيّد بالمجموع 30−15=15 وسطر المصدر يحمل Tebuconazole 15% وحده |
| 229 | `p184-y501.1` | اسم المادة الفعالة | Kresoxim-methyl 15% + %30 SC | Kresoxim-methyl 15% + Tebuconazole 15% %30 SC | المكوّن الناقص مقيّد بالمجموع 30−15=15 وسطر المصدر يحمل Tebuconazole 15% وحده |
| 230 | `p184-y543.6` | اسم المادة الفعالة | Kresoxim- ethyl 15% + Tebuconazole 15% %30 SC | Kresoxim-methyl 15% + Tebuconazole 15% %30 SC |  |
| 231 | `p185-y735.8` | اسم المادة الفعالة | + %16 WP | Dithianon 12% + Pyraclostrobin 4% %16 WP | كلا المكوّنين في سطرَي الصف والجمع 12+4=16؛ الأعلى أولاً كترتيب الطباعة |
| 232 | `p188-y595.7` | اسم المادة الفعالة | Acetamiprid 5% + %7.5 EC | Acetamiprid 5% + Bifenthrin 2.5% %7.5 EC | المكوّن الناقص مقيّد بالمجموع 7.5−5=2.5 وسطر المصدر يحمل Bifenthrin 2.5% وحده |
| 233 | `p188-y635.4` | اسم المادة الفعالة | Acetamiprid 5% + %7.5 EC | Acetamiprid 5% + Bifenthrin 2.5% %7.5 EC | المكوّن الناقص مقيّد بالمجموع 7.5−5=2.5 وسطر المصدر يحمل Bifenthrin 2.5% وحده |
| 234 | `p188-y675.1` | اسم المادة الفعالة | + Bifenthrin 27.3% %50 WP | Acetamiprid 22.7% + Bifenthrin 27.3% %50 WP | المكوّن الناقص مقيّد بالمجموع 50−27.3=22.7 وسطر المصدر يحمل Acetamiprid 22.7% وحده |
| 235 | `p188-y714.7` | اسم المادة الفعالة | Acetamiprid 6.4% + %11.2 EC | Acetamiprid 6.4% + Emamectin benzoate 4.8% %11.2 EC | المكوّن الناقص مقيّد بالمجموع 11.2−6.4=4.8 وسطر المصدر يحمل Emamectin benzoate 4.8% وحده |
| 236 | `p193-y238.0` | اسم المادة الفعالة | + Methoxyfenozide 30% %36 SC | Spinetoram 6% + Methoxyfenozide 30% %36 SC | المكوّن الناقص مقيّد بالمجموع 36−30=6 وسطر المصدر يحمل Spinetoram 6% وحده |
| 237 | `p193-y688.4` | اسم المادة الفعالة | + %30 SC | Chlorfenapyr 20% + Pyriproxyfen 10% %30 SC | كلا المكوّنين في سطرَي الصف والجمع 20+10=30؛ الأعلى أولاً كترتيب الطباعة |
| 238 | `p193-y730.3` | اسم المادة الفعالة | + %30 SC | Pyriproxyfen 10% + Chlorfenapyr 20% %30 SC | كلا المكوّنين في سطرَي الصف والجمع 10+20=30؛ الأعلى أولاً كترتيب الطباعة |
| 239 | `p198-y561.3` | اسم المادة الفعالة | + Bifenthrin 27.3% %50 WP | Acetamiprid 22.7% + Bifenthrin 27.3% %50 WP | المكوّن الناقص مقيّد بالمجموع 50−27.3=22.7 وسطر المصدر يحمل Acetamiprid 22.7% وحده |
| 240 | `p201-y561.5` | اسم المادة الفعالة | + Bifenthrin 27.3% %50 WP | Acetamiprid 22.7% + Bifenthrin 27.3% %50 WP | المكوّن الناقص مقيّد بالمجموع 50−27.3=22.7 وسطر المصدر يحمل Acetamiprid 22.7% وحده |
| 241 | `p201-y594.1` | اسم المادة الفعالة | + %7.5 EC | Acetamiprid 5% + Bifenthrin 2.5% %7.5 EC | كلا المكوّنين في سطرَي الصف والجمع 5+2.5=7.5؛ الأعلى أولاً كترتيب الطباعة |
| 242 | `p202-y598.7` | اسم المادة الفعالة | + Bifenthrin 27.3% %50 WP | Acetamiprid 22.7% + Bifenthrin 27.3% %50 WP | المكوّن الناقص مقيّد بالمجموع 50−27.3=22.7 وسطر المصدر يحمل Acetamiprid 22.7% وحده |
| 243 | `p205-y355.2` | اسم المادة الفعالة | Dimetho orph 38% + Pyraclostrobin 10% %48 WG | Dimethomorph 38% + Pyraclostrobin 10% %48 WG |  |
| 244 | `p205-y519.6` | اسم المادة الفعالة | Fluopyram 12.5% + %50 SC | Fluopyram 12.5% + Pyrimethanil 37.5% %50 SC | المكوّن الناقص مقيّد بالمجموع 50−12.5=37.5 وسطر المصدر يحمل Pyrimethanil 37.5% وحده |
| 245 | `p205-y655.7` | اسم المادة الفعالة | Boscalid 20% + %30 SC | Boscalid 20% + Pyraclostrobin 10% %30 SC | المكوّن الناقص مقيّد بالمجموع 30−20=10 وسطر المصدر يحمل Pyraclostrobin 10% وحده |
| 246 | `p205-y740.7` | اسم المادة الفعالة | Cyproconazole 8.9% + %37.4 EC | Cyproconazole 8.9% + Pyraclostrobin 28.5% %37.4 EC | المكوّن الناقص مقيّد بالمجموع 37.4−8.9=28.5 وسطر المصدر يحمل Pyraclostrobin 28.5% وحده |
| 247 | `p206-y386.7` | اسم المادة الفعالة | Dimetho orph 38% + Pyraclostrobin 10% %48 WG | Dimethomorph 38% + Pyraclostrobin 10% %48 WG |  |
| 248 | `p206-y669.3` | اسم المادة الفعالة | Pyraclostrobin 18.7% + %30.4 EC | Pyraclostrobin 18.7% + Propiconazole 11.7% %30.4 EC | المكوّن الناقص مقيّد بالمجموع 30.4−18.7=11.7 وسطر المصدر يحمل Propiconazole 11.7% وحده |
| 249 | `p207-y276.6` | اسم المادة الفعالة | Fluopyram 17% + %34.6 SC | Fluopyram 17% + Tebuconazole 17.6% %34.6 SC | المكوّن الناقص مقيّد بالمجموع 34.6−17=17.6 وسطر المصدر يحمل Tebuconazole 17.6% وحده |
| 250 | `p207-y307.7` | اسم المادة الفعالة | Cyproconazole 8.9% + %37.4 EC | Cyproconazole 8.9% + Pyraclostrobin 28.5% %37.4 EC | المكوّن الناقص مقيّد بالمجموع 37.4−8.9=28.5 وسطر المصدر يحمل Pyraclostrobin 28.5% وحده |
| 251 | `p209-y589.0` | اسم المادة الفعالة | 1 ٫ 3 Dichloropropene 60.8% + Chloropicrin 33.3% %94.1 EC | 1.3 Dichloropropene 60.8% + Chloropicrin 33.3% %94.1 EC |  |
| 252 | `p211-y251.3` | اسم المادة الفعالة | Etoxazole 10% + %20 | Etoxazole 10% + Fenpropathrin 10% %20 | المكوّن الناقص مقيّد بالمجموع 20−10=10 وسطر المصدر يحمل Fenpropathrin 10% وحده |
| 253 | `p211-y334.7` | اسم المادة الفعالة | Acetamiprid 5% + 2.5% + Bifenthrin %7.5 EC | Acetamiprid 5% + Bifenthrin 2.5% %7.5 EC | المعادلة والاسم مقتطعان في الخلية نفسها («2.5%» و«Bifenthrin») ودُمجا كما يقرّهما المجموع 7.5 |
| 254 | `p211-y362.4` | اسم المادة الفعالة | Buprofezin 10% + 20% + Imidacloprid %30 SC | Buprofezin 10% + Imidacloprid 20% %30 SC | المعادلة والاسم مقتطعان في الخلية نفسها («20%» و«Imidacloprid») ودُمجا كما يقرّهما المجموع 30 |
| 255 | `p211-y390.2` | اسم المادة الفعالة | Abamectin 1.3% + 8.8% + Bifenthrin %10.1 EC | Abamectin 1.3% + Bifenthrin 8.8% %10.1 EC | المعادلة والاسم مقتطعان في الخلية نفسها («8.8%» و«Bifenthrin») ودُمجا كما يقرّهما المجموع 10.1 |
| 256 | `p211-y418.0` | اسم المادة الفعالة | Acetamiprid 5% + 2.5% + Bifenthrin %7.5 EC | Acetamiprid 5% + Bifenthrin 2.5% %7.5 EC | المعادلة والاسم مقتطعان في الخلية نفسها («2.5%» و«Bifenthrin») ودُمجا كما يقرّهما المجموع 7.5 |
| 257 | `p217-y389.5` | اسم المادة الفعالة | Abamectin 1% + %10 EC | Abamectin 1% + Hexythiazox 9% %10 EC | المكوّن الناقص مقيّد بالمجموع 10−1=9 وسطر المصدر يحمل Hexythiazox 9% وحده |
| 258 | `p217-y691.4` | اسم المادة الفعالة | Abamectin 2.2% + %45.4 SC | Abamectin 2.2% + Bifenazate 43.2% %45.4 SC | المكوّن الناقص مقيّد بالمجموع 45.4−2.2=43.2 وسطر المصدر يحمل Bifenazate 43.2% وحده |
| 259 | `p218-y422.6` | اسم المادة الفعالة | Abamectin 2% + %20 SC | Abamectin 2% + Spirodiclofen 18% %20 SC | المكوّن الناقص مقيّد بالمجموع 20−2=18 وسطر المصدر يحمل Spirodiclofen 18% وحده |
| 260 | `p219-y740.1` | اسم المادة الفعالة | Abamectin 2% + %32 SC | Abamectin 2% + Bifenazate 30% %32 SC | المكوّن الناقص مقيّد بالمجموع 32−2=30 وسطر المصدر يحمل Bifenazate 30% وحده |
| 261 | `p225-y460.1` | اسم المادة الفعالة | Difenoconazole 15% + %30 EC | Difenoconazole 15% + Propiconazole 15% %30 EC | المكوّن الناقص مقيّد بالمجموع 30−15=15 وسطر المصدر يحمل Propiconazole 15% وحده |
| 262 | `p225-y494.9` | اسم المادة الفعالة | Difenoconazole 15% + %30 EC | Difenoconazole 15% + Propiconazole 15% %30 EC | المكوّن الناقص مقيّد بالمجموع 30−15=15 وسطر المصدر يحمل Propiconazole 15% وحده |
| 263 | `p225-y624.5` | اسم المادة الفعالة | Difenoconazole 15% + %30 EC | Difenoconazole 15% + Propiconazole 15% %30 EC | المكوّن الناقص مقيّد بالمجموع 30−15=15 وسطر المصدر يحمل Propiconazole 15% وحده |
| 264 | `p228-y393.6` | اسم المادة الفعالة | + %30 SC | Azoxystrobin 12% + Difenoconazole 18% %30 SC | كلا المكوّنين في سطرَي الصف والجمع 12+18=30؛ الأعلى أولاً كترتيب الطباعة |
| 265 | `p228-y689.4` | اسم المادة الفعالة | Azoxystrobin 20% + %50 SC | Azoxystrobin 20% + Tebuconazole 30% %50 SC | المكوّن الناقص مقيّد بالمجموع 50−20=30 وسطر المصدر يحمل Tebuconazole 30% وحده |
| 266 | `p229-y194.8` | اسم المادة الفعالة | Prochloraz 40% + %49 EC | Prochloraz 40% + Propiconazole 9% %49 EC | المكوّن الناقص مقيّد بالمجموع 49−40=9 وسطر المصدر يحمل Propiconazole 9% وحده |
| 267 | `p229-y225.9` | اسم المادة الفعالة | Difenoconazole 15% + %30 EC | Difenoconazole 15% + Propiconazole 15% %30 EC | المكوّن الناقص مقيّد بالمجموع 30−15=15 وسطر المصدر يحمل Propiconazole 15% وحده |
| 268 | `p229-y288.3` | اسم المادة الفعالة | Azoxystrobin 11% + %29.5 | Azoxystrobin 11% + Propiconazole 18.5% %29.5 | المكوّن الناقص مقيّد بالمجموع 29.5−11=18.5 وسطر المصدر يحمل Propiconazole 18.5% وحده |
| 269 | `p229-y393.2` | اسم المادة الفعالة | Azoxystrobin 25% + %75 WG | Azoxystrobin 25% + Tebuconazole 50% %75 WG | المكوّن الناقص مقيّد بالمجموع 75−25=50 وسطر المصدر يحمل Tebuconazole 50% وحده |
| 270 | `p229-y723.4` | اسم المادة الفعالة | Azoxystrobin 20% + %50 SC | Azoxystrobin 20% + Tebuconazole 30% %50 SC | المكوّن الناقص مقيّد بالمجموع 50−20=30 وسطر المصدر يحمل Tebuconazole 30% وحده |
| 271 | `p230-y540.8` | اسم المادة الفعالة | + %75 WG | Tebuconazole 50% + Trifloxystrobin 25% %75 WG | كلا المكوّنين في سطرَي الصف والجمع 50+25=75؛ الأعلى أولاً كترتيب الطباعة |
| 272 | `p230-y675.1` | اسم المادة الفعالة | Tebuconazole 50% + %75 WG | Tebuconazole 50% + Trifloxystrobin 25% %75 WG | المكوّن الناقص مقيّد بالمجموع 75−50=25 وسطر المصدر يحمل Trifloxystrobin 25% وحده |
| 273 | `p230-y710.5` | اسم المادة الفعالة | Tebuconazole 50% + %75 WG | Tebuconazole 50% + Trifloxystrobin 25% %75 WG | المكوّن الناقص مقيّد بالمجموع 75−50=25 وسطر المصدر يحمل Trifloxystrobin 25% وحده |
| 274 | `p235-y307.6` | اسم المادة الفعالة | Methoxyfenozide 30% + %36 SC | Methoxyfenozide 30% + Spinetoram 6% %36 SC | المكوّن الناقص مقيّد بالمجموع 36−30=6 وسطر المصدر يحمل Spinetoram 6% وحده |
| 275 | `p238-y147.4` | اسم المادة الفعالة | Boscalid 25.2% + %38 WG | Boscalid 25.2% + Pyraclostrobin 12.8% %38 WG | المكوّن الناقص مقيّد بالمجموع 38−25.2=12.8 وسطر المصدر يحمل Pyraclostrobin 12.8% وحده |
| 276 | `p238-y178.6` | اسم المادة الفعالة | Boscalid 25% + %38 WG | Boscalid 25% + Pyraclostrobin 13% %38 WG | المكوّن الناقص مقيّد بالمجموع 38−25=13 وسطر المصدر يحمل Pyraclostrobin 13% وحده |
| 277 | `p238-y241.0` | اسم المادة الفعالة | Cyprodinil 37% + %62 WG | Cyprodinil 37% + Fludioxonil 25% %62 WG | المكوّن الناقص مقيّد بالمجموع 62−37=25 وسطر المصدر يحمل Fludioxonil 25% وحده |
| 278 | `p238-y272.1` | اسم المادة الفعالة | Cyprodinil 37.5% + %62.5 SC | Cyprodinil 37.5% + Fludioxonil 25% %62.5 SC | المكوّن الناقص مقيّد بالمجموع 62.5−37.5=25 وسطر المصدر يحمل Fludioxonil 25% وحده |
| 279 | `p238-y303.3` | اسم المادة الفعالة | Boscalid 25.2% + %38 WG | Boscalid 25.2% + Pyraclostrobin 12.8% %38 WG | المكوّن الناقص مقيّد بالمجموع 38−25.2=12.8 وسطر المصدر يحمل Pyraclostrobin 12.8% وحده |
| 280 | `p238-y334.5` | اسم المادة الفعالة | Boscalid 25.2% + %38 WG | Boscalid 25.2% + Pyraclostrobin 12.8% %38 WG | المكوّن الناقص مقيّد بالمجموع 38−25.2=12.8 وسطر المصدر يحمل Pyraclostrobin 12.8% وحده |
| 281 | `p238-y683.7` | اسم المادة الفعالة | Cyprodinil 37.5% + %62.5 WG | Cyprodinil 37.5% + Fludioxonil 25% %62.5 WG | المكوّن الناقص مقيّد بالمجموع 62.5−37.5=25 وسطر المصدر يحمل Fludioxonil 25% وحده |
| 282 | `p238-y712.1` | اسم المادة الفعالة | Cyprodinil 37% + %62 WG | Cyprodinil 37% + Fludioxonil 25% %62 WG | المكوّن الناقص مقيّد بالمجموع 62−37=25 وسطر المصدر يحمل Fludioxonil 25% وحده |
| 283 | `p238-y740.4` | اسم المادة الفعالة | Cyprodinil 37.5% + %62.5 WG | Cyprodinil 37.5% + Fludioxonil 25% %62.5 WG | المكوّن الناقص مقيّد بالمجموع 62.5−37.5=25 وسطر المصدر يحمل Fludioxonil 25% وحده |
| 284 | `p239-y440.1` | اسم المادة الفعالة | Boscalid 20% + %30 SC | Boscalid 20% + Kresoxim-methyl 10% %30 SC | المكوّن الناقص مقيّد بالمجموع 30−20=10 وسطر المصدر يحمل Kresoxim-methyl 10% وحده |
| 285 | `p239-y455.3` | اسم المادة الفعالة | Kresoxim- ethyl 10% | Kresoxim-methyl 10% |  |
| 286 | `p240-y147.2` | اسم المادة الفعالة | Boscalid 20% + %30 SC | Boscalid 20% + Kresoxim-methyl 10% %30 SC | المكوّن الناقص مقيّد بالمجموع 30−20=10 وسطر المصدر يحمل Kresoxim-methyl 10% وحده |
| 287 | `p240-y159.5` | اسم المادة الفعالة | Kresoxim- ethyl 10% | Kresoxim-methyl 10% |  |
| 288 | `p240-y250.7` | اسم المادة الفعالة | Boscalid 25.2% + %38 SC | Boscalid 25.2% + Pyraclostrobin 12.8% %38 SC | المكوّن الناقص مقيّد بالمجموع 38−25.2=12.8 وسطر المصدر يحمل Pyraclostrobin 12.8% وحده |
| 289 | `p240-y637.0` | اسم المادة الفعالة | Boscalid 25.2% + %38 SC | Boscalid 25.2% + Pyraclostrobin 12.8% %38 SC | المكوّن الناقص مقيّد بالمجموع 38−25.2=12.8 وسطر المصدر يحمل Pyraclostrobin 12.8% وحده |
| 290 | `p240-y668.2` | اسم المادة الفعالة | Azoxystrobin 20% + %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−20=12.5 وسطر المصدر يحمل Difenoconazole 12.5% وحده |
| 291 | `p241-y459.5` | اسم المادة الفعالة | Dimetho orph 12% + %18.7 WG | Dimethomorph 12% + %18.7 WG | المكوّن الناقص مقيّد بالمجموع 18.7−12=6.7 وسطر المصدر يحمل Pyraclostrobin 6.7% وحده |
| 292 | `p241-y459.5` | اسم المادة الفعالة | Dimethomorph 12% + %18.7 WG | Dimethomorph 12% + Pyraclostrobin 6.7% %18.7 WG | المكوّن الناقص مقيّد بالمجموع 18.7−12=6.7 وسطر المصدر يحمل Pyraclostrobin 6.7% وحده |
| 293 | `p241-y493.5` | اسم المادة الفعالة | Dimetho orph 12% + %18.7 WG | Dimethomorph 12% + %18.7 WG | المكوّن الناقص مقيّد بالمجموع 18.7−12=6.7 وسطر المصدر يحمل Pyraclostrobin 6.7% وحده |
| 294 | `p241-y493.5` | اسم المادة الفعالة | Dimethomorph 12% + %18.7 WG | Dimethomorph 12% + Pyraclostrobin 6.7% %18.7 WG | المكوّن الناقص مقيّد بالمجموع 18.7−12=6.7 وسطر المصدر يحمل Pyraclostrobin 6.7% وحده |
| 295 | `p241-y527.6` | اسم المادة الفعالة | Dimetho orph 12% + Pyraclostrobin 6.7% %18.7 WG | Dimethomorph 12% + Pyraclostrobin 6.7% %18.7 WG |  |
| 296 | `p241-y595.6` | اسم المادة الفعالة | Azoxystrobin 20% + %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−20=12.5 وسطر المصدر يحمل Difenoconazole 12.5% وحده |
| 297 | `p241-y629.6` | اسم المادة الفعالة | Azoxystrobin 20% + %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−20=12.5 وسطر المصدر يحمل Difenoconazole 12.5% وحده |
| 298 | `p241-y738.0` | اسم المادة الفعالة | Difenoconazole 15% + %30 EC | Difenoconazole 15% + Propiconazole 15% %30 EC | المكوّن الناقص مقيّد بالمجموع 30−15=15 وسطر المصدر يحمل Propiconazole 15% وحده |
| 299 | `p243-y276.0` | اسم المادة الفعالة | Boscalid 25.2% + %38 WG | Boscalid 25.2% + Pyraclostrobin 12.8% %38 WG | المكوّن الناقص مقيّد بالمجموع 38−25.2=12.8 وسطر المصدر يحمل Pyraclostrobin 12.8% وحده |
| 300 | `p243-y313.4` | اسم المادة الفعالة | Boscalid 20% + %30 SC | Boscalid 20% + Kresoxim-methyl 10% %30 SC | المكوّن الناقص مقيّد بالمجموع 30−20=10 وسطر المصدر يحمل Kresoxim-methyl 10% وحده |
| 301 | `p243-y327.4` | اسم المادة الفعالة | Kresoxim- ethyl 10% | Kresoxim-methyl 10% |  |
| 302 | `p243-y378.6` | اسم المادة الفعالة | Dimetho orph 12% + %18.7 WG | Dimethomorph 12% + %18.7 WG | المكوّن الناقص مقيّد بالمجموع 18.7−12=6.7 وسطر المصدر يحمل Pyraclostrobin 6.7% وحده |
| 303 | `p243-y378.6` | اسم المادة الفعالة | Dimethomorph 12% + %18.7 WG | Dimethomorph 12% + Pyraclostrobin 6.7% %18.7 WG | المكوّن الناقص مقيّد بالمجموع 18.7−12=6.7 وسطر المصدر يحمل Pyraclostrobin 6.7% وحده |
| 304 | `p243-y657.8` | اسم المادة الفعالة | Boscalid 25.5% + %38 WG | Boscalid 25.5% + Pyraclostrobin 12.5% %38 WG | المكوّن الناقص مقيّد بالمجموع 38−25.5=12.5 وسطر المصدر يحمل Pyraclostrobin 12.5% وحده |
| 305 | `p244-y143.3` | اسم المادة الفعالة | Dimetho orph 12% + %18.7 WG | Dimethomorph 12% + %18.7 WG | المكوّن الناقص مقيّد بالمجموع 18.7−12=6.7 وسطر المصدر يحمل Pyraclostrobin 6.7% وحده |
| 306 | `p244-y143.3` | اسم المادة الفعالة | Dimethomorph 12% + %18.7 WG | Dimethomorph 12% + Pyraclostrobin 6.7% %18.7 WG | المكوّن الناقص مقيّد بالمجموع 18.7−12=6.7 وسطر المصدر يحمل Pyraclostrobin 6.7% وحده |
| 307 | `p244-y174.5` | اسم المادة الفعالة | Dimetho orph 12% + %18.7 WG | Dimethomorph 12% + %18.7 WG | المكوّن الناقص مقيّد بالمجموع 18.7−12=6.7 وسطر المصدر يحمل Pyraclostrobin 6.7% وحده |
| 308 | `p244-y174.5` | اسم المادة الفعالة | Dimethomorph 12% + %18.7 WG | Dimethomorph 12% + Pyraclostrobin 6.7% %18.7 WG | المكوّن الناقص مقيّد بالمجموع 18.7−12=6.7 وسطر المصدر يحمل Pyraclostrobin 6.7% وحده |
| 309 | `p244-y205.7` | اسم المادة الفعالة | Difenoconazole 12.5% + %20 SC | Difenoconazole 12.5% + Pydiflumetofen 7.5% %20 SC | المكوّن الناقص مقيّد بالمجموع 20−12.5=7.5 وسطر المصدر يحمل Pydiflumetofen 7.5% وحده |
| 310 | `p244-y236.9` | اسم المادة الفعالة | Fluopyram 25% + 25% + Trifloxystrobin %50 SC | Fluopyram 25% + Trifloxystrobin 25% %50 SC | المعادلة والاسم مقتطعان في الخلية نفسها («25%» و«Trifloxystrobin») ودُمجا كما يقرّهما المجموع 50 |
| 311 | `p244-y268.0` | اسم المادة الفعالة | Trifloxystrobin 25% + %75 WG | Trifloxystrobin 25% + Tebuconazole 50% %75 WG | المكوّن الناقص مقيّد بالمجموع 75−25=50 وسطر المصدر يحمل Tebuconazole 50% وحده |
| 312 | `p244-y323.3` | اسم المادة الفعالة | Azoxystrobin 20% + %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−20=12.5 وسطر المصدر يحمل Difenoconazole 12.5% وحده |
| 313 | `p244-y354.5` | اسم المادة الفعالة | Azoxystrobin 20% + %32.5 SC | Azoxystrobin 20% + Difenoconazole 12.5% %32.5 SC | المكوّن الناقص مقيّد بالمجموع 32.5−20=12.5 وسطر المصدر يحمل Difenoconazole 12.5% وحده |
| 314 | `p244-y385.7` | اسم المادة الفعالة | Dimetho orph 12% + Pyraclostrobin 6.7% %18.7 WG | Dimethomorph 12% + Pyraclostrobin 6.7% %18.7 WG |  |
| 315 | `p245-y251.6` | اسم المادة الفعالة | Copper oxychloride 67.7% + Dimetho orph 6% %73.2 WP | Copper oxychloride 67.7% + Dimethomorph 6% %73.2 WP |  |
| 316 | `p245-y288.8` | اسم المادة الفعالة | Dimetho orph 50% %70 WG | Dimethomorph 50% %70 WG |  |
| 317 | `p245-y318.2` | اسم المادة الفعالة | Cymoxanil 30% + %52.5 WG | Cymoxanil 30% + Famoxadone 22.5% %52.5 WG | المكوّن الناقص مقيّد بالمجموع 52.5−30=22.5 وسطر المصدر يحمل Famoxadone 22.5% وحده |
| 318 | `p245-y638.9` | اسم المادة الفعالة | Dimetho orph 50% %70 WG | Dimethomorph 50% %70 WG |  |
| 319 | `p245-y678.2` | اسم المادة الفعالة | Azoxystrobin 20% + 8% + Cyproconazole %28 SC | Azoxystrobin 20% + Cyproconazole 8% %28 SC | المعادلة والاسم مقتطعان في الخلية نفسها («8%» و«Cyproconazole») ودُمجا كما يقرّهما المجموع 28 |
| 320 | `p246-y141.9` | اسم المادة الفعالة | Fluopicolide 4.44% + %71.11 WG | Fluopicolide 4.44% + Fosetyl-Aluminium 66.67% %71.11 WG | المكوّن الناقص مقيّد بالمجموع 71.11−4.44=66.67 وسطر المصدر يحمل Fosetyl-Aluminium 66.67% وحده |
| 321 | `p246-y349.0` | اسم المادة الفعالة | Azoxystrobin 20% + Dimetho orph 50% %70 WG | Azoxystrobin 20% + Dimethomorph 50% %70 WG |  |
| 322 | `p247-y337.3` | اسم المادة الفعالة | Copper oxychloride 67% + Dimetho orph 6% %73 WP | Copper oxychloride 67% + Dimethomorph 6% %73 WP |  |
| 323 | `p248-y173.4` | اسم المادة الفعالة | Azoxystrobin 20% + 8% + Cyproconazole %28 SC | Azoxystrobin 20% + Cyproconazole 8% %28 SC | المعادلة والاسم مقتطعان في الخلية نفسها («8%» و«Cyproconazole») ودُمجا كما يقرّهما المجموع 28 |
| 324 | `p248-y630.0` | اسم المادة الفعالة | Azoxystrobin 20% + Dimetho orph 10% %30 WG | Azoxystrobin 20% + Dimethomorph 10% %30 WG |  |
| 325 | `p248-y675.4` | اسم المادة الفعالة | Dimetho orph 12% + Pyraclostrobin 6.7% %18.7 WG | Dimethomorph 12% + Pyraclostrobin 6.7% %18.7 WG |  |
| 326 | `p251-y726.2` | اسم المادة الفعالة | + %7.5 EC | Acetamiprid 5% + Bifenthrin 2.5% %7.5 EC | كلا المكوّنين في سطرَي الصف والجمع 5+2.5=7.5؛ الأعلى أولاً كترتيب الطباعة |
| 327 | `p264-y252.1` | اسم المادة الفعالة | + Thiophanate-methyl 44% %50 WP | Difenoconazole 6% + Thiophanate-methyl 44% %50 WP | المكوّن الناقص مقيّد بالمجموع 50−44=6 وسطر المصدر يحمل Difenoconazole 6% وحده |
| 328 | `p264-y423.8` | اسم المادة الفعالة | + %30 EC | Difenoconazole 15% + Propiconazole 15% %30 EC | كلا المكوّنين في سطرَي الصف والجمع 15+15=30؛ الأعلى أولاً كترتيب الطباعة |
| 329 | `p264-y571.2` | اسم المادة الفعالة | + %50 SC | Azoxystrobin 20% + Fluazinam 30% %50 SC | كلا المكوّنين في سطرَي الصف والجمع 20+30=50؛ الأعلى أولاً كترتيب الطباعة |
| 330 | `p265-y686.5` | اسم المادة الفعالة | Boscalid 25.2% + %38 WG | Boscalid 25.2% + Pyraclostrobin 12.8% %38 WG | المكوّن الناقص مقيّد بالمجموع 38−25.2=12.8 وسطر المصدر يحمل Pyraclostrobin 12.8% وحده |
| 331 | `p265-y737.5` | اسم المادة الفعالة | Boscalid 25.2% + %38 WG | Boscalid 25.2% + Pyraclostrobin 12.8% %38 WG | المكوّن الناقص مقيّد بالمجموع 38−25.2=12.8 وسطر المصدر يحمل Pyraclostrobin 12.8% وحده |
| 332 | `p266-y220.4` | اسم المادة الفعالة | Boscalid 20% + %30 SC | Boscalid 20% + Pyraclostrobin 10% %30 SC | المكوّن الناقص مقيّد بالمجموع 30−20=10 وسطر المصدر يحمل Pyraclostrobin 10% وحده |
| 333 | `p270-y409.8` | اسم المادة الفعالة | + %10 EC | Abamectin 1% + Hexythiazox 9% %10 EC | كلا المكوّنين في سطرَي الصف والجمع 1+9=10؛ الأعلى أولاً كترتيب الطباعة |
| 334 | `p271-y524.3` | اسم المادة الفعالة | Thiophanate-methyl 40% + %50 SC | Thiophanate-methyl 40% + Pyraclostrobin 10% %50 SC | المكوّن الناقص مقيّد بالمجموع 50−40=10 وسطر المصدر يحمل Pyraclostrobin 10% وحده |

## ب) صفوف صارت NEEDS_VERIFICATION

| # | المعرّف | النوع | القيمة قبل | السبب |
|---|---|---|---|---|
| 1 | `p17-y751.8` | fragment | Tebuconazole 6% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p17-y735.7` — من صنف شظايا التسعين |
| 2 | `p18-y439.8` | name-missing | + | اسم المادة غير محفوظ في الخلية (رمز أو تركيب وحده)؛ يحتاج إعادة استخراج بنيوية من سطر الصف |
| 3 | `p18-y476.7` | name-missing | + | اسم المادة غير محفوظ في الخلية (رمز أو تركيب وحده)؛ يحتاج إعادة استخراج بنيوية من سطر الصف |
| 4 | `p19-y310.8` | fragment | Propiconazole 15% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p19-y295.5` — من صنف شظايا التسعين |
| 5 | `p19-y434.5` | fragment | Propiconazole 24% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p19-y420.5` — من صنف شظايا التسعين |
| 6 | `p19-y454.5` | name-incomplete | Pyraclostrobin 18.7% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 7 | `p19-y580.2` | fragment | Cyproconazole 8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p19-y566.2` — من صنف شظايا التسعين |
| 8 | `p19-y670.9` | fragment | Propiconazole 11.4% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p19-y656.9` — من صنف شظايا التسعين |
| 9 | `p20-y158.2` | prose | � أمرا V ض اأمراضض | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 10 | `p24-y474.4` | fragment | Azoxystrobin 20% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p24-y483.9` — من صنف شظايا التسعين |
| 11 | `p24-y549.5` | name-incomplete | Copper oxychloride 69% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 12 | `p25-y235.9` | name-incomplete | Azoxystrobin 20% + %32 SC | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 13 | `p25-y269.4` | name-incomplete | Azoxystrobin 20% + %32 SC | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 14 | `p25-y617.9` | fragment | Dimethomorph 22.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p25-y603.9` — من صنف شظايا التسعين |
| 15 | `p28-y271.8` | fragment | Cyprodinil 37.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p28-y285.3` — من صنف شظايا التسعين |
| 16 | `p28-y358.7` | prose | مر V ض مرضض | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 17 | `p30-y591.1` | prose | البيا البياضض | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 18 | `p35-y792.8` | prose | وزارة الزراعة واستصالح الأراضى 22 | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 19 | `p37-y319.9` | fragment | Novaluron 5.25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p37-y305.9` — من صنف شظايا التسعين |
| 20 | `p37-y466.9` | prose | U | الخلية تحمل رمز WHO وحده (U) والسطر المصاحب ترويسة نصّية |
| 21 | `p37-y638.1` | prose | فى الأوراق % 5 - 3 من | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 22 | `p39-y603.6` | name-incomplete | Difenoconazole 20% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 23 | `p40-y215.8` | fragment | Propiconazole 15% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p40-y200.8` — من صنف شظايا التسعين |
| 24 | `p40-y271.8` | fragment | Propiconazole 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p40-y256.8` — من صنف شظايا التسعين |
| 25 | `p40-y304.4` | fragment | Propiconazole 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p40-y289.4` — من صنف شظايا التسعين |
| 26 | `p40-y337.0` | fragment | Difenoconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p40-y322.0` — من صنف شظايا التسعين |
| 27 | `p40-y389.4` | fragment | Difenoconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p40-y374.4` — من صنف شظايا التسعين |
| 28 | `p40-y454.6` | fragment | Propiconazole 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p40-y439.6` — من صنف شظايا التسعين |
| 29 | `p40-y487.2` | fragment | Propiconazole 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p40-y472.2` — من صنف شظايا التسعين |
| 30 | `p40-y519.8` | fragment | Propiconazole 15% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p40-y504.8` — من صنف شظايا التسعين |
| 31 | `p40-y572.2` | fragment | Propiconazole 15% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p40-y557.2` — من صنف شظايا التسعين |
| 32 | `p41-y216.1` | fragment | Propiconazole 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p41-y201.1` — من صنف شظايا التسعين |
| 33 | `p41-y250.1` | fragment | Propiconazole 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p41-y235.1` — من صنف شظايا التسعين |
| 34 | `p41-y340.8` | fragment | Propiconazole 15% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p41-y325.8` — من صنف شظايا التسعين |
| 35 | `p41-y439.3` | fragment | Cyproconazole 8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p41-y424.3` — من صنف شظايا التسعين |
| 36 | `p41-y649.8` | fragment | Propiconazole 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p41-y634.8` — من صنف شظايا التسعين |
| 37 | `p41-y717.8` | fragment | Difenoconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p41-y702.8` — من صنف شظايا التسعين |
| 38 | `p43-y442.5` | prose | الربسيم حديث الإنبات ووجود | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 39 | `p48-y380.3` | prose | تصل فيه نسبة الإصابة | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 40 | `p48-y396.9` | prose | ليالى 3 فراشات فى 8 | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 41 | `p52-y632.9` | fragment | Metalaxyl-M 1% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p52-y615.9` — من صنف شظايا التسعين |
| 42 | `p55-y634.6` | prose | حبوب 4-3( فردية سم ) لونها 1 حوالى | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 43 | `p57-y186.7` | prose | ابي  ضا V ابيضضاضض | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 44 | `p59-y340.6` | prose | نباتات مصابة مع %10 | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 45 | `p62-y347.0` | name-incomplete | Fludioxonil 2.5% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 46 | `p62-y648.9` | name-missing | + | اسم المادة غير محفوظ في الخلية (رمز أو تركيب وحده)؛ يحتاج إعادة استخراج بنيوية من سطر الصف |
| 47 | `p68-y280.9` | fragment | Fludioxonil 1.1% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p68-y244.0` — من صنف شظايا التسعين |
| 48 | `p68-y655.0` | fragment | Azoxystrobin 10% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p68-y664.4` — من صنف شظايا التسعين |
| 49 | `p75-y218.6` | prose | لأرضاملستدمية مبدة ترتاوح بني | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 50 | `p75-y300.6` | prose | وخاصة بعد نقل الشتت | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 51 | `p76-y677.7` | fragment | Thiamethoxam 12.6% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p76-y663.7` — من صنف شظايا التسعين |
| 52 | `p91-y530.8` | fragment | Metalaxyl-M 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p91-y515.8` — من صنف شظايا التسعين |
| 53 | `p94-y622.2` | fragment | Difenoconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p94-y597.5` — من صنف شظايا التسعين |
| 54 | `p94-y757.8` | fragment | Difenoconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p94-y735.9` — من صنف شظايا التسعين |
| 55 | `p95-y657.3` | fragment | Tebuconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p95-y643.8` — من صنف شظايا التسعين |
| 56 | `p95-y685.7` | fragment | Tebuconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p95-y672.2` — من صنف شظايا التسعين |
| 57 | `p96-y155.6` | fragment | Propiconazole 15% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p96-y142.1` — من صنف شظايا التسعين |
| 58 | `p96-y183.9` | fragment | Dimetho orph 10% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p96-y170.4` — من صنف شظايا التسعين |
| 59 | `p96-y337.0` | fragment | Metalaxyl 8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p96-y323.5` — من صنف شظايا التسعين |
| 60 | `p96-y563.8` | fragment | Pyraclostrobin 15% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p96-y550.3` — من صنف شظايا التسعين |
| 61 | `p96-y609.1` | fragment | Metalaxyl 8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p96-y595.6` — من صنف شظايا التسعين |
| 62 | `p96-y658.7` | fragment | Metiram 55% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p96-y645.2` — من صنف شظايا التسعين |
| 63 | `p96-y752.3` | fragment | Metalaxyl 8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p96-y738.8` — من صنف شظايا التسعين |
| 64 | `p97-y620.0` | fragment | Chlorothalonil 64% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p97-y632.4` — من صنف شظايا التسعين |
| 65 | `p99-y235.9` | name-incomplete | Benalaxyl 6% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 66 | `p99-y522.7` | fragment | Difenoconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p99-y508.7` — من صنف شظايا التسعين |
| 67 | `p99-y590.7` | fragment | Difenoconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p99-y576.7` — من صنف شظايا التسعين |
| 68 | `p99-y650.3` | fragment | Difenoconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p99-y636.3` — من صنف شظايا التسعين |
| 69 | `p104-y213.6` | prose | الغري كاملة باإستخدام عدسة | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 70 | `p104-y297.0` | prose | حشرات على الورقة 5 | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 71 | `p104-y709.0` | prose | Y اخلوخ الأوراق الفريوسى (الفراغ بين Y والتالي أُضيف هنا لسلامة التوثيق؛ الأصل في الطباعة ملتصق بلا فاصل) | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 72 | `p105-y257.2` | name-missing | + | اسم المادة غير محفوظ في الخلية (رمز أو تركيب وحده)؛ يحتاج إعادة استخراج بنيوية من سطر الصف |
| 73 | `p106-y352.8` | prose | من النباتات التى مت فحصها %5 | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 74 | `p115-y501.6` | name-incomplete | Dimethomorph 12% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 75 | `p115-y713.2` | name-incomplete | Tetraconazole 2.09% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 76 | `p115-y742.6` | name-incomplete | Dimethomorph 7.2% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 77 | `p116-y298.5` | name-incomplete | Azoxystrobin 24% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 78 | `p117-y389.9` | fragment | Pyraclostrobin 10% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p117-y375.9` — من صنف شظايا التسعين |
| 79 | `p117-y421.9` | fragment | Pyraclostrobin 5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p117-y407.9` — من صنف شظايا التسعين |
| 80 | `p117-y440.0` | name-incomplete | Dimethomorph 7.2% + %11.2 EC | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 81 | `p117-y557.1` | fragment | Metalaxyl 8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p117-y543.1` — من صنف شظايا التسعين |
| 82 | `p117-y608.3` | name-incomplete | Fluopyram 12.5% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 83 | `p117-y654.9` | fragment | Metalaxyl- M 10.9% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p117-y640.9` — من صنف شظايا التسعين |
| 84 | `p117-y720.1` | fragment | Propiconazole 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p117-y706.1` — من صنف شظايا التسعين |
| 85 | `p117-y752.7` | fragment | Metalaxyl 8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p117-y738.7` — من صنف شظايا التسعين |
| 86 | `p118-y202.4` | fragment | Metalaxyl 8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p118-y188.4` — من صنف شظايا التسعين |
| 87 | `p118-y256.2` | fragment | Pyraclostrobin 6.7% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p118-y242.2` — من صنف شظايا التسعين |
| 88 | `p118-y403.6` | fragment | Pyraclostrobin 13.3% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p118-y389.6` — من صنف شظايا التسعين |
| 89 | `p118-y553.2` | fragment | Difenoconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p118-y539.2` — من صنف شظايا التسعين |
| 90 | `p118-y719.0` | fragment | Metalaxyl 8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p118-y705.0` — من صنف شظايا التسعين |
| 91 | `p120-y301.3` | fragment | Zoxamide 18% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p120-y287.3` — من صنف شظايا التسعين |
| 92 | `p120-y380.7` | fragment | Tebuconazole 50% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p120-y366.7` — من صنف شظايا التسعين |
| 93 | `p120-y508.3` | fragment | Mancozeb 60% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p120-y494.3` — من صنف شظايا التسعين |
| 94 | `p120-y556.5` | fragment | Metalaxyl-M 4% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p120-y542.5` — من صنف شظايا التسعين |
| 95 | `p120-y573.6` | name-incomplete | Dimethomorph 7.2% + %11 EC | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 96 | `p121-y717.8` | fragment | Fluazinam 17% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p121-y705.3` — من صنف شظايا التسعين |
| 97 | `p121-y751.8` | fragment | Mancozeb 60% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p121-y737.8` — من صنف شظايا التسعين |
| 98 | `p122-y258.1` | name-missing | + | اسم المادة غير محفوظ في الخلية (رمز أو تركيب وحده)؛ يحتاج إعادة استخراج بنيوية من سطر الصف |
| 99 | `p122-y435.1` | fragment | Pyaclostrobin 4% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p122-y421.1` — من صنف شظايا التسعين |
| 100 | `p122-y749.7` | fragment | Folpet 60% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p122-y735.7` — من صنف شظايا التسعين |
| 101 | `p123-y161.3` | fragment | Metalaxyl 8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p123-y147.3` — من صنف شظايا التسعين |
| 102 | `p123-y373.9` | fragment | Propamocarb h rochloride 63% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p123-y359.9` — من صنف شظايا التسعين |
| 103 | `p123-y410.7` | fragment | Propiconazole 15% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p123-y396.7` — من صنف شظايا التسعين |
| 104 | `p123-y498.6` | fragment | Pyraclostrobin 6.7% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p123-y484.6` — من صنف شظايا التسعين |
| 105 | `p128-y431.6` | fragment | Bifenthrin 8.8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p128-y417.6` — من صنف شظايا التسعين |
| 106 | `p133-y306.7` | prose | 5 اليرقات ووجود نسبة | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 107 | `p134-y475.8` | fragment | Chlorothalonil 62.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p134-y492.3` — من صنف شظايا التسعين |
| 108 | `p134-y669.9` | fragment | Prochloraz 8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p134-y656.8` — من صنف شظايا التسعين |
| 109 | `p134-y754.9` | fragment | Propiconazole 6% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p134-y741.9` — من صنف شظايا التسعين |
| 110 | `p135-y432.3` | fragment | Fludioxanil 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p135-y418.3` — من صنف شظايا التسعين |
| 111 | `p135-y792.8` | prose | وزارة الزراعة واستصالح الأراضى 122 | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 112 | `p137-y792.8` | prose | وزارة الزراعة واستصالح الأراضى 124 | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 113 | `p143-y661.4` | fragment | Bifenazate 43.2% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p143-y645.9` — من صنف شظايا التسعين |
| 114 | `p145-y792.8` | prose | وزارة الزراعة واستصالح الأراضى 132 | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 115 | `p146-y736.0` | name-incomplete | Fosetyl- Aluminam 31% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 116 | `p147-y652.5` | fragment | Kresoxim- ethyl 10% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p147-y634.0` — من صنف شظايا التسعين |
| 117 | `p147-y707.2` | fragment | Azoxystrobin 20% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p147-y718.5` — من صنف شظايا التسعين |
| 118 | `p147-y730.5` | fragment | Difenoconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p147-y718.5` — من صنف شظايا التسعين |
| 119 | `p148-y191.9` | fragment | Kresoxim- ethyl 10% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p148-y178.4` — من صنف شظايا التسعين |
| 120 | `p148-y331.5` | fragment | Kresoxim- ethyl 10% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p148-y318.0` — من صنف شظايا التسعين |
| 121 | `p148-y363.2` | fragment | Kresoxim- ethyl 10% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p148-y349.2` — من صنف شظايا التسعين |
| 122 | `p148-y434.9` | name-incomplete | Kresoxim-methyl 30% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 123 | `p148-y531.2` | fragment | Trifloxystrobin 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p148-y517.2` — من صنف شظايا التسعين |
| 124 | `p148-y549.7` | name-incomplete | Tebuconazole 50% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 125 | `p148-y596.4` | fragment | Pyraclostrobin 12.8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p148-y582.4` — من صنف شظايا التسعين |
| 126 | `p148-y629.0` | fragment | Kresoxim- ethyl 10% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p148-y614.9` — من صنف شظايا التسعين |
| 127 | `p148-y671.4` | name-incomplete | + Fludioxanil 32% %38 FS | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 128 | `p149-y670.4` | fragment | Cymoxanil 10% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p149-y686.7` — من صنف شظايا التسعين |
| 129 | `p149-y739.8` | fragment | Cymoxanil 10% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p149-y749.0` — من صنف شظايا التسعين |
| 130 | `p150-y337.7` | fragment | Metalaxyl-M 4% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p150-y324.7` — من صنف شظايا التسعين |
| 131 | `p150-y700.2` | fragment | Metalaxyl 8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p150-y687.1` — من صنف شظايا التسعين |
| 132 | `p150-y732.8` | fragment | kresoxitn- methyl 15% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p150-y719.7` — من صنف شظايا التسعين |
| 133 | `p151-y203.1` | fragment | Metalaxyl-M 3.75% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p151-y190.1` — من صنف شظايا التسعين |
| 134 | `p151-y237.1` | fragment | Metalaxyl-M 3.75% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p151-y224.1` — من صنف شظايا التسعين |
| 135 | `p151-y473.8` | fragment | Metalaxyl-M 3.3% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p151-y460.8` — من صنف شظايا التسعين |
| 136 | `p155-y527.8` | fragment | Propiconazole 15% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p155-y514.8` — من صنف شظايا التسعين |
| 137 | `p156-y238.5` | fragment | Difenoconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p156-y224.5` — من صنف شظايا التسعين |
| 138 | `p159-y616.2` | fragment | Kresoxim- ethyl 10% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p159-y600.2` — من صنف شظايا التسعين |
| 139 | `p160-y702.7` | fragment | Pyraclostrobin 4% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p160-y686.7` — من صنف شظايا التسعين |
| 140 | `p161-y713.7` | fragment | Propiconazole 6% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p161-y697.6` — من صنف شظايا التسعين |
| 141 | `p164-y540.5` | fragment | Difenoconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p164-y525.5` — من صنف شظايا التسعين |
| 142 | `p165-y286.7` | fragment | Chlorothalonil 50% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p165-y272.2` — من صنف شظايا التسعين |
| 143 | `p165-y320.7` | fragment | Chlorothalonil 40% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p165-y306.2` — من صنف شظايا التسعين |
| 144 | `p165-y678.1` | fragment | Chlorothalonil 50% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p165-y663.6` — من صنف شظايا التسعين |
| 145 | `p166-y621.7` | name-incomplete | Chlorothalonil 16.6% + %22.6 SC | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 146 | `p167-y649.2` | fragment | Cymoxanil 5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p167-y632.1` — من صنف شظايا التسعين |
| 147 | `p169-y648.4` | prose | اكتشاف اأيه اإصابة مبكرة | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 148 | `p172-y246.6` | fragment | Difenoconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p172-y232.1` — من صنف شظايا التسعين |
| 149 | `p173-y485.9` | fragment | Azoxystrobin 6% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p173-y498.2` — من صنف شظايا التسعين |
| 150 | `p173-y585.7` | fragment | Chlorothalonil 50% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p173-y597.8` — من صنف شظايا التسعين |
| 151 | `p173-y614.9` | fragment | Chlorothalonil 50% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p173-y597.8` — من صنف شظايا التسعين |
| 152 | `p173-y625.0` | fragment | Azoxystrobin 6% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p173-y634.4` — من صنف شظايا التسعين |
| 153 | `p173-y644.1` | fragment | Chlorothalonil 50% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p173-y634.4` — من صنف شظايا التسعين |
| 154 | `p173-y673.3` | fragment | Chlorothalonil 50% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p173-y659.3` — من صنف شظايا التسعين |
| 155 | `p173-y753.1` | fragment | Chlorothalonil 50% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p173-y739.1` — من صنف شظايا التسعين |
| 156 | `p173-y792.8` | prose | وزارة الزراعة واستصالح الأراضى 160 | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 157 | `p176-y440.4` | prose | فى الأوراق التى يتم %5 | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 158 | `p179-y591.9` | fragment | Prochloraz 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p179-y601.5` — من صنف شظايا التسعين |
| 159 | `p179-y685.6` | fragment | Tebuconazole 13.3% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p179-y669.5` — من صنف شظايا التسعين |
| 160 | `p179-y792.8` | prose | وزارة الزراعة واستصالح الأراضى 166 | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 161 | `p181-y472.5` | fragment | Bifenthrin 2.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p181-y458.5` — من صنف شظايا التسعين |
| 162 | `p181-y503.7` | fragment | Bifenthrin 2.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p181-y489.6` — من صنف شظايا التسعين |
| 163 | `p183-y436.0` | fragment | Bifenthrin 8.8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p183-y421.0` — من صنف شظايا التسعين |
| 164 | `p184-y513.5` | fragment | Tebuconazole 15% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p184-y501.1` — من صنف شظايا التسعين |
| 165 | `p185-y751.8` | fragment | Pyraclostrobin 4% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p185-y735.8` — من صنف شظايا التسعين |
| 166 | `p186-y385.3` | prose | عند وصول نسبة الإصابة | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 167 | `p187-y405.5` | prose | 5 اأو وجود نسبة | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 168 | `p188-y612.2` | fragment | Bifenthrin 2.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p188-y595.7` — من صنف شظايا التسعين |
| 169 | `p188-y651.9` | fragment | Bifenthrin 2.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p188-y635.4` — من صنف شظايا التسعين |
| 170 | `p188-y731.2` | fragment | Emamectin benzoate 4.8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p188-y714.7` — من صنف شظايا التسعين |
| 171 | `p193-y706.4` | fragment | Pyriproxyfen 10% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p193-y688.4` — من صنف شظايا التسعين |
| 172 | `p193-y748.4` | fragment | Pyriproxyfen 10% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p193-y730.3` — من صنف شظايا التسعين |
| 173 | `p193-y792.8` | prose | وزارة الزراعة واستصالح الأراضى 180 | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 174 | `p198-y550.3` | fragment | Acetamiprid 22.7% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p198-y561.3` — من صنف شظايا التسعين |
| 175 | `p199-y792.8` | prose | وزارة الزراعة واستصالح الأراضى 186 | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 176 | `p200-y457.9` | prose | 5 اليرقات اأو وجود نسبة | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 177 | `p201-y612.1` | fragment | Bifenthrin 2.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p201-y594.1` — من صنف شظايا التسعين |
| 178 | `p201-y636.6` | name-missing | + | اسم المادة غير محفوظ في الخلية (رمز أو تركيب وحده)؛ يحتاج إعادة استخراج بنيوية من سطر الصف |
| 179 | `p201-y792.8` | prose | وزارة الزراعة واستصالح الأراضى 188 | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 180 | `p205-y441.3` | name-incomplete | + Fludioxonil 25% %62.5 WG | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 181 | `p205-y533.6` | fragment | Pyrimethanil 37.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p205-y519.6` — من صنف شظايا التسعين |
| 182 | `p205-y669.7` | fragment | Pyraclostrobin 10% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p205-y655.7` — من صنف شظايا التسعين |
| 183 | `p205-y754.7` | fragment | Pyraclostrobin 28.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p205-y740.7` — من صنف شظايا التسعين |
| 184 | `p205-y792.8` | prose | وزارة الزراعة واستصالح الأراضى 192 | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 185 | `p207-y290.5` | fragment | Tebuconazole 17.6% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p207-y276.6` — من صنف شظايا التسعين |
| 186 | `p207-y321.7` | fragment | Pyraclostrobin 28.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p207-y307.7` — من صنف شظايا التسعين |
| 187 | `p211-y264.1` | fragment | Fenpropathrin 10% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p211-y251.3` — من صنف شظايا التسعين |
| 188 | `p212-y404.5` | prose | من عدد %5 وجود اإصابة على | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 189 | `p213-y792.8` | prose | وزارة الزراعة واستصالح الأراضى 200 | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 190 | `p217-y405.5` | fragment | Hexythiazox 9% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p217-y389.5` — من صنف شظايا التسعين |
| 191 | `p217-y707.4` | fragment | Bifenazate 43.2% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p217-y691.4` — من صنف شظايا التسعين |
| 192 | `p219-y753.6` | fragment | Bifenazate 30% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p219-y740.1` — من صنف شظايا التسعين |
| 193 | `p225-y475.1` | fragment | Propiconazole 15% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p225-y460.1` — من صنف شظايا التسعين |
| 194 | `p225-y639.5` | fragment | Propiconazole 15% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p225-y624.5` — من صنف شظايا التسعين |
| 195 | `p225-y661.4` | name-incomplete | Difenoconazole 25% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 196 | `p225-y698.2` | name-incomplete | Azoxystrobin 20% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 197 | `p225-y792.8` | prose | وزارة الزراعة واستصالح الأراضى 212 | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 198 | `p226-y342.8` | prose | عدد الأشجار %5 | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 199 | `p226-y716.8` | prose | بالشجرة الواحدة | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 200 | `p228-y383.5` | fragment | Azoxystrobin 12% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p228-y393.6` — من صنف شظايا التسعين |
| 201 | `p228-y405.7` | fragment | Difenoconazole 18% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p228-y393.6` — من صنف شظايا التسعين |
| 202 | `p228-y707.5` | fragment | Tebuconazole 30% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p228-y689.4` — من صنف شظايا التسعين |
| 203 | `p229-y208.3` | fragment | Propiconazole 9% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p229-y194.8` — من صنف شظايا التسعين |
| 204 | `p229-y239.4` | fragment | Propiconazole 15% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p229-y225.9` — من صنف شظايا التسعين |
| 205 | `p229-y301.8` | fragment | Propiconazole 18.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p229-y288.3` — من صنف شظايا التسعين |
| 206 | `p229-y406.7` | fragment | Tebuconazole 50% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p229-y393.2` — من صنف شظايا التسعين |
| 207 | `p229-y736.9` | fragment | Tebuconazole 30% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p229-y723.4` — من صنف شظايا التسعين |
| 208 | `p230-y530.1` | fragment | Tebuconazole 50% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p230-y540.8` — من صنف شظايا التسعين |
| 209 | `p230-y551.8` | fragment | Trifloxystrobin 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p230-y540.8` — من صنف شظايا التسعين |
| 210 | `p230-y688.6` | fragment | Trifloxystrobin 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p230-y675.1` — من صنف شظايا التسعين |
| 211 | `p230-y724.0` | fragment | Trifloxystrobin 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p230-y710.5` — من صنف شظايا التسعين |
| 212 | `p235-y322.1` | fragment | Spinetoram 6% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p235-y307.6` — من صنف شظايا التسعين |
| 213 | `p238-y160.2` | fragment | Pyraclostrobin 12.8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p238-y147.4` — من صنف شظايا التسعين |
| 214 | `p238-y191.3` | fragment | Pyraclostrobin 13% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p238-y178.6` — من صنف شظايا التسعين |
| 215 | `p238-y209.8` | name-incomplete | Cyprodinil 37.5% + %62.5 WG | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 216 | `p238-y222.5` | fragment | Fludioxonil 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p238-y241.0` — من صنف شظايا التسعين |
| 217 | `p238-y253.7` | fragment | Fludioxonil 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p238-y241.0` — من صنف شظايا التسعين |
| 218 | `p238-y286.6` | fragment | Fludioxonil 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p238-y272.1` — من صنف شظايا التسعين |
| 219 | `p238-y316.1` | fragment | Pyraclostrobin 12.8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p238-y303.3` — من صنف شظايا التسعين |
| 220 | `p238-y347.2` | fragment | Pyraclostrobin 12.8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p238-y334.5` — من صنف شظايا التسعين |
| 221 | `p238-y696.5` | fragment | Fludioxonil 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p238-y683.7` — من صنف شظايا التسعين |
| 222 | `p238-y724.8` | fragment | Fludioxonil 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p238-y712.1` — من صنف شظايا التسعين |
| 223 | `p238-y753.2` | fragment | Fludioxonil 25% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p238-y740.4` — من صنف شظايا التسعين |
| 224 | `p239-y455.3` | fragment | Kresoxim- ethyl 10% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p239-y440.1` — من صنف شظايا التسعين |
| 225 | `p240-y159.5` | fragment | Kresoxim- ethyl 10% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p240-y147.2` — من صنف شظايا التسعين |
| 226 | `p240-y262.9` | fragment | Pyraclostrobin 12.8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p240-y250.7` — من صنف شظايا التسعين |
| 227 | `p240-y649.3` | fragment | Pyraclostrobin 12.8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p240-y637.0` — من صنف شظايا التسعين |
| 228 | `p240-y680.5` | fragment | Difenoconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p240-y668.2` — من صنف شظايا التسعين |
| 229 | `p241-y471.8` | fragment | Pyraclostrobin 6.7% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p241-y459.5` — من صنف شظايا التسعين |
| 230 | `p241-y505.8` | fragment | Pyraclostrobin 6.7% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p241-y493.5` — من صنف شظايا التسعين |
| 231 | `p241-y607.8` | fragment | Difenoconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p241-y595.6` — من صنف شظايا التسعين |
| 232 | `p241-y641.9` | fragment | Difenoconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p241-y629.6` — من صنف شظايا التسعين |
| 233 | `p241-y750.3` | fragment | Propiconazole 15% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p241-y738.0` — من صنف شظايا التسعين |
| 234 | `p243-y288.8` | fragment | Pyraclostrobin 12.8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p243-y276.0` — من صنف شظايا التسعين |
| 235 | `p243-y327.4` | fragment | Kresoxim- ethyl 10% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p243-y313.4` — من صنف شظايا التسعين |
| 236 | `p243-y390.8` | fragment | Pyraclostrobin 6.7% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p243-y378.6` — من صنف شظايا التسعين |
| 237 | `p243-y670.1` | fragment | Pyraclostrobin 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p243-y657.8` — من صنف شظايا التسعين |
| 238 | `p244-y155.6` | fragment | Pyraclostrobin 6.7% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p244-y143.3` — من صنف شظايا التسعين |
| 239 | `p244-y186.8` | fragment | Pyraclostrobin 6.7% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p244-y174.5` — من صنف شظايا التسعين |
| 240 | `p244-y217.9` | fragment | Pydiflumetofen 7.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p244-y205.7` — من صنف شظايا التسعين |
| 241 | `p244-y280.3` | fragment | Tebuconazole 50% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p244-y268.0` — من صنف شظايا التسعين |
| 242 | `p244-y335.6` | fragment | Difenoconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p244-y323.3` — من صنف شظايا التسعين |
| 243 | `p244-y366.8` | fragment | Difenoconazole 12.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p244-y354.5` — من صنف شظايا التسعين |
| 244 | `p245-y277.1` | name-incomplete | Azoxystrobin 20% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 245 | `p245-y332.2` | fragment | Famoxadone 22.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p245-y318.2` — من صنف شظايا التسعين |
| 246 | `p245-y440.1` | name-incomplete | Copper hydroxide 24.4% + %48.9 WG | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 247 | `p245-y627.2` | name-incomplete | Azoxystrobin 20% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 248 | `p246-y153.7` | fragment | Fosetyl-Aluminium 66.67% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p246-y141.9` — من صنف شظايا التسعين |
| 249 | `p246-y743.0` | name-incomplete | Iprovalicarb 8.4% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 250 | `p251-y741.8` | fragment | Bifenthrin 2.5% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p251-y726.2` — من صنف شظايا التسعين |
| 251 | `p256-y519.3` | prose | psidii بالفطر | الخلية تحمل جزء سطر نثري عن الممرض Cercospora psidii |
| 252 | `p257-y322.0` | prose | نسبة اإصابة الأشجار | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 253 | `p264-y242.1` | fragment | Difenoconazole 6% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p264-y252.1` — من صنف شظايا التسعين |
| 254 | `p264-y441.8` | fragment | Propiconazole 15% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p264-y423.8` — من صنف شظايا التسعين |
| 255 | `p264-y589.2` | fragment | Fluazinam 30% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p264-y571.2` — من صنف شظايا التسعين |
| 256 | `p264-y616.5` | name-missing | + | اسم المادة غير محفوظ في الخلية (رمز أو تركيب وحده)؛ يحتاج إعادة استخراج بنيوية من سطر الصف |
| 257 | `p265-y700.0` | fragment | Pyraclostrobin 12.8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p265-y686.5` — من صنف شظايا التسعين |
| 258 | `p265-y751.0` | fragment | Pyraclostrobin 12.8% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p265-y737.5` — من صنف شظايا التسعين |
| 259 | `p266-y233.9` | fragment | — | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p266-y220.4` — من صنف شظايا التسعين |
| 260 | `p268-y276.4` | prose | توفر رطوبة جوية | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 261 | `p270-y396.9` | fragment | Abamectin 1% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p270-y409.8` — من صنف شظايا التسعين |
| 262 | `p270-y419.7` | fragment | Hexythiazox 9% | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p270-y409.8` — من صنف شظايا التسعين |
| 263 | `p271-y259.2` | name-incomplete | — | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 264 | `p271-y537.8` | fragment | — | شظية سطر اسم: الخلية تحمل الاسم وحده (جرعة/WHO فارغتان) والمكوّن مسجَّل داخل خليط الصف `p271-y524.3` — من صنف شظايا التسعين |
| 265 | `p272-y281.1` | name-incomplete | Prochloraz 10% + %46 EC | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 266 | `p272-y704.1` | name-incomplete | Azoxystrobin 20% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 267 | `p274-y314.1` | name-incomplete | Azoxystrobin 20% + | اسم المكوّن الناقص لم يُحصر فريداً من سطر الصف (المجموع أو الأسطر غير كافية)؛ يبقى للمراجعة |
| 268 | `p277-y620.5` | prose | 5 متوسط الإصابة اإلى | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |
| 269 | `p278-y357.3` | prose | مرت .1 مسافات | الخلية تحمل سطراً نثرياً/ترويسة (أو تذييل «وزارة الزراعة») لا اسم مادة؛ صف ليس منتجاً — سطر الطباعة محفوظ في عمود الدليل |

**تصحيحات حقلية: 334 في 308 سجلًا · تحويلات: 269 سجلًا**
**الحالة: 2699 VERIFIED · 294 NEEDS_VERIFICATION (من 2993)**

تُركت كما هي (رسمها الكتاب نفسه حرفياً — لا خطأ استخراج):
`Lambd- cyhalothrin` (p74) · `Propamocorb` (p91) · `Fosetyl- Aluminam` (p146) ·
`Aluminicom` (p248) · `kresoxitn- methyl` (p150) · `Matalaxyl-M` (p24) ·
`Gopper oxychloride` (p119) · `Flufenoxurom` (p108) · `Thioahatate` (p134) ·
وكذلك فواصل `Metalaxyl- M` / `Lambda- cyhalothrin` / `Thiophanate- methyl`:
في المجرى **space glyph حقيقي** (كود 32) — الكتاب هو المكتوب به.
