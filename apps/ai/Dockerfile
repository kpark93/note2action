# Dev-oriented image for the Next.js app in the pnpm workspace.
# Build context is the repo root (see docker-compose.yml).
FROM node:20-slim

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

WORKDIR /repo/apps/ai
EXPOSE 3000
CMD ["pnpm", "dev"]
