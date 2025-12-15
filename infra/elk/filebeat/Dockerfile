# ============================================
# Filebeat Dockerfile
# Copies config file with correct ownership
# ============================================
FROM docker.elastic.co/beats/filebeat:8.11.0

# Switch to root for setup
USER root

# Copy config file with correct ownership and permissions
COPY filebeat.yml /usr/share/filebeat/filebeat.yml
RUN chown root:root /usr/share/filebeat/filebeat.yml && \
    chmod 644 /usr/share/filebeat/filebeat.yml

# Stay as root (required for reading Docker socket and container logs)
