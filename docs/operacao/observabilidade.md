# Observabilidade

- `/api/health` executa `SELECT 1`; sucesso indica conexão com PostgreSQL.
- Fastify registra requisições e falhas. O serializador remove query strings e mascara a rota
  de acompanhamento; cookies e cabeçalhos de autorização são ocultados.
- No proxy, desabilitar logs de acesso de `/api/orders/track/*`. Não registrar códigos OAuth,
  tokens, dados pessoais ou payloads completos em novas instrumentações.
- O painel exibe indicadores dos últimos 100 pedidos; não é relatório financeiro.

## Diagnóstico

```bash
docker compose ps
docker compose logs --tail=100 app migrate
curl --fail http://localhost:3000/api/health
```

| Sintoma             | Verificar                                                               |
| ------------------- | ----------------------------------------------------------------------- |
| Health com falha    | disponibilidade do banco, rede interna e resultado da migração          |
| Mutação retorna 403 | `Origin`, `APP_ORIGIN`, cookie e autorização                            |
| Login não conclui   | URL de callback exata, cliente OAuth e e-mail verificado                |
| Pedido retorna 409  | expediente, disponibilidade, estoque ou transição inválida              |
| Login retorna 429   | limite por IP; não contornar removendo a proteção                       |
| Página offline      | conexão e service worker; pedido não deve ser reenviado automaticamente |

Não publicar logs brutos em issues ou PRs. Não há métricas, tracing distribuído ou alertas externos
configurados. Novos sinais devem usar atributos de baixa cardinalidade sem identificar clientes.
