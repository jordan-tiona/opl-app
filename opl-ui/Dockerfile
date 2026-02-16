FROM node:20-alpine AS deps
WORKDIR /app
COPY opl-ui/package.json opl-ui/yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY opl-ui/ .

ARG VITE_API_BASE_URL
ARG VITE_OPL_CLIENT_ID
ARG VITE_RECAPTCHA_SITE_KEY
ARG VITE_DEMO_MODE
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_OPL_CLIENT_ID=$VITE_OPL_CLIENT_ID
ENV VITE_RECAPTCHA_SITE_KEY=$VITE_RECAPTCHA_SITE_KEY
ENV VITE_DEMO_MODE=$VITE_DEMO_MODE

RUN yarn build

FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY opl-ui/package.json opl-ui/yarn.lock ./
RUN yarn install --frozen-lockfile --production

FROM node:20-alpine
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY opl-ui/package.json ./

ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "ulimit -n 65536 && yarn start"]
