# Validação do catálogo e dos combos

## Implementado

- 37 produtos: 18 variantes de nove sabores de pastel (14 Pastéis/4 Doces), quatro Salgados,
  três Mini pizzas e doze Bebidas. Migrações 004/005 incrementais; produtos novos começam sem estoque.
- Salgados e todas as mini pizzas por R$ 8; molho de tomate em todas as mini pizzas.
- Primeiro destaque em Todos/Promoções: pastel + refri 200 ml, grande R$ 15 e pequeno R$ 10.
- Desconto automático por componentes elegíveis, maior economia primeiro e menor preço avulso
  preservado. Estoque reservado na transação existente; cancelamento repõe componentes uma vez.
- Personalizada aceita até três ingredientes conhecidos e distintos. Escolha persistida na
  sacola e em snapshot legível no pedido; vale para todas as unidades desse produto na sacola.
- Histórico mostra subtotal, desconto e total sem recalcular pedidos antigos.

## Principais arquivos

`src/domain/catalog.ts`, `src/domain/orders.ts`, `src/server/app.ts`,
`src/client/ComboCard.tsx`, `src/client/MenuProductCard.tsx`, `src/client/main.tsx`,
`src/client/OrderDetails.tsx`, `src/client/styles.css`, `db/005_catalog_and_combos.sql`,
`tests/promotions.test.ts`, `tests/integration.test.ts`, README e capítulos de arquitetura.

## Verificações executadas

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`: exit 0. Na execução local,
  47 testes aprovados e 23 PostgreSQL omitidos; integração executada separadamente.
- `docker.exe compose -f compose.validation.yaml run --rm integration`: exit 0;
  70 testes aprovados, incluindo 23 PostgreSQL. Primeira execução antes dos oito novos testes
  puros de promoções passou com 62; a execução final incluiu todos os 70.
- `docker.exe compose -f compose.validation.yaml run --rm quality`: exit 0;
  formatação, lint, tipos, testes sem banco, build, docs e sete testes Python aprovados.
  Vite no Docker avisou de um chunk acima de 500 kB; build concluiu, sem alterar dependências.
- Revisão independente de cálculo, pareamento, ingredientes, snapshots, autorização e estoque,
  sem defeitos acionáveis identificados. Checklist React aplicado aos componentes novos.
- Chromium real com Playwright em contêiner isolado: exit 0, `COMBO_BROWSER_OK`.
  Host sem Chrome para MCP; reutilizado Chromium temporário já instalado no contêiner.

No navegador, com banco exclusivo criado para esta validação e sessões sintéticas:

- Promoção aparece antes da grade; cartão permite escolher tamanho, sabor e refri.
- Grande + pequeno + personalizada: subtotal R$ 38, desconto R$ 5, total R$ 33, conferidos
  na sacola, na resposta/API e diretamente no PostgreSQL.
- Salgados: quatro cartões de R$ 8. Mini pizzas: três opções de R$ 8 com molho de tomate.
- Três ingredientes bloqueiam o quarto, mas permitem desmarcar. Seleção e sacola preservadas
  após recarregar. Pedido preserva Carne, Queijo e Palmito e reserva duas unidades do refri.
- Viewport 390×844 sem overflow horizontal nem erros JavaScript.
- Screenshots sintéticas `/tmp/tiulu-combo-menu.png` e `/tmp/tiulu-combo-cart.png` copiadas
  do contêiner e inspecionadas visualmente.

Aplicação em execução: `GET http://localhost:5173/api/menu` conferido, com 37 produtos,
categorias corretas e preços dos combos 1500/1000 centavos.

## Limites

Sem chamadas OAuth ou cobrança reais, deploy, push, novas dependências, alteração de credenciais
ou produção. Testes usam bancos isolados. Novos produtos exigem estoque real na gestão; fixtures
dos testes não representam disponibilidade comercial. Banco exclusivo do navegador e recursos
locais mantidos, sem exclusão. A personalizada usa a mesma escolha em todas as unidades da linha.
