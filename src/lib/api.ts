import { Kategori, PerangkatDetail, Produk, Promo, ServiceDetail } from '@/types';

/**
 * Di SERVER: langsung ke Laravel memakai API_BASE_URL (variabel server-only,
 * tidak ikut ke bundle browser).
 * Di BROWSER: selalu lewat proksi same-origin /api/backend, sehingga alamat
 * backend tidak pernah terpapar dan token tetap di cookie HttpOnly.
 */
const SERVER_API_BASE = process.env.API_BASE_URL || 'http://localhost:8080/api/v1';
const BROWSER_API_BASE = '/api/backend';

function apiBase(): string {
  return typeof window === 'undefined' ? SERVER_API_BASE : BROWSER_API_BASE;
}

export const dummyKategori: Kategori[] = [
  { id: 1, nama_kategori: 'Prosesor (CPU)', deskripsi_kategori: 'Prosesor Intel & AMD Ryzen', produk_count: 2 },
  { id: 2, nama_kategori: 'Kartu Grafis (VGA)', deskripsi_kategori: 'GPU NVIDIA GeForce & AMD Radeon', produk_count: 2 },
  { id: 3, nama_kategori: 'Motherboard', deskripsi_kategori: 'Motherboard Intel LGA1700 & AMD AM5', produk_count: 1 },
  { id: 4, nama_kategori: 'RAM (Memory)', deskripsi_kategori: 'Modul memori DDR4 & DDR5 performa tinggi', produk_count: 1 },
  { id: 5, nama_kategori: 'Storage (SSD/HDD)', deskripsi_kategori: 'NVMe M.2 PCIe Gen4/Gen5 & SATA SSD', produk_count: 1 },
  { id: 6, nama_kategori: 'Power Supply (PSU)', deskripsi_kategori: 'PSU sertifikasi 80 Plus Bronze hingga Platinum', produk_count: 1 },
  { id: 7, nama_kategori: 'Periferal & Aksesoris', deskripsi_kategori: 'Keyboard mekanik, mouse gaming, dan aksesoris', produk_count: 1 },
  { id: 8, nama_kategori: 'PC Rakitan', deskripsi_kategori: 'Paket PC Rakitan siap pakai bergaransi toko', produk_count: 1 },
];

export const dummyPromos: Promo[] = [
  {
    id: 1,
    nama_promo: 'Promo Rakit PC & Servis Spesial',
    kode_promo: 'REDLINE-STAGE1',
    tipe_promo: 'persen',
    besar_promo: 15,
    minimal_transaksi: 500000,
    maksimal_diskon: 250000,
    aktif: true,
  },
  {
    id: 2,
    nama_promo: 'Gratis Pembersihan & Ganti Thermal Paste',
    kode_promo: 'CLEAN-CARE',
    tipe_promo: 'nominal',
    besar_promo: 50000,
    minimal_transaksi: 200000,
    aktif: true,
  },
];

