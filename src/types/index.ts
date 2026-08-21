export interface Kategori {
  id: number;
  nama_kategori: string;
  deskripsi_kategori?: string;
  produk_count?: number;
}

export interface Produk {
  id: number;
  kategori_id?: number;
  sku?: string;
  nama_produk: string;
  deskripsi_produk?: string;
  show_katalog: boolean;
  kategori?: Kategori;
  created_at?: string;
  updated_at?: string;
}

export interface Promo {
  id: number;
  nama_promo: string;
  kode_promo: string;
  tipe_promo: string;
  besar_promo: number;
  minimal_transaksi?: number;
  maksimal_diskon?: number;
  waktu_mulai?: string;
  waktu_berakhir?: string;
  aktif: boolean;
  foto_promo?: string;
}

export interface ServicePart {
  nama_part: string;
  jumlah: number;
  harga: number;
  subtotal: number;
}

export interface ServiceRiwayat {
  status: string;
  status_warna: string;
  catatan?: string;
  waktu: string;
}

export interface ServiceDetail {
  nomor_resi: string;
  status: string;
  status_warna: string;
  merk_model?: string;
  nama_customer?: string;
  nomor_hp_customer?: string;
  keluhan?: string;
  catatan_solusi?: string;
  tanggal_masuk?: string;
  estimasi_selesai?: string;
  tanggal_selesai?: string;
  biaya_service: number;
  biaya_parts: number;
  total_biaya: number;
  parts: ServicePart[];
  riwayat: ServiceRiwayat[];
}

export interface PerangkatService {
  id: number;
  nomor_resi: string;
  status: string;
  status_warna: string;
  keluhan?: string;
  catatan_solusi?: string;
  tanggal_masuk?: string;
  tanggal_selesai?: string;
  total_biaya: number;
  parts: ServicePart[];
}

export interface PerangkatDetail {
  id: number;
  kode_perangkat: string;
  nama_customer: string;
  nomor_hp_customer?: string;
  merk_model: string;
  serial_number?: string;
  tahun?: string;
  spesifikasi?: string;
  services: PerangkatService[];
}

export interface PosCartLine {
  id: string;
  produk_id?: number;
  service_id?: number;
  tipe: 'produk' | 'service';
  nama_item: string;
  harga: number;
  jumlah: number;
}

export interface OfflineTransaction {
  local_id: string;
  kode_nota?: string;
  created_at: string;
  items: PosCartLine[];
  subtotal: number;
  diskon: number;
  kode_promo?: string;
  total: number;
  bayar: number;
  kembalian: number;
  metode_bayar: string;
  nama_pembeli?: string;
  nomor_hp_pembeli?: string;
  is_synced: boolean;
}
