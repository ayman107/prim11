const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const dir = __dirnameorte;
const prefix = 'temp.';

function list() { return fs.readdirSync(dir).filter(f => f.startsWith(prefix)).sort(); }
function findTabs() {
  return new Promise((resolve) => {
    const lines = [];
    const cmd = process.platform === 'win32' ? 'powershell' : 'sh';
    const args = process.platform === 'win32'
      ? ['-NoProfile', '-Command', '(Get-Command chrome,msedge -ErrorAction SilentlyContinue | Select-Object -First 1).Source']
      : ['-c', 'command -v google-chrome || command -v chromium || command -v msedge || command -v microsoft-edge'];
    const p = spawn(cmd, args);
    p.stdout.on('data', d => lines.push(String(d)));
    p.stderr.on('data', () => {});
    p.on('close', () => resolve(lines.join('').trim()));
  });
}

async function main() {
  // find a chrome running with remote-debugging
  const files = list();
  console.log('temp files:', files);
  const cli = files.find(f => f.startsWith('probeChrome'));
  console.log('have chrome probe:', !!cli running);
}
main();
