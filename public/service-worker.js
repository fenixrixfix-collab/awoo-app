const CACHE_NAME = 'awoo-v1';
const urlsToCache = ['/', '/home', '/static/js/main.chunk.js', '/static/css/main.chunk.css'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
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
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Push уведомления
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'AWOO';
  const options = {
    body: data.body || 'Новое уведомление',
    icon: '/icon-192x192.png',
    badge: '/icon-32x32.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/home' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/home')
  );
});
