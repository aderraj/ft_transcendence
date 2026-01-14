FROM node:20-alpine AS builder

WORKDIR /app

COPY shared ./shared

COPY front ./front

WORKDIR /app/shared
RUN npm install

WORKDIR /app/front
RUN npm install
RUN npm run build

FROM nginx:alpine

COPY front/nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir -p /etc/nginx/ssl

COPY --from=builder /app/front/dist /usr/share/nginx/html

# HTTP only - WAF reverse proxy handles HTTPS/SSL termination
EXPOSE 80

RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo 'cat > /usr/share/nginx/html/env-config.js << EOF' >> /docker-entrypoint.sh && \
    echo 'window.ENV = {' >> /docker-entrypoint.sh && \
    echo '  VITE_API_BASE: "${VITE_API_BASE}"' >> /docker-entrypoint.sh && \
    echo '};' >> /docker-entrypoint.sh && \
    echo 'EOF' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

CMD ["/docker-entrypoint.sh"]