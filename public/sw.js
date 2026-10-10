const CACHE_NAME = 'lifeos-cache-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg',
  '/manifest.json'
];

// Instalar Service Worker y pre-cachear recursos estáticos básicos
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activar Service Worker y limpiar cachés antiguos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar peticiones y servir desde caché / buscar en red dinámicamente
self.addEventListener('fetch', (e) => {
  // Evitar interceptar llamadas que no sean HTTP/HTTPS (como chrome-extension, etc.)
  if (!e.request.url.startsWith(self.location.origin)) return;

  // No interceptar ni cachear llamadas de la API de datos dinámica ni de Vite en desarrollo
  if (e.request.url.includes('/api/') || e.request.url.includes('/@') || e.request.url.includes('node_modules')) return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Devolver respuesta cacheada
        return cachedResponse;
      }

      // De lo contrario, ir a la red
      return fetch(e.request).then((networkResponse) => {
        // Si la respuesta no es válida, la devolvemos directamente
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Cachear dinámicamente las nuevas peticiones (ej. assets js/css compilados)
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback offline para navegación si no hay red
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
