# Etapa 1: Compilación de la app
FROM node:20-alpine AS builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar dependencias primero (mejor cacheo)
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación Vite (React + TypeScript)
RUN npm run build


# Etapa 2: Servir la app ya compilada con un servidor ligero
FROM node:20-alpine

WORKDIR /app

# Copiar solo los archivos de build desde la etapa anterior
COPY --from=builder /app/dist ./dist

# Instalar un servidor web para servir la app
RUN npm install -g serve

# Exponer el puerto donde corre la app
EXPOSE 3000

# Verificar el contenido del directorio dist
RUN ls -la dist

# Comando de inicio con más verbosidad
CMD ["serve", "-s", "dist", "-l", "3000", "--cors", "--debug"]
