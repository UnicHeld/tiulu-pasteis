---
name: spec-driven
description: Especifica e implementa mudanças com fases adaptativas. Use para features, mudanças multiarquivo, quick fixes ou retomada de trabalho com artefatos em .specs/.
---

# Desenvolvimento orientado a especificação

Ler `AGENTS.md`, `.specs/project/STATE.md`, a spec existente e somente os módulos relevantes.
Seguir `docs/processos/desenvolvimento-orientado-a-especificacao.md`.

```text
ESPECIFICAR -> DESENHAR* -> TAREFAS* -> EXECUTAR -> VALIDAR
```

Correção pequena usa `.specs/quick/NNN-slug/TASK.md` e `SUMMARY.md`; feature usa
`.specs/features/<feature>/spec.md`. Separar design/tarefas quando houver complexidade real.

- Para requisitos e aceite, ler `references/specify.md`.
- Para desenho ou decisão estrutural, ler `references/design.md` e consultar ADRs.
- Para executar, validar e retomar, ler `references/implement.md`.

Resolver detalhes rotineiros com evidência do repositório. Perguntar somente ambiguidade
bloqueante; não repetir aprovação já dada. Não inventar contrato, teste, resultado ou aprovação.
Atualizar docs e estado junto da entrega. Spec não autoriza ações externas além do pedido.
