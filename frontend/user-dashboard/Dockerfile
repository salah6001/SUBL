FROM node:20-alpine AS build
WORKDIR /app

RUN npm install -g pnpm@9

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_API_WS_URL=ws://localhost:5000
ENV VITE_API_WS_URL=$VITE_API_WS_URL

ARG VITE_CHAT_URL=http://localhost:5005
ENV VITE_CHAT_URL=$VITE_CHAT_URL

RUN pnpm build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
