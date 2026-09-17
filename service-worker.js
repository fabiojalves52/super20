const CACHE = 'super20-painel-v1';
const APP_FILES = [
  '/painel',
  '/painel.html',
  '/style.css',
  '/transicao.css',
  '/config-painel.js',
  '/painel.js',
  '/logo.png',
  '/assets/mascote-super20.png',
  '/assets/mascote-megafone.png',
  '/super20-192.png',
  '/super20-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
