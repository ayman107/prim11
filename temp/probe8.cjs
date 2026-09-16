const fs = require('fs');
const bundle = fs.readFileSync('assets/index-DVM_Cyny.js','utf8');
const css = (() => { try { return fs.readFileSync('assets/index-CEFcqToO.css','utf8'); } catch(e){ return ''; } })();
function probe(str, n) {
  const idxs = []; let i = -1;
  while ((i = bundle.indexOf(str, i + 1)) !== -1 && idxs.length < n) idxs.push(i);
  console.log(`\n===== "$str" -> ${(bundle.split(str).length - 1)} =====`);
  idxs.forEach(j => {
    let seg = bundle.slice(Math.max(0, j - 110), j + 75).replace(/\s+/g, ' ');
    console.log('  @' + j + ': ...' + seg + '...');
  });
}
['speaking-word','book-word','word-box','chip','surah','chip-circle','verse','ayah','speech','reading','next','playAyah','findAyah','husary','gText','alphabet?','selected','onWord','tap','wordIndex','wordIdx','current-word','bookWord']
  .forEach(p => probe(p, 3));
console.log('\n\n########## CSS probes ##########');
['speaking-word','book-word','chip','surah','ayah','current-word','green','#b6d867','#aecb52','#28a','#2d','shade','tint']
  .forEach(p => {
    const idxs = []; let i = -1;
    while ((i = css.indexOf(p, i + 1)) !== -1 && idxs.length < 4) idxs.push(i);
    console.log(`\n===== CSS "$p" -> ${(css.split(p).length - 1)} =====`);
    idxs.forEach(j => console.log('  @' + j + ': ...' + css.slice(Math.max(0, j - 110), j + 75).replace(/\s+/g, ' ') + '...'));
  });