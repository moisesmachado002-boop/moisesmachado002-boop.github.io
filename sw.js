const CACHE = 'meu-financeiro-v1-3-5';
const STATIC_ASSETS = [
  './manifest.json?v=1.3.5', './icon.svg', './category-fix.js?v=1.3.5',
  './body.01.txt?v=1.3.5', './body.02.txt?v=1.3.5', './body.03.txt?v=1.3.5', './body.04.txt?v=1.3.5', './body.05.txt?v=1.3.5',
  './style.01.txt?v=1.3.5', './style.02.txt?v=1.3.5', './style.03.txt?v=1.3.5',
  './app.01.txt?v=1.3.5', './app.02.txt?v=1.3.5', './app.03.txt?v=1.3.5', './app.04.txt?v=1.3.5', './app.05.txt?v=1.3.5', './app.06.txt?v=1.3.5', './app.07.txt?v=1.3.5', './app.08.txt?v=1.3.5', './app.09.txt?v=1.3.5', './app.10.txt?v=1.3.5', './app.11.txt?v=1.3.5'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isNavigation = event.request.mode === 'navigate';

  if (isNavigation) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put('./index.html', copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (isSameOrigin) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
