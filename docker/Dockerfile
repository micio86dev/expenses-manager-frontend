# syntax=docker/dockerfile:1
# Targets: dev (Vite dev server on 0.0.0.0:5173) and prod (static build behind unprivileged nginx).
ARG NODE_VERSION=24.18.0
ARG NGINX_VERSION=1.29.1

FROM node:${NODE_VERSION}-alpine AS base
RUN npm install --global pnpm@11.22.0 && mkdir /app && chown node:node /app
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM base AS dev
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .
USER node
ENV VITE_API_BASE_URL=http://localhost:8000/api/v1
EXPOSE 5173
CMD ["pnpm", "exec", "vite", "--host", "0.0.0.0", "--port", "5173"]

FROM deps AS build
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
COPY . .
RUN pnpm build

FROM nginxinc/nginx-unprivileged:${NGINX_VERSION}-alpine AS prod
# The official image renders /etc/nginx/templates/*.template with the environment at start-up.
ENV API_ORIGIN=http://localhost:8000
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
