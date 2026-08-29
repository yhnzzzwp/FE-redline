'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Loader2 } from 'lucide-react';

/** Tersedia di Chrome Android; tidak ada di lib.dom, jadi dideklarasikan seperlunya. */
interface HasilDeteksi {
  rawValue: string;
}
interface PendeteksiBarcode {
  detect: (sumber: CanvasImageSource) => Promise<HasilDeteksi[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (opsi?: { formats?: string[] }) => PendeteksiBarcode;
  }
}

type Status = 'memulai' | 'aktif' | 'gagal';

/**
 * Pemindai QR berbasis kamera untuk staf.
 *
 * Memakai BarcodeDetector bawaan browser bila ada (Chrome Android — perangkat
 * utama yang dipakai di konter), dan jatuh ke jsQR yang murni JavaScript bila
 * tidak. Keduanya membaca frame yang sama dari <video>, jadi perilakunya sama
 * di mata pengguna.
 */
export default function PemindaiQr({
  onHasil,
  aktif = true,
}: {
  onHasil: (teks: string) => void;
  aktif?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const berhentiRef = useRef(false);
  const [status, setStatus] = useState<Status>('memulai');
  const [pesan, setPesan] = useState<string>('');

  const hentikanKamera = useCallback(() => {
    berhentiRef.current = true;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!aktif) return;

    berhentiRef.current = false;
    let animasi = 0;

    const mulai = async () => {
      // Kamera hanya diizinkan browser pada secure context. Lewat HTTPS aman;
      // lewat http://<ip-lan>:3000 pasti ditolak, dan pesannya harus jelas
      // supaya tidak dikira kameranya rusak.
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        setStatus('gagal');
        setPesan(
          'Kamera hanya bisa dibuka lewat HTTPS. Buka panel ini dari alamat https:// — bukan dari alamat IP jaringan lokal.'
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (berhentiRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setStatus('aktif');

        const kanvas = document.createElement('canvas');
        const ctx = kanvas.getContext('2d', { willReadFrequently: true });
        const detektor = window.BarcodeDetector
          ? new window.BarcodeDetector({ formats: ['qr_code'] })
          : null;
        const jsQR = detektor ? null : (await import('jsqr')).default;

        const periksaFrame = async () => {
          if (berhentiRef.current || !video.videoWidth || !ctx) {
            if (!berhentiRef.current) animasi = requestAnimationFrame(() => void periksaFrame());
            return;
          }

          kanvas.width = video.videoWidth;
          kanvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, kanvas.width, kanvas.height);

          let terbaca: string | null = null;
          try {
            if (detektor) {
              const hasil = await detektor.detect(kanvas);
              terbaca = hasil[0]?.rawValue ?? null;
            } else if (jsQR) {
              const gambar = ctx.getImageData(0, 0, kanvas.width, kanvas.height);
              terbaca = jsQR(gambar.data, gambar.width, gambar.height)?.data ?? null;
            }
          } catch {
            // Frame gagal dibaca bukan kondisi galat: lanjut ke frame berikutnya.
          }

          if (terbaca) {
            hentikanKamera();
            onHasil(terbaca);
            return;
          }

          animasi = requestAnimationFrame(() => void periksaFrame());
        };

        animasi = requestAnimationFrame(() => void periksaFrame());
      } catch (e) {
        setStatus('gagal');
        const nama = e instanceof DOMException ? e.name : '';
        setPesan(
          nama === 'NotAllowedError'
            ? 'Izin kamera ditolak. Aktifkan izin kamera untuk situs ini di pengaturan browser, lalu muat ulang halaman.'
            : nama === 'NotFoundError'
              ? 'Tidak ada kamera yang terdeteksi pada perangkat ini.'
              : 'Kamera tidak dapat dibuka.'
        );
      }
    };

    void mulai();

    return () => {
      cancelAnimationFrame(animasi);
      hentikanKamera();
    };
  }, [aktif, onHasil, hentikanKamera]);

  if (status === 'gagal') {
    return (
      <div className="rl-card p-6 text-center">
        <CameraOff className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
        <p className="text-xs text-neutral-600 leading-relaxed max-w-sm mx-auto">{pesan}</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-neutral-900 aspect-square max-w-sm mx-auto">
      <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />

      {/* Bingkai bidik: menuntun jarak dan sudut, bukan sekadar hiasan. */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-2/3 aspect-square border-2 border-white/80 rounded-2xl shadow-[0_0_0_100vmax_rgba(0,0,0,0.35)]" />
      </div>

      <div className="absolute bottom-3 left-0 right-0 flex justify-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 text-white text-[11px] font-semibold">
          {status === 'memulai' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyalakan kamera…
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5" /> Arahkan ke stiker QR
            </>
          )}
        </span>
      </div>
    </div>
  );
}
