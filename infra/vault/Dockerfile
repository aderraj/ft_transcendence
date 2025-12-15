FROM hashicorp/vault:1.15

USER root
RUN apk add --no-cache openssl jq curl

RUN mkdir -p /vault/file/certs

# Generate self-signed cert
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /vault/file/certs/vault.key \
    -out /vault/file/certs/vault.crt \
    -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=Transcendence/CN=vault"

RUN chmod 644 /vault/file/certs/vault.crt && \
    chmod 600 /vault/file/certs/vault.key && \
    chown -R vault:vault /vault/file/certs

# Copy init script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["server"]
