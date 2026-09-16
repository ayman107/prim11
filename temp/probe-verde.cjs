/* Probe verde: احسب لكل صفحة سورة الأرقام الحقيقية من reading-order.js الحالي
   بعد التطبيق على كتاب البيانات المحفوظ — نسبة تغطية unionBox لكل رقاقة. */
const fs = require('fs');
const path = require('path');

function surf(pathname) {
  if (/^\/(islamic|ar)\b/.test(pathname)) {
    if (/^\/islamic\b/.test(pathname)) {
      return { from: 11, to: 16, gs: [1, 2, 3, 4, 5, 6, 7] };
    }
    return { from: 39, to: 43, gs: [6217, 6218, 6219, 6220, 6221] };
  }
  return null;
}

function unionBox(ws) {
  var b = null;
  for (var i = 0; i < ws.length; i++) {
    var r = ws[i].box;
    if (!r) continue;
    if (!b) b = [r[0], r[1], r[2], r[3]];
    else {
      var xe = r[0] + r[2], ye = r[1] + r[3];
      if (r[0] < b[0]) { b[2] += b[0] - r[0]; b[0] = r[0]; }
      if (xe > b[0] + b[2]) b[2] = xe - b[0];
      if (r[1] < b[1]) { b[3] += b[1] - r[1]; b[1] = r[1]; }
      if (ye > b[1] + b[3]) b[3] = ye - b[1];
    }
  }
  return b || [0, 0, 1, 1];
}

function keepWord(t) {
  if (!t) return false;
  if (t.length > 400) return false;
  if (/[\d\u0660-\u0669\u06F0-\u06F9]/.test(t)) return false;
  var l = String(t).replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[^\u0621-\u064A\u0671]/g, "");
  if (!l) return false;
  return true;
}

// نقرأ صفحات 11 و 39 من البيانات OCR (watch بيئة التطبيق)
for (const PAGE of [11, 39, 42]) {
  const fn = path.join('page-ocr', 'page-' + PAGE + '.json');
  if (!fs.existsSync(fn)) { console.log('PAGE ' + PAGE + ' no ocr file: ' + fn); continue; }
  const d = JSON.parse(fs.readFileSync(fn, 'utf8'));
  const words = (d.words || []).filter(w => keepWord(w.text));
  const ub = unionBox(words);
  const area = ub[2] * ub[3];
  // نشتق Union لكل آية؟ لا لدينا، لكن نحسب المساحة لكل سطر عبر متوسطات y
  console.log(`\nPAGE ${PAGE}: kept=${words.length} union=[${ub.map(x => Math.round(x)).join(',')}] areaPx=${Math.round(area)}`);
  // سطرية بسيطة
  const cy = words.map(w => w.box[1] + w.box[3] / 2);
  cy.sort((a, b) => a - b);
  const medH = words.map(w => w.box[3]).sort((a, b) => a - b)[words.length >> 1] || 1;
  const lineTh = Math.max(0.9, 0.7 * medH);
  let lines = [];
  for (const w of words) {
    const c = w.box[1] + w.box[3] / 2;
    let L = lines.length ? lines[lines.length - 1] : null;
    if (L && Math.abs(c - L.avg) <= lineTh) { L.items.push(w); L.avg = (L.avg * (L.items.length - 1) + c) / L.items.length; }
    else lines.push({ avg: c, items: [w] });
  }
  console.log(`  lines=${lines.length}  (medH=${Math.round(medH * 100) / 100})`);
}
