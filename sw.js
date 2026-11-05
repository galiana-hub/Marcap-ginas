// Service worker: deja la app entera disponible sin conexión.
const VERSION = 'mp-v5';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'fonts/literata-latin-wght-normal.woff2',
  'fonts/literata-latin-wght-italic.woff2',
  'fonts/literata-latin-ext-wght-normal.woff2',
  'fonts/literata-latin-ext-wght-italic.woff2',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'vendor/jszip.min.js',
  'vendor/mammoth.browser.min.js',
  'vendor/pdf.min.mjs',
  'vendor/pdf.worker.min.mjs'
];

self.addEventListener('install', e => {
  // Cada archivo por separado: si falta uno, el resto se guarda igualmente.
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(ASSETS.map(a => c.add(a).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // diccionarios y traductor: siempre a la red

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
      return hit || net;
    })
  );
});
