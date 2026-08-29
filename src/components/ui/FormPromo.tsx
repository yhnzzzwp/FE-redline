'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { authFetch } from '@/lib/api';

export interface Promo {
  id: number;
  nama_promo: string;
  kode_promo: string;
  tipe_promo: 'Persen' | 'Nominal';
  besar_promo: number;
  minimal_transaksi: number;
  maksimal_diskon: number | null;
  waktu_mulai: string;
  waktu_berakhir: string;
  kuota: number | null;
  terpakai: number;
  aktif: boolean;
}

/** Tanggal dari API bisa berupa 'YYYY-MM-DD' atau ISO penuh; input date butuh yang pertama. */
function tanggalInput(nilai: string | null | undefined): string {
  if (!nilai) return '';
  return nilai.slice(0, 10);
}

/**
 * Formulir promo, dipakai bersama oleh layar buat dan ubah.
 *
 * Batas 100 untuk tipe Persen ditegakkan backend; di sini ikut dipasang pada
 * atribut input agar kesalahannya ketahuan sebelum dikirim — promo 'persen'
 * bernilai 1000 berarti diskonnya sebesar seluruh subtotal.
 */
export default function FormPromo({ promo }: { promo?: Promo }) {
  const router = useRouter();
  const ubahMode = Boolean(promo);

  const [form, setForm] = useState({
    nama_promo: promo?.nama_promo ?? '',
    kode_promo: promo?.kode_promo ?? '',
    tipe_promo: promo?.tipe_promo ?? 'Persen',
    besar_promo: promo ? String(promo.besar_promo) : '',
    minimal_transaksi: promo ? String(promo.minimal_transaksi) : '0',
    maksimal_diskon: promo?.maksimal_diskon != null ? String(promo.maksimal_diskon) : '',
    waktu_mulai: tanggalInput(promo?.waktu_mulai),
    waktu_berakhir: tanggalInput(promo?.waktu_berakhir),
    kuota: promo?.kuota != null ? String(promo.kuota) : '',
    aktif: promo?.aktif ?? true,
  });
  const [mengirim, setMengirim] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<Record<string, string[]>>({});

  const ubah =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const nilai = e.target instanceof HTMLInputElement && e.target.type === 'checkbox'
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
        nama_promo: form.nama_promo.trim(),
        kode_promo: form.kode_promo.trim().toUpperCase(),
        tipe_promo: form.tipe_promo,
        besar_promo: Number(form.besar_promo),
        minimal_transaksi: Number(form.minimal_transaksi || 0),
        waktu_mulai: form.waktu_mulai,
        waktu_berakhir: form.waktu_berakhir,
        aktif: form.aktif,
      };
      // Kolom opsional yang kosong dibuang, bukan dikirim sebagai '': validator
      // menolak string kosong untuk aturan integer.
      if (form.maksimal_diskon !== '') payload.maksimal_diskon = Number(form.maksimal_diskon);
      if (form.kuota !== '') payload.kuota = Number(form.kuota);

      const res = await authFetch(
        ubahMode ? `/admin/promos/${promo!.id}` : '/admin/promos',
        { method: ubahMode ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      );
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const errors = (json?.errors ?? {}) as Record<string, string[]>;
        setErrorField(errors);
        setPesanError(
          Object.keys(errors).length > 0
            ? 'Beberapa kolom perlu diperbaiki.'
            : (json?.message ?? 'Promo gagal disimpan.')
        );
        return;
      }

      router.push('/admin/promo');
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
        <Kolom label="Nama promo" wajib galat={galat('nama_promo')}>
          <input
            required
            value={form.nama_promo}
            onChange={ubah('nama_promo')}
            placeholder="Diskon Akhir Tahun"
            className="rl-input"
          />
        </Kolom>

        <Kolom label="Kode promo" wajib galat={galat('kode_promo')} bantuan="Disimpan dalam huruf besar.">
          <input
            required
            value={form.kode_promo}
            onChange={ubah('kode_promo')}
            placeholder="AKHIR2026"
            className="rl-input rl-mono uppercase"
          />
        </Kolom>

        <Kolom label="Tipe" wajib galat={galat('tipe_promo')}>
          <select value={form.tipe_promo} onChange={ubah('tipe_promo')} className="rl-select">
            <option value="Persen">Persen (%)</option>
            <option value="Nominal">Nominal (Rp)</option>
          </select>
        </Kolom>

        <Kolom
          label={form.tipe_promo === 'Persen' ? 'Besar diskon (%)' : 'Besar diskon (Rp)'}
          wajib
          galat={galat('besar_promo')}
          bantuan={form.tipe_promo === 'Persen' ? 'Maksimal 100.' : undefined}
        >
          <input
            required
            type="number"
            min={1}
            max={form.tipe_promo === 'Persen' ? 100 : undefined}
            value={form.besar_promo}
            onChange={ubah('besar_promo')}
            className="rl-input"
          />
        </Kolom>

        <Kolom label="Minimal transaksi (Rp)" galat={galat('minimal_transaksi')}>
          <input
            type="number"
            min={0}
            value={form.minimal_transaksi}
            onChange={ubah('minimal_transaksi')}
            className="rl-input"
          />
        </Kolom>

        <Kolom
          label="Maksimal diskon (Rp)"
          galat={galat('maksimal_diskon')}
          bantuan="Kosongkan bila tanpa batas."
        >
          <input
            type="number"
            min={0}
            value={form.maksimal_diskon}
            onChange={ubah('maksimal_diskon')}
            className="rl-input"
          />
        </Kolom>

        <Kolom label="Mulai berlaku" wajib galat={galat('waktu_mulai')}>
          <input
            required
            type="date"
            value={form.waktu_mulai}
            onChange={ubah('waktu_mulai')}
            className="rl-input"
          />
        </Kolom>

        <Kolom label="Berakhir" wajib galat={galat('waktu_berakhir')}>
          <input
            required
            type="date"
            min={form.waktu_mulai || undefined}
            value={form.waktu_berakhir}
            onChange={ubah('waktu_berakhir')}
            className="rl-input"
          />
        </Kolom>

        <Kolom
          label="Kuota pemakaian"
          galat={galat('kuota')}
          bantuan={
            promo ? `Sudah terpakai ${promo.terpakai} kali. Kosongkan bila tanpa batas.` : 'Kosongkan bila tanpa batas.'
          }
        >
          <input type="number" min={1} value={form.kuota} onChange={ubah('kuota')} className="rl-input" />
        </Kolom>

        <label className="flex items-center gap-2.5 sm:mt-6">
          <input
            type="checkbox"
            checked={form.aktif}
            onChange={ubah('aktif')}
            className="w-4 h-4 accent-[#de1f26] cursor-pointer"
          />
          <span className="text-xs font-semibold text-neutral-800">
            Aktif — kode bisa dipakai di kasir
          </span>
        </label>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={mengirim}
          className="btn-redline inline-flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-60"
        >
          {mengirim && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {mengirim ? 'Menyimpan…' : ubahMode ? 'Simpan Perubahan' : 'Simpan Promo'}
        </button>
        <Link href="/admin/promo" className="btn-ghost text-xs no-underline">
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
