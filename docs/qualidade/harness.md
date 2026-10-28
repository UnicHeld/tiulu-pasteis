# Harness de desenvolvimento

| Superfície             | Fonte                                                                     |
| ---------------------- | ------------------------------------------------------------------------- |
| Regras de projeto      | `AGENTS.md`                                                               |
| Glossário              | `CONTEXT.md`                                                              |
| Revisão                | `REVIEW.md`                                                               |
| Claude Code            | `CLAUDE.md`, `.claude/settings.json`, `.claude/rules/`, `.claude/skills/` |
| Codex                  | `.codex/hooks.json`, `.codex/project.json`, `.agents/skills/`             |
| Cursor                 | `.cursor/rules/`, `.cursor/commands/`                                     |
| Estado de trabalho     | `.specs/project/` e artefatos da feature                                  |
| Validação automatizada | `.github/workflows/ci.yml`, `scripts/`, `tests/harness/`                  |

As skills canônicas ficam em `.claude/skills/`; `.agents/skills` aponta para o mesmo diretório.
Comandos Cursor e definições de agentes referenciam essas fontes. Não duplicar regras gerais.

## Workflows

- `spec-driven`: especificar, desenhar quando necessário, decompor e implementar.
- `nova-adr`: registrar decisão estrutural como proposta, com opções e regras verificáveis.
- `review-tiulu`: revisão somente leitura conforme `REVIEW.md`.
- `validate-tiulu`: validação proporcional ao escopo, com resultados reais.
- `pr`: preparar commit/push/PR dentro da autorização existente do usuário.

No Claude Code, usar `/nome`; no Codex, `$nome`. Os adaptadores são documentados em
`.claude/README.md` e `.codex/README.md`.

## Hooks

Claude Code carrega `.claude/project.json` no início da sessão, consulta `gate.py` antes do Bash
e executa `feedback.py` após editar TypeScript. O gate pede confirmação para padrões destrutivos;
o feedback roda ESLint sem corrigir arquivos e informa se a ferramenta está indisponível.

Codex carrega os mesmos comandos pelo `SessionStart` de `.codex/hooks.json`. Os hooks dependem
do suporte e da confiança da ferramenta no workspace. Não alteram permissões pessoais.
Os padrões do gate são uma ajuda, não um parser completo de shell nem uma fronteira de segurança.
Falha de parsing não autoriza operação; as regras de `AGENTS.md` continuam valendo.

## Gate de maturidade

O CI usa `harness-score@1.6.5` com mínimo `L4`, versão explícita para auditoria reproduzível.
Upgrade e alteração do mínimo precisam de revisão; executar o mesmo comando localmente após
mudar regras, skills, hooks ou CI. A proposta está em
[ADR-0001](../decisoes/0001-harness-com-gate-de-maturidade.md), ainda sem aceitação formal.

Referências oficiais: [hooks do Codex](https://learn.chatgpt.com/docs/hooks),
[skills](https://learn.chatgpt.com/docs/build-skills) e
[harness-score](https://github.com/paladini/harness-score).
