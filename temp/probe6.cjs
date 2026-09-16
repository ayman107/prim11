const fs = require('fs');
const b = fs.readFileSync('assets/index-DVM_Cyny.js', 'utf8');
function probe(p, show = 2, pad = 140) {
  let arr = [], i = -1;
  while ((i = b.indexOf(p, i + 1)) !== -1 && arr.length < show) arr.push(i);
  if (!arr.length) { console.log(`[${p}] NONE`); return; }
  console.log(`\n##### ${p} (total ${b.split(p).length - 1}) #####`);
  arr.forEach(idx => {
    console.log('@' + idx + ': ...' + b.slice(Math.max(0, idx - pad), idx + (pad + 40)).replace(/\s+/g, ' ') + '...');
  });
}
['"book-word', 'word.ayah', 'w.ayah', '.ayah', 'isAyah', 'ayahWord', 'verseWord', 'chipAyah', 'surah:',
 'verseChip', 'chipBox', 'hasAyah', 'e.ayah', 'kept.ayah', '"ayah"', 'Aya(']
  .forEach(p => probe(p, 3, 90));
