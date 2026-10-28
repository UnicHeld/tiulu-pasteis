# API

JSON, mesma origem. Mutações exigem `Origin: APP_ORIGIN`. Valores monetários em centavos. Erros: `{ "error": "mensagem" }`. Sessão por cookie HttpOnly.

| Método | Rota                        | Acesso / comportamento                                |
| ------ | --------------------------- | ----------------------------------------------------- |
| GET    | /api/health                 | Verifica banco                                        |
| GET    | /api/menu                   | Catálogo e informações da loja                        |
| GET    | /api/me                     | Sessão e contagem de compras                          |
| GET    | /api/auth/google            | Inicia OAuth                                          |
| GET    | /api/auth/google/callback   | Troca código e cria sessão                            |
| POST   | /api/auth/admin             | Senha de gestão, limitado a 5 tentativas/15min        |
| POST   | /api/auth/logout            | Encerra sessão atual                                  |
| POST   | /api/orders                 | Cria pedido anônimo ou autenticado                    |
| GET    | /api/orders/track/:token    | Pedido e eventos; token secreto de 64 caracteres hex  |
| GET    | /api/orders                 | Histórico do aluno ou últimos 100 pedidos para gestor |
| GET    | /api/admin/orders/:id/items | Itens, somente gestor                                 |
| PATCH  | /api/admin/orders/:id       | `{status?, paid?:true}`, somente gestor               |
| PATCH  | /api/admin/products/:id     | `{available:boolean, stock:integer, salePrice:integer | null}`, somente gestor |

Exemplo de criação (POST):

```json
{
  "name": "Ana",
  "items": [
    { "productId": "00000000-0000-4000-8000-000000000001", "quantity": 2 }
  ],
  "paymentMethod": "pix",
  "notes": "Sem azeitona",
  "scheduledAt": "2026-10-28T15:00:00.000Z"
}
```

`scheduledAt` é opcional e deve estar em UTC ISO 8601. Resposta 201: `{id, token, total}`. Não envie preços ou total. Máximo de 30 linhas, 20 unidades por produto; IDs repetidos são rejeitados. `verocard` é reconhecido, mas bloqueado até contratação. 400 para formato inválido, 401/403 para acesso, 404 para inexistente, 409 para conflito de regra e 429 para limite de requisições.
