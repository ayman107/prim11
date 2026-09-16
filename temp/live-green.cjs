const fs = require('fs');
const path = require('path');

function stripMarks(t) {
  return String(t || "").replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06DC\u06DF-\u06ED\u0653\u0654\u0655\u0652]/g, "");
}
function keepWord(t) {
  if (!t) return false;
  if (t.length > 400) return false;
  if (/[\d\u0660-\u0669\u06F0-\u06F9]/.test(t)) return false;
  const l = stripMarks(t).replace(/[^\u0621-\u064A\u0671]/g, "");
  if (!l) return false;
  return true;
}

async function main() {
  const cr = await fetch('http://127.0.0.1:9222/json');
  if (!cr.ok) { console.log('no cdp json'); return; }
  const tabs = await cr.json();
  const tab = (tabs && tabs.find(t => /\/test\/|\/opencode\//.test(t.url))) || tabs[0];
  console.log('tab', tab && tab.url);
  if (!tab || !tab.webSocketDebuggerUrl) { console.log('NO TAB'); return; }

  const { spawn, execSync } = require('child_process');
  // استخدم أسلوب probe9 الهندسي عبر WebSocket
  function connect(wsUrl) {
    return new Promise((resolve, reject) => {
      try {
        const ws = require('ws');
        const w = new ws(wsUrl);
        w.on('open', () => resolve(w));
        w.on('error', reject);
      } catch (e) { reject(new Error('ws missing: ' + e.message)); }
    });
  }
  const ws = await connect(tab.webSocketDebuggerUrl);
  let id = 0;
  const pend = {};
  function send(method, params) {
    const idx = ++id;
    return new Promise((resolve) => {
      pend[idx] = resolve;
      ws.send(JSON.stringify({ id: idx, method, params: params || {} }));
      setTimeout(() => { if (pend[idx]) { pend[idx](null); delete pend[idx]; } }, 8000);
    });
  }
  ws.on('message', (d) => {
    const m = JSON.parse(d);
    if (m.id && pend[m.id]) { pend[m.id](m.result); delete pend[m.id]; }
  });

  // 1) أعد التحميل لتفعيل السكربت الجديد
  await send('Page.reload', { ignoreCache: true });
  await new Promise(r => setTimeout(r, 1800));

  // 2) افتح صفحة 11 من التطبيق عبر window.location
  const ev = await send('Runtime.evaluate', {
    expression: `(function(){
      var r = {};
      r.words = [];
      var words = document.querySelectorAll('.book-word');
      r.total = words.length;
      var uniq = {};
      for (var i = 0; i < words.length && i < 30; i++) {
        var w = words[i];
        var c = w.getBoundingClientRect();
        var kk = [Math.round(c.width), Math.round(c.height)].join('x');
        uniq[kk] = (uniq[kk] || 0) + 1;
      }
      r.uniqSizes = uniq;
      // صناديق كلها متساوية ضخمة؟ نحسب أقصى
      var maxA = 0, maxW = null;
      for (var i = 0; i < words.length; i++) {
        var c = words[i].getBoundingClientRect();
        var a = c.width * c.height;
        if (a > maxA) { maxA = a; maxW = i; }
      }
      r.maxArea = Math.round(maxA);
      r.maxWord = maxW;
      r.bigOverPage = words.length && document.querySelector('.page') ? Math.round(maxA / (document.querySelector('.page').getBoundingClientRect().width * document.querySelector('.page').getBoundingClientRect().height) * 100) + '%' : '';
      return JSON.stringify(r);
    })()`,
    returnByValue: true
  });
  console.log('\n=== LIVE (فوري) ===');
  console.log(ev && ev.result ? ev.result.value : JSON.stringify(ev));
  ws.close();
}
main().catch(e => console.error('ERR', e));
