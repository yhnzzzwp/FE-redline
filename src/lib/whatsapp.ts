export function createWhatsAppLink(productName: string, sku?: string): string {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE || '6281234567890';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const skuText = sku ? `\nSKU: ${sku}` : '';
  const message = `Halo Redline, saya ingin bertanya tentang produk:\n\n*${productName}*${skuText}`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function createGeneralWhatsAppLink(): string {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE || '6281234567890';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const message = `Halo Redline Komputer, saya ingin berkonsultasi mengenai servis / kebutuhan komputer.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
