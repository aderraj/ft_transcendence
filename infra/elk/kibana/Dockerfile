FROM docker.elastic.co/kibana/kibana:8.11.0

USER root

RUN mkdir -p /usr/share/kibana/config/certs

# Generate certs
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /usr/share/kibana/config/certs/kibana.key \
    -out /usr/share/kibana/config/certs/kibana.crt \
    -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=Transcendence/CN=kibana"

RUN chmod 644 /usr/share/kibana/config/certs/kibana.crt && \
    chmod 600 /usr/share/kibana/config/certs/kibana.key && \
    chown -R kibana:kibana /usr/share/kibana/config/certs

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER kibana

ENTRYPOINT ["/entrypoint.sh"]
