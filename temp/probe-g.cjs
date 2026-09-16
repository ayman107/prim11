const fs = require('fs');
const b = fs.readFileSync('assets/index-DVM_Cyny.js', 'utf8');
// Green highlight comes from CSS classes on chips. Find the CSS for the surah/ayah chip buttons.
const pats = ['green', '#22c', '#1a7', 'chip', 'ayah-chip', 'surah-chip', 'verse-chip', '#3c9', '#2c8', 'rgb(34', 'rgba(34', 'box-shadow:0 0 0 3px', 'outline-green'];
const done = {};
for (const p of pats) {
  let i = -1, n = 0;
  while ((i = b.indexOf(p, i + 1)) !== -1 && n < 4) { n++; }
  if (n === 0) continue;
  console.log(`\n===== ${p}: ${b.split(p).length - 1} hits =====`);
  let j = -1, c = 0;
  while ((j = b.indexOf(p, j + 1)) !== -1 && c < 3) {
    // only print if inside a class-ish context (near '{' or 'class')
    const s = b.slice(Math.max(0, j - 80), j + 60).replace(/\s+/g, ' ');
    if (/class|:|background|color/i.test(s)) { console.log('  ...' + s + '...'); c++; }
  }
}
