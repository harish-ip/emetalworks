// Temporary cleanup worker: force-remove stale caches and unregister.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach((client) => client.navigate(client.url));
  })());
});

self.addEventListener('fetch', () => {
  // No-op: let network handle everything.
});