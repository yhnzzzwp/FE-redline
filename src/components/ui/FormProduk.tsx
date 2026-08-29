'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { useApiData } from '@/lib/useApiData';

export interface Kategori {
  id: number;
  nama_kategori: string;
}

export interface Produk {
  id: number;
  nama_produk: string;
  sku: string | null;
  kategori_id: number | null;
  deskripsi_produk: string | null;
  show_katalog: boolean;
  kategori?: Kategori | null;
}

/**
 * Formulir produk, dipakai bersama layar tambah dan ubah.
 *
 * Tidak ada kolom harga — dan itu memang rancangannya: kolom harga produk
 * dihapus pada migrasi 2026_08_20_000003, dan harga jual diisi kasir saat
 * transaksi (lihat app/Services/PosService.php). Menambahkan kolom harga di
 * sini akan menciptakan angka yang tidak pernah dipakai backend.
 */
export default function FormProduk({ produk }: { produk?: Produk }) {
  const router = useRouter();
  const ubahMode = Boolean(produk);

  const { data: kategoriData } = useApiData<Kategori[]>(
    '/admin/kategori',
    (json) => (json.data as Kategori[]) ?? []
  );
  const kategori = kategoriData ?? [];

  const [form, setForm] = useState({
    nama_produk: produk?.nama_produk ?? '',
    sku: produk?.sku ?? '',
    kategori_id: produk?.kategori_id ? String(produk.kategori_id) : '',
    deskripsi_produk: produk?.deskripsi_produk ?? '',
    show_katalog: produk?.show_katalog ?? true,
  });
  const [mengirim, setMengirim] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<Record<string, string[]>>({});

  const ubah =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const nilai =
        e.target instanceof HTMLInputElement && e.target.type === 'checkbox'
          ? e.target.checked
          : e.target.value;
      setForm((f) => ({ ...f, [key]: nilai }));
      setErrorField((prev) => (prev[key] ? { ...prev, [key]: [] } : prev));
    };

  const galat = (key: string): string | null => errorField[key]?.[0] ?? null;

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    setMengirim(true);
    setPesanError(null);
    setErrorField({});

    try {
      const payload: Record<string, string | number | boolean> = {
        nama_produk: form.nama_produk.trim(),
        kategori_id: Number(form.kategori_id),
        show_katalog: form.show_katalog,
      };
      // SKU kosong dibiarkan tidak dikirim: backend membuatkannya otomatis.
      if (form.sku.trim()) payload.sku = form.sku.trim();
      if (form.deskripsi_produk.trim()) payload.deskripsi_produk = form.deskripsi_produk.trim();

      const res = await authFetch(ubahMode ? `/admin/produk/${produk!.id}` : '/admin/produk', {
        method: ubahMode ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const errors = (json?.errors ?? {}) as Record<string, string[]>;
        setErrorField(errors);
        setPesanError(
          Object.keys(errors).length > 0
            ? 'Beberapa kolom perlu diperbaiki.'
            : (json?.message ?? 'Produk gagal disimpan.')
        );
        return;
      }

      router.push('/admin/produk');
      router.refresh();
    } catch {
      setPesanError('Server tidak dapat dihubungi. Periksa koneksi lalu coba lagi.');
    } finally {
      setMengirim(false);
    }
  };

  return (
    <form onSubmit={kirim} className="rl-card p-5 space-y-4 max-w-2xl">
      {pesanError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
          {pesanError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Kolom label="Nama produk" wajib galat={galat('nama_produk')}>
            <input
              required
              value={form.nama_produk}
              onChange={ubah('nama_produk')}
              placeholder="ASUS ROG Strix RTX 4090 24GB"
              className="rl-input"
            />
          </Kolom>
        </div>

        <Kolom label="Kategori" wajib galat={galat('kategori_id')}>
          <select required value={form.kategori_id} onChange={ubah('kategori_id')} className="rl-select">
            <option value="">— Pilih kategori —</option>
            {kategori.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama_kategori}
              </option>
            ))}
          </select>
        </Kolom>

        <Kolom label="SKU" galat={galat('sku')} bantuan="Kosongkan untuk dibuatkan otomatis.">
          <input
            value={form.sku}
            onChange={ubah('sku')}
            placeholder="RL-VGA-4090"
            className="rl-input rl-mono"
          />
        </Kolom>

        <div className="sm:col-span-2">
          <Kolom label="Deskripsi" galat={galat('deskripsi_produk')}>
            <textarea
              rows={4}
              value={form.deskripsi_produk}
              onChange={ubah('deskripsi_produk')}
              placeholder="Spesifikasi singkat, garansi, kelengkapan."
              className="rl-textarea"
            />
          </Kolom>
        </div>

        <label className="flex items-center gap-2.5 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.show_katalog}
            onChange={ubah('show_katalog')}
            className="w-4 h-4 accent-[#de1f26] cursor-pointer"
          />
          <span className="text-xs font-semibold text-neutral-800">
            Tampilkan di katalog publik situs
          </span>
        </label>
      </div>

      <p className="text-[11px] text-neutral-400 m-0">
        Harga tidak disimpan pada produk — kasir mengisinya saat transaksi di POS.
      </p>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={mengirim}
          className="btn-redline inline-flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-60"
        >
          {mengirim && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {mengirim ? 'Menyimpan…' : ubahMode ? 'Simpan Perubahan' : 'Simpan Produk'}
        </button>
        <Link href="/admin/produk" className="btn-ghost text-xs no-underline">
          Batal
        </Link>
      </div>
    </form>
  );
}

function Kolom({
  label,
  wajib = false,
  galat = null,
  bantuan,
  children,
}: {
  label: string;
  wajib?: boolean;
  galat?: string | null;
  bantuan?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="rl-label">
        {label}
        {wajib && <span className="text-[#de1f26]"> *</span>}
      </span>
      {children}
      {galat ? (
        <span className="block text-[11px] text-red-600 mt-1">{galat}</span>
      ) : bantuan ? (
        <span className="block text-[11px] text-neutral-400 mt-1">{bantuan}</span>
      ) : null}
    </label>
  );
}
