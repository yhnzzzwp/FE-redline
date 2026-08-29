'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, ClipboardCopy, Laptop, Loader2, Plus, QrCode, Receipt } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { useApiData } from '@/lib/useApiData';
import StikerQr from '@/components/ui/StikerQr';

interface UnitTerdaftar {
  id: number;
  kode_perangkat: string;
  nama_customer: string;
  nomor_hp_customer: string | null;
  merk_model: string;
  serial_number: string | null;
}

interface Tersimpan {
  id: number;
  nomor_resi: string;
  kode_perangkat: string | null;
  merk_model: string;
  unitBaru: boolean;
}

const FORM_KOSONG = {
  nama_customer: '',
  nomor_hp_customer: '',
  merk_model: '',
  serial_number: '',
  keluhan: '',
};

/**
 * Terima servis baru.
 *
 * Dua jalur masuk:
 *
 *  - Unit baru: identitas pelanggan diketik sekali di sini, lalu stikernya
 *    dicetak dan ditempel. Kunjungan berikutnya tidak perlu mengetik lagi.
 *  - Unit terdaftar (?perangkat=KODE, biasanya hasil pindai stiker): identitas
 *    sudah diketahui, petugas cukup mencatat keluhan.
 *
 * Estimasi biaya, teknisi, dan estimasi selesai sengaja TIDAK ditanyakan di
 * sini. Ketiganya baru bisa dijawab setelah unit dibongkar, jadi tempatnya di
 * halaman detail tiket — bukan di meja penerimaan saat pelanggan menunggu.
 */
export default function TambahServicePage() {
  return (
    <Suspense fallback={<div className="p-3 text-xs text-neutral-500">Memuat…</div>}>
      <IsiHalaman />
    </Suspense>
  );
}

