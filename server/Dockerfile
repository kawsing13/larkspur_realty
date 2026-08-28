# Build from the repo root:  docker build -f server/Dockerfile -t rems-server .
# (the build context is the whole repo because npm workspaces share one lockfile)

FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json
RUN npm ci
COPY server ./server
RUN npm run db:generate --workspace server

FROM node:22-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl wget && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server ./server
COPY --from=build /app/package.json /app/package-lock.json ./
RUN useradd -r -u 1001 -m appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["node", "server/src/server.js"]
