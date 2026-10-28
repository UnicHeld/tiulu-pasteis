# Aprendizados

## Ambiente local

Node.js pode não estar disponível no host. A configuração `compose.validation.yaml` permite
executar qualidade, integração PostgreSQL e harness sem instalar pacotes globalmente.

## Evidência de validação

Testes PostgreSQL são pulados sem `RUN_DB_TESTS=1`. Reportar separadamente domínio/HTTP e
integração; uma suíte pulada não comprova o fluxo transacional.
