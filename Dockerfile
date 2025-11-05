# -----------------------------
# Etapa 1: Construcción de la app
# -----------------------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# -----------------------------
# Etapa 2: Servidor de producción
# -----------------------------
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist

RUN npm install -g serve

EXPOSE 3000

# ✅ Escucha correctamente en todas las interfaces
CMD ["npx", "serve", "-s", "dist", "-l", "3000", "--cors"]
