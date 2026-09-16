/*
 * sw.js — المستشار الزراعي (v3)
 * Caching strategy:
 *   - App shell (HTML/JS/CSS/manifest/icons): precached, cache-first.
 *   - Data JSONs: precached individually (one failure never breaks
 *     install), then served stale-while-revalidate so an offline user
 *     always gets the last good copy and an online user gets updates.
 *   - version.json: always network (with cache fallback) so update
 *     detection keeps working.
 *   - Navigations: network-first with cache fallback to './' offline.
 * All four existing databases remain cached; none removed.
 */
const CACHE = 'mustashar-v3';
const SHELL = [
  './',
  './index.html',
  './src/search-core.js',
  './src/app.js',
  './manifest.json',
  './version.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/favicon.svg'
];
const DATA = [
  './data/libya-248.json',
  './data/libya-500.json',
  './data/eu.json',
  './data/epa.json'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // shell must be present
    await Promise.all(SHELL.map(async url => {
      try { await cache.add(new Request(url, { cache: 'reload' })); }
      catch (err) { console.warn('[sw] shell precache failed:', url, err); }
    }));
    // data files are independent: a single failure must not fail install
    await Promise.all(DATA.map(async url => {
      try { await cache.add(new Request(url, { cache: 'reload' })); }
      catch (err) { console.warn('[sw] data precache failed:', url, err); }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n !== CACHE).map(n => caches.delete(n)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (err) {}
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // page navigations: network-first, fall back to cached shell
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const preload = await e.preloadResponse;
        if (preload) return preload;
        return await fetch(req);
      } catch (err) {
        const cache = await caches.open(CACHE);
        return (await cache.match('./')) || (await cache.match('./index.html'))
          || new Response('offline', { status: 503, statusText: 'offline' });
      }
    })());
    return;
  }

  // version.json: network-first (keeps update detection alive)
  if (url.pathname.endsWith('/version.json') || url.pathname === '/version.json') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const fresh = await fetch(new Request(req, { cache: 'no-store' }));
        if (fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        return (await cache.match(req))
          || new Response(JSON.stringify({ version: 'unknown' }), { headers: { 'Content-Type': 'application/json' } });
      }
    })());
    return;
  }

  // data JSONs: stale-while-revalidate
  if (DATA.some(d => url.pathname.endsWith(d.replace('./', '/')) || url.pathname.endsWith('/' + d.split('/').pop()))) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const network = fetch(new Request(req, { cache: 'no-store' }))
        .then(res => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => null);
      return cached || (await network) || new Response(JSON.stringify({ error: 'offline and not cached' }), { status: 504 });
    })());
    return;
  }

  // everything else (shell/assets): cache-first, then network, then cache put
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    if (hit) return hit;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok && url.origin === location.origin) cache.put(req, fresh.clone());
      return fresh;
    } catch (err) {
      return new Response('offline', { status: 503 });
    }
  })());
});
