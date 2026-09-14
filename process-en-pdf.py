import pymupdf
import json, os
from PIL import Image
import io

PDF_PATH = r'C:/Users/ayman/Downloads/كتب الصف الأول/English_language_prim1_t1.pdf'
OUT_DIR  = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'books-en')
PAGES_DIR= os.path.join(OUT_DIR, 'pages')
os.makedirs(PAGES_DIR, exist_ok=True)

pdf = pymupdf.open(PDF_PATH)
pages_data = []

scale = 1200.0 / pdf[0].rect.width

for i in range(pdf.page_count):
    p = pdf[i]
    rect = p.rect
    w_pt = rect.width
    h_pt = rect.height

    raw_words = p.get_text('words')
    words = []
    for x0, y0, x1, y1, text, bno, lno, wno in raw_words:
        text = text.strip()
        if not text:
            continue
        bw = x1 - x0
        bh = y1 - y0
        if bw < 1 or bh < 1:
            continue
        words.append({
            'text': text,
            'box': [
                round(x0 / w_pt * 100, 3),
                round(y0 / h_pt * 100, 3),
                round(bw  / w_pt * 100, 3),
                round(bh  / h_pt * 100, 3),
            ]
        })

    mat = pymupdf.Matrix(scale, scale)
    pix = p.get_pixmap(matrix=mat, alpha=False)
    # Convert pixmap to PIL Image then save as WebP
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    img.save(os.path.join(PAGES_DIR, f'{i+1}.webp'), 'WEBP', quality=88)

    pages_data.append({
        'pdf':     i + 1,
        'printed': None,
        'width':   round(w_pt, 4),
        'height':  round(h_pt, 4),
        'words':   words,
    })

    if (i+1) % 20 == 0:
        print(f'  page {i+1}/{pdf.page_count} done', flush=True)

# --- save book-data-en.json ---
bd_path = os.path.join(OUT_DIR, 'book-data-en.json')
with open(bd_path, 'w', encoding='utf-8') as f:
    json.dump(pages_data, f, ensure_ascii=False, separators=(',', ':'))

# --- cover ---
cover_pix = pdf[0].get_pixmap(matrix=mat, alpha=False)
cover_img = Image.frombytes("RGB", [cover_pix.width, cover_pix.height], cover_pix.samples)
cover_img.save(os.path.join(OUT_DIR, 'cover.webp'), 'WEBP', quality=88)

print(f'\nDone! {pdf.page_count} pages processed')
print(f'  book-data-en.json : {os.path.getsize(bd_path):,} bytes')
print(f'  pages dir         : {len(os.listdir(PAGES_DIR))} images')
print(f'  cover.webp        : {os.path.getsize(os.path.join(OUT_DIR,"cover.webp")):,} bytes')
