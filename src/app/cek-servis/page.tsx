'use client';

import { useState } from 'react';
import { fetchCekServis } from '@/lib/api';
import { ServiceDetail } from '@/types';
import ServiceTimeline from '@/components/ui/ServiceTimeline';
import { createGeneralWhatsAppLink } from '@/lib/whatsapp';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function CekServisPage() {
  const [resi, setResi] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ServiceDetail | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resi.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    const res = await fetchCekServis(resi.trim());
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setError(res.message || 'Nomor resi tidak ditemukan');
    }
    setLoading(false);
  };

  const getPillColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('selesai') || s.includes('diambil')) return 'rl-pill-green';
    if (s.includes('dikerjakan') || s.includes('sparepart')) return 'rl-pill-amber';
    return 'rl-pill-blue';
  };

  return (
    <div className="pb-16">
      <div className="rl-public-header">
        <div className="rl-kicker mb-2">
          Pit stop <b>servis</b>
        </div>
        <h1 className="rl-page-title">Lacak Status Servis</h1>
        <p className="text-neutral-500 text-sm max-w-md mx-auto leading-relaxed">
          Pantau perkembangan perbaikan perangkat Anda secara real-time.
        </p>
        <div className="rl-ticks max-w-xs mx-auto mt-4"></div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="rl-card p-6 text-center">
          <h3 className="rl-section-title mb-3">Masukkan Nomor Resi</h3>
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              name="resi"
              value={resi}
              onChange={(e) => setResi(e.target.value.toUpperCase())}
              placeholder="Contoh: PK-1234-5678"
              required
              className="rl-input text-center rl-mono uppercase tracking-wider font-semibold"
            />
            <button
              type="submit"
              disabled={loading || !resi.trim()}
              className="btn-redline shrink-0"
            >
              {loading ? 'Mencari...' : 'Lacak'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-[#b01218] flex items-center justify-center gap-2 max-w-md mx-auto">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {data && (
          <div className="rl-card p-6 md:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-100">
              <div>
                <h2 className="rl-title-md mb-1">
                  {data.merk_model || 'Perangkat Tanpa Nama'}
                </h2>
                <div className="text-xs text-neutral-500">
                  <b className="rl-mono text-[#b01218] tnum font-bold">
                    {data.nomor_resi}
                  </b>{' '}
                  &middot; {data.nama_customer}
                </div>
              </div>
              <span className={`rl-pill ${getPillColor(data.status)}`}>
                {data.status}
              </span>
            </div>

            <ServiceTimeline currentStatus={data.status} riwayat={data.riwayat} />

            {data.status.toLowerCase() === 'selesai' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between flex-wrap gap-2 text-emerald-900">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs m-0">
                      Servis Selesai &amp; Siap Diambil
                    </h4>
                    <div className="text-[11px] text-emerald-700">
                      Silakan mengambil perangkat Anda di toko Redline Komputer.
                    </div>
                  </div>
                </div>
                <div className="text-right ml-auto">
                  <span className="text-[10px] text-emerald-700 block uppercase font-semibold">
                    Total Biaya
                  </span>
                  <span className="text-base font-bold rl-mono tnum text-emerald-800">
                    Rp {data.total_biaya.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-100 text-xs">
              <div className="space-y-2">
                <h4 className="rl-section-title text-xs mb-2">Informasi Perbaikan</h4>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-neutral-100">
                      <td className="py-2 text-neutral-500 w-2/5">Tanggal Masuk</td>
                      <td className="py-2 font-semibold text-neutral-900">
                        {data.tanggal_masuk || '—'}
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-100">
                      <td className="py-2 text-neutral-500">Estimasi Selesai</td>
                      <td className="py-2 font-semibold text-neutral-900">
                        {data.estimasi_selesai || '—'}
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-100">
                      <td className="py-2 text-neutral-500">Jasa Servis</td>
                      <td className="py-2 font-semibold rl-mono tnum text-neutral-900">
                        Rp {data.biaya_service.toLocaleString('id-ID')}
                      </td>
                    </tr>
                    {data.parts && data.parts.length > 0 && (
                      <tr className="border-b border-neutral-100">
                        <td className="py-2 text-neutral-500">Suku Cadang</td>
                        <td className="py-2 font-semibold rl-mono tnum text-neutral-900">
                          Rp {data.biaya_parts.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-neutral-200">
                      <td className="py-2 font-bold text-neutral-900">Total Biaya</td>
                      <td className="py-2 font-bold rl-mono text-[#b01218] tnum text-sm">
                        Rp {data.total_biaya.toLocaleString('id-ID')}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-neutral-500 align-top">Keluhan</td>
                      <td className="py-2 text-neutral-700 whitespace-pre-line">
                        {data.keluhan || '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                <h4 className="rl-section-title text-xs mb-2">Tindakan / Solusi</h4>
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 leading-relaxed min-h-24">
                  {data.catatan_solusi || 'Dalam proses pengerjaan dan diagnosa teknisi.'}
                </div>
              </div>
            </div>

            <div className="text-center text-neutral-500 text-xs pt-4 border-t border-neutral-100">
              Bawa nota/resi asli saat mengambil perangkat. Pertanyaan lebih lanjut hubungi{' '}
              <a
                href={createGeneralWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#de1f26] font-semibold hover:underline"
              >
                WhatsApp Kami
              </a>
              .
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
