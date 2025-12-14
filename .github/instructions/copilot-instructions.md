# GitHub Copilot Instructions for ft_transcendence (Security & DevOps)

## Project Overview
This project constitutes the **Cybersecurity and DevOps** infrastructure for the ft_transcendence Pong platform.
- **Goal**: Implement and validate a secure, containerized environment using a realistic Pong application testbed.
- **Architecture**:
  - **Edge**: Nginx + ModSecurity (WAF) as the single entry point.
  - **Application**: Pong Webapp (Frontend + Backend) to simulate real-world traffic and vulnerabilities.
  - **Secrets**: Self-Managed HashiCorp Vault.

## Tech Stack
- **Infrastructure**: Docker, Docker Compose.
- **Security**:
  - **WAF**: Nginx with ModSecurity v3 (OWASP Core Rule Set).
  - **Secrets**: HashiCorp Vault (Self-Hosted/Self-Managed).
- **Testbed App**: Python Flask (Simulating the Pong Frontend/Backend).

## Critical Workflows

### 1. Infrastructure Management (DevOps)
- **Start Environment**:
  ```bash
  docker-compose up --build
  ```
- **Vault Operations (Self-Managed)**:
  - **Initialization**: Vault starts sealed. You must manually initialize and unseal it.
  - **Configuration**: Create secrets engines and policies to store the Pong App's credentials (e.g., DB passwords, API keys).
  - **Verification**: Ensure the `vault` container is reachable by the `backend` service on the internal network.

### 2. Security Validation (Cybersecurity)
- **WAF Testing**:
  - The Pong App exposes inputs (Login, Game Search, Score Submission).
  - **Task**: Attempt exploits (SQLi, XSS, Path Traversal) against these inputs.
  - **Success**: The WAF blocks the request (403 Forbidden) and logs the event.
- **Secret Injection Testing**:
  - The Pong Backend connects to Vault at startup.
  - **Success**: The app starts ONLY if it successfully retrieves secrets from Vault.
  - **Failure**: The app crashes or enters a "Maintenance Mode" if Vault is sealed or unreachable.

## Application Structure (`mock_backend/`)
- **Role**: Serves as the "Pong Webapp" to test the infrastructure.
- **Components**:
  - **Frontend**: HTML/JS serving the Pong game interface (served via Flask templates).
  - **Backend**: API endpoints handling user auth and game logic.
- **Vault Integration**:
  - Uses `hvac` client to authenticate and fetch secrets.
  - **Requirement**: Must demonstrate secure failure handling (no hardcoded fallbacks).

## Project Conventions
- **Network Isolation**:
  - Public access is ONLY via the WAF (ports 80/443).
  - The Pong Backend and Vault are isolated on the `secure_net` bridge network.
- **Secret Management**:
  - **Strict Rule**: No secrets in `docker-compose.yml` or source code.
  - **Pattern**: App requests secrets from Vault at runtime.
- **Theme**: All test pages and dummy data should follow the "Pong" / "Retro Gaming" theme to match the project subject.

## Key Files
- `docker-compose.yml`: Orchestration of WAF, Vault, and Pong App.
- `infra/modsecurity/`: WAF configuration.
- `infra/vault/`: Vault persistence and config.
- `mock_backend/app.py`: The Pong application logic.
