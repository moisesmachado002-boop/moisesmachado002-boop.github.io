const CACHE = 'controle-familiar-v2.4.0';
const STATIC_ASSETS = [
  './index.html',
  './loader.js?v=2.4.0',
  './body.01.txt?v=2.4.0',
  './style.01.txt?v=2.4.0',
  './style.02.txt?v=2.4.0',
  './style.03.txt?v=2.4.0',
  './style.04.txt?v=2.4.0',
  './style.05.txt?v=2.4.0',
  './app.01.txt?v=2.4.0',
  './app.02.txt?v=2.4.0',
  './app.03.txt?v=2.4.0',
  './app.04.txt?v=2.4.0',
  './app.08.txt?v=2.4.0',
  './app.10.txt?v=2.4.0',
  './app.05.txt?v=2.4.0',
  './app.06.txt?v=2.4.0',
  './app.07.txt?v=2.4.0',
  './app.09.txt?v=2.4.0',
  './app.11.txt?v=2.4.0',
  './app.12.txt?v=2.4.0'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key.startsWith('controle-familiar-') && key !== CACHE)
        .map(key => caches.delete(key))
    ))
  );
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
