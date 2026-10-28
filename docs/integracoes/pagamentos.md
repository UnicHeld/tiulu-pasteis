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
