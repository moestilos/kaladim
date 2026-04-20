// Service Worker Kaladim — cache estrategia network-first para navegación,
// cache-first para assets estáticos. No cachea /api ni /admin (datos live).

const VERSION = 'v1';
const CACHE_ESTATICO = `kaladim-estatico-${VERSION}`;
const CACHE_RUNTIME = `kaladim-runtime-${VERSION}`;

const PRECACHE = [
  '/',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_ESTATICO).then((c) => c.addAll(PRECACHE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => ![CACHE_ESTATICO, CACHE_RUNTIME].includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // No cachear endpoints dinámicos
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/admin')) return;

  // Assets estáticos: cache-first
  if (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/icons/') ||
      /\.(css|js|woff2?|png|svg|jpg|webp|ico)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_ESTATICO).then((c) => c.put(req, clone)).catch(() => {});
        return res;
      }).catch(() => hit))
    );
    return;
  }

  // Páginas HTML: network-first con fallback cache
  e.respondWith(
    fetch(req).then((res) => {
      const clone = res.clone();
      caches.open(CACHE_RUNTIME).then((c) => c.put(req, clone)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match('/')))
  );
});
