const { EDGE_VOICES } = require('./_edge');

module.exports = function handler(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' });
  res.end(JSON.stringify(EDGE_VOICES));
};