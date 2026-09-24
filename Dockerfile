# ==============================================================================
# MarketingFlow Multi-Stage Production Dockerfile
# Stage 1: Build the React + Vite Frontend
# Stage 2: Install Server Dependencies & Generate Prisma Client
# Stage 3: Lightweight Production Runtime Image
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend
# ------------------------------------------------------------------------------
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Build Backend & Generate Prisma Client
# ------------------------------------------------------------------------------
FROM node:20-alpine AS server-builder
WORKDIR /app/server

# Install OpenSSL for Prisma engine on Alpine
RUN apk add --no-cache openssl

COPY server/package*.json ./
RUN npm ci

COPY server/prisma/ ./prisma/
RUN npx prisma generate --schema=prisma/schema.prisma

# ------------------------------------------------------------------------------
# Stage 3: Production Runtime
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Install OpenSSL & CA Certificates
RUN apk add --no-cache openssl ca-certificates

ENV NODE_ENV=production
ENV PORT=5000

# Copy server code and pre-installed dependencies
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY --from=server-builder /app/server/prisma ./server/prisma
COPY server/package.json ./server/
COPY server/entrypoint.js ./server/
COPY server/src ./server/src

# Copy built frontend assets
COPY --from=client-builder /app/client/dist ./client/dist

# Expose HTTP port
EXPOSE 5000

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

WORKDIR /app/server

# Start via entrypoint: runs DB schema sync, seeds demo data, boots Express & cron
CMD ["node", "entrypoint.js"]
