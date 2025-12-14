FROM owasp/modsecurity-crs:nginx

# Switch to root to perform installations and file operations
USER root

# Install openssl
RUN apt-get update && apt-get install -y openssl

# Create the SSL directory
RUN mkdir -p /etc/nginx/ssl

# Generate the self-signed certificate
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=Transcendence/CN=localhost"

# Fix permissions
RUN chmod 644 /etc/nginx/ssl/nginx.crt && \
    chmod 600 /etc/nginx/ssl/nginx.key

# COPY custom Nginx configuration
COPY ./nginx.conf /etc/nginx/nginx.conf

# CRITICAL: Remove the default template.
# If we don't do this, the container's startup script (20-envsubst) will 
# overwrite our copied nginx.conf with the default one at runtime.
RUN rm -f /etc/nginx/templates/nginx.conf.template
