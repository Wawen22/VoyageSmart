// Service Worker for VoyageSmart
// Handles caching with proper extension filtering

const CACHE_NAME = 'voyage-smart-v1';
const STATIC_CACHE = 'voyage-smart-static-v1';

// URLs to cache
const urlsToCache = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/images/logo-voyage_smart.png',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Helper function to check if request is from extension
function isExtensionRequest(request) {
  const url = request.url;
  return url.startsWith('chrome-extension://') || 
         url.startsWith('moz-extension://') || 
         url.startsWith('safari-extension://') ||
         url.startsWith('ms-browser-extension://');
}

// Helper function to check if request should be cached
function shouldCache(request) {
  // Don't cache extension requests
  if (isExtensionRequest(request)) {
    return false;
  }
  
  // Don't cache non-GET requests
  if (request.method !== 'GET') {
    return false;
  }
  
  // Don't cache API requests
  if (request.url.includes('/api/')) {
    return false;
  }
  
  // Don't cache external requests (except for same origin)
  const url = new URL(request.url);
  const origin = new URL(self.location.origin);
  if (url.origin !== origin.origin) {
    return false;
  }
  
  return true;
}

// Fetch event with extension filtering
self.addEventListener('fetch', (event) => {
  // Skip extension requests entirely
  if (isExtensionRequest(event.request)) {
    console.log('Skipping extension request:', event.request.url);
    return;
  }
  
  // Skip non-cacheable requests
  if (!shouldCache(event.request)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response because it's a stream
          const responseToCache = response.clone();
          
          // Add to cache
          caches.open(CACHE_NAME)
            .then((cache) => {
              try {
                cache.put(event.request, responseToCache);
              } catch (error) {
                console.warn('Failed to cache request:', event.request.url, error);
              }
            })
            .catch((error) => {
              console.warn('Cache operation failed:', error);
            });
          
          return response;
        }).catch((error) => {
          console.error('Fetch failed:', error);
          // Return a fallback response if needed
          throw error;
        });
      })
      .catch((error) => {
        console.error('Cache match failed:', error);
        // Fallback to network
        return fetch(event.request);
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});
