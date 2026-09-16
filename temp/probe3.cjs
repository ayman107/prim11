const fs = require('fs');
let am;
try { am = JSON.parse(fs.readFileSync('books-islamic/audio-map.json', 'utf8')); } catch (e) {}
let bd;
try { bd = JSON.parse(fs.readFileSync('books-islamic/book-data.json', 'utf8')); } catch (e) { console.log('No books-islamic/book-data.json'); }

function boxline(b){ return '['+b.map(function(n){return Math.round(n*100)/100}).join(',')+']'; }
for (let k = 8; k <= 14; k++) {
  const el = bd ? bd[k] : null;
  if (!el || !el.words) { console.log('=== elem '+k+' (none) ==='); continue; }
  console.log('\n=== elem '+k+' — '+el.words.length+' words ===');
  for (let i = 0; i < el.words.length; i++) {
    const w = el.words[i];
    console.log(i+' '+boxline(w.box)+' '+JSON.stringify(w.text)+(am&&am[w.text]?'  audio:OK':''));
  }
}
