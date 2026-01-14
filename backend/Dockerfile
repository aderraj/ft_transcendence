# Production Dockerfile for NestJS Backend
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY src ./src

# Build the application
RUN npm run build && ls -la dist/

# ============================================
# Production stage
# ============================================
FROM node:20-alpine AS production

# Install runtime dependencies only
RUN apk add --no-cache \
    openssl \
    bash \
    curl \
    jq \
    postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Verify the build was copied
RUN ls -la dist/src/ && test -f dist/src/main.js

# Create uploads directory
RUN mkdir -p /app/uploads/avatars && \
    chmod -R 755 /app/uploads

# Copy default avatar (to uploads and as backup)
COPY uploads/avatars/default-avatar.png /app/uploads/avatars/default-avatar.png
COPY uploads/avatars/default-avatar.png /app/default-avatar.png

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose application port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/api || exit 1

# Use entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]

# Production command - run the compiled JavaScript
CMD ["node", "dist/src/main.js"]