function IsiHalaman() {
  const kodeUnit = useSearchParams().get('perangkat');

  const { data: unit, error: galatUnit } = useApiData<UnitTerdaftar | null>(
    kodeUnit ? `/admin/perangkat/kode/${encodeURIComponent(kodeUnit)}` : '',
    (json) => (json.data as UnitTerdaftar) ?? null
  );

  const [form, setForm] = useState(FORM_KOSONG);
  const [mengirim, setMengirim] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<Record<string, string[]>>({});
  const [tersimpan, setTersimpan] = useState<Tersimpan | null>(null);
  const [tersalin, setTersalin] = useState(false);
  const [stikerTerbuka, setStikerTerbuka] = useState(false);

  const ubah =
    (key: keyof typeof FORM_KOSONG) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
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
        keluhan: form.keluhan.trim(),
      };

      if (unit) {
        payload.perangkat_id = unit.id;
      } else {
        payload.nama_customer = form.nama_customer.trim();
        payload.merk_model = form.merk_model.trim();
        if (form.nomor_hp_customer.trim()) payload.nomor_hp_customer = form.nomor_hp_customer.trim();
        if (form.serial_number.trim()) payload.serial_number = form.serial_number.trim();
      }

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

      // Tidak langsung dialihkan: nomor resi harus terbaca untuk didiktekan,
      // dan unit baru perlu langsung dicetak stikernya selagi laptopnya ada.
      setTersimpan({
        id: json?.data?.id,
        nomor_resi: json?.data?.nomor_resi,
        kode_perangkat: json?.data?.perangkat?.kode_perangkat ?? null,
        merk_model: json?.data?.perangkat?.merk_model ?? form.merk_model,
        unitBaru: !unit,
      });
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

  // ─── Sesudah tersimpan ──────────────────────────────────────────
  if (tersimpan) {
    return (
      <div className="space-y-4">
        <div className="rl-page-header">
          <h1 className="rl-page-title mb-1">Tiket Servis Dibuat</h1>
          <p className="rl-page-desc mb-0">
            {tersimpan.unitBaru
              ? 'Cetak stikernya sekarang selagi unitnya masih di meja.'
              : 'Berikan nomor resi ini kepada pelanggan.'}
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
            {tersimpan.kode_perangkat && (
              <button
                type="button"
                onClick={() => setStikerTerbuka(true)}
                className="btn-redline rl-btn-sm inline-flex items-center gap-1.5 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" /> Cetak stiker QR
              </button>
            )}
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
            <Link
              href="/admin/service/baru"
              className="btn-ghost rl-btn-sm inline-flex items-center gap-1.5 no-underline"
            >
              <Plus className="w-3.5 h-3.5" /> Servis lagi
            </Link>
          </div>
        </div>

        {stikerTerbuka && tersimpan.kode_perangkat && (
          <StikerQr
            kode={tersimpan.kode_perangkat}
            merkModel={tersimpan.merk_model}
            onTutup={() => setStikerTerbuka(false)}
          />
        )}
      </div>
    );
  }

  // ─── Formulir ───────────────────────────────────────────────────
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

      {kodeUnit && galatUnit && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
          Unit <span className="rl-mono">{kodeUnit}</span> tidak ditemukan — isi datanya sebagai unit baru.
        </div>
      )}

      {pesanError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
          {pesanError}
        </div>
      )}

      <form onSubmit={kirim} className="rl-card p-5 space-y-4 max-w-2xl">
        {unit ? (
          // Unit dikenali dari stiker: identitasnya tidak diketik ulang.
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <Laptop className="w-4 h-4 text-neutral-400" />
              <span className="text-xs font-bold text-neutral-900">Unit terdaftar</span>
              <span className="rl-mono text-[11px] text-neutral-400">{unit.kode_perangkat}</span>
            </div>
            <p className="text-xs text-neutral-800 m-0">
              {unit.nama_customer}
              {unit.nomor_hp_customer ? ` · ${unit.nomor_hp_customer}` : ''}
            </p>
            <p className="text-xs text-neutral-500 m-0 mt-0.5">
              {unit.merk_model}
              {unit.serial_number ? ` · S/N ${unit.serial_number}` : ''}
            </p>
            <Link
              href={`/admin/perangkat/${encodeURIComponent(unit.kode_perangkat)}`}
              className="text-[11px] text-[#b01218] no-underline inline-block mt-2"
            >
              Lihat riwayat servis unit ini →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Kolom label="Nama pelanggan" wajib galat={galat('nama_customer')}>
              <input
                required
                value={form.nama_customer}
                onChange={ubah('nama_customer')}
                placeholder="Budi Santoso"
                className="rl-input"
              />
            </Kolom>

            <Kolom label="Nomor WhatsApp" galat={galat('nomor_hp_customer')}>
              <input
                inputMode="tel"
                value={form.nomor_hp_customer}
                onChange={ubah('nomor_hp_customer')}
                placeholder="08123456789"
                className="rl-input"
              />
            </Kolom>

            <Kolom label="Merk / model" wajib galat={galat('merk_model')}>
              <input
                required
                value={form.merk_model}
                onChange={ubah('merk_model')}
                placeholder="Asus TUF Gaming A15"
                className="rl-input"
              />
            </Kolom>

            <Kolom label="Serial number" galat={galat('serial_number')}>
              <input
                value={form.serial_number}
                onChange={ubah('serial_number')}
                placeholder="S/N pada stiker bawah unit"
                className="rl-input"
              />
            </Kolom>
          </div>
        )}

        <Kolom label="Keluhan pelanggan" wajib galat={galat('keluhan')}>
          <textarea
            required
            rows={4}
            value={form.keluhan}
            onChange={ubah('keluhan')}
            placeholder="Mati total setelah kena air, tidak menyala sama sekali."
            className="rl-textarea"
          />
        </Kolom>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={mengirim}
            className="btn-redline inline-flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {mengirim && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {mengirim ? 'Menyimpan…' : 'Simpan & Buat Resi'}
          </button>
          <Link href="/admin/service" className="btn-ghost text-xs no-underline">
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}

function Kolom({
  label,
  wajib = false,
  galat = null,
  children,
}: {
  label: string;
  wajib?: boolean;
  galat?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="rl-label">
        {label}
        {wajib && <span className="text-[#de1f26]"> *</span>}
      </span>
      {children}
      {galat && <span className="block text-[11px] text-red-600 mt-1">{galat}</span>}
    </label>
  );
}
