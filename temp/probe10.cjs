const fs = require('fs');
const path = require('path');

/* ===== نسخة مطابقة حرفيًّا لدوال reading-order (التطبيقية الحالية) ===== */
function stripMarks(t) {
  return String(t || "").replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06DC\u06DF-\u06ED\u0653\u0654\u0655\u0652]/g, "");
}
function norm(s) {
  return String(s || "")
    .replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06DC\u06DF-\u06ED\u0653\u0654\u0655]/g, "")
    .replace(/[^\u0621-\u064A\u0671\s]/g, "")
    .replace(/[\u0621\u0622\u0623\u0625\u0671]/g, "\u0627")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0649/g, "\u064A")
    .replace(/\s+/g, " ")
    .trim();
}
var GARBLE = {
  "اظزر": "أُنْظُرْ",
  "وشضر": "وَفَكِّرْ",
  "جعرة": "سُورَةُ",
  "الظصاط": "الصِّرَاطُ"
};
function garbleKey(t) { return stripMarks(t).replace(/\u0640/g, "").replace(/\s+/g, ""); }
function garbleFix(t) { var k = garbleKey(t); return GARBLE[k] || t; }
function garbleNorm(t) { return norm(garbleFix(t)); }
function keepWord(t) {
  if (!t) return false;
  if (t.length > 400) return false;
  if (/[\d\u0660-\u0669\u06F0-\u06F9]/.test(t)) return false;
  var l = stripMarks(t).replace(/[^\u0621-\u064A\u0671]/g, "");
  if (!l) return false;
  return true;
}
function cx(w) { return w.box[0] + w.box[2] / 2; }
function orderPage(kept) {
  return kept; /* في القراءة الحالية: كلمات عادية بترتيب OCR */
}
/* =====/unionBox لم تُستدعَ بعد الآن في صفحات السور (التعديل الجديد) ===== */

/* بيانات book-data.json من المجلد الصحيح */
let book = null;
for (const cand of ['books-islamic/book-data.json', 'books-islamic/data/book-data.json']) {
  try { book = JSON.parse(fs.readFileSync(cand, 'utf8')); break; } catch (e) {}
}
if (!book) { console.log('book-data.json غير موجود'); process.exit(0); }

function areaOf(w) { return (w.box[2] || 0) * (w.box[3] || 0); }

/* نعرّف صفحات السور الثلاثة كما في reading-order */
const SURAH_PAGES = [
  { from: 11, to: 16, gs: [1, 2, 3, 4, 5, 6, 7] },
  { from: 39, to: 43, gs: [6217, 6218, 6219, 6220, 6221] },
  { from: 64, to: 69, gs: [6194, 6195, 6196, 6197] }
];
function surahFor(k) {
  const n = Number(k);
  for (const r of SURAH_PAGES) if (n >= r.from && n <= r.to) return r;
  return null;
}

console.log('=== فحص صفحات السور: أكبر صندوق كلمة (بعد التعديل) ===\n');
for (const k in book) {
  const r = surahFor(k);
  if (!r) continue;
  const src = (book[k] && book[k].words) || [];
  let kept = [];
  for (const w of src) {
    if (!keepWord(garbleFix(w.text))) continue;
    kept.push({ text: garbleFix(w.text), box: w.box });
  }
  const words = orderPage(kept);
  let maxW = null;
  for (const w of words) if (!maxW || areaOf(w) > areaOf(maxW)) maxW = w;
  const hMax = 480, wMax = 640; /* أبعاد صفحة موهومة للمقارنة التقريبية */
  const cover = maxW ? (areaOf(maxW) / (wMax * hMax) * 100).toFixed(1) : 0;
  console.log(`الصفحة ${k.padStart? k.padStart(2):k}  السورة=${r.gs[0] ? '✓' : '-'} كلمات=${words.length}  أكبر صندوق = ${maxW ? ('[' + maxW.box.map(x=>Math.round(x)) + ']') : '-'}  أي ~${cover}% من الصفحة`);
}
