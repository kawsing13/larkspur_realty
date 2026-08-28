# Build from the repo root:  docker build -f client/Dockerfile -t rems-web .

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json
RUN npm ci
COPY client ./client
# The API path the built app calls. "/api" works when nginx proxies to the server.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build --workspace client

FROM nginx:1.27-alpine AS runtime
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
