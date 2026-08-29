import type { NextConfig } from "next";

const isVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  // Mode standalone hanya diaktifkan untuk build Docker lokal, bukan Vercel
  ...(isVercel ? {} : { output: "standalone" }),

  // Sembunyikan X-Powered-By header untuk mencegah fingerprinting teknologi
  poweredByHeader: false,

  // Sembunyikan dan nonaktifkan Source Maps di browser publik agar kode asli tidak bisa di-inspect
  productionBrowserSourceMaps: false,

  // Security Headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Filter XSS bawaan browser lama sudah usang dan pernah menjadi
          // sumber kerentanan tersendiri; '0' adalah nilai yang benar sekarang.
          // Harus sama dengan yang di-set src/proxy.ts agar tidak berbeda.
          {
            key: "X-XSS-Protection",
            value: "0",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
