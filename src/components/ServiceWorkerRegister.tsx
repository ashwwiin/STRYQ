'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('STRYQ Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('STRYQ Service Worker registration failed:', err);
        });
    }
  }, []);

  return null;
}
