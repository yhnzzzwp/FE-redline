'use client';

import { useEffect, type ReactNode } from 'react';
import { registerServiceWorker } from '@/lib/sw-register';
import { ConnectionProvider } from '@/lib/connection';
import { AutoSync } from '@/lib/AutoSync';

/**
 * Client-side provider yang membungkus:
 * 1. Service Worker registration (sekali saat mount)
 * 2. ConnectionProvider (status online/offline global)
 * 3. AutoSync (kirim antrean transaksi offline saat koneksi pulih)
 */
export default function ClientProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ConnectionProvider>
      <AutoSync />
      {children}
    </ConnectionProvider>
  );
}
