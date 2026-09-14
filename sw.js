const VERSION = 'yomo-platform-v3';
const BLANK_WEBP = 'UklGRkAAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAIAAAAAAFZQOCAYAAAAMAEAnQEqAQABAAFAJiWkAANwAP789AAA';

self.addEventListener('install', (event) => { event.waitUntil(caches.delete(VERSION)); self.skipWaiting(); });
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION && k.indexOf('yomo-') !== 0).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.endsWith('.pdf') || event.request.headers.has('range')) return;

  event.respondWith((async () => {
    let isEn = url.pathname.startsWith('/books-en/');
    if (!isEn) {
      try {
        const client = await self.clients.get(event.clientId);
        if (client && client.url) isEn = client.url.includes('/en');
      } catch (e) {}
    }

    const rewrite = (u) => (isEn && u.pathname.startsWith('/books/'))
      ? new URL(u.origin + '/books-en/' + u.pathname.slice('/books/'.length) + u.search)
      : u;

    const target = rewrite(url);
    const req = new Request(target.href, event.request);
    const isWebp = /\.webp$/i.test(target.pathname);
    const isBookJson = /\/books(?:-en)?\/(book-data|audio-map)\.json$/.test(target.pathname);

    // Static page images / cover: cache-first (keyed by per-platform rewritten URL)
    if (isWebp) {
      const hit = await caches.match(req);
      if (hit) return hit;
    }

    try {
      const response = await fetch(req);
      if (response.ok) {
        const copy = response.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return response;
      }
      if (isWebp) {
        const blank = new Response(atob(BLANK_WEBP), { status: 200, headers: { 'Content-Type': 'image/webp' } });
        caches.open(VERSION).then((c) => c.put(req, blank.clone()));
        return blank;
      }
      // Non-webp book JSON: network-first, fall back to cached copy
      const cached = await caches.match(req);
      if (cached) return cached;
      return response;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      return (await caches.match('/')) || new Response('', { status: 503 });
    }
  })());
});