FROM node:18-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* ./
COPY tsconfig.json ./

RUN npm ci

COPY . .

RUN npm run build

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

CMD ["node", "dist/server.js"]

