'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from './api';

interface Hasil<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  muatUlang: () => void;
}

/**
 * Pemuat data untuk layar internal.
 *
 * Menggantikan pola lama `import data from '@/data/*.json'`, yang membuat
 * seluruh isi fixture — termasuk nama, username, email, dan nomor telepon —
 * ikut terkirim di dalam bundle JavaScript ke SETIAP pengunjung situs,
 * terlepas dari apakah mereka login atau tidak.
 *
 * Semua permintaan lewat authFetch, jadi melalui proksi BFF same-origin dan
 * hanya berhasil bila cookie sesi valid.
 */
export function useApiData<T>(
  path: string,
  ambil: (json: Record<string, unknown>) => T
): Hasil<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const muatUlang = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let dibatalkan = false;

    (async () => {
      // Ditunda satu microtask supaya pembaruan state tidak terjadi secara
      // sinkron di dalam fase efek (memicu render berantai).
      await Promise.resolve();
      if (dibatalkan) return;

      // Path kosong = pemanggil sedang tidak membutuhkan data (mis. formulir
      // servis yang hanya memuat unit bila ada ?perangkat= di URL). Tanpa
      // penjagaan ini, authFetch('') menembak /api/backend dan selalu gagal.
      if (!path) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await authFetch(path);
        const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;

        if (dibatalkan) return;

        if (!res.ok || !json || json.status !== 'success') {
          setError((json?.message as string) ?? 'Gagal memuat data dari server.');
          setData(null);
        } else {
          setData(ambil(json));
        }
      } catch {
        if (!dibatalkan) {
          setError('Tidak dapat terhubung ke server.');
          setData(null);
        }
      } finally {
        if (!dibatalkan) setLoading(false);
      }
    })();

    return () => {
      dibatalkan = true;
    };
    // `ambil` sengaja tidak masuk dependensi: pemanggil umumnya mengoper
    // fungsi inline, dan memasukkannya akan memicu pemuatan tanpa henti.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, nonce]);

  return { data, loading, error, muatUlang };
}

/** Ambil array dari respons { data: [...] } atau { data: { data: [...] } }. */
export function daftar<T>(json: Record<string, unknown>): T[] {
  const d = json.data;
  if (Array.isArray(d)) return d as T[];
  if (d && typeof d === 'object' && Array.isArray((d as Record<string, unknown>).data)) {
    return (d as Record<string, unknown>).data as T[];
  }
  return [];
}
