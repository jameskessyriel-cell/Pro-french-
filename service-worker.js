// Service Worker — Maîtrise du Français Soutenu
// Permet l'installation PWA et un fonctionnement minimal hors-ligne.

const CACHE_NAME = "mfs-cache-v1";
const FILES_TO_CACHE = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Installation : on met en cache les fichiers essentiels
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Activation : on nettoie les anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Récupération : cache d'abord, puis réseau (sauf pour les appels API externes)
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Ne jamais intercepter les appels vers des API externes (ex: api.anthropic.com)
  if (url.includes("api.anthropic.com") || url.includes("unpkg.com")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Met en cache les nouvelles ressources locales avec succès
        if (response.ok && event.request.method === "GET") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
