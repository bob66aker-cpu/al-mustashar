#!/usr/bin/env python3
"""
build-tws-images.py — استخراج صور كتاب «التوصيات المعتمدة لمكافحة الآفات
الزراعية 2025» (Recomm25) وربطها بصفحات الأقسام.

القاعدة: الصور من الكتاب وحده (لا صور خارجية). كل صورة تُنسب إلى رقم
صفحة PDF في الكتاب (والصفحة المطبوعة = PDF − 13، ثابت مُتحقَّق منه).

الفلاتر (بلا تخمين):
  1) دمج الأجسام المتطابقة بايتاً وتعدّد تكرارها عبر المستند.
  2) حجم أدنى 110 بكسل للضلع — تُسقط الأيقونات والزخارف الصغيرة.
  3) تكرار > 6 عبر الكتاب = زخرفة ترويسة/شعار → مسقطة.
  4) نطاق عمودي: خارج نطاق الترويسة (أعلى 80pt) والتذييل (أسفل 60pt).

المخرجات:
  data/tws/img/p<page>-<k>.webp     الصور (WebP، أقصى ضلع 1000، جودة 72)
  tmp/apc/images_index.json         {pdf_page: [{file,w,h,sha1,freq}]}
"""
import hashlib
import io
import json
import os
import sys
from collections import Counter

import pymupdf as fitz
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "tmp", "apc", "Recomm25.final.pdf")
OUT_DIR = os.path.join(ROOT, "data", "tws", "img")
INDEX = os.path.join(ROOT, "tmp", "apc", "images_index.json")

PAGES_FROM, PAGES_TO = 16, 279   # نطاق أقسام الكتاب (كما في cards2_cas.meta.pages)
MIN_SIDE = 110
MAX_FREQ = 6
TOP_Y, BOTTOM_Y = 80.0, 60.0
MAX_DIM = 1000
QUALITY = 72


def main():
    if not os.path.exists(PDF):
        print("missing PDF:", PDF, file=sys.stderr)
        return 1
    os.makedirs(OUT_DIR, exist_ok=True)
    doc = fitz.open(PDF)

    found = []  # (page, sha1, bytes, w, h)
    seen_key = set()
    for pno in range(PAGES_FROM, min(PAGES_TO, doc.page_count) + 1):
        page = doc[pno - 1]
        try:
            rects_by_xref = {x[0]: page.get_image_rects(x[0]) for x in page.get_images(full=True)}
        except Exception:
            continue
        for xref, rects in rects_by_xref.items():
            if not rects:
                continue
            rect = rects[0]
            if rect.y0 < TOP_Y or rect.y1 > (page.rect.height - BOTTOM_Y):
                continue
            try:
                info = doc.extract_image(xref)
                raw = info["image"]
                w, h = info.get("width", 0), info.get("height", 0)
            except Exception:
                continue
            if min(w, h) < MIN_SIDE:
                continue
            sha = hashlib.sha1(raw).hexdigest()
            key = (pno, sha)
            if key in seen_key:
                continue
            seen_key.add(key)
            found.append((pno, sha, raw, w, h))

    freq = Counter(sha for _, sha, _, _, _ in found)

    exported = {}
    index = {}
    for pno, sha, raw, w, h in sorted(found, key=lambda t: (t[0], -t[3] * t[4])):
        if freq[sha] > MAX_FREQ:
            continue
        if sha not in exported:
            try:
                im = Image.open(io.BytesIO(raw))
                if im.mode != "RGB":
                    im = im.convert("RGB")
                im.thumbnail((MAX_DIM, MAX_DIM))
                name = f"p{pno}-{len(exported) + 1:03d}.webp"
                im.save(os.path.join(OUT_DIR, name), "WEBP", quality=QUALITY, method=4)
                exported[sha] = name
                w, h = im.size
            except Exception as e:
                print(f"skip p{pno}: {e}", file=sys.stderr)
                continue
        index.setdefault(str(pno), []).append({
            "file": exported[sha], "w": w, "h": h,
            "sha1": sha, "freq": freq[sha],
        })

    with open(INDEX, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=1)

    total_bytes = sum(
        os.path.getsize(os.path.join(OUT_DIR, e["file"]))
        for v in index.values() for e in v
    )
    print(f"pages with images: {len(index)}")
    print(f"image references: {sum(len(v) for v in index.values())}")
    print(f"unique files: {len(exported)}")
    print(f"total size: {total_bytes / 1024 / 1024:.1f} MiB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
