FROM docker.elastic.co/logstash/logstash:8.11.0

USER root

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER logstash

ENTRYPOINT ["/entrypoint.sh"]
