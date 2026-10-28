# Conceitos fundamentais

Aplicação web responsiva com PWA para pedidos de retirada de uma única loja. O
[glossário](../../CONTEXT.md) fixa a terminologia. Produtos e horários iniciais são exemplos e
precisam de revisão do estabelecimento.

## Comportamento implementado

- Cardápio com busca, categorias, destaques editoriais, estoque e disponibilidade.
- Promoção por produto: gestor define preço positivo e menor que o normal.
- Sacola e pedido sem cadastro; retirada imediata durante o expediente ou agendada de
  15 minutos a 7 dias. Expediente: segunda a sexta, 9h–21h, `America/Sao_Paulo`.
- Total em centavos recalculado pelo servidor. Máximo de 30 linhas e 20 unidades por produto;
  IDs repetidos são rejeitados.
- Acompanhamento por código secreto de 256 bits, guardado no navegador, com consulta a cada
  10 segundos. O código é necessário para acompanhar em outro aparelho.
- Painel autenticado com os últimos 100 pedidos, itens, observações, indicadores desse conjunto,
  confirmação de pagamento e ajuste de estoque/disponibilidade.
- Login Google, histórico dos pedidos feitos autenticado e contagem de fidelidade.
- PWA com manifest, ícones e página offline. Não cria pedidos offline.

## Limites atuais

- Pix e cartão são indicações de pagamento presencial, pendente até confirmação do gestor.
- Verocard está bloqueado; não há cobrança online, QR Pix ou aprovação automática.
- Fidelidade conta pedidos autenticados pagos e entregues; resgate e recompensas não existem.
- Não há CRUD completo de produtos nem ajuste de expediente pelo painel.
- Não há recuperação de pedido anônimo sem código nem associação retroativa a uma conta.
- Criação não é idempotente: resposta perdida exige conferência antes de reenviar.
- Pedidos agendados reservam estoque imediatamente; abandonados exigem cancelamento manual.
- Não há notificações externas, reembolso automático ou relatório financeiro completo.
- Instalação da PWA depende do navegador e de HTTPS ou localhost; validar em aparelhos reais.

Fontes: `src/domain/`, `src/server/app.ts`, `src/client/main.tsx` e `public/sw.js`.
