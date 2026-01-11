# Node.js LTS (22.x is current LTS as of Dec 2024)
FROM node:22.12-alpine AS base

WORKDIR /app

# Install dependencies stage
FROM base AS deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# Production stage
FROM base AS production
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

EXPOSE 3001

CMD ["node", "dist/main"]
