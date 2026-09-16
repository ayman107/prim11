const fs = require('fs');
const am = JSON.parse(fs.readFileSync('books-islamic/audio-map.json', 'utf8'));
let bd;
for (const p of ['books-islamic/book-data.json', 'books-islamic/book-data.json']) {
  try { bd = JSON.parse(fs.readFileSync(p, 'utf8')); break; } catch (e) { bd = null; }
}
if (!bd) { console.log('NO book-data'); process.exit(0); }
console.log('book-data is array?', Array.isArray(bd), 'len', bd.length);

for (let k = 10; k <= 13; k++) {
  const el = bd[k];
  if (!el || !el.words) { console.log(`=== elem ${k} (none) ===`); continue; }
  console.log(`\n=== elem ${k} — ${el.words.length} words ===`);
  for (let i = 0; i < el.words.length; i++) {
    const w = el.words[i];
    const b = w.box;
    const bx = '[' + b.map(n => (Math.round(n * 100) / 100).toFixed(2)).join(',') + ']';
    console.log(i + ' ' + JSON.stringify(w.text) + ' box=' + bx + ' audio=' + (am[w.text] ? 'Y' : '-'));
  }
}
