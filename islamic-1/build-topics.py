# -*- coding: utf-8 -*-
# Generates topics.json (Arabic-safe, via file IO not console) from report.json heads.
import os, json

HERE = os.path.dirname(os.path.abspath(__file__))
rep_path = os.path.join(HERE, "report.json")
out_path = os.path.join(HERE, "topics.json")

with open(rep_path, "r", encoding="utf-8") as f:
    rep = json.load(f)

topics = []
# Build from page_images/page_texts heads — the most meaningful line per page.
pages = rep.get("page_texts") or rep.get("pages") or []
for p in pages:
    head = (p.get("head") or p.get("text") or "").strip()
    if not head:
        continue
    # Skip pure page-number / thin pages (very short or <= 8 chars) unless it has a title feel.
    head_clean = head[:80]
    topics.append({
        "page": p.get("page", p.get("n", 0)),
        "title": head_clean,
        "len": p.get("len") or p.get("text_len") or len(head_clean),
    })

if not topics:
    # fallback: use every page as a topic with a generic title
    n = len(pages)
    topics = [{"page": i + 1, "title": ("صفحة " + str(i + 1)), "len": 1} for i in range(n)]

with open(out_path, "w", encoding="utf-8") as f:
    json.dump(topics, f, ensure_ascii=False, indent=1)

print("DONE topics=" + str(len(topics)))
