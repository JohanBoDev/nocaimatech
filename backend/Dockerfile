# Imagen de producción de la API. Se construye en la EC2 desde la raíz del repo
# (monorepo con npm workspaces: el lockfile vive en la raíz):
#
#   docker compose -f docker-compose.prod.yml up -d --build

# --- build: compila TypeScript con todas las dependencias ---
FROM node:22-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
# npm ci valida el lockfile contra todos los workspaces, aunque solo se instale uno.
COPY frontend/package.json frontend/
COPY backend/prisma backend/prisma
RUN npm ci -w backend
COPY backend/tsconfig.json backend/
COPY backend/src backend/src
RUN npm run build -w backend
# RDS exige TLS y su CA no viene en Alpine: sin este bundle no se puede verificar
# el certificado del servidor (ver DATABASE_URL en el README).
RUN mkdir -p /app/certs && \
    wget -qO /app/certs/rds-ca.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# --- runtime: solo dependencias de producción ---
FROM node:22-alpine
# Los motores de Prisma 6 necesitan OpenSSL; Alpine no lo trae.
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY backend/prisma backend/prisma
# `prisma` va en dependencies: el postinstall genera el cliente y el mismo CLI
# sirve para `prisma migrate deploy` desde esta imagen.
RUN npm ci -w backend --omit=dev && npm cache clean --force
COPY --from=builder /app/backend/dist backend/dist
COPY backend/data backend/data
COPY --from=builder /app/certs /app/certs
USER node
WORKDIR /app/backend
EXPOSE 4000
# `node` directo y no `npm start`: npm no reenvía el SIGTERM de `docker stop`.
CMD ["node", "dist/index.js"]
