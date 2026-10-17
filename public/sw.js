/*
 * ATHERIA service worker — minimal AND staleness-proof.
 *
 * Strategies:
 *  - /igra/assets/*  : CACHE-FIRST. These filenames carry a content hash
 *    (index-XXXX.js), so a cached entry can never be stale — a new deploy
 *    ships new hashes and therefore new URLs. This is what makes the game
 *    fully playable offline.
 *  - Navigations     : NETWORK-FIRST, cached app shell only as the offline
 *    fallback — the user online NEVER receives an old bundle from us.
 *  - Everything else : plain network passthrough.
 */
const SHELL = '/igra/';
const CACHE = 'atheria-shell-v2';
const ASSETS_RE = /\/igra\/assets\//;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.add(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Immutable hashed build output — cache-first is safe by construction.
  if (ASSETS_RE.test(req.url)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
      )
    );
    return;
  }

  // Navigations (and everything else): network-first, no staleness.
  event.respondWith(
    fetch(req).catch(() => {
      if (req.mode === 'navigate') {
        return caches.match(SHELL).then((r) => r || Response.error());
      }
      return Response.error();
    })
  );
});
