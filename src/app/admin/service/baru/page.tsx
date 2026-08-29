'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ClipboardCopy, Loader2, Plus, Receipt } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { useApiData, daftar } from '@/lib/useApiData';

interface Pegawai {
  id: number;
  nama_pegawai: string;
  masih_bekerja: boolean;
}

interface Tersimpan {
  id: number;
  nomor_resi: string;
}

const FORM_KOSONG = {
  nama_customer: '',
  nomor_hp_customer: '',
  merk_model: '',
  serial_number: '',
  keluhan: '',
  biaya_service: '',
  estimasi_selesai: '',
  teknisi_id: '',
};

/** Tanggal n hari dari hari ini dalam format YYYY-MM-DD zona waktu setempat. */
function tanggalPlus(hari: number): string {
  const d = new Date();
  d.setDate(d.getDate() + hari);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function rupiah(nilai: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(nilai);
}

const PILIHAN_ESTIMASI = [
  { label: 'Hari ini', hari: 0 },
  { label: 'Besok', hari: 1 },
  { label: '3 hari', hari: 3 },
  { label: '1 minggu', hari: 7 },
];

/**
 * Terima servis baru.
 *
 * Layar ini sebelumnya tidak ada: /admin/service hanya bisa menampilkan daftar
 * dan detail, sedangkan portal Blade mensyaratkan perangkat yang sudah
 * terdaftar tanpa menyediakan layar untuk mendaftarkannya. Pelanggan baru
 * karena itu hanya bisa dilayani lewat pemanggilan API manual.
 *
 * Endpoint POST /admin/services sudah mendukungnya: bila perangkat_id
 * dikosongkan, perangkat dibuat dari data pelanggan pada formulir yang sama.
 * Satu formulir untuk satu kedatangan pelanggan, sesuai kenyataan di konter.
 */
export default function TambahServicePage() {
  const { data: pegawaiData } = useApiData<Pegawai[]>(
    '/admin/pegawai?per_page=100',
    (json) => daftar<Pegawai>(json)
  );
  const teknisi = useMemo(
    () => (pegawaiData ?? []).filter((p) => p.masih_bekerja),
    [pegawaiData]
  );

  const [form, setForm] = useState(FORM_KOSONG);
  const [mengirim, setMengirim] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<Record<string, string[]>>({});
  const [tersimpan, setTersimpan] = useState<Tersimpan | null>(null);
  const [tersalin, setTersalin] = useState(false);

  const ubah =
    (key: keyof typeof FORM_KOSONG) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      // Pesan galat per-field ikut hilang begitu kolomnya disunting, supaya
      // tidak menuduh masukan yang sudah diperbaiki.
      setErrorField((prev) => (prev[key] ? { ...prev, [key]: [] } : prev));
    };

  const galat = (key: string): string | null => errorField[key]?.[0] ?? null;

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    setMengirim(true);
    setPesanError(null);
    setErrorField({});

    try {
      // Kolom kosong dibuang, bukan dikirim sebagai string kosong: validator
      // Laravel menolak '' untuk aturan integer dan date.
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
        const errors = (json?.errors ?? {}) as Record<string, string[]>;
        setErrorField(errors);
        setPesanError(
          Object.keys(errors).length > 0
            ? 'Beberapa kolom perlu diperbaiki.'
            : (json?.message ?? 'Tiket servis gagal dibuat.')
        );
        return;
      }

      // Sengaja tidak langsung dialihkan: nomor resi harus terbaca dulu untuk
      // didiktekan atau ditulis di nota tanda terima pelanggan.
      setTersimpan({ id: json?.data?.id, nomor_resi: json?.data?.nomor_resi });
      setForm(FORM_KOSONG);
    } catch {
      setPesanError('Server tidak dapat dihubungi. Periksa koneksi lalu coba lagi.');
    } finally {
      setMengirim(false);
    }
  };

  const salinResi = async () => {
    if (!tersimpan) return;
    try {
      await navigator.clipboard.writeText(tersimpan.nomor_resi);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 2000);
    } catch {
      setTersalin(false);
    }
  };

  // ─── Layar sesudah tersimpan ────────────────────────────────────
  if (tersimpan) {
    return (
      <div className="space-y-4">
        <div className="rl-page-header">
          <h1 className="rl-page-title mb-1">Tiket Servis Dibuat</h1>
          <p className="rl-page-desc mb-0">
            Berikan nomor resi ini kepada pelanggan untuk melacak servisnya.
          </p>
        </div>

        <div className="rl-card p-8 text-center max-w-xl">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mb-4">
            <Check className="w-6 h-6" />
          </span>

          <p className="text-xs text-neutral-500 mb-2">Nomor resi</p>
          <p className="rl-mono text-2xl sm:text-3xl font-bold text-[#b01218] tracking-wide mb-5 break-all">
            {tersimpan.nomor_resi}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={salinResi}
              className="btn-ghost rl-btn-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              {tersalin ? <Check className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
              {tersalin ? 'Tersalin' : 'Salin resi'}
            </button>
            {tersimpan.id && (
              <Link
                href={`/admin/service/${tersimpan.id}`}
                className="btn-ghost rl-btn-sm inline-flex items-center gap-1.5 no-underline"
              >
                <Receipt className="w-3.5 h-3.5" /> Buka tiket
              </Link>
            )}
            <button
              type="button"
              onClick={() => setTersimpan(null)}
              className="btn-redline rl-btn-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Terima servis lagi
            </button>
          </div>
        </div>

        <Link
          href="/admin/service"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 no-underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke daftar servis
        </Link>
      </div>
    );
  }

  // ─── Formulir ───────────────────────────────────────────────────
  const biaya = form.biaya_service === '' ? null : Number(form.biaya_service);

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

      {pesanError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
          {pesanError}
        </div>
      )}

      <form onSubmit={kirim} className="grid gap-4 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-4">
          <section className="rl-card p-5">
            <Judul nomor={1} teks="Pelanggan & Perangkat" />

            <div className="grid gap-4 sm:grid-cols-2">
              <Kolom label="Nama pelanggan" wajib galat={galat('nama_customer')}>
                <input
                  required
                  value={form.nama_customer}
                  onChange={ubah('nama_customer')}
                  placeholder="Budi Santoso"
                  className="rl-input"
                  aria-invalid={Boolean(galat('nama_customer'))}
                />
              </Kolom>

              <Kolom
                label="Nomor WhatsApp"
                galat={galat('nomor_hp_customer')}
                bantuan="Dipakai untuk mengabari saat servis selesai."
              >
                <input
                  inputMode="tel"
                  value={form.nomor_hp_customer}
                  onChange={ubah('nomor_hp_customer')}
                  placeholder="08123456789"
                  className="rl-input"
                />
              </Kolom>

              <Kolom label="Merk / model perangkat" wajib galat={galat('merk_model')}>
                <input
                  required
                  value={form.merk_model}
                  onChange={ubah('merk_model')}
                  placeholder="Asus TUF Gaming A15"
                  className="rl-input"
                  aria-invalid={Boolean(galat('merk_model'))}
                />
              </Kolom>

              <Kolom label="Serial number" galat={galat('serial_number')} bantuan="Opsional.">
                <input
                  value={form.serial_number}
                  onChange={ubah('serial_number')}
                  placeholder="S/N pada stiker bawah perangkat"
                  className="rl-input"
                />
              </Kolom>
            </div>
          </section>

          <section className="rl-card p-5">
            <Judul nomor={2} teks="Keluhan & Estimasi" />

            <Kolom label="Keluhan pelanggan" wajib galat={galat('keluhan')}>
              <textarea
                required
                rows={3}
                value={form.keluhan}
                onChange={ubah('keluhan')}
                placeholder="Mati total setelah kena air, tidak menyala sama sekali."
                className="rl-textarea"
                aria-invalid={Boolean(galat('keluhan'))}
              />
            </Kolom>

            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <Kolom
                label="Estimasi biaya"
                galat={galat('biaya_service')}
                bantuan={biaya !== null && biaya > 0 ? rupiah(biaya) : 'Boleh dikosongkan dulu.'}
              >
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={form.biaya_service}
                  onChange={ubah('biaya_service')}
                  placeholder="150000"
                  className="rl-input"
                />
              </Kolom>

              <Kolom label="Teknisi" galat={galat('teknisi_id')} bantuan="Bisa ditentukan nanti.">
                <select value={form.teknisi_id} onChange={ubah('teknisi_id')} className="rl-select">
                  <option value="">— Belum ditentukan —</option>
                  {teknisi.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nama_pegawai}
                    </option>
                  ))}
                </select>
              </Kolom>
            </div>

            <div className="mt-4">
              <Kolom label="Estimasi selesai" galat={galat('estimasi_selesai')}>
                <input
                  type="date"
                  value={form.estimasi_selesai}
                  onChange={ubah('estimasi_selesai')}
                  className="rl-input"
                />
              </Kolom>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PILIHAN_ESTIMASI.map((p) => {
                  const nilai = tanggalPlus(p.hari);
                  const aktif = form.estimasi_selesai === nilai;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, estimasi_selesai: nilai }))}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${
                        aktif
                          ? 'border-[#de1f26] bg-red-50 text-[#b01218]'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Ringkasan: dibaca ulang bersama pelanggan sebelum tiket disimpan. */}
        <aside className="rl-card p-5 lg:sticky lg:top-4">
          <h2 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-3">
            Ringkasan
          </h2>

          <dl className="space-y-2.5 text-xs">
            <Baris label="Pelanggan" nilai={form.nama_customer} />
            <Baris label="WhatsApp" nilai={form.nomor_hp_customer} />
            <Baris label="Perangkat" nilai={form.merk_model} />
            <Baris label="Keluhan" nilai={form.keluhan} />
            <Baris label="Estimasi biaya" nilai={biaya !== null && biaya > 0 ? rupiah(biaya) : ''} />
            <Baris label="Estimasi selesai" nilai={form.estimasi_selesai} />
            <Baris
              label="Teknisi"
              nilai={teknisi.find((t) => String(t.id) === form.teknisi_id)?.nama_pegawai ?? ''}
            />
          </dl>

          <div className="border-t border-neutral-100 mt-4 pt-4 space-y-2">
            <button
              type="submit"
              disabled={mengirim}
              className="btn-redline w-full inline-flex items-center justify-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {mengirim && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {mengirim ? 'Menyimpan…' : 'Simpan & Buat Resi'}
            </button>
            <Link
              href="/admin/service"
              className="btn-ghost w-full inline-flex items-center justify-center text-xs no-underline"
            >
              Batal
            </Link>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Judul({ nomor, teks }: { nomor: number; teks: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-neutral-900 text-white text-[11px] font-bold shrink-0">
        {nomor}
      </span>
      <h2 className="text-sm font-bold text-neutral-900 m-0">{teks}</h2>
    </div>
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

function Baris({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-neutral-400 shrink-0">{label}</dt>
      <dd className="text-neutral-800 font-medium text-right m-0 break-words min-w-0">
        {nilai.trim() ? nilai : <span className="text-neutral-300">—</span>}
      </dd>
    </div>
  );
}
