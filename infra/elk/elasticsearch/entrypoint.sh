#!/bin/bash
# ============================================
# Elasticsearch Entrypoint
# Reads password from secrets volume and configures ES
# ============================================

SECRETS_DIR="/secrets"
ES_URL="https://localhost:9200"
SETUP_DONE="/usr/share/elasticsearch/data/.setup-complete"

# Wait for secrets
echo "[es] Waiting for secrets..."
while [ ! -f "$SECRETS_DIR/.ready" ]; do
    sleep 1
done

# Read password from secrets volume
export ELASTIC_PASSWORD=$(cat "$SECRETS_DIR/elastic_password")
echo "[es] ✓ Password loaded from secrets"

# Background setup after ES starts
setup_elasticsearch() {
    echo "[es-setup] Waiting for Elasticsearch..."
    
    for i in $(seq 1 60); do
        if curl -sk -u "elastic:$ELASTIC_PASSWORD" "$ES_URL/_cluster/health" 2>/dev/null | grep -qE '"status":"(green|yellow)"'; then
            break
        fi
        sleep 2
    done
    
    if [ -f "$SETUP_DONE" ]; then
        echo "[es-setup] ✓ Already configured"
        return 0
    fi
    
    echo "[es-setup] Configuring Kibana user..."
    curl -sk -X POST "$ES_URL/_security/user/kibana_system/_password" \
        -u "elastic:$ELASTIC_PASSWORD" \
        -H "Content-Type: application/json" \
        -d "{\"password\":\"$ELASTIC_PASSWORD\"}" > /dev/null 2>&1
    
    echo "[es-setup] Configuring ILM policy..."
    curl -sk -X PUT "$ES_URL/_ilm/policy/pong-logs-policy" \
        -u "elastic:$ELASTIC_PASSWORD" \
        -H "Content-Type: application/json" \
        -d '{"policy":{"phases":{"hot":{"min_age":"0ms","actions":{"rollover":{"max_age":"1d","max_size":"1gb"}}},"warm":{"min_age":"2d","actions":{"shrink":{"number_of_shards":1}}},"delete":{"min_age":"7d","actions":{"delete":{}}}}}}' > /dev/null 2>&1
    
    curl -sk -X PUT "$ES_URL/_index_template/pong-logs-template" \
        -u "elastic:$ELASTIC_PASSWORD" \
        -H "Content-Type: application/json" \
        -d '{"index_patterns":["pong-logs-*","pong-security-*"],"template":{"settings":{"index.lifecycle.name":"pong-logs-policy","number_of_shards":1,"number_of_replicas":0}}}' > /dev/null 2>&1
    
    touch "$SETUP_DONE"
    echo "[es-setup] ✓ Setup complete"
}

(setup_elasticsearch) &

# Start Elasticsearch
exec /usr/local/bin/docker-entrypoint.sh elasticsearch
