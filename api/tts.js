const { EQ, synthEdge, synthGoogle } = require('./_edge');

module.exports = async function handler(req, res) {
  const u = new URL(req.url, 'http://localhost');
  const q = u.searchParams;
  const text = (q.get('text') || '').slice(0, 4096);
  let voice = q.get('voice') || 'ar-SA-ZariyahNeural';
  const headers = { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400' };

  if (voice.startsWith('edge:')) voice = voice.slice(5);

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

  if (voice.startsWith('web:google:')) {
    try {
      respond(await synthGoogle(text, voice.split(':')[2]));
    } catch (err) {
      respondError(err);
    }
    return;
  }

  if (!EQ[voice]) voice = 'ar-SA-ZariyahNeural';
  const lang = voice.startsWith('en') ? 'en' : 'ar';

  try {
    respond(await synthEdge(text, voice));
  } catch (err) {
    try {
      respond(await synthGoogle(text, lang));
    } catch (err2) {
      respondError(err2);
    }
  }
};