'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            reg.update();
          })
          .catch((err) => {
            console.warn('STRYQ Service Worker registration failed:', err);
          });
      } else {
        // In development, unregister any service workers to prevent cached CSS conflicts
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
      }
    }
  }, []);

  return null;
}
