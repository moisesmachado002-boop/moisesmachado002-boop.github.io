const CACHE = 'meu-financeiro-v1-3-2';
const ASSETS = ["./", "./index.html", "./loader.js", "./manifest.json", "./icon.svg", "./style.01.txt", "./style.02.txt", "./style.03.txt", "./app.01.txt", "./app.02.txt", "./app.03.txt", "./app.04.txt", "./app.05.txt", "./app.06.txt", "./app.07.txt", "./app.08.txt", "./app.09.txt", "./app.10.txt"];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
    return response;
  }).catch(() => caches.match('./index.html'))));
});
