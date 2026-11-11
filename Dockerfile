FROM node:22-alpine AS base

ENV NEXT_TELEMETRY_DISABLED=1 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

FROM base AS build

ENV NODE_OPTIONS=--max-old-space-size=512

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm next build \
    && pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify \
    && pnpm prune --prod

FROM base AS runner

ENV NODE_ENV=production \
    COZE_PROJECT_ENV=PROD \
    HOSTNAME=0.0.0.0 \
    PORT=5000

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/next.config.mjs ./next.config.mjs
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 5000

CMD ["node", "dist/server.js"]
