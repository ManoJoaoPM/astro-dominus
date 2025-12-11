# ========= BASE =========
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ========= DEPS =========
FROM base AS deps
# habilita corepack para usar pnpm
RUN corepack enable

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ========= BUILDER =========
FROM base AS builder
RUN corepack enable

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next em modo standalone
ENV NODE_ENV=production
RUN pnpm build

# ========= RUNNER =========
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Não rodar como root
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
USER nextjs

# Copia output standalone
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# server.js vem do output standalone do Next
CMD ["node", "server.js"]
