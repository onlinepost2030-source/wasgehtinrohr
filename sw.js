// Service Worker für "Rohr bewegt sich"
// Cacht nur die App-Hülle (HTML/Icons), damit die Seite auch offline zumindest
// startet. Die Termindaten (Gist-JSON) werden NIE aus dem Cache bedient,
// sondern immer frisch aus dem Netz geholt, damit du nie veraltete Termine
// siehst — nur wenn gar keine Verbindung besteht, greift ein Netzwerkfehler
// wie gewohnt (die Seite zeigt dann ihre eigene Fehlermeldung).

const CACHE_NAME = 'rohr-termine-shell-v1';
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Termindaten (Gist / GitHub API) immer live aus dem Netz, nie aus dem Cache
  if (url.hostname.includes('githubusercontent.com') || url.hostname.includes('api.github.com')) {
    return; // Browser macht normalen Netzwerk-Request, SW mischt sich nicht ein
  }

  // App-Hülle: erst Netz versuchen, bei Fehler auf Cache zurückfallen (offline-Start)
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
