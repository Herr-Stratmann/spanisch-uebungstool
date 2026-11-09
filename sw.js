// Service Worker: Offline-Nutzung. Beim Ändern von Dateien VERSION erhöhen.
// Strategie: erst aus dem Cache antworten, im Hintergrund aktualisieren (stale-while-revalidate).

const VERSION = 'v1-2026-11-09c';
const DATEIEN = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/app.js', 'js/dom.js', 'js/audio.js', 'js/daten.js', 'js/check.js', 'js/scheduler.js',
  'js/storage.js', 'js/ablauf.js', 'js/bewertung.js',
  'js/views/ueben.js', 'js/views/fortschritt.js', 'js/views/saetze.js',
  'js/exercises/index.js', 'js/exercises/_ui.js', 'js/exercises/_mc.js', 'js/exercises/_luecke.js',
  'js/exercises/_fehlantworten.js', 'js/exercises/einfuehrung.js', 'js/exercises/mc_es_de.js',
  'js/exercises/mc_bild.js', 'js/exercises/tippen_de_es.js', 'js/exercises/luecke_hilfe.js',
  'js/exercises/luecke.js', 'js/exercises/situation.js',
  'data/index.json', 'data/vocab/unidad-01.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async (cache) => {
    const ausCache = await cache.match(e.request, { ignoreSearch: true });
    const ausNetz = fetch(e.request).then((antwort) => {
      if (antwort.ok) cache.put(e.request, antwort.clone());
      return antwort;
    }).catch(() => ausCache);
    return ausCache ?? ausNetz;
  }));
});
