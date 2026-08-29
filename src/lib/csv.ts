/**
 * Netralkan injeksi formula spreadsheet pada ekspor CSV sisi klien.
 *
 * Sama dengan App\Support\Csv di backend: Excel, LibreOffice, dan Google
 * Sheets memperlakukan sel yang diawali '=', '+', '-', '@', tab, atau
 * carriage return sebagai FORMULA. Nama pelanggan atau nama item yang
 * mengandung =cmd|'/c calc'!A1 akan dieksekusi saat berkas dibuka.
 */
export function selAman(nilai: unknown): string {
  if (nilai === null || nilai === undefined) return '';

  const teks = String(nilai);

  if (teks === '' || !Number.isNaN(Number(teks))) {
    return teks;
  }

  return /^[=+\-@\t\r]/.test(teks) ? `'${teks}` : teks;
}

/** Bungkus satu sel: disanitasi lalu dikutip dengan escaping CSV yang benar. */
export function selCsv(nilai: unknown): string {
  return `"${selAman(nilai).replace(/"/g, '""')}"`;
}
