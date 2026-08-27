import jsPDF from 'jspdf';

export interface ReceiptData {
  kode_nota: string;
  tanggal: string;
  nama_pembeli: string;
  nomor_hp?: string;
  items: Array<{
    nama_item: string;
    harga: number;
    jumlah: number;
    tipe?: string;
  }>;
  subtotal: number;
  total: number;
  bayar: number;
  kembalian: number;
  metode_bayar: string;
  kasir: string;
}

export function generateReceiptPDFBlob(data: ReceiptData): Blob {
  // Create 80mm thermal receipt formatted PDF or standard compact format
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, Math.max(140, 95 + data.items.length * 10)],
  });

  const pageWidth = 80;
  let y = 10;

  // Header Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(222, 31, 38); // Redline brand red
  doc.text('REDLINE KOMPUTER', pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(90, 96, 110);
  doc.text('Hardware, Service & Custom PC', pageWidth / 2, y, { align: 'center' });

  y += 4;
  doc.text('Jl. Pemuda No. 45, Salatiga · 0856-4020-3069', pageWidth / 2, y, { align: 'center' });

  // Divider
  y += 3;
  doc.setDrawColor(220, 224, 230);
  doc.setLineWidth(0.3);
  doc.line(6, y, pageWidth - 6, y);

  // Meta Info
  y += 4;
  doc.setFontSize(7.5);
  doc.setTextColor(50, 55, 65);
  doc.text(`No. Nota : #${data.kode_nota}`, 6, y);
  y += 3.5;
  doc.text(`Tanggal  : ${data.tanggal}`, 6, y);
  y += 3.5;
  doc.text(`Kasir    : ${data.kasir}`, 6, y);
  y += 3.5;
  doc.text(`Customer : ${data.nama_pembeli}${data.nomor_hp ? ` (${data.nomor_hp})` : ''}`, 6, y);

  // Items Divider
  y += 3;
  doc.setDrawColor(220, 224, 230);
  doc.line(6, y, pageWidth - 6, y);

  // Items Header
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(20, 25, 30);
  doc.text('Item / Layanan', 6, y);
  doc.text('Total (Rp)', pageWidth - 6, y, { align: 'right' });

  // Items List
  y += 2;
  doc.setFont('helvetica', 'normal');
  data.items.forEach((item) => {
    y += 3.5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 35, 42);
    // Truncate long name if needed
    const truncatedName = item.nama_item.length > 32 ? item.nama_item.substring(0, 30) + '..' : item.nama_item;
    doc.text(truncatedName, 6, y);

    y += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 96, 110);
    doc.text(`  ${item.jumlah}x @ Rp ${item.harga.toLocaleString('id-ID')}`, 6, y);
    doc.setTextColor(20, 25, 30);
    doc.text(`Rp ${(item.jumlah * item.harga).toLocaleString('id-ID')}`, pageWidth - 6, y, { align: 'right' });
  });

  // Summary Divider
  y += 3.5;
  doc.setDrawColor(220, 224, 230);
  doc.line(6, y, pageWidth - 6, y);

  // Summary
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(176, 18, 24); // Red strong
  doc.text('TOTAL TAGIHAN', 6, y);
  doc.text(`Rp ${data.total.toLocaleString('id-ID')}`, pageWidth - 6, y, { align: 'right' });

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 65, 75);
  doc.text(`Metode Bayar : ${data.metode_bayar}`, 6, y);

  if (data.metode_bayar === 'Tunai') {
    y += 3.5;
    doc.text(`Tunai Diterima : Rp ${data.bayar.toLocaleString('id-ID')}`, 6, y);
    y += 3.5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 120, 60);
    doc.text(`Kembalian      : Rp ${data.kembalian.toLocaleString('id-ID')}`, 6, y);
  }

  // Footer
  y += 6;
  doc.setDrawColor(220, 224, 230);
  doc.line(6, y, pageWidth - 6, y);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 125, 135);
  doc.text('Terima kasih atas kunjungan Anda!', pageWidth / 2, y, { align: 'center' });
  y += 3;
  doc.text('Simpan nota ini sebagai bukti transaksi & garansi.', pageWidth / 2, y, { align: 'center' });

  return doc.output('blob');
}

export function downloadReceiptPDF(data: ReceiptData, fileName?: string): void {
  const blob = generateReceiptPDFBlob(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || `Nota-Redline-${data.kode_nota}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareReceiptPDFToWhatsApp(data: ReceiptData): Promise<void> {
  const blob = generateReceiptPDFBlob(data);
  const fileName = `Nota-Redline-${data.kode_nota}.pdf`;
  const file = new File([blob], fileName, { type: 'application/pdf' });

  // Clean phone number
  const phone = (data.nomor_hp || '').replace(/^0/, '62').replace(/\D/g, '');
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://redline-testing1.yohaneswp.sbs';
  const liveNotaUrl = `${baseUrl}/nota/${data.kode_nota}`;

  const messageText = `Halo Kak *${data.nama_pembeli}*,\n\nBerikut adalah *Nota Transaksi & File PDF Resmi #${data.kode_nota}* dari *Redline Komputer Salatiga*:\n\n📄 *Buka & Unduh Nota PDF Resmi:* \n👉 ${liveNotaUrl}\n\n💰 *Total Tagihan:* Rp ${data.total.toLocaleString('id-ID')} (${data.metode_bayar})\n\nTerima kasih telah berbelanja di Redline Komputer! Simpan tautan & file PDF ini sebagai bukti pembelian dan klaim garansi resmi.`;

  // If Web Share API with files is supported (e.g. mobile Chrome / Safari)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `Nota Redline #${data.kode_nota}`,
        text: messageText,
        files: [file],
      });
      return;
    } catch {
      // User cancelled or share failed, fallback to download + WA link
    }
  }

  // Fallback for Desktop web:
  // 1. Auto-download the PDF
  downloadReceiptPDF(data, fileName);

  // 2. Open WhatsApp chat with the pre-filled message and direct digital invoice link
  const waUrl = phone.length >= 8
    ? `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`
    : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

  window.open(waUrl, '_blank', 'noopener,noreferrer');
}
