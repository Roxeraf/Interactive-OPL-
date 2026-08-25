# Klarpunkt — Node 22 is pinned here so local Node versions no longer matter.
# Next.js 16 requires Node >= 20.9; this image is the supported runtime.
ARG NODE_VERSION=22.14.0

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="file:./dev.db"
RUN npx prisma generate && npx next build

FROM base AS development
ENV NODE_ENV=development \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DATABASE_URL="file:/data/klarpunkt.db"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && mkdir -p /data
EXPOSE 3000
VOLUME ["/data"]
ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "run", "dev"]

# Local compose image: stay root. A recursive `chown` of node_modules (tens of
# thousands of files) is the step that appears frozen for many minutes on
# Docker Desktop for Windows. Files from COPY are world-readable; Prisma and
# SQLite only need to write `/data`, which root can always do.
FROM base AS runner
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DATABASE_URL="file:/data/klarpunkt.db"

RUN mkdir -p /data

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
VOLUME ["/data"]
ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "run", "start"]
