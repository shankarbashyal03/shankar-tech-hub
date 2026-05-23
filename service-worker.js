// ShankarTech Hub - Service Worker
const CACHE_NAME = 'shankartech-cache-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/logo.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/make-cv.png',
    '/icons/cover-letter.png',
    '/icons/emirates-id.png',
    '/icons/police-report-uae.png',
    '/icons/police-report-nepal.png',
    '/icons/epassport.png',
    '/icons/national-id.png',
    '/icons/pan-card.png',
    '/icons/voter-id.png',
    '/icons/shram-renewal.png',
    '/icons/other-services.png',
    '/services/index.html',
    '/courses/index.html',
    '/contact/index.html',
    '/settings/index.html',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install Event - Cache all assets
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching assets...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('✅ All assets cached successfully');
                return self.skipWaiting();
            })
    );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker: Activated');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Serve from cache, then network (Cache First Strategy)
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip Google Script / external API calls
    if (event.request.url.includes('googleapis.com') ||
        event.request.url.includes('script.google.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached response if found
                if (cachedResponse) {
                    // Fetch update in background (Stale-While-Revalidate)
                    fetch(event.request)
                        .then((networkResponse) => {
                            if (networkResponse && networkResponse.status === 200) {
                                caches.open(CACHE_NAME).then((cache) => {
                                    cache.put(event.request, networkResponse.clone());
                                });
                            }
                        })
                        .catch(() => {});
                    return cachedResponse;
                }

                // If not in cache, fetch from network
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Cache the new response for future
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Return a fallback for HTML pages
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// Push Notification Event
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New update from ShankarTech Hub',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200],
        data: { url: '/index.html' }
    };
    event.waitUntil(
        self.registration.showNotification('ShankarTech Hub', options)
    );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/index.html')
    );
});