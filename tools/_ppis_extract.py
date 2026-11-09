#!/usr/bin/env python3
# tools/_ppis_extract.py — يبني نفس مخرج _epa_extract.py (verif + rows) مباشرة من ملفات EPA/PPIS الخام
# (chemcas/chemname/product/formula/ctreason) بدل الدفتر اليدوي، وفق منهجية الدفتر نفسها:
#  1) منتج نشط = CAN_DATE = 00000000؛ غيره ملغى.  2) formula تربط المنتج بالمادة (PC).
#  3) اسم المادة = أول اسم DISPLAY_IND=Y بأولوية ISO ثم ANSI ثم غيرها.
#  4) رقم CAS يُفحص بخانة التحقق ولا يُصحَّح.  5) لا حكم قانوني.
# Usage: python3 tools/_ppis_extract.py <dir-with-5-txt-files>
import json, re, sys
from collections import Counter, defaultdict

D = sys.argv[1].rstrip('/')
rd = lambda f: open(f'{D}/{f}', encoding='latin-1').read().split('\n')

def cas_fmt(raw):
    d = raw.lstrip('0')
    if len(d) < 4: return ''
    return f'{d[:-3]}-{d[-3:-1]}-{d[-1]}'
def cas_ok(c):
    m = re.fullmatch(r'(\d{2,7})-(\d{2})-(\d)', c)
    if not m: return False
    digits = (m.group(1) + m.group(2))[::-1]
    return sum((i + 1) * int(x) for i, x in enumerate(digits)) % 10 == int(m.group(3))

# ctreason
ct = {}
for l in rd('ctreason.txt'):
    if len(l) >= 2: ct[l[:2]] = l[2:].strip()

# chemcas
cas_rows = defaultdict(list); anomalies = 0; cas_lines = 0
for l in rd('chemcas.txt'):
    l = l.rstrip()
    if not l.strip(): continue
    cas_lines += 1
    if re.fullmatch(r'\d{6}\d{10}', l):
        cas_rows[l[:6]].append(l[6:16])
    else:
        anomalies += 1
pc_by_cas = defaultdict(set)
for pc, lst in cas_rows.items():
    for r in lst: pc_by_cas[r].add(pc)

# chemname
names = defaultdict(list)
allpc = set()
for l in rd('chemname.txt'):
    if len(l) < 27: continue
    pc = l[:6]; allpc.add(pc)
    typ = l[6:26].strip(); nm = re.sub(r'[\x00-\x08\x0b-\x1f\x7f]', '', l[26:296]).replace('\xa0', ' ').strip()
    disp = l[296:297]
    if disp == 'Y': names[pc].append((typ, nm))
def pick(pc):
    lst = names.get(pc, [])
    for want in ('ISO', 'ANSI'):
        for t, n in lst:
            if t == want: return t, n
    return lst[0] if lst else ('', '')

# product
prod = {}  # reg -> (can_date, ct_code)
for l in rd('product.txt'):
    if len(l) < 32: continue
    prod[l[:11]] = (l[22:30], l[30:32])
active_n = sum(1 for v in prod.values() if v[0] == '00000000')

# formula
pc_prods = defaultdict(set); formula_lines = 0
for l in rd('formula.txt'):
    if len(l) < 17: continue
    formula_lines += 1
    pc_prods[l[11:17]].add(l[:11]); allpc.add(l[11:17])
allpc |= set(cas_rows)

rows = []
for pc in sorted(allpc):
    typ, nm = pick(pc)
    regs = pc_prods.get(pc, set())
    act = sum(1 for r in regs if r in prod and prod[r][0] == '00000000')
    can = sum(1 for r in regs if r in prod and prod[r][0] != '00000000')
    cnt = Counter(prod[r][1] for r in regs if r in prod and prod[r][0] != '00000000')
    reason, rcount = '', 0
    if cnt:
        code, rcount = cnt.most_common(1)[0]; reason = ct.get(code, code)
    status = ('له تسجيل نشط واحد على الأقل' if act > 0 else
              'كل تسجيلاته ملغاة' if can > 0 else 'غير مرتبط بأي منتج في formula.txt/product.txt')
    cl = cas_rows.get(pc) or [None]
    for raw in cl:
        if raw is None:
            cas = ''; q = 'لا رقم في الملف'; sh = 'لا'; shn = 0
        else:
            cas = cas_fmt(raw); q = 'سليم' if cas_ok(cas) else 'فاشل رقم التحقق'
            k = len(pc_by_cas[raw]); shn = k
            sh = 'نعم — لا يُعرض كنتيجة مؤكدة بالرقم وحده' if k > 1 else 'لا'
        rows.append({'pc_code': pc, 'name': nm, 'name_type': typ,
                     'name_note': 'اسم أساسي (Y) في الملف' if nm else 'لا يوجد اسم في chemname.txt',
                     'cas': cas, 'cas_raw': raw or '', 'cas_quality': q, 'shared': sh, 'shared_count': shn if raw else 0,
                     'active': act, 'cancelled': can, 'status_sheet': status,
                     'cancel_reason': reason, 'cancel_reason_count': rcount})

act_pcs = len({r['pc_code'] for r in rows if r['active'] > 0})
can_pcs = len({r['pc_code'] for r in rows if r['active'] == 0 and r['cancelled'] > 0})
verif = {
 'اتحاد كل رموز المواد الظاهرة في الملفات الخمسة': len(allpc),
 'مواد لها تسجيل نشط واحد على الأقل': act_pcs,
 'مواد كل تسجيلاتها ملغاة': can_pcs,
 'أرقام مرتبطة بأكثر من مادة (الفخ)': sum(1 for v in pc_by_cas.values() if len(v) > 1),
 'صفوف ورقة "المواد الفعالة" النهائية': len(rows),
 '_products_total': len(prod), '_products_active': active_n, '_formula_lines': formula_lines,
 '_chemcas_lines': cas_lines, '_chemcas_anomalies': anomalies,
}
print(json.dumps({'verif': verif, 'rows': rows}, ensure_ascii=False))
