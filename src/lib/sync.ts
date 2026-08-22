import { getPendingTransactions, markAsSynced, markAsConflict } from './storage';
import type { TransaksiPending } from './db';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

// ─── Types ─────────────────────────────────────────────────────────
interface SyncResultItem {
  local_id: string;
  status: 'synced' | 'conflict';
  kode_nota?: string;
  server_id?: number;
  reason?: string;
}

interface SyncResponse {
  status: 'success' | 'partial' | 'error';
  results?: SyncResultItem[];
  message?: string;
}

export interface SyncReport {
  total: number;
  synced: number;
  conflicts: number;
  errors: string[];
}

// ─── Sync Manager ──────────────────────────────────────────────────

/** Flag untuk mencegah double-sync */
let isSyncing = false;

/**
 * Sinkronisasi semua transaksi pending ke server.
 * Dipanggil otomatis saat status berubah ke online, atau manual oleh user.
 *
 * Flow:
 * 1. Ambil semua transaksi pending dari IndexedDB
 * 2. Kirim batch ke /api/v1/pos/sync
 * 3. Proses response per-item:
 *    - synced → update status di IndexedDB, simpan kode_nota
 *    - conflict → tandai, biarkan user resolve manual
 */
export async function syncPendingTransactions(): Promise<SyncReport> {
  if (isSyncing) {
    return { total: 0, synced: 0, conflicts: 0, errors: ['Sync sedang berjalan'] };
  }

  isSyncing = true;
  const report: SyncReport = { total: 0, synced: 0, conflicts: 0, errors: [] };

  try {
    const pending = await getPendingTransactions();
    report.total = pending.length;

    if (pending.length === 0) {
      return report;
    }

    // Kirim batch ke server
    const payload = pending.map(txToPayload);

    const res = await fetch(`${API_BASE}/pos/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaksi: payload }),
    });

    if (!res.ok) {
      report.errors.push(`Server error: ${res.status} ${res.statusText}`);
      return report;
    }

    const json: SyncResponse = await res.json();

    if (json.results && Array.isArray(json.results)) {
      for (const item of json.results) {
        if (item.status === 'synced') {
          await markAsSynced(item.local_id, item.kode_nota, item.server_id);
          report.synced++;
        } else if (item.status === 'conflict') {
          await markAsConflict(item.local_id, item.reason || 'Conflict dari server');
          report.conflicts++;
        }
      }
    } else if (json.status === 'success') {
      // Server tidak mengembalikan per-item results — tandai semua sebagai synced
      for (const tx of pending) {
        await markAsSynced(tx.localId);
        report.synced++;
      }
    } else {
      report.errors.push(json.message || 'Response tidak dikenali dari server');
    }
  } catch (err) {
    report.errors.push(
      err instanceof Error ? err.message : 'Gagal terhubung ke server saat sync'
    );
  } finally {
    isSyncing = false;
  }

  return report;
}

/** Konversi TransaksiPending ke format yang dikirim ke server */
function txToPayload(tx: TransaksiPending) {
  return {
    local_id: tx.localId,
    created_at: tx.createdAt,
    items: tx.items.map((item) => ({
      produk_id: item.produk_id,
      service_id: item.service_id,
      tipe: item.tipe,
      nama_item: item.nama_item,
      harga: item.harga,
      jumlah: item.jumlah,
    })),
    subtotal: tx.subtotal,
    diskon: tx.diskon,
    kode_promo: tx.kode_promo,
    total: tx.total,
    bayar: tx.bayar,
    kembalian: tx.kembalian,
    metode_bayar: tx.metode_bayar,
    nama_pembeli: tx.nama_pembeli,
    nomor_hp_pembeli: tx.nomor_hp_pembeli,
  };
}

/** Cek apakah sedang dalam proses sync */
export function getSyncStatus(): boolean {
  return isSyncing;
}
