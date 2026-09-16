const WebSocket = require('ws');
const http = require('http');
const { spawn } = require('child_process');
const os = require('fs');
const path = require('path');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9358;
const PROFILE = require('os').tmpdir() + '/opencode/cdp_live3';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function httpGet(url) {
  return new Promise((res, rej) => {
    http.get(url, r => { let b = []; r.on('data', c => b.push(c)); r.on('end', () => res(JSON.parse(Buffer.concat(b).toString()))); }).on('error', rej);
  });
}

(async () => {
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--autoplay-policy=no-user-gesture-required',
    '--mute-audio', 'about:blank'
  ]);
  try {
    let targets;
    for (let i = 0; i < 40; i++) { await sleep(250); try { targets = await httpGet(`http://127.0.0.1:${PORT}/json`); if (targets.length) break; } catch (e) {} }
    const page = targets.find(t => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false });
    let id = 0;
    const pending = {};
    const evts = [];
    const send = (method, params) => new Promise((res, rej) => {
      const mid = ++id; pending[mid] = { res, rej };
      ws.send(JSON.stringify({ id: mid, method, params: params || {} }));
    });
    ws.on('message', d => {
      const m = JSON.parse(d.toString());
      if (m.id && pending[m.id]) { const p = pending[m.id]; delete pending[m.id]; m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
    });
    await new Promise(r => ws.on('open', r));
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });

    await send('Page.navigate', { url: 'https://prim11.vercel.app/islamic/' });
    await sleep(8000);

    // Check if reading-order ran
    const r1 = await send('Runtime.evaluate', { returnByValue: true, expression: `JSON.stringify({ro: window.__yumoReadingOrder||0, path: location.pathname, sw: !!(navigator.serviceWorker && navigator.serviceWorker.controller)})` });
    console.log('=== LIVE STATE ===');
    console.log('Result:', r1.result.value);

    // Inject the fetch interceptor check
    await send('Runtime.evaluate', { returnByValue: true, expression: `
      window.__liveBookData = null;
      window.__liveBookReady = new Promise(function(resolve){
        var origFetch = window.fetch;
        window.fetch = function(url, opts) {
          var result = origFetch.apply(this, arguments);
          if (typeof url === 'string' && url.indexOf('book-data.json') !== -1) {
            result.then(function(r){ return r.clone().json(); }).then(function(d){ window.__liveBookData = d; resolve(d); }).catch(function(){});
          }
          return result;
        };
      });
      true;
    ` });

    // Force re-fetch book-data
    await send('Runtime.evaluate', { returnByValue: true, expression: `
      window.__liveBookReady.then(function(d){
        window.__liveFetched = d;
      });
      fetch('/books-islamic/book-data.json').then(function(r){return r.json()}).then(function(d){window.__liveBookData2 = d;});
      true;
    ` });
    await sleep(4000);

    const r2 = await send('Runtime.evaluate', { returnByValue: true, expression: `
      (function(){
        var d = window.__liveBookData || window.__liveFetched || window.__liveBookData2;
        if (!d) return JSON.stringify({error:'no data loaded', ro: window.__yumoReadingOrder||0});
        var out = {ro: window.__yumoReadingOrder||0, type: Array.isArray(d) ? 'array' : 'object', len: Array.isArray(d) ? d.length : Object.keys(d).length};
        // Page 7 (elem 6) and page 8 (elem 7) - the عقيدة lesson
        var p6 = d[6], p7 = d[7];
        if (p6 && p6.words) out.p6_count = p6.words.length;
        if (p7 && p7.words) out.p7_count = p7.words.length;
        if (p7 && p7.words) out.p7_words = p7.words.slice(0,10).map(function(w){return w.text.substring(0,25);});
        // Check if surah ayahs are on page 12 (elem 11)
        var p12 = d[11];
        if (p12 && p12.words) {
          out.p12_count = p12.words.length;
          var ayahs = p12.words.filter(function(w){return !!w.ayah;});
          out.p12_ayahCount = ayahs.length;
          if (ayahs.length) out.p12_ayahs = ayahs.map(function(w){return {text:w.text.substring(0,30), g:w.ayah};});
        }
        return JSON.stringify(out);
      })()
    ` });
    console.log('=== BOOK DATA INSPECT ===');
    console.log('Result:', r2.result.value);

    // Now check the actual DOM: buttons/chips on current page
    const r3 = await send('Runtime.evaluate', { returnByValue: true, expression: `
      (function(){
        var btns = document.querySelectorAll('button');
        var chips = [];
        btns.forEach(function(b){
          var t = (b.textContent||'').trim();
          if (t.length > 1 && t.length < 200) chips.push(t.substring(0,40));
        });
        return JSON.stringify({totalButtons: btns.length, chips: chips.slice(0,15)});
      })()
    ` });
    console.log('=== DOM CHIPS ===');
    console.log('Result:', r3.result.value);

    ws.close();
  } finally { try { chrome.kill(); } catch (e) {} }
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
