'use client';

import { useState } from 'react';
import { fetchCekServis } from '@/lib/api';
import { ServiceDetail } from '@/types';
import ServiceTimeline from '@/components/ui/ServiceTimeline';
import { createGeneralWhatsAppLink } from '@/lib/whatsapp';
import { MessageCircle, FileText, AlertCircle } from 'lucide-react';

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <FileText className="w-3.5 h-3.5" />
          <span>Tracking Servis Online</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          Lacak Status Pengerjaan Servis
        </h1>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          Masukkan nomor tanda terima / resi servis (contoh: <span className="font-mono text-zinc-300">PK-2026-0001</span>) untuk memantau status secara real-time.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto">
        <input
          type="text"
          placeholder="Masukkan Nomor Resi Servis..."
          value={resi}
          onChange={(e) => setResi(e.target.value.toUpperCase())}
          className="w-full pl-5 pr-32 py-4 rounded-2xl bg-zinc-900 border border-white/10 text-base text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 font-mono tracking-wider transition-all"
        />
        <button
          type="submit"
          disabled={loading || !resi.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-rose-950/40 active:scale-95"
        >
          {loading ? 'Mencari...' : 'Lacak Resi'}
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm max-w-xl mx-auto">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl glass-panel border border-white/5 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
              <div>
                <span className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
                  Resi #{data.nomor_resi}
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">
                  {data.merk_model || 'Perangkat Tanpa Nama'}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Customer: {data.nama_customer} {data.nomor_hp_customer && `(${data.nomor_hp_customer})`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  {data.status}
                </span>
              </div>
            </div>

            <ServiceTimeline currentStatus={data.status} riwayat={data.riwayat} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5 text-sm">
              <div className="space-y-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                  Keluhan Pelanggan
                </span>
                <p className="text-zinc-300 bg-zinc-900/60 p-3.5 rounded-xl border border-white/5 leading-relaxed">
                  {data.keluhan || '-'}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                  Catatan Teknisi / Solusi
                </span>
                <p className="text-zinc-300 bg-zinc-900/60 p-3.5 rounded-xl border border-white/5 leading-relaxed">
                  {data.catatan_solusi || 'Pengerjaan dalam proses diagnosis.'}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                Rincian Biaya Servis
              </span>
              <div className="rounded-xl overflow-hidden border border-white/5 bg-zinc-900/50">
                <div className="p-3.5 flex justify-between text-xs border-b border-white/5">
                  <span className="text-zinc-400">Jasa Perbaikan / Servis</span>
                  <span className="font-mono font-semibold text-zinc-200">
                    Rp {data.biaya_service.toLocaleString('id-ID')}
                  </span>
                </div>
                {data.parts.map((p, i) => (
                  <div key={i} className="p-3.5 flex justify-between text-xs border-b border-white/5">
                    <span className="text-zinc-400">{p.nama_part} ({p.jumlah} unit)</span>
                    <span className="font-mono font-semibold text-zinc-200">
                      Rp {p.subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
                <div className="p-4 flex justify-between items-center bg-rose-950/20 font-bold text-sm">
                  <span className="text-rose-300">Total Biaya</span>
                  <span className="font-mono text-base text-rose-400">
                    Rp {data.total_biaya.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <a
              href={createGeneralWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-white/5 transition-all"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Ada Pertanyaan Terkait Servis Ini? Hubungi Kami</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
