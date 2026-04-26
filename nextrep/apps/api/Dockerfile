FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

# Copy manifests first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared as CommonJS for Node runtime compatibility
RUN pnpm --filter @nextrep/shared exec tsc --project tsconfig.json --module commonjs --moduleResolution node

RUN pnpm turbo run build --filter=@nextrep/api

# ─── Prod image ───────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

# Copy only what's needed
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./

# Point shared package to compiled JS in the container
RUN node -e "const fs=require('fs');const p=require('./packages/shared/package.json');p.main='./dist/index.js';p.types='./dist/index.d.ts';p.exports={'.':'./dist/index.js'};fs.writeFileSync('./packages/shared/package.json', JSON.stringify(p, null, 2));"

RUN pnpm install --prod --frozen-lockfile

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/health || exit 1

WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]
