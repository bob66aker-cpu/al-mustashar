#!/usr/bin/env python3
"""
tws-source-index.py — فهرس بنية صفحة الكتاب للأقسام (سطر الطباعة نفسه).

لكل صفحة في نطاق الأقسام (16..279):
  heads : كل سطر «مظهر الإصابة» + أقرب سطر نصي فوقه (عنوان القسم الفعلي
          كما في الطباعة) مع y لكل سطر.
  groups: كل علامة «الآفة : …» (مجموعة القسم) مع y.

المخرَج tmp/apc/print_index.json يُستهلك في scripts/build-tws.mjs
لمطابقة كل قسم بعنوانه المطبوع (بلا تخمين: الرقم والترتيب من الهندسة نفسها).
"""
import json
import os
import re
import sys

import pymupdf as fitz

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "tmp", "apc", "Recomm25.final.pdf")
OUT = os.path.join(ROOT, "tmp", "apc", "print_index.json")
PAGES_FROM, PAGES_TO = 16, 279

SYM_RE = re.compile(r"مظهر\s*ا?ل?إص\s*ابة")
GROUP_RE = re.compile(r"الآف\s*[اة]\s*:")
# ضجيج الترويسة/التذييل وأسطر الجداول لا تُعدّ عناوين
NOISE_RE = re.compile(
    r"التو\s*صيات|املعتمدة|ملкаفح|ملكافح|الزراعي\s*ة?\s*\d|جلنة مبي|وزارة الزراعة"
    r"|رقم|التس\s*جيل|السم |معدل|تص\s*نيف|WHO|الأمان|MRL|Codex|EPA|EU$|Tolerance"
    r"|مظهر|حشرات\s*$|الآفة|\(\s*[بجدهـ]\s*\)|آفات محاصيل"
)


def clean(s):
    # إزالة علامات الاتجاه/الصف المطبوع المتشابكة للعرض الحرفية لاحقاً
    s = s.replace("​", "").replace("‌", "")
    return re.sub(r"\s+", " ", s).strip()


def line_blocks(page):
    """كل سطر نصي (كتلة/سطر) مع y أعلاه."""
    out = []
    d = page.get_text("dict")
    for b in d.get("blocks", []):
        for l in b.get("lines", []):
            txt = clean("".join(sp["text"] for sp in l.get("spans", [])))
            if not txt:
                continue
            y = round(l["bbox"][1], 1)
            out.append((y, txt))
    out.sort(key=lambda t: t[0])
    return out


def main():
    doc = fitz.open(PDF)
    index = {}
    for pno in range(PAGES_FROM, min(PAGES_TO, doc.page_count) + 1):
        lines = line_blocks(doc[pno - 1])
        heads, groups = [], []
        for i, (y, txt) in enumerate(lines):
            if SYM_RE.search(txt):
                # أقرب سطر نصي فوق «مظهر الإصابة» ليس ترويسة/ضجيجاً/علامة مجموعة
                h = None
                for y2, t2 in reversed(lines[:i]):
                    if y2 >= y:
                        continue
                    if SYM_RE.search(t2) or GROUP_RE.search(t2) or NOISE_RE.search(t2):
                        continue
                    if len(clean(t2)) < 3:
                        continue
                    h = {"y": y2, "heading": clean(t2)}
                    break
                heads.append(h or {"y": y, "heading": None})
            gm = GROUP_RE.search(txt)
            if gm:
                # نص المجموعة بعد العلامة (حتى نهاية السطر)
                gtxt = clean(txt[gm.end():]) or clean(txt)
                groups.append({"y": y, "text": gtxt, "raw": clean(txt)})
            tops = []
        for (y, txt) in lines:
            if y >= 205:
                continue
            if SYM_RE.search(txt) or GROUP_RE.search(txt) or NOISE_RE.search(txt):
                continue
            tops.append({"y": y, "text": txt})
        # كل أسطر الصفحة بمواضع y ( أساس التسمية لكل قسم بحسب الموقع الفعلي )
        lines_out = [{"y": y, "text": t} for (y, t) in lines]
        index[str(pno)] = {"heads": heads, "groups": groups, "tops": tops, "lines": lines_out}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=1)
    nh = sum(len(v["heads"]) for v in index.values())
    ng = sum(len(v["groups"]) for v in index.values())
    missing = sum(1 for v in index.values() for h in v["heads"] if not h["heading"])
    print(f"pages: {len(index)}  head-lines: {nh}  group-lines: {ng}  heads-without-name: {missing}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
