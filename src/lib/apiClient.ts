import { Kategori, PerangkatDetail, Produk, Promo, ServiceDetail } from '@/types';

const SERVER_API_BASE = process.env.API_BASE_URL || 'http://localhost:8080/api/v1';
const BROWSER_API_BASE = '/api/backend';

function apiBase(): string {
  return typeof window === 'undefined' ? SERVER_API_BASE : BROWSER_API_BASE;
}

const paginationKosong = { current_page: 1, last_page: 1, total: 0 };

export async function fetchKatalog(params?: {
  kategori?: number;
  cari?: string;
  page?: number;
}): Promise<{ data: Produk[]; pagination: { current_page: number; last_page: number; total: number } }> {
  const url = new URL(`${apiBase()}/katalog`, typeof window === 'undefined' ? undefined : window.location.origin);
  if (params?.kategori) url.searchParams.set('kategori', params.kategori.toString());
  if (params?.cari) url.searchParams.set('cari', params.cari);
  if (params?.page) url.searchParams.set('page', params.page.toString());

  const res = await fetch(url.toString(), { next: { revalidate: 30 } });
  if (!res.ok) {
    return { data: [], pagination: paginationKosong };
  }
  const json = await res.json();
  return {
    data: Array.isArray(json.data) ? json.data : [],
    pagination: json.pagination || paginationKosong,
  };
}

export async function fetchProdukDetail(
  id: number | string
): Promise<{ produk: Produk | null; terkait: Produk[] }> {
  const res = await fetch(`${apiBase()}/katalog/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) {
    return { produk: null, terkait: [] };
  }
  const json = await res.json();
  if (!json.data) {
    return { produk: null, terkait: [] };
  }
  return {
    produk: json.data.produk || json.data,
    terkait: json.data.terkait || [],
  };
}

export async function fetchKategori(): Promise<Kategori[]> {
  const res = await fetch(`${apiBase()}/kategori`, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}

export async function fetchPromos(): Promise<Promo[]> {
  const res = await fetch(`${apiBase()}/promo`, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}

export async function fetchCekServis(
  nomor_resi: string
): Promise<{ success: boolean; data?: ServiceDetail; isConnectionError?: boolean; message?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `${apiBase()}/service/cek?resi=${encodeURIComponent(nomor_resi)}`,
      { cache: 'no-store', signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (!res.ok) {
      if (res.status === 404) {
        return { success: false, message: 'Nomor resi tidak ditemukan dalam sistem database kami.' };
      }
      return { success: false, isConnectionError: true, message: 'Server database sedang tidak dapat diakses.' };
    }
    const json = await res.json();
    if (json.status === 'error' || !json.data) {
      return { success: false, message: json.message || 'Nomor resi tidak ditemukan.' };
    }
    return { success: true, data: json.data };
  } catch {
    return {
      success: false,
      isConnectionError: true,
      message: 'Gagal terhubung ke server database Redline.',
    };
  }
}

export async function fetchPerangkat(
  kode: string
): Promise<{ success: boolean; data?: PerangkatDetail; isConnectionError?: boolean; message?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${apiBase()}/perangkat/${encodeURIComponent(kode)}`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      if (res.status === 404) {
        return { success: false, message: 'Perangkat tidak ditemukan.' };
      }
      return { success: false, isConnectionError: true, message: 'Server tidak dapat diakses.' };
    }
    const json = await res.json();
    if (json.status === 'error' || !json.data) {
      return { success: false, message: json.message || 'Perangkat tidak ditemukan.' };
    }
    return { success: true, data: json.data };
  } catch {
    return {
      success: false,
      isConnectionError: true,
      message: 'Gagal terhubung ke server backend Redline.',
    };
  }
}

export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return fetch(`/api/backend${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    headers,
    cache: 'no-store',
    credentials: 'same-origin',
  });
}

export async function syncPosTransactions(
  transactions: unknown[]
): Promise<{ status: string; synced?: unknown[]; errors?: unknown[] }> {
  try {
    const res = await authFetch('/pos/sync', {
      method: 'POST',
      body: JSON.stringify({ transaksi: transactions }),
    });
    if (res.status === 401) {
      return {
        status: 'error',
        errors: ['Sesi berakhir. Masuk kembali untuk menyinkronkan transaksi offline.'],
      };
    }
    return await res.json();
  } catch (error) {
    return {
      status: 'error',
      errors: [error instanceof Error ? error.message : 'Gagal terhubung ke server'],
    };
  }
}

export async function loginUser(
  portal: 'admin' | 'karyawan',
  username: string,
  password: string,
  remember = false
): Promise<{ success: boolean; role?: string; message?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, portal, remember }),
      cache: 'no-store',
      credentials: 'same-origin',
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.status === 'success') {
      return { success: true, role: json.data?.user?.role };
    }
    return { success: false, message: json?.message || 'Username atau password salah.' };
  } catch {
    return {
      success: false,
      message: 'Tidak dapat terhubung ke server Redline. Login membutuhkan koneksi.',
    };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
    });
  } catch {
    /* noop */
  }
}

export async function loginAdmin(
  username: string,
  password: string,
  remember = false
): Promise<{ success: boolean; role?: string; message?: string }> {
  return loginUser('admin', username, password, remember);
}