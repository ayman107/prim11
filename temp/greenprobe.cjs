const fs = require('fs');
let b;
for (const p of ['assets/index-DVM_Cyny.js', 'assets/index-DVM_Cyny.js']) {
  try { b = fs.readFileSync(p, 'utf8'); break; } catch (e) {}
}
if (!b) { console.log('NO BUNDLE FOUND'); process.exit(0); }
function probe(p, show = 3) {
  const arr = [];
  let i = -1;
  while ((i = b.indexOf(p, i + 1)) !== -1 && arr.length < show) arr.push(i);
  if (!arr.length) { console.log(`[${p}] none`); return; }
  console.log(`\n##### ${p} (${b.split(p).length - 1} total) #####`);
  arr.forEach(idx => {
    const s = b.slice(Math.max(0, idx - 150), idx + 120).replace(/\s+/g, ' ');
    console.log(`@${idx}: ...${s}...`);
  });
}
// what makes a word render with a green background? search for background assignment on the word button
const pats = ['"book-word ', '"book-word"', 'aybG', 'ayg', '.green', 'isGreen', 'hadAyah', '"g"(', 'w.g', 'u.g', 'e.g',
  'verse-span', '.verse', 'hasG', '.for', 'foreground', 'white-space:nowrap;background', 'background:#77', 'background:#6a', 'background:var(--',
  'chipBox', 'chipChit', 'chips', 'sgAyah', 'surahMarginBottom'];
for (const p of pats) probe(pinates ? p : p, 2);
