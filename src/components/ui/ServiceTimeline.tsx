import { ServiceRiwayat } from '@/types';
import { Check } from 'lucide-react';

const SERVICE_STAGES = [
  'Diterima',
  'Dikerjakan',
  'Menunggu Sparepart',
  'Selesai',
  'Sudah Diambil',
];

export default function ServiceTimeline({
  currentStatus,
  riwayat,
}: {
  currentStatus: string;
  riwayat?: ServiceRiwayat[];
}) {
  const currentStepIndex = SERVICE_STAGES.findIndex(
    (stage) => stage.toLowerCase() === currentStatus.toLowerCase()
  );

  return (
    <div className="space-y-6">
      <div className="rl-step-wrap overflow-x-auto" role="list" aria-label="Tahapan servis">
        {SERVICE_STAGES.map((stage, idx) => {
          const isPassed = currentStepIndex !== -1 && idx < currentStepIndex;
          const isCurrent = currentStepIndex !== -1 && idx === currentStepIndex;

          return (
            <div
              key={stage}
              className={`rl-step ${isPassed ? 'done' : isCurrent ? 'now' : ''}`}
              role="listitem"
            >
              <div className="rl-step-dot">
                {isPassed ? (
                  <Check className="w-4 h-4 text-white stroke-[2.5]" />
                ) : isCurrent ? (
                  '●'
                ) : (
                  idx + 1
                )}
              </div>
              <span className="text-[11px] font-semibold mt-1 tracking-tight">
                {stage}
              </span>
            </div>
          );
        })}
      </div>

      {riwayat && riwayat.length > 0 && (
        <div className="pt-6 border-t border-neutral-200">
          <h4 className="rl-section-title mb-4">Riwayat Status</h4>
          <div className="rl-timeline">
            {riwayat.map((item, i) => (
              <div key={i} className="rl-timeline-item">
                <div className="flex justify-between items-baseline mb-1">
                  <b className="text-[13px] text-neutral-900">{item.status}</b>
                  <span className="text-neutral-500 rl-mono text-[11.5px] tnum">
                    {item.waktu}
                  </span>
                </div>
                {item.catatan && (
                  <div className="text-neutral-500 text-[13px] leading-relaxed">
                    {item.catatan}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
