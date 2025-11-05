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

# ✅ Compatible con la versión nueva de "serve"
CMD ["npx", "serve", "-s", "dist", "--listen", "tcp://0.0.0.0:3000"]
