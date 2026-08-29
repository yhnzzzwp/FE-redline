/**
 * Kode unit (perangkat) dan QR yang ditempel di laptop pelanggan.
 *
 * QR memuat URL penuh ke halaman unit di panel staf, bukan kodenya saja,
 * supaya aplikasi kamera bawaan HP pun bisa langsung membukanya tanpa aplikasi
 * khusus. Halaman tujuannya berada di balik login: pelanggan yang iseng
 * memindai stikernya sendiri hanya akan bertemu layar masuk.
 */

/** URL yang ditanam ke dalam QR. Dipanggil hanya di browser. */
export function urlUnit(kode: string): string {
  const asal = typeof window === 'undefined' ? '' : window.location.origin;
  return `${asal}/admin/perangkat/${encodeURIComponent(kode)}`;
}

/**
 * Ambil kode unit dari hasil pindai.
 *
 * Diterima tiga bentuk, karena stiker lama, stiker baru, dan pengetikan manual
 * bisa bercampur di konter:
 *   - URL penuh   https://situs/admin/perangkat/DEV-ABC123
 *   - URL publik  https://situs/perangkat/DEV-ABC123
 *   - kode telanjang DEV-ABC123
 *
 * Mengembalikan null bila teksnya jelas bukan kode unit — QR acak dari kemasan
 * produk, misalnya, tidak boleh diperlakukan sebagai kode dan menghasilkan
 * pencarian yang membingungkan.
 */
export function kodeDariPindaian(teks: string): string | null {
  const bersih = teks.trim();
  if (bersih === '') return null;

  const cocokUrl = bersih.match(/\/perangkat\/([A-Za-z0-9._-]+)/i);
  if (cocokUrl) return cocokUrl[1];

  // Bukan URL: hanya terima yang berbentuk kode, bukan sembarang teks.
  if (/^[A-Za-z0-9][A-Za-z0-9._-]{3,63}$/.test(bersih) && !bersih.includes('://')) {
    return bersih;
  }

  return null;
}
