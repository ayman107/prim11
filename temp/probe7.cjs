const fs = require('fs');
let b;
for (const p of ['assets/index-DVM_Cyny.js']) {
  try { b = fs.readFileSync(p, 'utf8'); }
  catch (e) { b = null; }
}
if (!b) { console.log('NO BUNDLE'); process.exit(0); }
const PROBES = [
  ['chipSurah', 3], ['chipBox', 3], ['chipAyah', 3], ['cp.ayah', 3], ['cp.words', 3],
  ['w.ayah', 3], ['word.ayah', 3], ['\\.ayah', 3], ['chip', 2], ['Chipped', 3], ['chipped', 6],
  ['green', 6], ['#28a745', 3], ['#246', 3], ['#2a7', 3], ['#32a852', 3], ['#2fa44d', 3],
  ['#28c', 3], ['#2f8f', 3], ['#2e7d32', 3], ['tint', 4], ['dint', 4], ['shade', 6], ['sanct', 3],
  ['verse', 10]
];
PROBES.forEach(([p, n]) => {
  let i = -1, hits = [];
  while ((i = b.indexOf(p, i + 1)) !== -1 && hits.length < n) hits.push(i);
  if (!hits.length) { console.log(`@${p}: NONE`); return; }
  console.log(`\n##### @${p} (${hits.length}+) #####`);
  hits.forEach(j => {
    console.log('  @' + j + ': ...' + b.slice(Math.max(0, j - 120), j + 55).replace(/\s+/g, ' ') + '...');
  });
});
