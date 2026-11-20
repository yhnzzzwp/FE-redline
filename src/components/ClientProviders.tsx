'use client';

import { useEffect, type ReactNode } from 'react';
import { registerServiceWorker } from '@/lib/swRegister';
import { ConnectionProvider } from '@/lib/connection';
import { AutoSyncProvider } from '@/lib/AutoSyncProvider';

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
      <AutoSyncProvider />
      {children}
    </ConnectionProvider>
  );
}
