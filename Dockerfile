FROM node:22-alpine AS base

# --- Build del frontend ---
FROM base AS frontend-build
WORKDIR /app/admin
COPY admin/package*.json ./
RUN npm ci
COPY admin/ ./
RUN npm run build

# --- Build del backend ---
FROM base AS backend-build
WORKDIR /app/api
COPY api/package*.json ./
RUN npm ci
COPY api/ ./
RUN npm run build

# --- Producción ---
FROM base AS production
WORKDIR /app

# Copiar backend build + dependencias de producción
COPY api/package*.json ./api/
WORKDIR /app/api
RUN npm ci --omit=dev
COPY --from=backend-build /app/api/dist ./dist

# Copiar frontend build
COPY --from=frontend-build /app/admin/dist /app/admin/dist

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "api/dist/main.js"]