export const dummyProduk: Produk[] = [
  {
    id: 1,
    kategori_id: 2,
    sku: 'VGA-RTX4090-24G',
    nama_produk: 'ASUS ROG Strix GeForce RTX 4090 OC 24GB GDDR6X',
    deskripsi_produk: 'Kartu grafis flagship untuk performa gaming 4K ekstrem dan rendering 3D profesional. Dilengkapi sistem pendingin Axial-tech 3.5-slot, backplate aluminium berventilasi, dan dual BIOS (Performance / Quiet). Garansi resmi 3 tahun.',
    show_katalog: true,
    kategori: { id: 2, nama_kategori: 'Kartu Grafis (VGA)' },
  },
  {
    id: 2,
    kategori_id: 1,
    sku: 'CPU-I9-14900K',
    nama_produk: 'Intel Core i9-14900K Processor (24 Cores, up to 6.0 GHz)',
    deskripsi_produk: 'Prosesor generasi ke-14 dengan 24 core (8 P-core + 16 E-core) dan 32 thread. Kecepatan clock hingga 6.0 GHz dengan Intel Thermal Velocity Boost. Kompatibel dengan socket LGA1700 motherboard chipset 700 & 600 series.',
    show_katalog: true,
    kategori: { id: 1, nama_kategori: 'Prosesor (CPU)' },
  },
  {
    id: 3,
    kategori_id: 1,
    sku: 'CPU-R7-7800X3D',
    nama_produk: 'AMD Ryzen 7 7800X3D Gaming Processor (8 Cores, 3D V-Cache)',
    deskripsi_produk: 'Prosesor gaming tercepat dengan arsitektur Zen 4 dan teknologi revolusioner AMD 3D V-Cache (96MB L3 Cache). Konsumsi daya efisien dengan performa FPS stabil di judul-judul kompetitif.',
    show_katalog: true,
    kategori: { id: 1, nama_kategori: 'Prosesor (CPU)' },
  },
  {
    id: 4,
    kategori_id: 2,
    sku: 'VGA-RTX4070TIS-16G',
    nama_produk: 'MSI GeForce RTX 4070 Ti SUPER 16G GAMING X SLIM',
    deskripsi_produk: 'Performa grafis ultra 1440p & 4K dengan VRAM 16GB GDDR6X. Dilengkapi pendingin TRI FROZR 3 dengan kipas TORX FAN 5.0 dan desain profil ramping untuk sirkulasi udara optimal.',
    show_katalog: true,
    kategori: { id: 2, nama_kategori: 'Kartu Grafis (VGA)' },
  },
  {
    id: 5,
    kategori_id: 4,
    sku: 'RAM-DOM-TITAN-64',
    nama_produk: 'Corsair Dominator Titanium RGB DDR5 64GB (2x32GB) 6000MHz CL30',
    deskripsi_produk: 'Kit memori DDR5 premium dengan pendingin forged aluminum dan 11 LED RGB Capellix beralamat per modul. Mendukung profil Intel XMP 3.0 dan AMD EXPO untuk stabilitas overclocking maksimal.',
    show_katalog: true,
    kategori: { id: 4, nama_kategori: 'RAM (Memory)' },
  },
  {
    id: 6,
    kategori_id: 5,
    sku: 'SSD-990PRO-2TB',
    nama_produk: 'Samsung 990 PRO NVMe M.2 SSD 2TB PCIe Gen 4.0',
    deskripsi_produk: 'SSD tercepat di kelasnya dengan kecepatan baca sekuensial hingga 7.450 MB/s dan tulis hingga 6.900 MB/s. Dilengkapi teknologi V-NAND 3-bit MLC dan kontrol termal dinamis cerdas.',
    show_katalog: true,
    kategori: { id: 5, nama_kategori: 'Storage (SSD/HDD)' },
  },
  {
    id: 7,
    kategori_id: 3,
    sku: 'MBO-ROG-Z790-E',
    nama_produk: 'ASUS ROG STRIX Z790-E GAMING WIFI II Motherboard',
    deskripsi_produk: 'Motherboard gaming premium LGA1700 dengan 18+1+2 power stages, slot PCIe 5.0 x16, 5 slot M.2 NVMe, Wi-Fi 7 ultra-cepat, dan audio SupremeFX ALC4080.',
    show_katalog: true,
    kategori: { id: 3, nama_kategori: 'Motherboard' },
  },
  {
    id: 8,
    kategori_id: 6,
    sku: 'PSU-HX1000I-ATX3',
    nama_produk: 'Corsair HXi Series HX1000i 1000W 80 PLUS Platinum ATX 3.0',
    deskripsi_produk: 'Power supply modular 1000 Watt dengan efisiensi 80 PLUS Platinum, kapasitor Jepang 105°C, sertifikasi ATX 3.0 & PCIe 5.0 natif (12VHPWR), serta pemantauan software iCUE.',
    show_katalog: true,
    kategori: { id: 6, nama_kategori: 'Power Supply (PSU)' },
  },
  {
    id: 9,
    kategori_id: 7,
    sku: 'KEY-WOB-RAIN75',
    nama_produk: 'Rainy75 Mechanical Keyboard Aluminium Wireless Tri-Mode',
    deskripsi_produk: 'Custom mechanical keyboard 75% CNC aluminium enclosure dengan gasket mount flex cut PCB, FR4 plate, foam modded pabrik, dan switch HMX Violet linear.',
    show_katalog: true,
    kategori: { id: 7, nama_kategori: 'Periferal & Aksesoris' },
  },
  {
    id: 10,
    kategori_id: 8,
    sku: 'PC-REDLINE-STAGE3',
    nama_produk: 'PC Rakitan Redline Stage 3 Gaming & Editing Edition',
    deskripsi_produk: 'PC rakitan custom yang telah di-benchmark stabilitas suhu dan performa 24 jam penuh di workshop Redline Salatiga. Spek: Ryzen 7 7800X3D, RTX 4070 Ti Super, 32GB DDR5, 1TB NVMe Gen4, AIO Liquid Cooling 360mm.',
    show_katalog: true,
    kategori: { id: 8, nama_kategori: 'PC Rakitan' },
  },
];

