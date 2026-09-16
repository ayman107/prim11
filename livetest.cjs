const WebSocket = require('ws');
const http = require('http');
const { spawn } = require('child_process');
const os = require('os');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9357;
const PROFILE = os.tmpdir() + '/opencode/cdp_live2';
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
    // Network disable cache to guarantee fresh fetch
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });

    await send('Page.navigate', { url: 'https://prim11.vercel.app/islamic/' });
    await sleep(7000);

    const r1 = await send('Runtime.evaluate', { returnByValue: true, expression: `
      JSON.stringify({
        ro: window.__yumoReadingOrder || 0,
        d: window.__yumoRODbg ? window.__yumoRODbg('7') : null,
        path: location.pathname,
        sw: !!(navigator.serviceWorker && navigator.serviceWorker.controller)
      })` });
    console.log('LIVE1:', r1.value);

    // now fetch book-data.json INSIDE the page (goes through reading-order interceptor)
    const r2 = await send('Runtime.evaluate', { returnByValue: true, expression: `
      (async function () {
        try {
          var res = await fetch('/books-islamic/book-data.json');
          var d = await res.json();
          function norm(s){return String(s||'').replace(/[\\u064B-\\u065F\\u0670\\u0640\\u06D6-\\u06DC\\u06DF-\\u06ED\\u0653\\u0654\\u0655]/g,'').replace(/[^\\u0621-\\u064A\\u0671\\s]/g,'').replace(/[\\u0621\\u0622\\u0623\\u0625\\u0671]/g,'\\u0627').replace(/\\u0629/g,'\\u0647').replace(/\\u0649/g,'\\u064A').replace(/\\s+/g,' ').trim();}
          function stripMarks(t){return String(t||'').replace(/[\\u064B-\\u065F\\u0670\\u0640\\u06D6-\\u06DC\\u06DF-\\u06ED\\u0653\\u0654\\u0655\\u0652]/g,'');}
          function garbleKey(t){return stripMarks(t).replace(/\\u0640/g,'').replace(/\\s+/g,'');}
          var GARBLE={ '\u0627\u0638\u0632\u0631':'\u0623\u064F\u0646\u0651\u0638\u064F\u0631\u0652', '\u0648\u0634\u0636\u0631':'\u0648\u064E\u0641\u064E\u0643\u0651\u064F\u0631', '\u062C\u0639\u0631\u0629':'\u0633\u064F\u0648\u0631\u0629\u064F', '\u0627\u0644\u0638\u0635\u0627\u0637':'\u0627\u0644\u0635\u0651\u0631\u0650\u0637\u064B' };
          function garbleFix(t){var k=garbleKey(t);return GARBLE[k]||t;}
          var out={ro: window.__yumoReadingOrder||0, verified: Array.isArray(d), p7: (d[7]||{}).words ? d[7].words.slice(3,8).map(function(w){return {t:garbleFix(w.text), a:!!w.ayah};}) : null, p12: (d[12]||{}).words ? d[12].words.slice(0,8).map(function(w){return {t:(w.text||'').substring(0,20), a:!!w.ayah, ay:w.ayah||null};}) : null};
          return JSON.stringify(out);
        } catch(e) { return 'ERR:'+e.message; }
      })()` });
    console.log('LIVE2:', r2.value);

    // Evaluate tap on an ayah chip: count buttons/husary
    const r3 = await send('Runtime.evaluate', { returnByValue: true, expression: `
      (async function () {
        var chipCount = document.querySelectorAll('[data-ayah]').length;
        var ayahEls = Array.from(document.querySelectorAll('button')).filter(function(b){return /\\u0628\\u0650\\u0633\\u0652\\u0645/.test(b.textContent)||/\\u0627\\u0644\\u062D\\u0645\\u062F/.test(b.textContent);}).length;
        return JSON.stringify({chipCount: chipCount, ayahButtons: ayahEls});
      })()` });
    console.log('LIVE3:', r3.value);

    ws.close();
  } finally { try { chrome.kill(); } catch (e) {} }
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });