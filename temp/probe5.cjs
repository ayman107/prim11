const fs = require('fs');
let am, bd;
try { am = JSON.parse(fs.readFileSync('books-islamic/audio-map.json', 'utf8')); } catch (e) {}
const paths = ['books-islamic/book-data.json'];
for (const p of paths) { try { bd = JSON.parse(fs.readFileSync(p, 'utf8')); break; } catch (e) {} }
if (!bd) { console.log('NO book-data'); process.exit(0); }
console.log('book-data len:', bd.length, '| audio-map keys:', am ? Object.keys(am).length : -1県);
function boxl(b){ return '[' + b.map(n => (Math.round(n * 10000) / 10000).toFixed(4)).join(',') + ']'; }
for (const k of [6, 7, 11, 39, 42, 12]) {
  const el = bd[k];
  if (!el || !el.words) { console.log(`=== elem ${k}: NONE ===`); continue; }
  console.log(`\n=== elem ${k} (${el.words.length} words) ===`);
  for (let i = 0; i < el.words.length; i++) {
    const w = el.words[i];
    const hit = am ? am[w.text] : null;
    console.log(i + ' ' + boxl(w.box) + ' ' + JSON.stringify(w.text) + (hit ? '  AUDIO' : ''));
  }
}