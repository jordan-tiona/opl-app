FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder

WORKDIR /app
COPY opl-api/pyproject.toml opl-api/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY opl-api/ .
RUN uv sync --frozen --no-dev

FROM python:3.12-slim-bookworm

WORKDIR /app
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app /app

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["fastapi", "run", "main.py", "--host", "0.0.0.0", "--port", "8000"]
