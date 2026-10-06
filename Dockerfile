FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .

ENV NODE_ENV=production \
    APP_ENV=development \
    DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    BETTER_AUTH_SECRET=build-only-secret-not-used-at-runtime \
    BETTER_AUTH_URL=http://localhost:3000

RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npm run db:deploy && npm run start"]
