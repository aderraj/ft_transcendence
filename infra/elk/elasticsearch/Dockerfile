FROM docker.elastic.co/elasticsearch/elasticsearch:8.11.0

USER root

RUN mkdir -p /usr/share/elasticsearch/config/certs

# Generate certs
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /usr/share/elasticsearch/config/certs/elasticsearch.key \
    -out /usr/share/elasticsearch/config/certs/elasticsearch.crt \
    -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=Transcendence/CN=elasticsearch"

# Convert key to pkcs8 for ES
RUN openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt \
    -in /usr/share/elasticsearch/config/certs/elasticsearch.key \
    -out /usr/share/elasticsearch/config/certs/elasticsearch.pkcs8.key

RUN chmod 644 /usr/share/elasticsearch/config/certs/elasticsearch.crt && \
    chmod 600 /usr/share/elasticsearch/config/certs/elasticsearch.pkcs8.key && \
    chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/config/certs

# Copy setup script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER elasticsearch

ENTRYPOINT ["/entrypoint.sh"]
