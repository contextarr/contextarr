FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@10.0.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json vitest.config.ts ./
COPY apps ./apps
COPY packages ./packages
COPY tools ./tools
COPY assets ./assets
COPY demo-packs ./demo-packs

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @contextarr/web build

ENV NODE_ENV=production
ENV CONTEXTARR_HOST=0.0.0.0
ENV CONTEXTARR_PORT=3210
ENV CONTEXTARR_PACKS_DIR=/app/demo-packs
ENV CONTEXTARR_DATABASE_PATH=/app/data/contextarr.db
ENV CONTEXTARR_WEB_DIST_DIR=/app/apps/web/dist

EXPOSE 3210

CMD ["pnpm", "--filter", "@contextarr/server", "start"]
