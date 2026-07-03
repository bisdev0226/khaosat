# syntax=docker/dockerfile:1
# khaosat — Express + Prisma + React(Vite). Dựa trên starter-kit/deploy/Dockerfile.node,
# chỉnh cho layout repo này (server/ chạy trực tiếp, client/ build ra client/dist).
FROM node:22-alpine AS build
WORKDIR /app
# Cài deps 2 tầng (root + client) trước để tận dụng layer cache
COPY package*.json ./
COPY client/package*.json ./client/
# --ignore-scripts: postinstall (prisma generate) chạy sau khi đã copy schema
RUN npm ci --ignore-scripts
RUN npm --prefix client ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/server ./server
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/data ./data
COPY --from=build /app/package.json ./
EXPOSE 3000
CMD ["node", "server/index.js"]
