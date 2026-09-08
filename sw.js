const CACHE = 'checkpoint-v2'; // Changed to v2 to force old caches to clear
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .catch(() => {})
  );
  self.skipWaiting(); // Forces the new service worker to activate immediately
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// --- UPDATED TO NETWORK-FIRST STRATEGY ---
self.addEventListener('fetch', e => {
  // Only handle standard local requests (ignore external Firebase URLs)
  if (!e.request.url.startsWith(self.location.origin)) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // If network request works, clone it into cache
        if (response.status === 200) {
          const resClone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, resClone));
        }
        return response;
      })
      .catch(() => {
        // If network fails (offline), pull from cache
        return caches.match(e.request);
      })
  );
});
