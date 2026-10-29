# Contratos de integração e API

JSON, mesma origem. Mutações exigem `Origin: APP_ORIGIN`. Valores monetários em centavos. Erros: `{ "error": "mensagem" }`. Sessão por cookie HttpOnly.

| Método | Rota                        | Acesso / comportamento                                                          |
| ------ | --------------------------- | ------------------------------------------------------------------------------- |
| GET    | /api/health                 | Verifica banco                                                                  |
| GET    | /api/menu                   | Catálogo e informações da loja                                                  |
| GET    | /api/me                     | Sessão e contagem de compras                                                    |
| GET    | /api/auth/google            | Inicia OAuth                                                                    |
| GET    | /api/auth/google/callback   | Troca código e cria sessão                                                      |
| POST   | /api/auth/admin             | Senha de gestão, limitado a 5 tentativas/15min                                  |
| POST   | /api/auth/logout            | Encerra sessão atual                                                            |
| POST   | /api/orders                 | Cria pedido, exige login, localização no campus e aceite de retirada            |
| GET    | /api/orders/track/:token    | Pedido e eventos; token secreto de 64 caracteres hex                            |
| GET    | /api/orders                 | Histórico do aluno ou últimos 100 pedidos para gestor                           |
| GET    | /api/orders/:id             | Detalhes, itens e eventos; somente titular ou gestor                            |
| GET    | /api/admin/orders/:id/items | Itens, somente gestor                                                           |
| PATCH  | /api/admin/orders/:id       | `{status?, paid?:true}`, somente gestor                                         |
| PATCH  | /api/admin/products/:id     | `{available:boolean, stock:integer, salePrice:integer \| null}`, somente gestor |

Exemplo de criação (POST):

```json
{
  "name": "Ana",
  "items": [
    { "productId": "10000000-0000-4000-8000-000000000001", "quantity": 2 }
  ],
  "paymentMethod": "pix",
  "notes": "",
  "pickupAccepted": true,
  "location": {
    "latitude": -20.7855,
    "longitude": -49.3585,
    "accuracy": 10,
    "timestamp": 1793203200000
  }
}
```

Novos pedidos rejeitam `scheduledAt` e exigem `pickupAccepted: true` e `location`.
O `timestamp` do exemplo é ilustrativo: o cliente deve enviar a posição obtida no momento.
Latitude/longitude precisam ser finitas e estar nos limites geográficos; `accuracy` deve ser
positiva. Schema inválido retorna 400. Localização com mais de 120 segundos, mais de 10 segundos
no futuro, precisão acima de 100 metros ou círculo de precisão fora do campus retorna 403.
A regra e as fontes do contorno estão no [fluxo de pedidos](fluxo-de-pedidos.md).

Resposta 201: `{id, token, total, status: "received"}`. A criação reserva estoque atomicamente,
registra `confirmed_at` e não define expiração. Não envie preços ou total. Até 30 linhas/20 unidades
por produto, sem IDs repetidos. Até três pedidos ativos por conta, incluindo pré-pedidos legados.
A localização não integra a resposta, o histórico ou a persistência.

`PATCH /api/admin/orders/:id` com `{status: "preparing"}` inicia o preparo de um pedido
`received`, sem presença ou pagamento antecipado. `{paid:true}` confirma recebimento presencial;
`completed` exige pagamento confirmado. Cancelar `received` repõe a reserva uma única vez.

Pré-pedidos antigos em `awaiting_arrival` preservam a confirmação com
`{status: "preparing", paid: true}`, que confere presença/pagamento e reserva estoque
atomicamente. Expiração permanece automática nesses pedidos; cliente não fornece `expired`.
Ler QR apenas abre detalhes autorizados e não executa mutação. Detalhe de outro titular retorna 404.

`verocard` reconhecido, mas bloqueado. 400 para formato inválido, 401/403 para acesso,
404 para inexistente, 409 para regra e 429 para limite de requisições.

## Combo e personalização

`GET /api/menu` inclui `promotion.comboPrices` (centavos), `pizzaIngredients` e metadados
`combo_size`, `combo_drink`, `customizable` nos produtos. A promoção usa componentes da sacola,
sem produto de combo separado. Cada par elegível custa até R$ 15 (grande) ou R$ 10 (pequeno),
respeitando preço avulso menor e priorizando a maior economia quando faltam refrigerantes.

Cada item de `POST /api/orders` aceita `ingredients?: string[]` (padrão `[]`), até três IDs
distintos da lista de ingredientes publicada. Apenas `customizable=true` aceita extras;
produto comum com extras retorna 409; formato, excesso ou IDs desconhecidos retornam 400.
Exemplo: `{"productId":"10000000-0000-4000-8000-000000000037","quantity":1,"ingredients":["carne","queijo","palmito"]}`.
Não enviar preço, total ou desconto: campos de valor enviados são ignorados pelo servidor.

Histórico, detalhes e acompanhamento retornam `discount_total` e `items[].ingredients`,
com nomes preservados dos ingredientes. Preços unitários continuam avulsos; exibir subtotal,
desconto e total para manter os valores claros. Pedidos antigos retornam desconto zero.
