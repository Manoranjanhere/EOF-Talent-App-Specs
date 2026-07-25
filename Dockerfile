# Build & run EOF Talent API (NestJS) from monorepo root.
# On EC2: docker compose up -d --build

FROM node:20-bookworm-slim AS build
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/
COPY mobile-app/package.json ./mobile-app/

RUN npm ci --workspace=@eof/shared --workspace=backend

COPY packages/shared ./packages/shared
COPY backend ./backend

RUN npm run build --workspace=@eof/shared \
  && npx prisma generate --schema=backend/prisma/schema.prisma \
  && npm run build --workspace=backend

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/
COPY mobile-app/package.json ./mobile-app/

# Install runtime deps; keep prisma CLI for migrate deploy
RUN npm ci --omit=dev --workspace=@eof/shared --workspace=backend \
  && npm install prisma@5.22.0 --no-save --workspace=backend --include=dev \
  && npm cache clean --force

COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/docker-entrypoint.sh ./backend/docker-entrypoint.sh
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client

RUN chmod +x /app/backend/docker-entrypoint.sh \
  && mkdir -p /app/backend/uploads

WORKDIR /app/backend
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
