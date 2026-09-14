const { EQ, synthEdge, synthGoogle } = require('./_edge');

module.exports = async function handler(req, res) {
  const u = new URL(req.url, 'http://localhost');
  const q = u.searchParams;
  const text = (q.get('text') || '').slice(0, 4096);
  let voice = q.get('voice') || 'ar-SA-ZariyahNeural';
  const headers = { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400' };

  if (!text) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'missing text' }));
    return;
  }

  const respond = (buf) => {
    res.writeHead(200, headers);
    res.end(buf);
  };

  const respondError = (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: String((err && err.message) || err) }));
  };

  if (voice === 'web:google:ar') {
    try {
      respond(await synthGoogle(text));
    } catch (err) {
      respondError(err);
    }
    return;
  }

  if (!EQ[voice]) voice = 'ar-SA-ZariyahNeural';

  try {
    respond(await synthEdge(text, voice));
  } catch (err) {
    try {
      respond(await synthGoogle(text));
    } catch (err2) {
      respondError(err2);
    }
  }
};