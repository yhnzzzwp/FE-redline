'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, X } from 'lucide-react';
import { urlUnit } from '@/lib/qr';

/**
 * Stiker QR yang ditempel di unit pelanggan.
 *
 * Isinya URL penuh ke halaman unit, bukan kodenya saja, supaya kamera bawaan
 * HP bisa langsung membukanya. Tata letaknya sengaja sederhana — QR di atas,
 * identitas unit di bawahnya — karena model printernya belum ditentukan;
 * ukuran dalam milimeter membuatnya tercetak sama di label thermal maupun
 * kertas biasa.
 */
export default function StikerQr({
  kode,
  merkModel,
  onTutup,
}: {
  kode: string;
  merkModel: string;
  onTutup: () => void;
}) {
  const [gambar, setGambar] = useState<string | null>(null);
  const [galat, setGalat] = useState(false);

  useEffect(() => {
    let batal = false;
    QRCode.toDataURL(urlUnit(kode), {
      width: 512,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => {
        if (!batal) setGambar(url);
      })
      .catch(() => {
        if (!batal) setGalat(true);
      });
    return () => {
      batal = true;
    };
  }, [kode]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="rl-card w-full max-w-sm p-5">
        <div className="flex items-start justify-between mb-4 rl-tanpa-cetak">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 m-0">Stiker QR Unit</h2>
            <p className="text-[11px] text-neutral-500 m-0 mt-0.5">
              Tempel di badan laptop. Sekali tempel, dipakai untuk semua servis berikutnya.
            </p>
          </div>
          <button
            type="button"
            onClick={onTutup}
            aria-label="Tutup"
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 border-0 bg-transparent cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hanya blok ini yang ikut tercetak — lihat aturan @media print di globals.css. */}
        <div className="rl-print-area">
          <div className="rl-stiker">
            {galat ? (
              <p className="text-xs text-red-600">QR gagal dibuat.</p>
            ) : gambar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gambar} alt={`QR unit ${kode}`} className="rl-stiker__qr" />
            ) : (
              <div className="rl-stiker__qr bg-neutral-100" />
            )}
            <p className="rl-stiker__unit">{merkModel}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          disabled={!gambar}
          className="btn-redline w-full mt-4 inline-flex items-center justify-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-60 rl-tanpa-cetak"
        >
          <Printer className="w-3.5 h-3.5" /> Cetak stiker
        </button>
      </div>
    </div>
  );
}
