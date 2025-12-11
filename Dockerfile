# ========= BASE =========
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ========= DEPS =========
FROM base AS deps

# Copia arquivos do npm
COPY package.json package-lock.json* ./

# Instala dependências no modo produção
# (se quiser todas as deps para build, use "npm install" sem flag)
RUN npm ci

# ========= BUILDER =========
FROM base AS builder

WORKDIR /app

# Copia node_modules do estágio anterior
COPY --from=deps /app/node_modules ./node_modules

# Copia código do projeto
COPY . .

# Build Next em modo standalone
ENV NODE_ENV=production
RUN npm run build

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
