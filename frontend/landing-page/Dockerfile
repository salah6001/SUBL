# Landing page — TanStack Start (Cloudflare Workers target) marketing site.
#
# Unlike the admin/user dashboards (static Vite SPAs served by nginx), this app
# is server-rendered, so it ships with a small Node runtime that serves the
# built worker via Vite's preview server (workerd/miniflare under the hood).
FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

COPY . .

# Baked at build time (the browser reaches these on the host, hence localhost).
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_USER_APP_URL=http://localhost:3002
ENV VITE_USER_APP_URL=$VITE_USER_APP_URL

# Build the SSR bundle. Our custom server entry emits dist/server/index.js, but
# the TanStack preview server imports dist/server/server.js — alias it so
# `vite preview` can boot the worker.
RUN npm run build && cp dist/server/index.js dist/server/server.js

EXPOSE 3003
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "3003"]
