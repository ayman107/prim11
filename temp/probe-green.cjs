const fs = require('fs');
let b;
for (const p of ['assets/index-DVM_Cyny.js', 'assets/index-DVM_Cyny.js']) {
  try { b = fs.readFileSync(p, 'utf8'); break; } catch (e) {}
}
if (!b) { console.log('NO BUNDLE'); process.exit(0); }
function probe(p, show = 4) {
  let arr = [], i = -1;
  while ((i = b.indexOf(p, i + 1)) !== -1 && arr.length < show) arr.push(i);
  if (!arr.length) { console.log(`[${p}] --- none ---`); return; }
  console.log(`\n##### ${p} (${b.split(p).length - 1}) #####`);
  arr.forEach(idx => {
    const s = b.slice(Math.max(0, idx - 140), idx + 110).replace(/\s+/g, ' ');
    console.log('@' + idx + ': ...' + s + '...');
  });
}
['.ayah', '"ayah"', 'isAyah', 'adata', 'verse-chip', 'green', 'highlight', '.green', 'chip', 'ui-green', '#3e9', '#2f9', 'speaking-word', 'color:#e3f3', 'fg-highlight', 'wordHighlight', '.table', '.semantics', 'semitag', '.meaning-chip', 'sungWord', 'touched-word', 'currentWord'