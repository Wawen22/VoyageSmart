'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, notify user
                  console.log('New content available, please refresh.');
                  
                  // Optionally show a notification to the user
                  if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('VoyageSmart Update Available', {
                      body: 'A new version is available. Please refresh the page.',
                      icon: '/images/logo-voyage_smart.png'
                    });
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
          console.log('Service Worker update available');
        }
      });

      // Clean up old service workers safely
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          if (registration.scope.includes('chrome-extension')) {
            // Don't interfere with extension service workers
            return;
          }

          // Only update if the service worker is in a valid state
          if (registration.active && registration.active.state === 'activated') {
            try {
              registration.update().catch((error) => {
                console.warn('Service Worker update failed:', error);
              });
            } catch (error) {
              console.warn('Service Worker update error:', error);
            }
          }
        });
      }).catch((error) => {
        console.warn('Failed to get service worker registrations:', error);
      });
    }
  }, []);

  return null;
}
