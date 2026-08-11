# FastAPI backend. Build context is ./apps/api (see docker-compose.yml).
FROM python:3.12-slim

# uv for dependency management.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Install runtime deps first for better layer caching.
COPY pyproject.toml uv.lock* ./
RUN uv sync --no-dev

# App source.
COPY . .

EXPOSE 8000
CMD ["uv", "run", "--no-dev", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
