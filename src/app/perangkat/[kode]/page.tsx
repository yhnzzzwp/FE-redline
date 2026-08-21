import { notFound } from 'next/navigation';
import { fetchPerangkat } from '@/lib/api';
import { QrCode, Laptop, User, Calendar, Cpu, Wrench } from 'lucide-react';

export default async function PerangkatLifecyclePage({
  params,
}: {
  params: Promise<{ kode: string }>;
}) {
  const { kode } = await params;
  const res = await fetchPerangkat(kode);

  if (!res.success || !res.data) {
    notFound();
  }

  const perangkat = res.data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="p-6 md:p-8 rounded-3xl glass-panel border border-white/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest font-bold">
                ID Perangkat QR
              </span>
              <h1 className="text-xl font-bold font-mono text-rose-400">
                {perangkat.kode_perangkat}
              </h1>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-300">
            <Laptop className="w-4 h-4 text-rose-500" />
            <span>{perangkat.merk_model}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500 font-semibold">
              <User className="w-3.5 h-3.5" />
              <span>Pemilik</span>
            </div>
            <p className="font-bold text-zinc-200">{perangkat.nama_customer}</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500 font-semibold">
              <Cpu className="w-3.5 h-3.5" />
              <span>Serial Number</span>
            </div>
            <p className="font-mono text-zinc-200">{perangkat.serial_number || '-'}</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500 font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>Tahun / Generasi</span>
            </div>
            <p className="text-zinc-200">{perangkat.tahun || '-'}</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500 font-semibold">
              <Wrench className="w-3.5 h-3.5" />
              <span>Total Riwayat</span>
            </div>
            <p className="font-bold text-rose-400">{perangkat.services.length} Servis</p>
          </div>
        </div>

        {perangkat.spesifikasi && (
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 text-xs space-y-1">
            <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
              Spesifikasi Hardware
            </span>
            <p className="text-zinc-300 whitespace-pre-line leading-relaxed">
              {perangkat.spesifikasi}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Wrench className="w-5 h-5 text-rose-500" />
          <span>Riwayat Pengerjaan & Perbaikan</span>
        </h2>

        {perangkat.services.length === 0 ? (
          <div className="p-8 text-center rounded-2xl glass-panel border border-white/5 text-xs text-zinc-500">
            Belum ada riwayat servis untuk unit ini.
          </div>
        ) : (
          <div className="space-y-4">
            {perangkat.services.map((svc) => (
              <div
                key={svc.id}
                className="p-6 rounded-2xl glass-panel border border-white/5 space-y-4 glow-hover transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-rose-400">
                      #{svc.nomor_resi}
                    </span>
                    <span className="text-xs text-zinc-500">·</span>
                    <span className="text-xs text-zinc-400">
                      Masuk: {svc.tanggal_masuk || '-'}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 w-fit">
                    {svc.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-zinc-500 font-semibold">Keluhan:</span>
                    <p className="text-zinc-300">{svc.keluhan || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-zinc-500 font-semibold">Tindakan / Solusi:</span>
                    <p className="text-zinc-300">{svc.catatan_solusi || 'Pengerjaan servis standar.'}</p>
                  </div>
                </div>

                {svc.parts.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Part / Komponen Diganti:
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {svc.parts.map((p, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-zinc-900 border border-white/5 text-xs text-zinc-300"
                        >
                          {p.nama_part} ({p.jumlah}x)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
