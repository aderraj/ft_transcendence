FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema and config
COPY prisma ./prisma
COPY prisma.config.ts ./

# Copy application code
COPY . .

# Expose port
EXPOSE 3002

# Generate Prisma client and start application
CMD sh -c "npx prisma generate && npm start"
