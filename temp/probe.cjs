const fs = require('fs');
const b = fs.readFileSync('assets/index-DVM_Cyny.js', 'utf8');
const pats = ['audio/words', '"words"', 'word.fixed', 'Nn.current', '.fixed', 'husary', 'speakHusary', 'findAyah', 'tts', 'playAyah'];
for (const p of pats) {
  const matches = [];
  let i = -1;
  while ((i = b.indexOf(p, i + 1)) !== -1 && matches.length < 4) matches.push(i);
  matches.forEach(idx => {
    const s = b.slice(Math.max(0, idx - 100), idx + 90).replace(/\s+/g, ' ');
    console.log(`--- ${p} @ ${idx}: ...${s}...`);
  });
  console.log(`[${p}] total: ${b.split(p).length - 1}`);
}
