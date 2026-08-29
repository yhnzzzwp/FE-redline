'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useApiData } from '@/lib/useApiData';
import { authFetch } from '@/lib/api';
import { MessageCircle, CheckCircle2 } from 'lucide-react';

interface Riwayat {
  id: number;
  status: string;
  catatan: string | null;
  pegawai: string | { nama_pegawai?: string } | null;
  waktu: string;
}

interface PartServis {
  nama_part: string;
  jumlah: number;
  harga: number;
  subtotal: number;
}

interface ServiceDetail {
  id: number;
  nomor_resi: string;
  status: string;
  keluhan: string;
  catatan_solusi: string | null;
  tanggal_masuk: string | null;
  estimasi_selesai: string | null;
  biaya_service: number;
  perangkat: {
    nama_customer: string;
    nomor_hp_customer: string | null;
    merk_model: string;
  };
  parts: PartServis[];
  riwayat: Riwayat[];
  pegawai: { nama_pegawai?: string } | null;
  teknisi: { nama_pegawai?: string } | null;
}

/** Nama penulis riwayat; API bisa mengirim string atau objek pegawai. */
function penulis(p: Riwayat['pegawai']): string {
  if (!p) return '—';
  if (typeof p === 'string') return p;
  return p.nama_pegawai ?? '—';
}

const STATUS_STEPS = [
  'Diterima',
  'Dikerjakan',
  'Menunggu Sparepart',
  'Selesai',
  'Sudah Diambil',
];

export default function AdminServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Diambil dari backend dengan sesi yang sah. Sebelumnya seluruh isi
  // src/data/service.json — termasuk nama dan nomor telepon pelanggan —
  // ikut terkirim ke bundle JavaScript setiap pengunjung situs.
  const { data: service, loading, error, muatUlang } = useApiData<ServiceDetail>(
    `/admin/services/${encodeURIComponent(id)}`,
    (json) => json.data as ServiceDetail
  );

  if (loading) {
    return <div className="p-8 text-sm text-neutral-500">Memuat data servis&hellip;</div>;
  }

  if (error || !service) {
    return (
      <div className="p-8">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-bold text-sm text-red-900 mb-1">Servis tidak ditemukan</h2>
          <p className="text-xs text-red-800 mb-3">{error ?? 'Data tidak tersedia.'}</p>
          <Link href="/admin/service" className="text-xs font-semibold underline">
            Kembali ke daftar servis
          </Link>
        </div>
      </div>
    );
  }

  return <ServiceDetailContent service={service} onTersimpan={muatUlang} />;
}

