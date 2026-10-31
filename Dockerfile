# syntax=docker/dockerfile:1
# One non-root image serves the API, worker, and checked-in migrations.
ARG BUN_VERSION=1.4.2-alpine
FROM oven/bun:${BUN_VERSION} AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts

FROM oven/bun:${BUN_VERSION} AS runtime
WORKDIR /app
ARG BUILD_COMMIT=unknown
LABEL org.opencontainers.image.revision=$BUILD_COMMIT
LABEL org.opencontainers.image.source=https://github.com/hsignals/ms-agentic-be
ENV BUILD_COMMIT=$BUILD_COMMIT
RUN apk add --no-cache tini
ENV NODE_ENV=production PORT=8080 LOG_LEVEL=info
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY --chown=bun:bun src ./src
COPY --chown=bun:bun drizzle ./drizzle
USER bun
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- "http://localhost:$PORT/health" >/dev/null 2>&1 || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["bun", "run", "src/index.ts"]
