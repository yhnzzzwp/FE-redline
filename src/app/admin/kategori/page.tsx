'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useApiData } from '@/lib/useApiData';
import { authFetch } from '@/lib/api';
import { useConnection } from '@/lib/connection';

interface Kategori {
  id: number;
  nama_kategori: string;
  produk_count: number;
}

/**
 * Pengelolaan kategori produk.
 *
 * Endpoint CRUD-nya sudah lengkap sejak lama, tetapi panel hanya memakainya
 * untuk mengisi dropdown pada formulir produk — kategori baru tidak bisa dibuat
 * dari layar mana pun.
 *
 * Hanya nama yang bisa disunting: API kategori memang hanya menerima
 * nama_kategori. Kolom deskripsi_kategori dan tampil_filter ada di tabel tetapi
 * tidak dibaca backend di mana pun, jadi menampilkannya di sini hanya akan
 * menjanjikan sesuatu yang tidak berpengaruh.
 */
export default function AdminKategoriPage() {
  const { isOnline } = useConnection();

  const { data, loading, error, muatUlang } = useApiData<Kategori[]>(
    '/admin/kategori',
    (json) => (json.data as Kategori[]) ?? []
  );
  const kategori = data ?? [];

  const [namaBaru, setNamaBaru] = useState('');
  const [sedangTambah, setSedangTambah] = useState(false);
  const [idDisunting, setIdDisunting] = useState<number | null>(null);
  const [namaSunting, setNamaSunting] = useState('');
  const [sibuk, setSibuk] = useState<number | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);

  const tambah = async (e: React.FormEvent) => {
    e.preventDefault();
    const nama = namaBaru.trim();
    if (!nama) return;

    setSedangTambah(true);
    setPesan(null);
    try {
      const res = await authFetch('/admin/kategori', {
        method: 'POST',
        body: JSON.stringify({ nama_kategori: nama }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const errors = (json?.errors ?? {}) as Record<string, string[]>;
        setPesan(errors.nama_kategori?.[0] ?? json?.message ?? 'Kategori gagal ditambahkan.');
        return;
      }
      setNamaBaru('');
      muatUlang();
    } catch {
      setPesan('Server tidak dapat dihubungi.');
    } finally {
      setSedangTambah(false);
    }
  };

  const simpanSuntingan = async (k: Kategori) => {
    const nama = namaSunting.trim();
    if (!nama || nama === k.nama_kategori) {
      setIdDisunting(null);
      return;
    }

    setSibuk(k.id);
    setPesan(null);
    try {
      const res = await authFetch(`/admin/kategori/${k.id}`, {
        method: 'PUT',
        body: JSON.stringify({ nama_kategori: nama }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const errors = (json?.errors ?? {}) as Record<string, string[]>;
        setPesan(errors.nama_kategori?.[0] ?? json?.message ?? 'Kategori gagal diperbarui.');
        return;
      }
      setIdDisunting(null);
      muatUlang();
    } catch {
      setPesan('Server tidak dapat dihubungi.');
    } finally {
      setSibuk(null);
    }
  };

  const hapus = async (k: Kategori) => {
    // Backend menolak menghapus kategori yang masih punya produk; tombolnya
    // dimatikan lebih dulu agar penolakannya tidak datang sebagai kejutan.
    if (k.produk_count > 0) return;
    if (!window.confirm(`Hapus kategori "${k.nama_kategori}"?`)) return;

    setSibuk(k.id);
    setPesan(null);
    try {
      const res = await authFetch(`/admin/kategori/${k.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setPesan(json?.message ?? 'Kategori gagal dihapus.');
        return;
      }
      muatUlang();
    } catch {
      setPesan('Server tidak dapat dihubungi.');
    } finally {
      setSibuk(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rl-page-header">
        <Link
          href="/admin/produk"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 no-underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke daftar produk
        </Link>
        <h1 className="rl-page-title mb-1 mt-2">Kategori Produk</h1>
        <p className="rl-page-desc mb-0">
          Kategori dipakai untuk mengelompokkan produk dan menyaring katalog di situs.
        </p>
      </div>

      {!isOnline && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
          <strong>Mode Offline:</strong> kategori tidak dapat dimuat atau diubah.
        </div>
      )}

      {(pesan || error) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
          {pesan ?? error}
        </div>
      )}

      <form onSubmit={tambah} className="rl-card p-4 flex items-end gap-2 max-w-xl">
        <label className="block flex-1">
          <span className="rl-label">Kategori baru</span>
          <input
            value={namaBaru}
            onChange={(e) => setNamaBaru(e.target.value)}
            placeholder="Storage (SSD/HDD)"
            className="rl-input"
          />
        </label>
        <button
          type="submit"
          disabled={sedangTambah || !namaBaru.trim()}
          className="btn-redline rl-btn-sm inline-flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-60"
        >
          {sedangTambah ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Tambah
        </button>
      </form>

      <div className="rl-card overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-100/70 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10.5px]">
              <th className="py-3 px-4">Nama Kategori</th>
              <th className="py-3 px-4 text-center">Produk</th>
              <th className="py-3 px-4 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-800">
            {loading ? (
              <tr>
                <td colSpan={3} className="py-10 text-center text-neutral-400 text-xs">
                  Memuat kategori&hellip;
                </td>
              </tr>
            ) : kategori.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-10 text-center text-neutral-400 text-xs">
                  Belum ada kategori.
                </td>
              </tr>
            ) : (
              kategori.map((k) => (
                <tr key={k.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-2.5 px-4">
                    {idDisunting === k.id ? (
                      <input
                        autoFocus
                        value={namaSunting}
                        onChange={(e) => setNamaSunting(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            void simpanSuntingan(k);
                          }
                          if (e.key === 'Escape') setIdDisunting(null);
                        }}
                        className="rl-input"
                      />
                    ) : (
                      <span className="font-semibold text-neutral-900">{k.nama_kategori}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center rl-mono text-neutral-500">
                    {k.produk_count}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {idDisunting === k.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void simpanSuntingan(k)}
                            disabled={sibuk === k.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-[11px] font-semibold text-neutral-700 cursor-pointer disabled:opacity-50"
                          >
                            {sibuk === k.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setIdDisunting(null)}
                            aria-label="Batal menyunting"
                            className="inline-flex items-center justify-center p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-400 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setIdDisunting(k.id);
                              setNamaSunting(k.nama_kategori);
                              setPesan(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-[11px] font-semibold text-neutral-700 cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" /> Ubah
                          </button>
                          <button
                            type="button"
                            onClick={() => void hapus(k)}
                            disabled={sibuk === k.id || k.produk_count > 0}
                            title={
                              k.produk_count > 0
                                ? 'Masih ada produk pada kategori ini — pindahkan dulu produknya.'
                                : `Hapus ${k.nama_kategori}`
                            }
                            aria-label={`Hapus ${k.nama_kategori}`}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-400 hover:text-red-600 hover:border-red-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-neutral-400 disabled:hover:border-neutral-200"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
