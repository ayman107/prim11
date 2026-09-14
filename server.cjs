const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const WebSocket = require('ws');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.pdf': 'application/pdf',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const EQ = {
  'ar-AE-FatimaNeural': 1, 'ar-AE-HamdanNeural': 1,
  'ar-EG-SalmaNeural': 1, 'ar-EG-ShakirNeural': 1,
  'ar-HO-DefinedNeural': 1,
  'ar-IQ-RanaNeural': 1,
  'ar-JO-LailaNeural': 1,
  'ar-KW-FahedNeural': 1, 'ar-KW-NouraNeural': 1,
  'ar-LB-LaylaNeural': 1, 'ar-LB-RamiNeural': 1,
  'ar-LY-ImanNeural': 1, 'ar-LY-OmarNeural': 1,
  'ar-MA-JamalNeural': 1, 'ar-MA-MounaNeural': 1,
  'ar-MR-MoussaNeural': 1,
  'ar-OM-AbdullahNeural': 1, 'ar-OM-AyshaNeural': 1,
  'ar-PS-CamillaNeural': 1,
  'ar-QA-AmalNeural': 1, 'ar-QA-MoazNeural': 1,
  'ar-SA-HamedNeural': 1, 'ar-SA-ZariyahNeural': 1,
  'ar-SY-AmanyNeural': 1, 'ar-SY-LaithNeural': 1,
  'ar-TN-HediNeural': 1, 'ar-TN-ReemNeural': 1,
  'ar-YE-MaryamNeural': 1, 'ar-YE-SalehNeural': 1,
  'en-US-AvaNeural': 1, 'en-US-GuyNeural': 1,
  'en-US-JennyNeural': 1, 'en-US-AriaNeural': 1,
  'en-US-DavisNeural': 1, 'en-US-AndrewNeural': 1,
  'en-US-BrianNeural': 1, 'en-US-EmmaNeural': 1,
  'en-GB-SoniaNeural': 1, 'en-GB-RyanNeural': 1,
  'en-AU-NatashaNeural': 1, 'en-AU-WilliamNeural': 1,
};

const EDGE_VOICES = Object.keys(EQ).sort();

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const CHROMIUM_FULL_VERSION = '143.0.3650.75';

function secMsGec() {
  let ticks = Math.floor(Date.now() / 1000) + 11644473600;
  ticks -= ticks % 300;
  ticks *= 1e9 / 100;
  return crypto
    .createHash('sha256')
    .update(Math.floor(ticks).toString() + TRUSTED_CLIENT_TOKEN)
    .digest('hex')
    .toUpperCase();
}

function jsDate() {
  return new Date().toUTCString().replace('GMT', 'GMT+0000 (Coordinated Universal Time)');
}

function xmlEscape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function synthEdge(text, voice) {
  return new Promise((resolve, reject) => {
    const gec = secMsGec();
    const connectionId = crypto.randomBytes(16).toString('hex');
    const muid = crypto.randomBytes(16).toString('hex').toUpperCase();
    const url =
      'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1' +
      '?TrustedClientToken=' + TRUSTED_CLIENT_TOKEN +
      '&Sec-MS-GEC=' + gec +
      '&Sec-MS-GEC-Version=1-' + CHROMIUM_FULL_VERSION +
      '&ConnectionId=' + connectionId;

    const headers = {
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache',
      'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0',
      'Cookie': 'muid=' + muid + ';',
    };

    const ws = new WebSocket(url, { headers });
    const chunks = [];
    let settled = false;
    const timer = setTimeout(() => { ws.terminate(); }, 15000);

    const done = (err, buf) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { ws.close(); } catch (e) {}
      if (err) reject(err); else resolve(buf);
    };

    ws.on('open', () => {
      ws.send(
        'X-Timestamp:' + jsDate() +
        '\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n' +
        '{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n'
      );
      const ssml =
        "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>" +
        "<voice name='" + voice + "'>" +
        "<prosody pitch='+0Hz' rate='+0%' volume='+0%'>" + xmlEscape(text) + '</prosody>' +
        '</voice></speak>';
      ws.send(
        'X-RequestId:' + crypto.randomBytes(16).toString('hex') +
        '\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:' + jsDate() + 'Z\r\nPath:ssml\r\n\r\n' + ssml
      );
    });

    ws.on('message', (data, isBinary) => {
      if (!isBinary) {
        const str = Buffer.from(data).toString('utf-8');
        if (str.includes('Path:turn.end')) done(null, Buffer.concat(chunks));
        return;
      }
      const buf = data;
      if (buf.length < 4) return;
      const headerLength = (buf[0] << 8) | buf[1];
      if (headerLength > buf.length) return;
      const audio = buf.slice(headerLength + 2);
      if (audio.length) chunks.push(audio);
    });

    ws.on('error', (e) => done(e));
    ws.on('close', () => done(new Error('ws closed before turn.end')));
  });
}

