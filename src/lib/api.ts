import { Kategori, PerangkatDetail, Produk, Promo, ServiceDetail } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

export async function fetchKatalog(params?: {
  kategori?: number;
  cari?: string;
  page?: number;
}): Promise<{ data: Produk[]; pagination: { current_page: number; last_page: number; total: number } }> {
  try {
    const url = new URL(`${API_BASE}/katalog`);
    if (params?.kategori) url.searchParams.set('kategori', params.kategori.toString());
    if (params?.cari) url.searchParams.set('cari', params.cari);
    if (params?.page) url.searchParams.set('page', params.page.toString());

    const res = await fetch(url.toString(), { next: { revalidate: 30 } });
    if (!res.ok) throw new Error('Gagal memuat katalog');
    const json = await res.json();
    return {
      data: json.data || [],
      pagination: json.pagination || { current_page: 1, last_page: 1, total: 0 },
    };
  } catch {
    return { data: [], pagination: { current_page: 1, last_page: 1, total: 0 } };
  }
}

export async function fetchProdukDetail(id: number | string): Promise<{ produk: Produk | null; terkait: Produk[] }> {
  try {
    const res = await fetch(`${API_BASE}/katalog/${id}`, { next: { revalidate: 30 } });
    if (!res.ok) return { produk: null, terkait: [] };
    const json = await res.json();
    return {
      produk: json.data?.produk || null,
      terkait: json.data?.terkait || [],
    };
  } catch {
    return { produk: null, terkait: [] };
  }
}

export async function fetchKategori(): Promise<Kategori[]> {
  try {
    const res = await fetch(`${API_BASE}/kategori`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function fetchPromos(): Promise<Promo[]> {
  try {
    const res = await fetch(`${API_BASE}/promo`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function fetchCekServis(resi: string): Promise<{ success: boolean; data?: ServiceDetail; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/service/cek?resi=${encodeURIComponent(resi)}`, { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok || json.status === 'error') {
      return { success: false, message: json.message || 'Tiket servis tidak ditemukan' };
    }
    return { success: true, data: json.data };
  } catch {
    return { success: false, message: 'Gagal terhubung ke server. Silakan coba sesaat lagi.' };
  }
}

export async function fetchPerangkat(kode: string): Promise<{ success: boolean; data?: PerangkatDetail; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/perangkat/${encodeURIComponent(kode)}`, { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok || json.status === 'error') {
      return { success: false, message: json.message || 'Perangkat tidak ditemukan' };
    }
    return { success: true, data: json.data };
  } catch {
    return { success: false, message: 'Gagal memuat riwayat perangkat.' };
  }
}

export async function syncPosTransactions(transactions: unknown[]): Promise<{ status: string; synced?: unknown[]; errors?: unknown[] }> {
  try {
    const res = await fetch(`${API_BASE}/pos/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaksi: transactions }),
    });
    return await res.json();
  } catch (error) {
    return { status: 'error', errors: [error] };
  }
}

export async function loginAdmin(username: string, password: string): Promise<{ success: boolean; token?: string; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    if (res.ok && json.status === 'success') {
      return { success: true, token: json.data?.token };
    }
    return { success: false, message: json.message || 'Username atau password salah' };
  } catch {
    return { success: false, message: 'Gagal terhubung ke server.' };
  }
}
