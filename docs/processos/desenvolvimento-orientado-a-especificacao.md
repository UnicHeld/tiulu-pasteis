# Desenvolvimento orientado a especificação

```text
ESPECIFICAR -> DESENHAR* -> TAREFAS* -> EXECUTAR -> VALIDAR
```

Profundidade proporcional ao problema: quick fix usa `.specs/quick/NNN-slug/TASK.md` e
`SUMMARY.md`; feature usa `.specs/features/<feature>/spec.md`. Design e tarefas separados existem
quando reduzem ambiguidade ou coordenam dependências.

## Conteúdo

- Spec: problema, objetivos, fora de escopo, regras testáveis e critérios de aceite.
- Design: contratos, fronteiras, alternativas, compatibilidade e necessidade de ADR.
- Tarefas: unidades verificáveis, dependências e evidência esperada.
- Validação: comandos realmente executados, resultados, critérios atendidos e lacunas.
- `.specs/project/STATE.md`: posição atual e próximo passo para retomar sem reconstruir contexto.
- `.specs/project/LESSONS.md`: aprendizados comprovados, sem copiar histórico de conversa.

## Execução assistida

Claude Code usa `/spec-driven`; Codex usa `$spec-driven`. A fonte é
`.claude/skills/spec-driven/SKILL.md`, também descoberta por `.agents/skills/`.
Não exigir nova aprovação de decisões já autorizadas. Dúvida bloqueante exige esclarecimento;
trabalho independente pode prosseguir. Spec não autoriza commit, push, deploy ou integração real.

Consultar ADRs aceitos antes de modificar paths regidos. Decisão estrutural vira ADR proposto;
detalhe local permanece na spec. Documentação viva é atualizada junto da implementação.
