const VERSION = 'yomo-book-v2';
self.addEventListener('install', (event) => { event.waitUntil(caches.delete(VERSION)); self.skipWaiting(); });
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.endsWith('.pdf') || event.request.headers.has('range')) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const copy = response.clone();
        caches.open(VERSION).then((c) => c.put(event.request, copy));
      }
      return response;
    } catch (err) {
      return (await caches.match(event.request)) || caches.match('/');
    }
  })());
});