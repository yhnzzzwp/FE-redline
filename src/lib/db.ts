import Dexie, { type EntityTable } from 'dexie';

// ─── Tabel: transaksiPending ───────────────────────────────────────
export interface TransaksiPendingItem {
  id: string;
  produk_id?: number;
  service_id?: number;
  tipe: 'produk' | 'service';
  nama_item: string;
  harga: number;
  jumlah: number;
}

export interface TransaksiPending {
  localId: string;
  status: 'pending' | 'synced' | 'conflict';
  createdAt: string;
  items: TransaksiPendingItem[];
  subtotal: number;
  diskon: number;
  kode_promo?: string;
  total: number;
  bayar: number;
  kembalian: number;
  metode_bayar: string;
  nama_pembeli: string;
  nomor_hp_pembeli?: string;
  kode_nota?: string;        // Di-assign server setelah sync
  server_id?: number;        // ID dari server setelah sync
  conflict_reason?: string;  // Alasan jika conflict
}

// ─── Tabel: produkCache ────────────────────────────────────────────
export interface ProdukCache {
  id: number;
  nama: string;
  sku?: string;
  kategori: string;
  hargaTerakhir: number;
  stokTerakhir: number;
  updatedAt: string;
}

// ─── Database ──────────────────────────────────────────────────────
const db = new Dexie('RedlinePosDB') as Dexie & {
  transaksiPending: EntityTable<TransaksiPending, 'localId'>;
  produkCache: EntityTable<ProdukCache, 'id'>;
};

db.version(1).stores({
  transaksiPending: 'localId, status, createdAt',
  produkCache: 'id, nama, kategori, hargaTerakhir, stokTerakhir',
});

export { db };
