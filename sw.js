// SnapNote service worker — network-first (updates reach devices on refresh),
// cache fallback (offline launch still works). Version bumps on each deploy
// purge the old cache automatically.

const CACHE_NAME = 'snapnote-v2';   // bump this (v3, v4...) if you ever want a forced cache purge

self.addEventListener('install', e => {
  self.skipWaiting();   // new worker activates immediately, doesn't wait for old pages to close
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())   // take control of open pages right away
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // network answered: serve it live AND refresh the cache copy
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
  );
});