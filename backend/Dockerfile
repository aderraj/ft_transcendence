FROM node:20-alpine

RUN apk add --no-cache openssl

RUN mkdir -p /etc/ssl/private /etc/ssl/certs

RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/backend.key \
    -out /etc/ssl/certs/backend.crt \
    -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=Transcendence/CN=backend"

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "run", "start:prod"]
