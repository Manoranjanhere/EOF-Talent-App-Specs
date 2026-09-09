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

# postinstall runs `prisma generate`; schema is not in the image yet
RUN npm ci --workspace=@eof/shared --workspace=backend --ignore-scripts

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

# Install runtime deps; skip postinstall (no schema yet). Prisma CLI is for migrate deploy.
RUN npm ci --omit=dev --workspace=@eof/shared --workspace=backend --ignore-scripts \
  && npm install prisma@5.22.0 --no-save --workspace=backend --include=dev --ignore-scripts \
  && npm cache clean --force

COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/generated ./backend/generated
COPY --from=build /app/backend/docker-entrypoint.sh ./backend/docker-entrypoint.sh

RUN chmod +x /app/backend/docker-entrypoint.sh \
  && mkdir -p /app/backend/uploads

WORKDIR /app/backend
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
