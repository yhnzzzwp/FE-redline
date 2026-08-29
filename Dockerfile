# ─── Stage 1: Dependencies ──────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ─── Stage 2: Build ─────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args hanya untuk nilai yang MEMANG publik.
# Alamat backend sengaja TIDAK di sini: sejak pola BFF dipakai, ia dibaca
# saat runtime lewat API_BASE_URL (tanpa awalan NEXT_PUBLIC_) sehingga tidak
# pernah ikut ter-inline ke dalam bundle JavaScript browser.
ARG NEXT_PUBLIC_WA_PHONE=6281234567890
ENV NEXT_PUBLIC_WA_PHONE=$NEXT_PUBLIC_WA_PHONE
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─── Stage 3: Production ────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Alamat backend Laravel — server-only, dibaca saat runtime oleh Route Handler.
ENV API_BASE_URL=http://redline-web/api/v1

# User non-root untuk keamanan
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
