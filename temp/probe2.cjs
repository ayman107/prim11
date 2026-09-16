const fs = require('fs');
const b = fs.readFileSync('assets/index-DVM_Cyny.js', 'utf8');
// look at audio resolution: word.fixed vs word.text, and Ea/Nn.current keying
const pats = ['.fixed', 'Nn.current[', 'audio-map', "audioMap", 'fixedText', 'text.replace', '.audio', 'playAudio', 'currentWord'];
for (const p of pats) {
  let i = -1, n = 0;
  const arr = [];
  while ((i = b.indexOf(p, i + 1)) !== -1 && n < 8) { arr.push(i); n++; }
  arr.forEach(idx => {
    const s = b.slice(Math.max(0, idx - 120), idx + 100).replace(/\s+/g, ' ');
    console.log(`--- ${p} @ ${idx}: ...${s}...`);
  });
  console.log(`[${p}] total: ${b.split(p).length - 1}`);
}
