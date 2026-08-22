import { db, type TransaksiPending, type ProdukCache } from './db';

// ─── Transaksi Pending ─────────────────────────────────────────────

/** Simpan transaksi baru ke IndexedDB */
export async function savePendingTransaction(tx: TransaksiPending): Promise<void> {
  await db.transaksiPending.put(tx);
}

/** Ambil semua transaksi yang belum di-sync */
export async function getPendingTransactions(): Promise<TransaksiPending[]> {
  return db.transaksiPending.where('status').equals('pending').toArray();
}

/** Ambil semua transaksi (semua status) */
export async function getAllTransactions(): Promise<TransaksiPending[]> {
  return db.transaksiPending.orderBy('createdAt').reverse().toArray();
}

/** Tandai transaksi sebagai synced, simpan kode_nota dari server */
export async function markAsSynced(localId: string, kodeNota?: string, serverId?: number): Promise<void> {
  await db.transaksiPending.update(localId, {
    status: 'synced',
    kode_nota: kodeNota,
    server_id: serverId,
  });
}

/** Tandai transaksi sebagai conflict */
export async function markAsConflict(localId: string, reason: string): Promise<void> {
  await db.transaksiPending.update(localId, {
    status: 'conflict',
    conflict_reason: reason,
  });
}

/** Hapus transaksi yang sudah synced */
export async function clearSyncedTransactions(): Promise<void> {
  await db.transaksiPending.where('status').equals('synced').delete();
}

/** Hitung jumlah transaksi pending */
export async function countPending(): Promise<number> {
  return db.transaksiPending.where('status').equals('pending').count();
}

/** Hitung jumlah transaksi conflict */
export async function countConflicts(): Promise<number> {
  return db.transaksiPending.where('status').equals('conflict').count();
}

// ─── Produk Cache ──────────────────────────────────────────────────

/** Simpan/update daftar produk ke cache lokal */
export async function cacheProdukList(products: ProdukCache[]): Promise<void> {
  await db.produkCache.bulkPut(products);
}

/** Ambil semua produk dari cache lokal */
export async function getCachedProduk(): Promise<ProdukCache[]> {
  return db.produkCache.toArray();
}

/** Cari produk dari cache lokal */
export async function searchCachedProduk(query: string): Promise<ProdukCache[]> {
  const q = query.toLowerCase();
  return db.produkCache
    .filter((p) => p.nama.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q))
    .toArray();
}

/** Hapus semua cache produk (untuk force refresh) */
export async function clearProdukCache(): Promise<void> {
  await db.produkCache.clear();
}
