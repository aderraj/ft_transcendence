FROM grafana/grafana:10.2.2

USER root

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy provisioning configurations
COPY provisioning /etc/grafana/provisioning
COPY dashboards /var/lib/grafana/dashboards
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh && \
    chown -R grafana:root /etc/grafana && \
    chown -R grafana:root /var/lib/grafana

USER grafana

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
