# Stage 1: Dependencies (all dependencies for build)
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build:next
RUN npm run build:worker

# Stage 3: Final runner
FROM node:20-alpine AS runner
RUN apk add --no-cache postgresql16 postgresql16-contrib redis supervisor su-exec wget bash
WORKDIR /app
ENV NODE_ENV=production

# Copy standalone application files (minimal production dependencies)
COPY --from=builder /app/.next/standalone/server.js ./server.js
COPY --from=builder /app/.next/standalone/package.json ./package.json

# Copy full node_modules (needed for worker dependencies like bullmq, ioredis, googleapis)
# The standalone build only includes Next.js dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy .next directory with all required files for standalone server
COPY --from=builder /app/.next ./.next

# Copy public files
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Copy compiled worker code (no TypeScript, no source files)
COPY --from=builder /app/dist ./dist

# Copy config files
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create directories for PostgreSQL and Redis
RUN mkdir -p /var/lib/postgresql/data /var/lib/redis /run/postgresql

# Setup permissions
RUN chown -R node:node /app /var/lib/postgresql/data /var/lib/redis /run/postgresql

EXPOSE 3000
ENV PGDATA=/var/lib/postgresql/data
ENV PGPORT=5432

ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]
