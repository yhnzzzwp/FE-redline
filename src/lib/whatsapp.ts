export function createWhatsAppLink(productName: string, sku?: string): string {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE || '6281234567890';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const itemInfo = sku ? `${productName} (SKU: ${sku})` : productName;
  const message = `Halo Redline Komputer, saya tertarik untuk menanyakan info dan pemesanan produk: ${itemInfo}. Apakah barang ini tersedia?`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function createGeneralWhatsAppLink(): string {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE || '6281234567890';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const message = `Halo Redline Komputer, saya ingin berkonsultasi mengenai servis / kebutuhan komputer.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
