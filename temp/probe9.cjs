const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function main() {
  const cr = await fetch('http://127.0.0.1:9222/json');
  if (!cr.ok) { console.log('no cdp'); return; }
  const tabs = await cr.json();
  const tab = (tabs && tabs.find(t => /\/test\//.test(t.url))) || tabs[0];
  console.log('tab', tab && tab.url);

  if (!tab || !tab.webSocketDebuggerUrl) { console.log('NO TAB'); return; }

  // WebSocket client (manual, no lib)
  function connect(wsUrl) {
    return new Promise((resolve, reject) => {
      try {
        const ws = require('ws');
        const w = new ws(wsUrl);
        w.on('open', () => resolve(w));
        w.on('error', reject);
      } catch (e) { reject(new Error('ws module missing: ' + e.message)); }
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

  const ev = await send('Runtime.evaluate', {
    expression: `
      (function(){
        var r = { path: location.pathname };
        var words = document.querySelectorAll('.book-word');
        var uniq = {};
        r.total = words.length;
        r.firsts = [];
        for (var i = 0; i < words.length && i < 12; i++) {
          var w = words[i];
          var b = w.getBoundingClientRect();
          var key = b.x + '|' + b.y + '|' + b.width + '|' + b.height;
          uniq[key] = (uniq[key] || 0) + 1;
          r.firsts.push({ t: (w.getAttribute('data-text')||w.textContent||'').slice(0,20), box: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)], cls: w.className });
        }
        r.uniqSizes = Object.keys(uniq).length;
        var maxK = '', maxN = 0;
        for (var k in uniq) if (uniq[k] > maxN) { maxN = uniq[k]; maxK = k; }
        r.maxSize = { key: maxK, n: maxN };
        var sy = words.length ? window.getComputedStyle(words[0]).backgroundColor : '';
        var sy2 = words.length ? window.getComputedStyle(words[0]).mixBlendMode : '';
        r.styleBg = sy; r.blend = sy2;
        var tll = document.querySelector('.tashlih-layer,.drawing-layer') ? true : false;
        var styleSheets = [];
        try {
          for (var s = 0; s < document.styleSheets.length; s++) {
            var ss = document.styleSheets[s];
            for (var q = 0; q < (ss.cssRules ? ss.cssRules.length : 0); q++) {
              var rr = ss.cssRules[q];
              if (rr.selectorText && /book-word|speaking-word|chip|ayah/.test(rr.selectorText)) {
                styleSheets.push({ sel: rr.selectorText, css: rr.style ? (rr.style.backgroundColor + ' / ' + rr.style.boxShadow + ' / ' + rr.style.color) : '' });
              }
            }
          }
        } catch (e) { styleSheets = 'err:' + e.message; }
        r.cssRules = styleSheets;
        r.firstWord = words[0] ? words[0].outerHTML.slice(0, 300) : '';
        return JSON.stringify(r);
      })()
    `,
    returnByValue: true
  });
  console.log('\n=== PANEL (path=' + (location ? location.pathname : '?') + ') ===');
  const raw = ev && ev.result ? ev.result.value : (ev && ev.result) || ev;
  console.log(raw);
  ws.close();
}
main().catch(e => { console.error('ERR', e); });