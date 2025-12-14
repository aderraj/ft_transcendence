# Vault Configuration for ft_transcendence
# Self-Managed / Self-Hosted

# Storage backend - file-based for persistence
storage "file" {
  path = "/vault/file"
}

# Listener configuration
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1  # TLS handled by WAF/Nginx
}

# Disable mlock for Docker compatibility
disable_mlock = true

# API address for internal communication
api_addr = "http://vault:8200"

# UI enabled for management
ui = true

# Logging
log_level = "info"
