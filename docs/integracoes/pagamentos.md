# Pagamentos

Pix e cartão indicam **pagamento presencial no balcão**. Pedido nasce pendente e o gestor confirma
o recebimento. Não há cobrança online, coleta de cartão, QR Pix ou confirmação automática.

Verocard é reconhecido e rejeitado pela API até confirmação comercial com a operadora e o
adquirente. Não anunciar aceitação. Não há reembolso automático.

Integração futura deve usar checkout hospedado, webhook autenticado e idempotente e reconciliação.
Retorno do navegador não comprova pagamento. A escolha de provedor depende de contratação,
requisitos e revisão da documentação oficial na implementação.

Fidelidade é contagem de pedidos autenticados pagos e entregues; resgate, descontos e recompensas
precisam de regras comerciais e implementação próprias.

## Confirmação presencial

Novos pedidos reservam estoque no envio e podem entrar em preparo antes da chegada ou do
pagamento. O gestor confere o recebimento presencial e marca o pagamento; a entrega só é
permitida após essa confirmação. Reserva e pagamento não representam o mesmo fato.

O QR de identificação é opcional na retirada e nunca representa QR Pix ou confirmação financeira.
Pré-pedidos legados em `awaiting_arrival` conservam a confirmação conjunta de presença,
pagamento e preparo, com reserva atômica nesse momento.

Pagamento online continua sem integração. Uma implementação futura exige escolha de
provedor/conta e política explícita de reserva, cancelamento e reembolso; não anunciar cobrança
online enquanto não estiver implementada e homologada.
