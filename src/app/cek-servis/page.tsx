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
      <div className="rl-public-header" data-reveal>
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
        <div className="rl-card p-6 text-center" data-reveal>
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
          <div className="rl-card p-6 md:p-8 space-y-6" data-reveal>
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

            <div className="py-2">
              <ServiceTimeline currentStatus={data.status} riwayat={data.riwayat} />
            </div>

            {(data.status.toLowerCase().includes('selesai') ||
              data.status.toLowerCase().includes('diambil')) && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-emerald-900">
                <CheckCircle className="w-5 h-5 text-[#178a46] shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-sm text-[#178a46] mb-0.5">
                    Servis Selesai &amp; Siap Diambil
                  </p>
                  <p className="mb-0 text-emerald-800">
                    Silakan datang ke toko Redline Komputer dengan membawa nomor resi atau bukti tanda terima servis ini.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <h3 className="rl-section-title text-sm">Rincian Kerusakan &amp; Tindakan</h3>
              <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 text-xs space-y-2">
                <div>
                  <span className="text-neutral-400">Keluhan:</span>
                  <p className="text-neutral-800 font-medium mt-0.5">
                    {data.keluhan || '—'}
                  </p>
                </div>
                {data.catatan_solusi && (
                  <div className="pt-2 border-t border-neutral-200/60">
                    <span className="text-neutral-400">Tindakan Perbaikan:</span>
                    <p className="text-neutral-800 font-medium mt-0.5">
                      {data.catatan_solusi}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {data.parts && data.parts.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="rl-section-title text-sm">Sparepart &amp; Biaya</h3>
                <div className="border border-neutral-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-100 text-neutral-600 font-semibold border-b border-neutral-200">
                      <tr>
                        <th className="p-3">Item / Part</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Biaya</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {data.parts.map((p, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/50">
                          <td className="p-3 text-neutral-800 font-medium">
                            {p.nama_part}
                          </td>
                          <td className="p-3 text-center text-neutral-500 rl-mono tnum">
                            {p.jumlah}
                          </td>
                          <td className="p-3 text-right rl-mono font-semibold text-neutral-800 tnum">
                            Rp {p.subtotal.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                      {data.biaya_service > 0 && (
                        <tr className="hover:bg-neutral-50/50">
                          <td colSpan={2} className="p-3 text-neutral-800 font-medium">
                            Biaya Jasa Servis
                          </td>
                          <td className="p-3 text-right rl-mono font-semibold text-neutral-800 tnum">
                            Rp {data.biaya_service.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-neutral-50 font-bold border-t-2 border-neutral-200">
                        <td colSpan={2} className="p-3 text-neutral-900">
                          Total Estimasi Biaya
                        </td>
                        <td className="p-3 text-right rl-mono text-sm text-[#b01218] tnum">
                          Rp {data.total_biaya.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-neutral-100 text-center space-y-2">
              <p className="text-xs text-neutral-500 mb-0">
                Ada pertanyaan mengenai progres servis ini?
              </p>
              <a
                href={createGeneralWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-xs inline-flex items-center gap-1.5"
              >
                <span>Hubungi Teknisi via WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
