# Dev-oriented image for the Vite + React app in the pnpm workspace.
# Build context is the repo root (see docker-compose.yml).
# pnpm@11 (packageManager in root package.json) needs Node >= 22.13.
FROM node:22-slim

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /repo

# Install workspace deps first for better layer caching.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
COPY apps/ai/package.json apps/ai/
RUN pnpm install --frozen-lockfile

# Copy the rest of the source.
COPY . .

WORKDIR /repo/apps/web
EXPOSE 5173
CMD ["pnpm", "dev"]
