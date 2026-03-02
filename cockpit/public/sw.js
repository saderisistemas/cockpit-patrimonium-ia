// IRIS Cockpit Service Worker v1.0.0
const CACHE_NAME = 'iris-cockpit-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/favicon.png',
];

// Install: cache static shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: network-first strategy (real-time app needs fresh data)
self.addEventListener('fetch', (event) => {
    // Skip non-GET and Supabase/API requests
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.hostname.includes('supabase') || url.hostname.includes('cloudfy')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache successful responses for offline fallback
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
