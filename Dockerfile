# -----------------------------
# Etapa 1: Construcción de la app
# -----------------------------
FROM node:20-alpine AS builder

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias (mejor caché)
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Compilar la aplicación (React + Vite)
RUN npm run build


# -----------------------------
# Etapa 2: Servidor de producción
# -----------------------------
FROM node:20-alpine

WORKDIR /app

# Copiar solo los archivos generados del build
COPY --from=builder /app/dist ./dist

# Instalar el servidor estático 'serve'
RUN npm install -g serve

# Exponer el puerto (debe coincidir con EasyPanel)
EXPOSE 3000

# Comando de inicio — importante escuchar en 0.0.0.0
CMD ["npx", "serve", "-s", "dist", "-l", "0.0.0.0:3000", "--cors"]
