# Pedido confirmado no balcão

## Objetivo

Antecipar a escolha dos produtos, mantendo a fritura após a chegada do cliente.
Melhorar o histórico, gerar QR de apresentação e permitir leitura na PWA de gestão.

## Regras e aceite

- Cardápio público; criação exige conta Google autenticada e aceite de retirada pessoal.
- Pré-pedido começa em `awaiting_arrival`, sem baixa ou garantia de estoque. Expira após
  duas horas sem confirmação. Limite de três pré-pedidos ativos por conta.
- Cliente vê itens, total, pagamento, instruções, validade, estados e QR pelo histórico.
- QR contém somente `tiulu:order:<uuid>`; consulta exige sessão e autorização na API.
- Gestor lê QR com câmera ou informa o identificador; leitura apenas abre os detalhes.
- Confirmação de presença e pagamento reserva estoque e inicia preparo atomicamente.
  Fila segue confirmação, não o instante do pré-pedido. Repetição não duplica baixa.
- Cancelar/expirar pré-pedido não repõe estoque. Pedidos legados preservam sua reserva.
- Gestão acessível em `/gestao`, sem link público; API continua exigindo gestor.
- O catálogo contém oito sabores em dois tamanhos (R$ 14 e R$ 8) e as bebidas informadas.
- Migrações incrementais preservam pedidos e itens históricos. Catálogo novo não reseta
  estoques existentes em reaplicações.

## Pendências e limites

Pagamento online depende de provedor/conta e da política de reserva antes da chegada;
pergunta enviada ao usuário. Não simular pagamento nem habilitar cobrança real. Não há
coordenadas do campus para implementar georrestrição. Presença é confirmada no balcão.
Sem entregas, notificações externas, resgate de fidelidade ou alteração de produção.

## Plano

1. Domínio, migração incremental, catálogo e API transacional com autorização.
2. Histórico/detalhes, QR, leitor, gestão privada e nova sacola.
3. Testes reais de integração/concorrência, qualidade, navegador e documentação.
