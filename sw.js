const VERSION = 'yomo-platform-v6';
const BLANK_WEBP = 'UklGRkAAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAIAAAAAAFZQOCAYAAAAMAEAnQEqAQABAAFAJiWkAANwAP789AAA';

self.addEventListener('install', (event) => { event.waitUntil(caches.delete(VERSION)); self.skipWaiting(); });

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION && k.indexOf('yomo-') !== 0).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

const clientLang = {};

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.endsWith('.pdf')) return;
  if (event.request.headers.has('range')) return;

  event.respondWith((async () => {
    let isEn = url.pathname.startsWith('/books-en/');
    if (!isEn) {
      try {
        if (event.clientId && clientLang[event.clientId] !== undefined) {
          isEn = clientLang[event.clientId];
        } else {
          const client = await self.clients.get(event.clientId);
          if (client && client.url) {
            isEn = client.url.indexOf('/en') !== -1;
            if (event.clientId) clientLang[event.clientId] = isEn;
          }
        }
      } catch (e) {}
    }

    const target = (isEn && url.pathname.startsWith('/books/'))
      ? new URL(url.origin + '/books-en/' + url.pathname.slice('/books/'.length) + url.search)
      : url;

    const isNav = event.request.mode === 'navigate';
    const isWebp = /\.webp$/i.test(target.pathname);
    const fetchUrl = isNav ? url.href : target.href;

    if (isWebp) {
      const hit = await caches.match(target.href);
      if (hit) return hit;
    }

    try {
      const response = await fetch(fetchUrl);
      if (response.ok) {
        const copy = response.clone();
        caches.open(VERSION).then((c) => c.put(fetchUrl, copy));
        return response;
      }
      if (isWebp) {
        const blank = new Response(atob(BLANK_WEBP), { status: 200, headers: { 'Content-Type': 'image/webp' } });
        caches.open(VERSION).then((c) => c.put(target.href, blank.clone()));
        return blank;
      }
      const cached = await caches.match(fetchUrl);
      if (cached) return cached;
      return response;
    } catch (err) {
      const cached = await caches.match(fetchUrl);
      if (cached) return cached;
      if (isNav) {
        const hub = await caches.match(self.location.origin + '/');
        if (hub) return hub;
        const en = await caches.match(self.location.origin + '/en/');
        if (en) return en;
        const ar = await caches.match(self.location.origin + '/ar/');
        if (ar) return ar;
        const islamic = await caches.match(self.location.origin + '/islamic/');
        if (islamic) return islamic;
      }
      return new Response('', { status: 503 });
    }
  })());
});