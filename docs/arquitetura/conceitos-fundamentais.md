# Conceitos fundamentais

Aplicação responsiva com PWA para uma única pastelaria. O [glossário](../../CONTEXT.md)
fixa a terminologia. O cliente pede no campus para encontrar seu pedido pronto na retirada.

## Comportamento implementado

- Cardápio público com nove sabores de pastel, grande (R$ 14) ou pequeno (R$ 8), quatro
  salgados de R$ 8, três mini pizzas de R$ 8 e doze bebidas. Pastéis salgados ficam em Pastéis;
  chocolate e queijo com goiabada em Doces. Um cartão por sabor permite escolher tamanho,
  mantendo preços e estoques por variante. Novos produtos começam sem estoque.
- Aplicação abre em Promoções. O combo aparece somente nessa aba; Todos contém apenas avulsos.
  Cartão com foto abre a sacola com pastel e refri inclusos. Sabor, tamanho e bebida são editáveis
  ali; reabrir não duplica o combo, e adicionar outro é uma ação explícita.
- Promoção: pastel de qualquer sabor + Coca-Cola ou Guaraná de 200 ml,
  R$ 15 no grande e R$ 10 no pequeno. Desconto automático na sacola, pareando maior economia
  primeiro, sem aumentar uma soma avulsa já menor. Regras em `src/domain/catalog.ts`.
- Toda mini pizza leva molho de tomate. A personalizada aceita até três recheios distintos
  da lista apresentada, sem adicional; sabor e ingredientes são escolhidos na sacola, sem
  formulário na grade. A escolha vale para todas as unidades dessa pizza na sacola.
- Busca, categorias, destaques, promoções, estoque e disponibilidade.
- Sacola preservada no aparelho durante login; criar pedido exige conta Google, localização
  recente dentro do campus IBILCE e aceite de retirada pessoal, sem entrega ou motofrete.
  Expediente: segunda a sexta, 9h–21h, São Paulo.
- Pedido em `received` com reserva imediata e atômica de estoque; até três ativos por conta.
  O gestor pode preparar antes da chegada, sem aguardar confirmação de presença ou pagamento.
- Total calculado no servidor em centavos, até 30 linhas/20 unidades por produto, sem duplicatas.
- Histórico com itens, total, pagamento, detalhes, etapas, eventos e QR opcional para identificar
  o pedido na retirada. Atualização a cada dez segundos. O QR não comprova pagamento.
- Gestão em `/gestao`, sem link público. Leitor de QR por câmera e busca manual, detalhes,
  estados, pagamento e estoque. Entrega exige pagamento confirmado.
- Acompanhamento antigo por código secreto continua disponível para pedidos legados, após
  consulta explícita. Código salvo não dispara consulta ao abrir o site; resposta 404 remove
  a referência local inválida e encerra as tentativas, sem apagar pedidos do servidor.
- Fidelidade conta pedidos pagos e retirados. PWA com página offline, sem criação de pedidos offline.
- Tiulu nos fundos da ASTAIBILCE, conforme indicação do responsável.

## Limites atuais

- Pagamento presencial por Pix ou cartão; não há checkout online, QR Pix, webhook ou reembolso.
- Verocard bloqueado; fidelidade sem resgate/recompensas.
- Login não comprova vínculo institucional e localização do navegador pode ser falsificada.
  A posição é usada somente no envio e não é persistida. O contorno OSM requer homologação
  no campus; posições imprecisas ou próximas das bordas podem impedir o envio.
- Retirada pessoal depende da conferência do atendente. QR pode ser compartilhado.
- Sem CRUD completo de produtos ou ajuste de expediente no painel.
- Criação não idempotente; conferir histórico antes de reenviar após perda de conexão.
- Pedidos novos não expiram. Pré-pedidos antigos conservam expiração e confirmação no balcão;
  pedidos legados preservam suas reservas e agendamentos originais.
- Sem notificações externas ou relatório financeiro completo. Validar câmera/PWA em aparelhos reais.

[Fluxo de pedidos](fluxo-de-pedidos.md) detalha localização, estados e compatibilidade;
[pagamentos](../integracoes/pagamentos.md) detalha o recebimento presencial.

Fotos reais de referência são ilustrativas, não fotos da loja. Fontes, licenças e limites de
representação: [imagens do cardápio](../integracoes/imagens-do-cardapio.md).
