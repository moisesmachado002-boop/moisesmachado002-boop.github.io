const CACHE = 'meu-financeiro-v1-5-4';
const CACHE_PREFIX = 'meu-financeiro-';
const SCOPE_URL = new URL(self.registration.scope);
const SCOPE_PATH = SCOPE_URL.pathname;

const STATIC_ASSETS = [
  './index.html',
  './financeiro.html',
  './manifest.json?v=1.5.4',
  './manifest-app.json?v=1.5.4',
  './icon.svg',
  './loader.js?v=1.5.2',
  './loader-app.js',
  './category-fix.js?v=1.5.2',
  './loans.js?v=1.5.2',
  './auth-redirect-fix.js?v=1.5.2',
  './body.01.txt?v=1.5.2', './body.02.txt?v=1.5.2', './body.03.txt?v=1.5.2', './body.04.txt?v=1.5.2', './body.05.txt?v=1.5.2',
  './style.01.txt?v=1.5.2', './style.02.txt?v=1.5.2', './style.03.txt?v=1.5.2',
  './app.01.txt?v=1.5.2', './app.02.txt?v=1.5.2', './app.03.txt?v=1.5.2', './app.04.txt?v=1.5.2', './app.05.txt?v=1.5.2', './app.06.txt?v=1.5.2', './app.07.txt?v=1.5.2', './app.08.txt?v=1.5.2', './app.09.txt?v=1.5.2', './app.10.txt?v=1.5.2', './app.11.txt?v=1.5.2'
];

function relativeRootPath(url) {
  if (url.origin !== SCOPE_URL.origin || !url.pathname.startsWith(SCOPE_PATH)) return null;
  const relative = url.pathname.slice(SCOPE_PATH.length);
  return relative.includes('/') ? null : relative;
}

function navigationFallback(relative) {
  const file = relative === 'financeiro.html' ? 'financeiro.html' : 'index.html';
  return new URL(`./${file}`, self.registration.scope).href;
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
        .map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const relative = relativeRootPath(url);

  // Não interfere em /SIMULADO-01/, /controle-familiar/ ou qualquer outra subpasta.
  if (relative === null) return;

  const isNavigation = event.request.mode === 'navigate';

  if (isNavigation) {
    if (relative !== '' && relative !== 'index.html' && relative !== 'financeiro.html') return;

    const fallbackUrl = navigationFallback(relative);
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(fallbackUrl, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(fallbackUrl))
    );
    return;
  }

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
