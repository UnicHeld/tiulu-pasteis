---
name: review-tiulu
description: Revisa diffs, branches ou PRs procurando defeitos concretos em pedidos, estoque, autenticação e contratos. Use quando o usuário pedir code review ou análise de risco.
---

# Revisar mudanças

Ler `AGENTS.md` e `REVIEW.md`; resolver alvo e inspecionar Git, diff e consumidores imediatos.
Sem alvo, revisar alterações locais incluindo não rastreados relevantes. Somente leitura.
Cruzar paths com ADRs aceitos e verificar regras vigentes.

Priorizar autorização/PII, atomicidade de pedido e estoque, preço no servidor, pagamento,
transições, falhas de rede e duplicidade. Conferir testes que discriminem regressões.
Confirmar cada achado no código com cenário concreto e `arquivo:linha`.
Não apresentar preferência estilística como defeito nem status pendente como falha de CI.

Usar contagem, classificação de risco e segunda passada de `REVIEW.md`. Informar validações
executadas, omissões e riscos mesmo sem achados. Não publicar comentários ou alterar PR sem pedido.
