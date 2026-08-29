import { getPendingTransactions, markAsSynced, markAsConflict } from './storage';
import { authFetch } from './api';
import type { TransaksiPending } from './db';

// ─── Types ─────────────────────────────────────────────────────────
/**
 * Bentuk respons /pos/sync sesuai ApiPosController::sync di backend.
 *
 * Versi sebelumnya membaca `json.results`, kunci yang TIDAK pernah dikirim
 * server. Akibatnya kode jatuh ke cabang `status === 'success'` dan menandai
 * SEMUA transaksi sebagai tersinkron tanpa memeriksa satu pun hasil per-item —
 * termasuk yang sebenarnya ditolak server.
 */
interface SyncedItem {
  local_id: string;
  kode_nota?: string;
  status: 'synced' | 'already_synced';
}

interface ErrorItem {
  index: number;
  local_id: string | null;
  errors: string[];
}

interface SyncResponse {
  status: 'success' | 'partial' | 'error';
  synced?: SyncedItem[];
  errors?: ErrorItem[];
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

    const res = await authFetch('/pos/sync', {
      method: 'POST',
      body: JSON.stringify({ transaksi: payload }),
    });

    // Endpoint sync sekarang butuh Bearer token. Transaksi TIDAK ditandai
    // synced saat sesi mati — biarkan tetap pending supaya tidak ada
    // penjualan yang hilang, dan beri tahu kasir untuk masuk kembali.
    if (res.status === 401) {
      report.errors.push(
        'Sesi berakhir. Masuk kembali untuk menyinkronkan transaksi offline. Transaksi tetap tersimpan.'
      );
      return report;
    }

    if (!res.ok) {
      report.errors.push(`Server error: ${res.status} ${res.statusText}`);
      return report;
    }

    const json: SyncResponse = await res.json();

    for (const item of json.synced ?? []) {
      await markAsSynced(item.local_id, item.kode_nota);
      report.synced++;
    }

    for (const item of json.errors ?? []) {
      if (!item.local_id) {
        report.errors.push(item.errors.join('; '));
        continue;
      }
      // Ditandai conflict, BUKAN synced: transaksinya tetap tersimpan lokal
      // supaya tidak ada penjualan yang hilang diam-diam.
      await markAsConflict(item.local_id, item.errors.join('; '));
      report.conflicts++;
    }

    if ((json.synced ?? []).length === 0 && (json.errors ?? []).length === 0) {
      report.errors.push(json.message || 'Server tidak mengembalikan hasil sinkronisasi.');
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
