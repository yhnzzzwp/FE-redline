'use client';

import { useEffect, useRef } from 'react';
import { useConnection } from './connection';
import { syncPendingTransactions } from './sync';

/**
 * Menyinkronkan antrean transaksi offline saat koneksi pulih.
 *
 * Sebelumnya syncPendingTransactions() tidak pernah dipanggil dari mana pun —
 * seluruh lapisan offline (db.ts, storage.ts, sync.ts) adalah kode mati, dan
 * penjualan yang dibuat saat offline tidak pernah sampai ke server.
 */
export function AutoSync() {
  const { isOnline } = useConnection();
  const sebelumnya = useRef<boolean | null>(null);

  useEffect(() => {
    const dulu = sebelumnya.current;
    sebelumnya.current = isOnline;

    // Jalan saat pertama kali online, dan setiap kali koneksi pulih.
    if (isOnline && dulu !== true) {
      void syncPendingTransactions();
    }
  }, [isOnline]);

  return null;
}
