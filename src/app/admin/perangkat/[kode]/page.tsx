'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Laptop,
  Phone,
  Plus,
  QrCode,
  User,
  Wrench,
} from 'lucide-react';
import { useApiData } from '@/lib/useApiData';
import StikerQr from '@/components/ui/StikerQr';

interface ServisRingkas {
  id: number;
  nomor_resi: string;
  status: string;
  keluhan: string;
  catatan_solusi: string | null;
  tanggal_masuk: string | null;
  tanggal_selesai: string | null;
  total_biaya: number;
}

interface UnitDetail {
  id: number;
  kode_perangkat: string;
  nama_customer: string;
  nomor_hp_customer: string | null;
  merk_model: string;
  serial_number: string | null;
  tahun: string | null;
  spesifikasi: string | null;
  services: ServisRingkas[];
}

function rupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

function warnaStatus(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('selesai') || s.includes('diambil')) return 'rl-pill-green';
  if (s.includes('menunggu')) return 'rl-pill-red';
  if (s.includes('dikerjakan')) return 'rl-pill-amber';
  return 'rl-pill-blue';
}

/**
 * Riwayat satu unit, dibuka dengan memindai stiker QR yang menempel padanya.
 *
 * Halaman ini di balik login dan menampilkan data apa adanya — nama dan nomor
 * pelanggan tidak disamarkan seperti pada permukaan publik, karena yang membaca
 * adalah staf yang sedang memegang unitnya.
 */
export default function AdminUnitPage({
  params,
}: {
  params: Promise<{ kode: string }>;
}) {
  const { kode } = use(params);
  const [stikerTerbuka, setStikerTerbuka] = useState(false);

  const { data: unit, loading, error } = useApiData<UnitDetail>(
    `/admin/perangkat/kode/${encodeURIComponent(kode)}`,
    (json) => json.data as UnitDetail
  );

  return (
    <div className="space-y-4">
      <div className="rl-page-header">
        <Link
          href="/admin/pindai"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 no-underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Pindai unit lain
        </Link>
        <h1 className="rl-page-title mb-1 mt-2">Riwayat Unit</h1>
        <p className="rl-page-desc mb-0 rl-mono">{decodeURIComponent(kode)}</p>
      </div>

      {loading && (
        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-500">
          Memuat data unit&hellip;
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
          {error}
        </div>
      )}

      {unit && (
        <>
          <div className="rl-card p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-2.5">
                <Data ikon={<User className="w-3.5 h-3.5" />} label="Pelanggan" nilai={unit.nama_customer} />
                <Data
                  ikon={<Phone className="w-3.5 h-3.5" />}
                  label="WhatsApp"
                  nilai={unit.nomor_hp_customer ?? '—'}
                />
                <Data ikon={<Laptop className="w-3.5 h-3.5" />} label="Unit" nilai={unit.merk_model} />
                <Data
                  ikon={<QrCode className="w-3.5 h-3.5" />}
                  label="Serial number"
                  nilai={unit.serial_number ?? '—'}
                />
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <Link
                  href={`/admin/service/baru?perangkat=${encodeURIComponent(unit.kode_perangkat)}`}
                  className="btn-redline rl-btn-sm inline-flex items-center justify-center gap-1.5 no-underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Servis baru untuk unit ini
                </Link>
                <button
                  type="button"
                  onClick={() => setStikerTerbuka(true)}
                  className="btn-ghost rl-btn-sm inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" /> Cetak ulang stiker
                </button>
              </div>
            </div>
          </div>

          <div className="rl-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-4 h-4 text-neutral-400" />
              <h2 className="text-sm font-bold text-neutral-900 m-0">
                Riwayat servis ({unit.services.length})
              </h2>
            </div>

            {unit.services.length === 0 ? (
              <p className="text-xs text-neutral-400 m-0">
                Unit ini belum pernah masuk servis.
              </p>
            ) : (
              <ol className="space-y-3 m-0 p-0 list-none">
                {unit.services.map((s) => (
                  <li key={s.id} className="border border-neutral-100 rounded-xl p-3.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                      <Link
                        href={`/admin/service/${s.id}`}
                        className="rl-mono text-xs font-bold text-[#b01218] no-underline"
                      >
                        {s.nomor_resi}
                      </Link>
                      <span className={`rl-pill ${warnaStatus(s.status)}`}>{s.status}</span>
                    </div>

                    <p className="text-xs text-neutral-800 m-0 mb-1.5">{s.keluhan || '—'}</p>

                    {s.catatan_solusi && (
                      <p className="text-[11px] text-neutral-500 m-0 mb-1.5">
                        Tindakan: {s.catatan_solusi}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] text-neutral-400">
                      <span>
                        Masuk {s.tanggal_masuk ?? '—'}
                        {s.tanggal_selesai ? ` · selesai ${s.tanggal_selesai}` : ''}
                      </span>
                      <span className="rl-mono font-bold text-neutral-700">
                        {rupiah(s.total_biaya)}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}

      {stikerTerbuka && unit && (
        <StikerQr
          kode={unit.kode_perangkat}
          merkModel={unit.merk_model}
          onTutup={() => setStikerTerbuka(false)}
        />
      )}
    </div>
  );
}

function Data({
  ikon,
  label,
  nilai,
}: {
  ikon: React.ReactNode;
  label: string;
  nilai: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-neutral-300 shrink-0">{ikon}</span>
      <span className="text-[11px] text-neutral-400 w-24 shrink-0">{label}</span>
      <span className="text-xs font-semibold text-neutral-900">{nilai}</span>
    </div>
  );
}