function httpsGet(url, { referer }) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        'Referer': referer,
        'Accept': '*/*',
      },
    };
    const get = (rest) => {
      const req = https.request(opts, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          if (--rest < 0) { res.resume(); reject(new Error('too many redirects')); return; }
          opts.path = new URL(res.headers.location, 'https://' + opts.hostname).pathname + new URL(res.headers.location, 'https://' + opts.hostname).search;
          opts.hostname = new URL(res.headers.location, 'https://' + opts.hostname).hostname;
          get(rest);
          return;
        }
        if (res.statusCode !== 200) { res.resume(); reject(new Error('google tts status ' + res.statusCode)); return; }
        const bufs = [];
        res.on('data', (d) => bufs.push(d));
        res.on('end', () => resolve(Buffer.concat(bufs)));
      });
      req.on('error', reject);
      req.end();
    };
    get(3);
  });
}

function synthGoogle(text, lang) {
  const tl = lang || 'ar';
  const url =
    'https://translate.google.com/translate_tts?ie=UTF-8&tl=' + tl + '&client=tw-ob&q=' +
    encodeURIComponent(String(text).slice(0, 200));
  return httpsGet(url, { referer: 'https://translate.google.com/' });
}

function handleTTS(req, res, u) {
  const q = u.searchParams;
  const text = (q.get('text') || '').slice(0, 4096);
  let voice = q.get('voice') || 'ar-SA-ZariyahNeural';

  if (!text) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'missing text' }));
    return;
  }

  if (voice === 'web:google:ar') {
    synthGoogle(text, 'ar')
      .then((buf) => {
        res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': buf.length, 'Cache-Control': 'public, max-age=86400' });
        res.end(buf);
      })
      .catch((err) => {
        res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: String(err.message || err) }));
      });
    return;
  }

  if (voice === 'web:google:en') {
    synthGoogle(text, 'en')
      .then((buf) => {
        res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': buf.length, 'Cache-Control': 'public, max-age=86400' });
        res.end(buf);
      })
      .catch((err) => {
        res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: String(err.message || err) }));
      });
    return;
  }

  if (!EQ[voice]) voice = 'ar-SA-ZariyahNeural';
  const lang = voice.startsWith('en') ? 'en' : 'ar';

  synthEdge(text, voice)
    .then((buf) => {
      res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': buf.length, 'Cache-Control': 'public, max-age=86400' });
      res.end(buf);
    })
    .catch(() => {
      synthGoogle(text, lang)
        .then((buf) => {
          res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': buf.length, 'Cache-Control': 'public, max-age=86400' });
          res.end(buf);
        })
        .catch((err) => {
          res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: String(err.message || err) }));
        });
    });
}

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const urlPath = decodeURIComponent(parsed.pathname);

  if (urlPath === '/api/tts') {
    handleTTS(req, res, parsed);
    return;
  }
  if (urlPath === '/api/voices') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(EDGE_VOICES));
    return;
  }

  let filePath = path.join(ROOT, path.normalize(urlPath));
  if (filePath === ROOT || urlPath.endsWith('/')) {
    filePath = path.join(filePath, 'index.html');
  }
  if (urlPath === '/sw.js') {
    filePath = path.join(ROOT, 'sw.js');
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 - not found</h1>');
      return;
    }
    if (filePath === path.join(ROOT, 'books', 'arabic-grade1.pdf')) {
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Length': stat.size,
        'Accept-Ranges': 'bytes',
        'Content-Disposition': 'inline',
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log('Yumo site running at http://localhost:' + PORT);
});