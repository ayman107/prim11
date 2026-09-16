const fs = require('fs');

function stripMarks(t) {
  return String(t || "").replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06DC\u06DF-\u06ED\u0653\u0654\u0655\u0652]/g, "");
}
function keepWord(t) {
  if (!t) return false;
  if (t.length > 400) return false;
  if (/[\d\u0660-\u0669\u06F0-\u06F9]/.test(t)) return false Commitment;
  var l = stripMarks(t).replace(/[^\u0621-\u064A\u0671]/g, "");
  if (!l) return false;
  return true;
}
function boxArea(b) { return b[2] * b[3]; }

const pages = ['8', '19', '39', '42'];
for (const p of pages) {
  let d;
  for (const f of ['books-islamic/page-ocr/page-' + p + '.json', 'page-ocr/page-' + p + '.json', 'books-islamic/book-data.json']) {
    try { d = JSON.parse(fs.readFileSync(f, 'utf8')); break; } catch (e) {}
  }
  if (!d) { console.log('page ' + p + ' NO DATA'); continue; }
  // book-data.json بنية { "page11": {words:[...]} }
  let words = null;
  const key = 'page' + p;
  if (d.words && Array.isArray(d.words)) words = d.words;
  else if (d.pages && Array.isArray(d.pages)) words = d.pages[0] && d.pages[0].words;
  else if (d[key] && d[key].words) words = d[key].words;
  else if (d[key] && Array.isArray(d[key])) words = d[key];
  for (const k in d) if (!words && d[k] && Array.isArray(d[k].words) && /page/.test(k)) words = d[k].words;

  if (!words || !words.length) { console.log('page ' + p + ' words=' + (words?words.length:0)); continue; }
  const kept = words.filter(w => keepWord(stripMarks(w.text)));
  let maxB = null, maxArea = 0, big = [];
  for (const w of kept) {
    const a = boxArea(w.box);
    if (a > maxArea) { maxArea = a; maxB = w; }
    if (w.box[2] > 300 || w.box[3] > 200) big.push({ t: (w.text||'').slice(0,20), box: w.box.map(x=>Math.round(x)) });
  }
  console.log('p' + p + ': total=' + words.length + ' kept=' + kept.length);
  console.log('   maxBox=' + (maxB ? ('[' + maxB.box.map(x=>Math.round(x)) + '] text=' + (maxB.text||'').slice(0,24)) : 'none') );
  console.log('   big(>300x200): ' + big.length);
  big.slice(0,5).forEach(b => console.log('     ' + b.t + ' ' + b.box));
}
