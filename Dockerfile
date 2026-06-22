# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Production stage ─────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Buat direktori unggahan (persistent dalam container).
RUN mkdir -p public/assets/uploads/receiving

# Salin dependency & kode aplikasi.
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Cloud Run menetapkan env PORT otomatis (default 8080).
ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "./bin/www"]
