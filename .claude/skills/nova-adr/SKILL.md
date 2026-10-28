---
name: nova-adr
description: Registra uma decisão arquitetural como ADR proposto com alternativas, consequências e paths regidos. Use ao criar, superseder ou documentar decisão estrutural.
---

# Nova ADR

Ler `docs/processos/registro-de-decisoes.md`, o índice e os ADRs aceitos da área.
Se não atender critério de ADR, registrar na spec/PR. Se a decisão estiver aberta, explicitar
alternativas sem inventar conclusão.

Usar próximo número livre, copiar `docs/decisoes/_modelo.md` e preencher contexto com evidência.
Título afirmativo, pelo menos duas opções reais, custos negativos e regras verificáveis.
Agente escreve `Proposto`; não inventar decisor ou aprovação. Atualizar índice com paths regidos.
Ao superar, alterar somente Status/Links do antigo e vincular ambos.

Validar `python3 scripts/check-docs.py`. Informar arquivo, critério atendido e aprovação pendente.
