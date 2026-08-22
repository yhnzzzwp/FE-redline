'use client';

import { useEffect, type ReactNode } from 'react';
import { registerServiceWorker } from '@/lib/sw-register';
import { ConnectionProvider } from '@/lib/connection';

/**
 * Client-side provider yang membungkus:
 * 1. Service Worker registration (sekali saat mount)
 * 2. ConnectionProvider (status online/offline global)
 */
export default function ClientProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return <ConnectionProvider>{children}</ConnectionProvider>;
}
