import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchPerangkat } from '@/lib/api';
import { createGeneralWhatsAppLink } from '@/lib/whatsapp';
import { QrCode, Laptop, User, Calendar, Cpu, Wrench, MessageCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PerangkatLifecyclePage({
  params,
}: {
  params: Promise<{ kode: string }>;
}) {
  const { kode } = await params;
  const res = await fetchPerangkat(kode);

  if (res.isConnectionError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="rl-card p-8 space-y-4 border-amber-300/80 bg-gradient-to-b from-amber-50/80 to-amber-50/30">
          <div className="w-14 h-14 rounded-2xl bg-amber-100/90 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
            <Wrench className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-amber-950">Layanan Servis &amp; Maintenance</h1>
            <p className="text-xs text-amber-800/90 max-w-sm mx-auto leading-relaxed">
              Sistem database perbaikan perangkat <span className="rl-mono font-bold text-[#b01218]">{kode}</span> sedang dalam tahap pemeliharaan sistem (Maintenance).
            </p>
          </div>
          <div className="pt-4 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/" className="btn-ghost text-xs border-amber-300 text-amber-900 hover:bg-amber-100">
              &larr; Kembali ke Beranda
            </Link>
            <a
              href={createGeneralWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-redline text-xs font-bold"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Tanya Status via WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!res.success || !res.data) {
    notFound();
  }

  const perangkat = res.data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="rl-card p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#de1f26]">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] rl-mono text-neutral-400 uppercase tracking-widest font-semibold block">
                ID Perangkat QR
              </span>
              <h1 className="text-xl font-bold rl-mono text-[#b01218] tnum">
                {perangkat.kode_perangkat}
              </h1>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 text-xs font-semibold text-neutral-800">
            <Laptop className="w-4 h-4 text-[#de1f26]" />
            <span>{perangkat.merk_model}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-400 font-semibold">
              <User className="w-3.5 h-3.5" />
              <span>Pemilik</span>
            </div>
            <p className="font-bold text-neutral-900">{perangkat.nama_customer}</p>
          </div>

          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-400 font-semibold">
              <Cpu className="w-3.5 h-3.5" />
              <span>Serial Number</span>
            </div>
            <p className="rl-mono text-neutral-900 tnum">{perangkat.serial_number || '-'}</p>
          </div>

          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-400 font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>Tahun / Generasi</span>
            </div>
            <p className="text-neutral-900">{perangkat.tahun || '-'}</p>
          </div>

          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-400 font-semibold">
              <Wrench className="w-3.5 h-3.5" />
              <span>Total Riwayat</span>
            </div>
            <p className="font-bold text-[#b01218]">{perangkat.services.length} Servis</p>
          </div>
        </div>

        {perangkat.spesifikasi && (
          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 text-xs space-y-1">
            <span className="text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">
              Spesifikasi Hardware
            </span>
            <p className="text-neutral-700 whitespace-pre-line leading-relaxed">
              {perangkat.spesifikasi}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="rl-title-md text-neutral-900 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-[#de1f26]" />
          <span>Riwayat Pengerjaan &amp; Perbaikan</span>
        </h2>

        {perangkat.services.length === 0 ? (
          <div className="rl-card p-8 text-center text-xs text-neutral-500">
            Belum ada riwayat servis untuk unit ini.
          </div>
        ) : (
          <div className="space-y-4">
            {perangkat.services.map((svc) => (
              <div key={svc.id} className="rl-card p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs rl-mono font-bold text-[#b01218] tnum">
                      #{svc.nomor_resi}
                    </span>
                    <span className="text-xs text-neutral-300">&middot;</span>
                    <span className="text-xs text-neutral-500">
                      Masuk: {svc.tanggal_masuk || '-'}
                    </span>
                  </div>
                  <span className="rl-pill rl-pill-blue">
                    {svc.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-neutral-500 font-semibold">Keluhan:</span>
                    <p className="text-neutral-800">{svc.keluhan || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-neutral-500 font-semibold">Tindakan / Solusi:</span>
                    <p className="text-neutral-800">{svc.catatan_solusi || 'Pengerjaan servis standar.'}</p>
                  </div>
                </div>

                {svc.parts && svc.parts.length > 0 && (
                  <div className="pt-2 border-t border-neutral-100">
                    <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
                      Part / Komponen Diganti:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {svc.parts.map((p, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded bg-neutral-100 text-xs font-medium text-neutral-800"
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
