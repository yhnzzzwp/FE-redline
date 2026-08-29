'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { useApiData, daftar } from '@/lib/useApiData';

interface Pegawai {
  id: number;
  nama_pegawai: string;
  masih_bekerja: boolean;
}

/**
 * Terima servis baru.
 *
 * Sebelumnya layar ini tidak ada sama sekali: /admin/service hanya bisa
 * menampilkan daftar dan detail, sehingga tiket hanya dapat dibuat lewat portal
 * Blade — dan portal itu pun mensyaratkan perangkat yang sudah terdaftar,
 * padahal tidak ada layar untuk mendaftarkannya. Untuk pelanggan baru, satu-
 * satunya jalan adalah memanggil API secara manual.
 *
 * Endpoint POST /admin/services sudah mendukung pelanggan baru: bila
 * perangkat_id dikosongkan, perangkat dibuat dari data pelanggan di bawah ini.
 * Jadi satu formulir cukup — sesuai kenyataan di konter servis.
 */
export default function TambahServicePage() {
  const router = useRouter();

  const { data: pegawaiData } = useApiData<Pegawai[]>(
    '/admin/pegawai?per_page=100',
    (json) => daftar<Pegawai>(json)
  );
  const teknisi = (pegawaiData ?? []).filter((p) => p.masih_bekerja);

  const [form, setForm] = useState({
    nama_customer: '',
    nomor_hp_customer: '',
    merk_model: '',
    serial_number: '',
    keluhan: '',
    biaya_service: '',
    estimasi_selesai: '',
    teknisi_id: '',
  });
  const [mengirim, setMengirim] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ubah = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    setMengirim(true);
    setError(null);

    try {
      // Field kosong dibuang, bukan dikirim sebagai string kosong: validator
      // Laravel memperlakukan '' pada integer/date sebagai nilai tak sah.
      const payload: Record<string, string | number> = {
        nama_customer: form.nama_customer.trim(),
        merk_model: form.merk_model.trim(),
        keluhan: form.keluhan.trim(),
      };
      if (form.nomor_hp_customer.trim()) payload.nomor_hp_customer = form.nomor_hp_customer.trim();
      if (form.serial_number.trim()) payload.serial_number = form.serial_number.trim();
      if (form.biaya_service !== '') payload.biaya_service = Number(form.biaya_service);
      if (form.estimasi_selesai) payload.estimasi_selesai = form.estimasi_selesai;
      if (form.teknisi_id) payload.teknisi_id = Number(form.teknisi_id);

      const res = await authFetch('/admin/services', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const errors = json?.errors as Record<string, string[]> | undefined;
        setError(
          errors
            ? Object.values(errors).flat().join(' ')
            : (json?.message ?? 'Tiket servis gagal dibuat.')
        );
        return;
      }

      const id = json?.data?.id;
      router.push(id ? `/admin/service/${id}` : '/admin/service');
    } catch {
      setError('Server tidak dapat dihubungi. Periksa koneksi lalu coba lagi.');
    } finally {
      setMengirim(false);
    }
  };

  const kelasInput =
    'w-full px-3 py-2 rounded-xl bg-white border border-neutral-200 focus:border-[#de1f26] focus:ring-2 focus:ring-red-100 text-xs text-neutral-800 transition-all outline-none';

  return (
    <div className="space-y-4">
      <div className="rl-page-header">
        <Link
          href="/admin/service"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 no-underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke daftar servis
        </Link>
        <h1 className="rl-page-title mb-1 mt-2">Terima Servis Baru</h1>
        <p className="rl-page-desc mb-0">
          Nomor resi dibuat otomatis setelah tiket tersimpan.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={kirim} className="rl-card p-5 space-y-5 max-w-3xl">
        <div>
          <h2 className="text-xs font-semibold text-neutral-800 mb-3">Data Pelanggan &amp; Perangkat</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="block text-xs text-neutral-600 mb-1.5">Nama pelanggan *</span>
              <input required value={form.nama_customer} onChange={ubah('nama_customer')} className={kelasInput} />
            </label>
            <label className="block">
              <span className="block text-xs text-neutral-600 mb-1.5">Nomor WhatsApp</span>
              <input
                value={form.nomor_hp_customer}
                onChange={ubah('nomor_hp_customer')}
                placeholder="08xxxxxxxxxx"
                className={kelasInput}
              />
            </label>
            <label className="block">
              <span className="block text-xs text-neutral-600 mb-1.5">Merk / model perangkat *</span>
              <input
                required
                value={form.merk_model}
                onChange={ubah('merk_model')}
                placeholder="Asus TUF Gaming A15"
                className={kelasInput}
              />
            </label>
            <label className="block">
              <span className="block text-xs text-neutral-600 mb-1.5">Serial number</span>
              <input value={form.serial_number} onChange={ubah('serial_number')} className={kelasInput} />
            </label>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-neutral-800 mb-3">Keluhan &amp; Estimasi</h2>
          <label className="block mb-3">
            <span className="block text-xs text-neutral-600 mb-1.5">Keluhan *</span>
            <textarea
              required
              rows={3}
              value={form.keluhan}
              onChange={ubah('keluhan')}
              placeholder="Mati total setelah kena air, tidak mau menyala sama sekali"
              className={kelasInput}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="block text-xs text-neutral-600 mb-1.5">Estimasi biaya (Rp)</span>
              <input
                type="number"
                min={0}
                value={form.biaya_service}
                onChange={ubah('biaya_service')}
                className={kelasInput}
              />
            </label>
            <label className="block">
              <span className="block text-xs text-neutral-600 mb-1.5">Estimasi selesai</span>
              <input
                type="date"
                value={form.estimasi_selesai}
                onChange={ubah('estimasi_selesai')}
                className={kelasInput}
              />
            </label>
            <label className="block">
              <span className="block text-xs text-neutral-600 mb-1.5">Teknisi</span>
              <select value={form.teknisi_id} onChange={ubah('teknisi_id')} className={kelasInput}>
                <option value="">— Belum ditentukan —</option>
                {teknisi.map((t) => (
                  <option key={t.id} value={t.id}>{t.nama_pegawai}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={mengirim}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#de1f26] text-white text-xs font-semibold border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {mengirim && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {mengirim ? 'Menyimpan…' : 'Simpan & Buat Resi'}
          </button>
          <Link
            href="/admin/service"
            className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 text-xs no-underline"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