export async function fetchKatalog(params?: {
  kategori?: number;
  cari?: string;
  page?: number;
}): Promise<{ data: Produk[]; pagination: { current_page: number; last_page: number; total: number } }> {
  try {
    const url = new URL(`${apiBase()}/katalog`, typeof window === 'undefined' ? undefined : window.location.origin);
    if (params?.kategori) url.searchParams.set('kategori', params.kategori.toString());
    if (params?.cari) url.searchParams.set('cari', params.cari);
    if (params?.page) url.searchParams.set('page', params.page.toString());

    const res = await fetch(url.toString(), { next: { revalidate: 30 } });
    if (!res.ok) throw new Error('Gagal memuat katalog');
    const json = await res.json();
    if (json.data && json.data.length > 0) {
      return {
        data: json.data,
        pagination: json.pagination || { current_page: 1, last_page: 1, total: json.data.length },
      };
    }
  } catch {
    // fallback to static data
  }

  let filtered = [...dummyProduk];
  if (params?.kategori) {
    filtered = filtered.filter((p) => p.kategori_id === params.kategori);
  }
  if (params?.cari) {
    const query = params.cari.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.nama_produk.toLowerCase().includes(query) ||
        (p.sku ? p.sku.toLowerCase().includes(query) : false) ||
        (p.deskripsi_produk ? p.deskripsi_produk.toLowerCase().includes(query) : false)
    );
  }

  return {
    data: filtered,
    pagination: {
      current_page: 1,
      last_page: 1,
      total: filtered.length,
    },
  };
}

export async function fetchProdukDetail(
  id: number | string
): Promise<{ produk: Produk | null; terkait: Produk[] }> {
  try {
    const res = await fetch(`${apiBase()}/katalog/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        return {
          produk: json.data.produk || json.data,
          terkait: json.data.terkait || [],
        };
      }
    }
  } catch {
    // fallback
  }

  const found = dummyProduk.find((p) => p.id === Number(id) || p.sku === id) || null;
  const terkait = found
    ? dummyProduk.filter((p) => p.id !== found.id && p.kategori_id === found.kategori_id).slice(0, 3)
    : [];

  return { produk: found, terkait };
}

export async function fetchKategori(): Promise<Kategori[]> {
  try {
    const res = await fetch(`${apiBase()}/kategori`, { next: { revalidate: 300 } });
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.length > 0) return json.data;
    }
  } catch {
    // fallback
  }
  return dummyKategori;
}

export async function fetchPromos(): Promise<Promo[]> {
  try {
    const res = await fetch(`${apiBase()}/promo`, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.length > 0) return json.data;
    }
  } catch {
    // fallback
  }
  return dummyPromos;
}

export async function fetchCekServis(
  nomor_resi: string
): Promise<{ success: boolean; data?: ServiceDetail; isConnectionError?: boolean; message?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `${apiBase()}/service/cek?resi=${encodeURIComponent(nomor_resi)}`,
      {
        cache: 'no-store',
        signal: controller.signal,
      }
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

// ─── Autentikasi lewat BFF (Backend-for-Frontend) ──────────────────
//
// Token sesi TIDAK pernah menyentuh JavaScript. Ia disimpan sebagai cookie
// HttpOnly oleh Route Handler di server, dan Route Handler pula yang
// melampirkannya sebagai Bearer saat meneruskan permintaan ke Laravel.
// Konsekuensinya: skrip berbahaya yang berhasil dieksekusi di halaman ini
// tetap tidak bisa membaca maupun mengekstraksi token.

/** Panggilan ke endpoint terproteksi. Selalu same-origin. */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  return fetch(`/api/backend${path}`, {
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

/**
 * Login. Mengembalikan status dan peran saja — TIDAK mengembalikan token,
 * dan pemanggil tidak perlu (dan tidak bisa) menyetel cookie sendiri.
 */
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

/** Cabut token di backend lalu hapus cookie sesi. */
export async function logoutUser(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
    });
  } catch {
    // Abaikan: cookie tetap dibuang server saat permintaan berikutnya gagal.
  }
}

export async function loginAdmin(
  username: string,
  password: string,
  remember = false
): Promise<{ success: boolean; role?: string; message?: string }> {
  return loginUser('admin', username, password, remember);
}
