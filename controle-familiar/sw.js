const CACHE = 'controle-familiar-v2.13.1';
const STATIC_ASSETS = [
  './index.html',
  './loader.js?v=2.13.1',
  './body.01.txt?v=2.13.1',
  './style.01.txt?v=2.13.1',
  './style.02.txt?v=2.13.1',
  './style.03.txt?v=2.13.1',
  './style.04.txt?v=2.13.1',
  './style.05.txt?v=2.13.1',
  './style.06.txt?v=2.13.1',
  './style.07.txt?v=2.13.1',
  './style.08.txt?v=2.13.1',
  './style.09.txt?v=2.13.1',
  './style.10.txt?v=2.13.1',
  './style.11.txt?v=2.13.1',
  './style.12.txt?v=2.13.1',
  './style.13.txt?v=2.13.1',
  './style.14.txt?v=2.13.1',
  './style.15.txt?v=2.13.1',
  './style.16.txt?v=2.13.1',
  './style.17.txt?v=2.13.1',
  './app.01.txt?v=2.13.1',
  './app.02.txt?v=2.13.1',
  './app.03.txt?v=2.13.1',
  './app.04.txt?v=2.13.1',
  './app.08.txt?v=2.13.1',
  './app.10.txt?v=2.13.1',
  './app.26.txt?v=2.13.1',
  './app.31.txt?v=2.13.1',
  './app.05.txt?v=2.13.1',
  './app.06.txt?v=2.13.1',
  './app.07.txt?v=2.13.1',
  './app.09.txt?v=2.13.1',
  './app.11.txt?v=2.13.1',
  './app.12.txt?v=2.13.1',
  './app.13.txt?v=2.13.1',
  './app.14.txt?v=2.13.1',
  './app.15.txt?v=2.13.1',
  './app.16.txt?v=2.13.1',
  './app.17.txt?v=2.13.1',
  './app.18.txt?v=2.13.1',
  './app.19.txt?v=2.13.1',
  './app.20.txt?v=2.13.1',
  './app.21.txt?v=2.13.1',
  './app.22.txt?v=2.13.1',
  './app.23.txt?v=2.13.1',
  './app.24.txt?v=2.13.1',
  './app.25.txt?v=2.13.1',
  './app.28.txt?v=2.13.1',
  './app.29.txt?v=2.13.1',
  './app.30.txt?v=2.13.1',
  './app.32.txt?v=2.13.1',
  './app.27.txt?v=2.13.1'
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