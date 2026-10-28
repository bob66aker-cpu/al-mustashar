# سجل توحيد الفروع — 2026-10-28

المستودع: `bob66aker-cpu/al-mustashar` · الفرع الافتراضي: `main`
سُجّل هذا الجرد **قبل** أي دمج أو حذف. لم يُحذف أي مرجع حتى الآن.
الحماية: `release-1-pre-oct11-preserved` مثبّت عند
`536244cb5b57f788afa15ccbe59659ef9f80dc12` (1.19.22 / mustashar-v58) — لا checkout كتابةً، لا commit، لا force-push، لا حذف.

## 1. جرد الفروع (البعد البعيد، قبل العمل)

| الفرع | SHA (قبل) | آخر commit (تاريخ/مؤلف) | مقابل V2 |
|---|---|---|---|
| `release-1-pre-oct11-preserved` | `536244cb` | 2026-10-10 bob66aker-cpu (D55) | محمي — 0 فريد (V2 سبقه 19) |
| `main` | `46c392c` | 2026-10-12 bob66aker-cpu (D58) | محتواه كاملًا في V2 (0 فريد) |
| `work-branch` | `fb40c92` | 2026-10-25 bob66aker-cpu | محتواه كاملًا في V2 (0 فريد) |
| `experimental-v2-2026-10-25` | `08b35c9` (خادم) / `bfb3921` (محلي) | 2026-10-28 | منقسم: 9 التزامات بعيدة / 3 محلية |
| `audit/apc-2025-data-integration` | `5343b48` | 2026-10-28 bob66aker-cpu | 4 التزامات فريدة (مستندات تدقيق APC) |
| `audit/tawsiyat-core-2026-10-22` | `ace4e3f` | 2026-10-22 bob66aker-cpu | 1 التزام فريد · 1 ملف |
| `design/tawsiyat-card-refresh-2026-10-23` | `62f20d5` | 2026-10-23 bob66aker-cpu | 3 التزامات فريدة · 3 ملفات |
| `fix/pro-regulatory-pack-refresh-2026-10-23` | `ba75483` | 2026-10-23 bob66aker-cpu | 19 التزامًا فريدًا · 7 ملفات |
| `fix/tawsiyat-dark-spelling-status-2026-10-23` | `4764eb4` | 2026-10-23 bob66aker-cpu | 11 التزامًا فريدًا · 4 ملفات |
| `hotfix/remove-legacy-advice-2026-10-22` | `3b5f4a8` | 2026-10-22 bob66aker-cpu | 0 فريد (مُدمج عبر PR #2) |
| `ppocr-lab` (محلي فقط، بلا نظير بعيد) | `dbb966f` | — | أرشيف تجربة PP-OCRv5 (D24) |

شجرات العمل المحلية: `/home/daytona/codebase` (main قديم)،
`/home/daytona/al-mustashar-audit` (audit/apc)، `/home/daytona/al-mustashar-work` (V2)،
و`freebuff/changes-jh8fpjmj` (= main).

## 2. جرد الـ PRs

| # | الحالة | من → إلى | العنوان |
|---|---|---|---|
| 7 | OPEN مسودة | audit/apc → V2 | جمع حزمة تدقيق APC 2026 داخل الإصدار التجريبي الثاني |
| 6 | OPEN مسودة | audit/apc → work-branch | توثيق وتدقيق حزمة APC 2025 دون استيرادها (تُبقي مسودة) |
| 5 | OPEN | fix/pro-regulatory → work-branch | إعادة تحديث الحالة التنظيمية |
| 4 | OPEN | fix/tawsiyat-dark-spelling → work-branch | الوضع الداكن ونصوص التوصيات |
| 3 | OPEN | design/tawsiyat-card-refresh → work-branch | تحسين تصميم بطاقات التوصيات |
| 2 | MERGED | hotfix/remove-legacy-advice → work-branch | إزالة واجهة الإرشاد القديمة |
| 1 | OPEN مسودة | audit/tawsiyat-core → work-branch | توثيق مراجعة سلامة قسم التوصيات |

## 3. الـ Tags وإعدادات النشر

- Tags: `v1.19.25` → `46c392c` (= طرف `main`) — وحدها.
- GitHub Pages: مفعّلة، build_type=legacy من `main` على
  `https://bob66aker-cpu.github.io/al-mustashar/` (بيئة `github-pages`).
- الاستضافة المُدارة (Freebuff): **لا عمليات نشر إطلاقًا** (`prodSlug=null`, `latestDeployment=null`).
- لا ملفات wrangler/cloudflare داخل المستودع.
- لم يُغيَّر الفرع الافتراضي أو أي إعداد نشر ضمن هذه المهمة.

## 4. انقسام V2 وتوحيدُه (قبل → بعد)

- البعيد `08b35c9` (9 التزامات فريدة: وثائق + تصحيحات إملائية في `src/i18n.js`
  `bdda66d` + `e1902e8`) والمحلي `bfb3921` (3 التزامات: تصميم بنتو `459a6fd`
  + لغات `3d781f0` + `bfb3921`) كانا منقسمين على أساس مشترك `fb40c92`.
- الدمج: `git merge --no-edit 08b35c9` في شجرة V2 → **`7dc9477` بلا تعارض**
  (الملفان المتقاطعان `src/i18n.js` اندمجا تلقائيًا ونجح `node --check`).
- الرفع: `08b35c9..7dc9477` إلى `origin/experimental-v2-2026-10-25`.
- تغيير المستخدم غير الملتزم في `data/advice/advice-registry-report.json`
  بقي كما هو (لم يلمسه الدمج)، ولم تُمسّ الأصناف غير الملتزمة `.verify/`,
  `docs/phase2-fixes/`, `docs/phase2-preview/`, `preview/`.

## 5. قرارات الدمج والحذف النهائية

(تُسجَّل بعد اكتمال التدقيق والاختبارات — القسم 6 أدناه.)
