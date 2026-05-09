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
COPY demo-skills ./demo-skills
COPY demo-agent-kits ./demo-agent-kits

RUN pnpm install --frozen-lockfile
ARG VITE_CONTEXTARR_API_TOKEN=contextarr-local-preview-token
ENV VITE_CONTEXTARR_API_TOKEN=$VITE_CONTEXTARR_API_TOKEN
RUN pnpm --filter @contextarr/web build

ENV NODE_ENV=production
ENV CONTEXTARR_HOST=0.0.0.0
ENV CONTEXTARR_PORT=3210
ENV CONTEXTARR_API_TOKEN=$VITE_CONTEXTARR_API_TOKEN
ENV CONTEXTARR_PACKS_DIR=/app/demo-packs
ENV CONTEXTARR_SKILLS_DIR=/app/demo-skills
ENV CONTEXTARR_DEMO_AGENT_KITS_DIR=/app/demo-agent-kits
ENV CONTEXTARR_AGENT_KITS_DIR=/app/agent-kits
ENV CONTEXTARR_DATABASE_PATH=/app/data/contextarr.db
ENV CONTEXTARR_WEB_DIST_DIR=/app/apps/web/dist

EXPOSE 3210

CMD ["pnpm", "--filter", "@contextarr/server", "start"]
