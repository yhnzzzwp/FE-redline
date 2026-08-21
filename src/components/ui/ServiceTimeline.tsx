import { ServiceRiwayat } from '@/types';
import { CheckCircle2, Clock, Wrench, Package, Check } from 'lucide-react';

const STATUS_STEPS = [
  { key: 'Diterima', label: 'Unit Diterima', icon: Package },
  { key: 'Dikerjakan', label: 'Proses Pengerjaan', icon: Wrench },
  { key: 'Menunggu Sparepart', label: 'Menunggu Sparepart', icon: Clock },
  { key: 'Selesai', label: 'Servis Selesai', icon: CheckCircle2 },
  { key: 'Sudah Diambil', label: 'Unit Diambil', icon: Check },
];

export default function ServiceTimeline({
  currentStatus,
  riwayat,
}: {
  currentStatus: string;
  riwayat?: ServiceRiwayat[];
}) {
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="space-y-6">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-800 -z-0" />
        {STATUS_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isPassed = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center gap-2 relative z-10">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                  isCurrent
                    ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-950/60 scale-110'
                    : isPassed
                    ? 'bg-zinc-800 text-rose-400 border-rose-500/30'
                    : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[11px] font-medium text-center hidden sm:block max-w-[80px] ${
                  isCurrent ? 'text-rose-400 font-bold' : isPassed ? 'text-zinc-300' : 'text-zinc-600'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {riwayat && riwayat.length > 0 && (
        <div className="mt-8 space-y-3 pt-6 border-t border-white/5">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Riwayat Log Pengerjaan
          </h4>
          <div className="space-y-2.5">
            {riwayat.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-white/5 text-xs">
                <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">{r.status}</span>
                    <span className="text-[11px] font-mono text-zinc-500">{r.waktu}</span>
                  </div>
                  {r.catatan && <p className="text-zinc-400 mt-1">{r.catatan}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
