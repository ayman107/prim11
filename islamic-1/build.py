# -*- coding: utf-8 -*-
# ISLAMIC-1 BUILDER — صامت تماماً (بلا أي طباعة عربية للكونسول).
# الخطوات: يجد الكتاب → يُنتج صور صفحات PNG → يسطّر الفهرس (النص + TOC) → JSON.
import os, sys, glob, json, time

HERE = os.path.dirname(os.path.abspath(__file__))
OUT  = os.path.join(HERE, "islamic-1")
PAGEDIR = os.path.join(OUT, "pages")
os.makedirs(PAGEDIR, exist_ok=True)

report = {"ok": False, "error": None}

def write_report(obj):
    with open(os.path.join(OUT, "report.json"), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)

# 1) الكتاب — أولوية للمسار المؤكَّد مسبقاً + fallback مسح
pdf = r"C:\Users\ayman\Downloads\كتب الصف الأول\islamic_religion_prim1_t1.pdf"
if not os.path.exists(pdf):
    pdf2 = None
    for root in (r"C:\Users\ayman\Downloads",):
        for dirpath, _, files in os.walk(root):
            for fn in files:
                fl = fn.lower()
                if fl.endswith(".pdf") and "islamic" in fl and ("prim1" in fl or "prim_1" in fl):
                    pdf2 = os.path.join(dirpath, fn)
                    break
            if pdf2:
                break
        if pdf2:
            break
    pdf = pdf2

if not pdf:
    write_report({"ok": False, "error": "NO_PDF"})
    print("FAIL_NO_PDF")
    sys.exit(1)

report["pdf"] = pdf
report["pdf_mb"] = round(os.path.getsize(pdf) / 1048576.0, 1)

import pymupdf
doc = pymupdf.open(pdf)
report["page_count"] = doc.page_count
report["toc"] = doc.get_toc()

# 2) صور الصفحات (PNG بدقة قراءة جيدة + نسخة مصغّرة سريعة)
mat  = pymupdf.Matrix(1.5, 1.5)
matS = pymupdf.Matrix(0.75, 0.75)
report["pages"] = []
for i in range(doc.page_count):
    p = doc[i]
    pix = p.get_pixmap(matrix=mat, alpha=False)
    big = "p%03d.png" % (i + 1)
    pix.save(os.path.join(PAGEDIR, big))
    thb = "t%03d.png" % (i + 1)
    p.get_pixmap(matrix=matS, alpha=False).save(os.path.join(PAGEDIR, thb))
    txt = " ".join(p.get_text().split())
    report["pages"].append({
        "n": i + 1, "img": big, "thumb": thb,
        "px": [pix.width, pix.height],
        "text_len": len(txt),
        "head": txt[:70],
    })

# 3) الفهرس: احفظ TOC إن وُجد + نص أول 12 صفحة (لايجاد مواضع الفهرس الفعلية)
report["toc"] = [[a, b, c] for a, b, c in doc.get_toc()]
report["toc_head_pages"] = []
for i in range(min(14, doc.page_count)):
    t = " ".join(doc[i].get_text().split())
    report["toc_head_pages"].append({"p": i + 1, "head": t[:100]})

doc.close()
report["ok"] = True
write_report(report)
print("DONE pages=%d toc=%d pdf=%s" % (report["page_count"], len(report["toc"]), os.path.basename(report["pdf"])))
