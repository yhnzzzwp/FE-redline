'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';

// ─── Types ─────────────────────────────────────────────────────────
interface ConnectionState {
  /** navigator.onLine DAN healthcheck terakhir berhasil */
  isOnline: boolean;
  /** Terakhir kali healthcheck berhasil (ISO string) */
  lastHealthCheck: string | null;
}

interface ConnectionContextType extends ConnectionState {
  /** Paksa cek koneksi sekarang */
  checkNow: () => Promise<boolean>;
}

// ─── Context ───────────────────────────────────────────────────────
const ConnectionContext = createContext<ConnectionContextType>({
  isOnline: true,
  lastHealthCheck: null,
  checkNow: async () => true,
});

export function useConnection() {
  return useContext(ConnectionContext);
}

// ─── Health Check ──────────────────────────────────────────────────
// Healthcheck juga lewat proksi same-origin: komponen ini berjalan di
// browser, dan alamat backend tidak boleh bocor ke sana.
const API_BASE = '/api/backend';
const HEALTH_CHECK_INTERVAL = 30_000; // 30 detik
const HEALTH_CHECK_TIMEOUT = 5_000;   // 5 detik timeout

async function pingServer(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    const res = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Provider ──────────────────────────────────────────────────────
export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConnectionState>({
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    lastHealthCheck: null,
  });

  const lastHealthCheckOk = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateStatus = useCallback((browserOnline: boolean, healthOk: boolean) => {
    const online = browserOnline && healthOk;
    lastHealthCheckOk.current = healthOk;
    setState((prev) => ({
      isOnline: online,
      lastHealthCheck: healthOk ? new Date().toISOString() : prev.lastHealthCheck,
    }));
  }, []);

  const checkNow = useCallback(async (): Promise<boolean> => {
    const browserOnline = navigator.onLine;
    if (!browserOnline) {
      updateStatus(false, false);
      return false;
    }
    const healthOk = await pingServer();
    updateStatus(browserOnline, healthOk);
    return browserOnline && healthOk;
  }, [updateStatus]);

  useEffect(() => {
    // Cek langsung saat mount — health check ke server external
    // (ini memang use case yang benar untuk effect: sinkronisasi dengan sistem eksternal)
    void checkNow(); // eslint-disable-line react-hooks/set-state-in-effect

    // Interval health check berkala
    intervalRef.current = setInterval(() => {
      void checkNow();
    }, HEALTH_CHECK_INTERVAL);

    // Browser online/offline events (callback-based, bukan synchronous)
    const handleOnline = () => {
      // Browser bilang online — verifikasi dengan health check
      void checkNow();
    };

    const handleOffline = () => {
      updateStatus(false, false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkNow, updateStatus]);

  return (
    <ConnectionContext.Provider value={{ ...state, checkNow }}>
      {children}
    </ConnectionContext.Provider>
  );
}
