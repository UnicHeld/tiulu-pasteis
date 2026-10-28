---
name: validate-tiulu
description: Executa validações reais e proporcionais ao escopo, com alternativa Docker isolada. Use ao pedir testes, checks, verificação antes de entrega ou diagnóstico de CI.
---

# Validar mudanças

Ler `AGENTS.md`, status e diff. Comandos e camadas:
`docs/qualidade/visao-geral-de-avaliacoes.md`.

| Escopo                     | Validação                                                       |
| -------------------------- | --------------------------------------------------------------- |
| Docs                       | formatação, `python3 scripts/check-docs.py`, `git diff --check` |
| TypeScript                 | formatação, lint, tipos e testes do comportamento afetado       |
| Compartilhado, build ou CI | quality e integration em `compose.validation.yaml`              |
| Harness                    | check-docs, testes Python e harness L4                          |

Sem Node.js local, usar `docker compose -f compose.validation.yaml run --rm quality`,
`integration` e `harness`, conforme necessário. O banco de teste é efêmero e isolado.
Não ler `.env`, usar produção, chamar OAuth real ou corrigir arquivos durante mera validação.
Se ferramenta falhar, reportar causa e resultado parcial. Não contornar checks.

Relatório: resultado geral, comandos e exit codes, falhas acionáveis, verificações omitidas e risco.
Suíte PostgreSQL pulada não conta como integração validada.
