const fs = require('fs');
const o = JSON.parse(fs.readFileSync('books/book-data.json', 'utf8'));

const FIXES = new Map([
  ['أًأوََو', 'أَوَّلًا'],
  ['االلووعََعيْْيُُ', 'الوَعْيُ'],
  ['االلْببْصََصرََريِِي', 'البَصَرِيّ'],
]);

function isMark(c) { return /^[\u064B-\u065F\u0660\u0670\u06D6-\u06ED]$/.test(c); }
function isLetter(c) { return /^[\u0621-\u064A\u0671-\u06D3]$/.test(c) && c !== '\u0640'; }

function dedupWord(raw) {
  let out = '';
  for (const c of raw.split('')) {
    if (isLetter(c)) {
      // skip if previous kept char is the same letter
      const last = out ? Array.from(out).filter(isLetter).pop() : '';
      if (last === c) continue;
      out += c;
    } else if (isMark(c)) {
      out += c;
    } else if (c !== '\u0640') {
      out += c;
    }
  }
  return out;
}

function hasDupLetter(raw) {
  let prev = '';
  let sett = false;
  for (const c of raw.split('')) {
    if (isLetter(c)) { if (c === prev) return true; prev = c; }
  }
  return sett;
}

const rows = [];
for (let p = 0; p < o.length; p++) {
  for (const w of (o[p].words || [])) {
    const t = w.text;
    if (!t) continue;
    if (FIXES.has(t)) { rows.push({ pdf: o[p].pdf, orig: t, clean: FIXES.get(t) }); continue; }
    const hasDup = (() => { let prev = '', r = false; for (const c of t) { if (isLetter(c)) { if (c === prev) { r = true; prev=''; } else prev = c; } } return r; })();
    if (hasDup) {
      const cleaned = dedupWord(t);
      rows.push({ pdf: o[p].pdf, orig: t, clean: cleaned });
    }
  }
}
console.log('garbled words (dedup candidates):', rows.length);
const seen = new Map();
for (const r of rows) {
  const k = r.orig;
  const n = (seen.get(k) || 0) + 1;
  seen.set(k, n);
}
for (const [k, n] of [...seen.entries()].sort((a, b) => a[1] - b[1])) {
  const sample = rows.find(r => r.orig === k);
  console.log(`${String(n).padStart(3)}x | pdf ${String(sample.pdf).padStart(3)} | "${k}" => "${sample.clean}"`);
}