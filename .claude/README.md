# Workflows assistidos

Regras gerais: `AGENTS.md`; revisão: `REVIEW.md`; arquitetura e operação: `docs/README.md`.

| Comando           | Uso                                                          |
| ----------------- | ------------------------------------------------------------ |
| `/spec-driven`    | especificar e executar mudança com profundidade proporcional |
| `/nova-adr`       | registrar decisão em `docs/decisoes/` como proposta          |
| `/review-tiulu`   | revisar diff com evidência e sem alterar arquivos            |
| `/validate-tiulu` | executar checks reais conforme escopo                        |
| `/pr`             | preparar e publicar entrega quando autorizado                |

Skills canônicas ficam em `skills/`. `.agents/skills` compartilha essa fonte por link.
`settings.json` carrega comandos de `project.json`, consulta a guarda antes de Bash e oferece
feedback ESLint após edição. Hooks não concedem autorização nem substituem sandbox/revisão.
Não copiar permissões pessoais, credenciais ou `settings.local.json`.
