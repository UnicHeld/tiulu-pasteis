# Categorias do catálogo e combo em destaque

## Objetivo

Organizar o catálogo real e destacar primeiro a promoção pastel + refrigerante de 200 ml.
Preservar pedidos, estoques e preços avulsos existentes.

## Regras confirmadas

- Categorias: Pastéis, Salgados, Mini pizza, Doces e Bebidas; Promoções é o primeiro filtro.
- Pastéis salgados ficam em Pastéis, com tamanho selecionável; Doces contém somente chocolate
  e queijo com goiabada, ambos grande (R$ 14) e pequeno (R$ 8), seguindo os preços dos pastéis.
- Salgados: kibe, empada, coxinha e espetinho de frango, R$ 8 cada.
- Mini pizzas de presunto e mussarela, calabresa e personalizada, todas R$ 8 e com molho de tomate.
- Personalizada permite até três ingredientes distintos, sem adicional. Opções dos recheios
  conhecidos: carne, queijo, frango, catupiry, palmito, presunto, mussarela, chocolate e goiabada.
  Não inventar composição dos três queijos. Escolha vale para todas as unidades da mesma
  personalizada na sacola; a interface informa essa regra. Zero extras mantém somente o molho.
- Combo grande R$ 15; pequeno R$ 10. Qualquer sabor, inclusive doce, com Coca-Cola ou Guaraná
  de 200 ml. Elegibilidade é explícita no catálogo, nunca inferida de payload, categoria ou nome.
- Experiência atual: aplicação abre em Promoções; combo aparece exclusivamente nessa aba,
  com foto e texto de campanha. Selecionar abre a sacola; tamanho, sabor e refri ficam ali.
  Desconto segue automático também em adição avulsa. Detalhes na
  [spec de experiência](../experiencia-do-cardapio/spec.md).
- Parear maior economia primeiro; preço final nunca supera a soma avulsa, inclusive sale_price.
- API valida entrada, ingredientes, preços e estoque. Reserva de componentes, pedido, itens,
  snapshot de desconto e evento ficam na mesma transação. Cliente não envia desconto/preço.
- Histórico mantém preços unitários avulsos, desconto total e ingredientes legíveis; total é
  subtotal dos itens menos desconto. Legados ganham desconto zero; não recalcular pedidos antigos.
- Cancelamento antes do preparo repõe cada componente uma única vez, sem estoque de combo separado.
- Novos produtos começam com estoque zero. Não apagar pedidos, editar migrações anteriores ou
  alterar dados de produção. Sem novas dependências ou integrações externas.

## Desenho

Metadados de elegibilidade em `products`; `orders.discount_total` preserva desconto do pedido,
e `order_items.ingredients` preserva os nomes escolhidos. Uma linha por produto mantém a PK e
reposição existentes. Desconto em coluna do pedido evita médias unitárias fracionárias quando
apenas parte da quantidade integra combo. Escolha local da feature, sem mudança entre camadas.

## Plano e aceite

1. Filtros, ordem e migrações incrementais de catálogo/metadata/snapshots.
2. Regra pura de preço compartilhada; validação e persistência autoritativas na API.
3. Cartão de combo, personalização, sacola e histórico com desconto/ingredientes.
4. Testes de pares mistos, sobras, promoções, falta de componente, adulteração e ingredientes;
   PostgreSQL, qualidade e navegador real. Registrar [evidências](validation.md).