function ServiceDetailContent({
  service,
  onTersimpan,
}: {
  service: ServiceDetail;
  onTersimpan: () => void;
}) {
  const [currentStatus, setCurrentStatus] = useState(service.status);
  const [catatanBaru, setCatatanBaru] = useState('');
  const history: Riwayat[] = service.riwayat ?? [];

  const getStepIndex = (status: string) => {
    return STATUS_STEPS.indexOf(status);
  };

  const currentIndex = getStepIndex(currentStatus);

  const [menyimpan, setMenyimpan] = useState(false);

  /**
   * Versi sebelumnya hanya menambah satu baris ke state React lalu menampilkan
   * alert "berhasil diperbarui" — server tidak pernah dihubungi, dan nama
   * penulisnya ter-hardcode. Sekarang benar-benar memanggil backend, yang juga
   * menegakkan aturan transisi status (StatusService::canTransitionTo).
   */
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStatus || menyimpan) return;

    setMenyimpan(true);
    try {
      const res = await authFetch(`/admin/services/${service.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: currentStatus, catatan: catatanBaru || null }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        alert(json?.message ?? 'Gagal memperbarui status servis.');
        setCurrentStatus(service.status);
        return;
      }

      setCatatanBaru('');
      onTersimpan();
    } catch {
      alert('Tidak dapat terhubung ke server.');
    } finally {
      setMenyimpan(false);
    }
  };

  const createWhatsAppUpdateLink = () => {
    const phone = (service.perangkat.nomor_hp_customer || '').replace(/^0/, '62').replace(/\D/g, '');
    let text = `Halo Kak *${service.perangkat.nama_customer}*,\n\n`;
    text += `Update pengerjaan servis perangkat di *Redline Komputer*:\n`;
    text += `---------------------------------\n`;
    text += `No. Resi     : *#${service.nomor_resi}*\n`;
    text += `Perangkat    : ${service.perangkat.merk_model}\n`;
    text += `Status Baru  : *${currentStatus}*\n`;
    if (service.catatan_solusi) {
      text += `Tindakan     : ${service.catatan_solusi}\n`;
    }
    const totalParts = service.parts.reduce((acc, p) => acc + p.subtotal, 0);
    const totalEstimasi = service.biaya_service + totalParts;
    text += `Estimasi Biaya: Rp ${totalEstimasi.toLocaleString('id-ID')}\n`;
    text += `---------------------------------\n`;
    text += `Cek status live di: https://redline-testing1.yohaneswp.sbs/cek-servis\n\n`;
    text += `Terima kasih! Ada pertanyaan silakan balas pesan ini.`;

    const encoded = encodeURIComponent(text);
    if (phone.length >= 8) {
      return `https://wa.me/${phone}?text=${encoded}`;
    }
    return `https://wa.me/?text=${encoded}`;
  };

  const totalPartsCost = service.parts.reduce((acc, p) => acc + p.subtotal, 0);
  const grandTotal = service.biaya_service + totalPartsCost;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Header */}
      <div>
        <Link
          href="/admin/service"
          className="text-xs text-neutral-500 hover:text-[#b01218] font-semibold inline-flex items-center gap-1 mb-2 no-underline"
        >
          &larr; Kembali ke Semua Servis
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="rl-page-title mb-1">{service.perangkat.merk_model}</h1>
            <p className="rl-page-desc mb-0">
              <span className="rl-mono font-bold text-[#b01218]">#{service.nomor_resi}</span> &middot;{' '}
              {service.perangkat.nama_customer} ({service.perangkat.nomor_hp_customer || 'Tanpa No. HP'})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={createWhatsAppUpdateLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 no-underline transition-all shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Kirim Update WA</span>
            </a>
          </div>
        </div>
      </div>

      {/* Step Progress Indicator Bar */}
      <div className="rl-card p-6">
        <div className="flex items-center justify-between relative max-w-3xl mx-auto">
          {/* Progress bar background line */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-neutral-200 w-full z-0"></div>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#de1f26] transition-all duration-500 z-0"
            style={{
              width: `${(Math.max(0, currentIndex) / (STATUS_STEPS.length - 1)) * 100}%`,
            }}
          ></div>

          {STATUS_STEPS.map((step, idx) => {
            const isDone = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div key={step} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isDone
                      ? 'bg-[#de1f26] text-white'
                      : isCurrent
                      ? 'bg-neutral-900 text-white ring-4 ring-red-100'
                      : 'bg-white border-2 border-neutral-300 text-neutral-400'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-[11px] font-semibold mt-2 text-center max-w-[80px] leading-tight ${
                    isCurrent ? 'text-neutral-900 font-bold' : 'text-neutral-500'
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Detail & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Detail Perangkat & Rincian */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rl-card p-6 space-y-5">
            <h3 className="rl-section-title text-sm border-b border-neutral-100 pb-2">
              Detail Perangkat &amp; Kerusakan
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-neutral-400 block mb-0.5">Tanggal Masuk:</span>
                <span className="font-bold text-neutral-800 rl-mono">{service.tanggal_masuk}</span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-neutral-400 block mb-0.5">Estimasi Selesai:</span>
                <span className="font-bold text-neutral-800 rl-mono">{service.estimasi_selesai}</span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-neutral-400 block mb-0.5">Teknisi Penanggung Jawab:</span>
                <span className="font-bold text-neutral-800">{service.teknisi?.nama_pegawai ?? 'Belum ditugaskan'}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-neutral-700 block mb-1">Keluhan Pelanggan:</span>
                <div className="p-3 rounded-lg bg-red-50/50 border border-red-100 text-neutral-800">
                  {service.keluhan}
                </div>
              </div>

              {service.catatan_solusi && (
                <div>
                  <span className="font-bold text-neutral-700 block mb-1">Tindakan / Solusi Teknisi:</span>
                  <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-800">
                    {service.catatan_solusi}
                  </div>
                </div>
              )}
            </div>

            {/* Suku Cadang & Biaya */}
            <div className="space-y-3 pt-3 border-t border-neutral-100">
              <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">
                Suku Cadang &amp; Komponen
              </h4>

              <div className="border border-neutral-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-neutral-100 text-neutral-600 font-semibold border-b border-neutral-200">
                    <tr>
                      <th className="p-2.5">Nama Part / Komponen</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {service.parts.map((p, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 text-neutral-800 font-medium">{p.nama_part}</td>
                        <td className="p-2.5 text-center text-neutral-500 rl-mono">{p.jumlah}</td>
                        <td className="p-2.5 text-right font-bold text-neutral-900 rl-mono">
                          Rp {p.subtotal.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={2} className="p-2.5 text-neutral-700 font-medium">
                        Biaya Jasa Servis
                      </td>
                      <td className="p-2.5 text-right font-bold text-neutral-900 rl-mono">
                        Rp {service.biaya_service.toLocaleString('id-ID')}
                      </td>
                    </tr>
                    <tr className="bg-red-50 font-bold border-t border-neutral-200 text-neutral-900">
                      <td colSpan={2} className="p-3 text-[#b01218]">
                        Total Estimasi Biaya
                      </td>
                      <td className="p-3 text-right text-[#b01218] rl-mono text-sm">
                        Rp {grandTotal.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Form Update Status & Riwayat Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Form Update Status */}
          <div className="rl-card p-6 space-y-4">
            <h3 className="rl-section-title text-sm border-b border-neutral-100 pb-2">
              Update Status Servis
            </h3>

            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                  Pilih Status Baru
                </label>
                <select
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  className="rl-select text-xs w-full font-bold"
                >
                  {STATUS_STEPS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                  Catatan Progres / Tindakan
                </label>
                <textarea
                  rows={2}
                  placeholder="Misal: Fan pengganti telah dipasang dan diuji suhu normal..."
                  value={catatanBaru}
                  onChange={(e) => setCatatanBaru(e.target.value)}
                  className="rl-input text-xs w-full"
                />
              </div>

              <button
                type="submit"
                className="btn-redline w-full py-2.5 text-xs font-bold cursor-pointer"
              >
                Simpan Pembaruan Status
              </button>
            </form>
          </div>

          {/* Timeline Riwayat Status */}
          <div className="rl-card p-6 space-y-4">
            <h3 className="rl-section-title text-sm border-b border-neutral-100 pb-2">
              Riwayat Timeline Servis
            </h3>

            <div className="space-y-3 text-xs">
              {history.map((h, idx) => (
                <div key={idx} className="flex items-start gap-3 relative pb-3 border-b border-neutral-100 last:border-b-0 last:pb-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#de1f26] mt-1 shrink-0 ring-4 ring-red-50"></div>
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-900">{h.status}</span>
                      <span className="text-[10px] text-neutral-400 rl-mono">{h.waktu}</span>
                    </div>
                    <p className="text-neutral-600 mb-0">{h.catatan}</p>
                    <span className="text-[10px] text-neutral-400 block">Oleh: {penulis(h.pegawai)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
