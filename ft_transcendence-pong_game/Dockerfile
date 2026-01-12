FROM node:20-alpine

WORKDIR /app

# Install netcat for healthcheck
RUN apk add --no-cache netcat-openbsd

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema and config
COPY prisma ./prisma
COPY prisma.config.ts ./

# Copy application code
COPY . .

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 3002

# Use entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]

# Generate Prisma client and start application
CMD ["npm", "start"]
