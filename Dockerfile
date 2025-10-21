# ===== Deps =====
FROM node:20-alpine AS deps
WORKDIR /app

# En Alpine, quelques libs utiles (sharp/libvips) — optionnel mais safe
RUN apk add --no-cache libc6-compat

# Copie des manifests (npm)
COPY package.json package-lock.json ./
# Installe toutes les deps pour builder (dev + prod)
RUN npm ci

# ===== Build =====
FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
# libvips/compat facultatif (sharp)
RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build Next (produit .next/standalone grâce à output: 'standalone')
RUN npm run build

# ===== Runner minimal =====
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# On copie le serveur standalone généré par Next
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
