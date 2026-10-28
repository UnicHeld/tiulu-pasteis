# Workflows assistidos no Codex

Regras gerais em `AGENTS.md`, revisão em `REVIEW.md` e contratos em `docs/README.md`.

- `$spec-driven`: especificação, implementação e retomada com artefatos em `.specs/`.
- `$nova-adr`: decisão arquitetural proposta, com alternativas e regras verificáveis.
- `$review-tiulu`: revisão somente leitura, com evidência.
- `$validate-tiulu`: validação proporcional com comandos reais e alternativa Docker.
- `$pr`: preparar e publicar entrega dentro da autorização do usuário.

`.agents/skills` aponta para `.claude/skills/`, evitando cópias divergentes. O hook
`SessionStart` carrega `.codex/project.json`, que compartilha os comandos de validação.
Não há perfil de permissões pessoais, token ou conexão privada versionado. Hooks dependem do
suporte da ferramenta e da confiança no workspace; não substituem autorização ou sandbox.
