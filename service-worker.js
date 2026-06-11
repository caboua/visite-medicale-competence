// V14 : service worker désactivé pour éviter les erreurs de cache HTTP 400.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
