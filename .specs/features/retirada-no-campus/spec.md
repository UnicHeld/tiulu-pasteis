# Pedido antecipado para retirada no campus

## Objetivo

Restaurar pedidos preparados antes da chegada para alunos que querem passar e retirar com
rapidez. Substitui o fluxo de novos pré-pedidos de [pedido no balcão](../pedido-no-balcao/spec.md),
preservando catálogo, histórico e compatibilidade dos registros antigos.

## Regras e aceite

- Cardápio público; envio exige login Google e aceite de retirada pessoal.
- Tiulu nos fundos da ASTAIBILCE, no IBILCE/UNESP de São José do Rio Preto, conforme usuário.
- Envio exige `location: {latitude, longitude, accuracy, timestamp}`. Schema inválido retorna 400.
  A API valida idade máxima de 120 segundos, futuro de até 10 segundos, precisão positiva de
  até 100 metros e círculo de precisão inteiro dentro do contorno do campus. Falhas retornam 403.
- Polígono OSM way 228464680, versão 13, consultado em 28/10/2026. Exige homologação local.
  Coordenadas do navegador podem ser falsificadas; não comprovam presença ou vínculo institucional.
- Sem localização válida, negar envio e preservar sacola. Não persistir coordenadas ou rastrear.
- Pedido nasce em `received`, reserva estoque com locks por ID na transação de pedido/itens/evento,
  `confirmed_at` na criação e `expires_at=null`. Até três ativos por conta, incluindo legados.
- Gestor inicia preparo sem exigir presença ou pagamento. Entrega exige pagamento confirmado.
- Pagamento continua presencial por Pix/cartão; QR identifica o pedido opcionalmente na retirada.
- Cancelar `received` repõe a reserva uma única vez. Não expirar pedidos novos nem cancelar preparo.
- Legados `awaiting_arrival` preservam expiração, confirmação presencial e reserva nesse momento.
- Migrações anteriores permanecem imutáveis. Nova 003 corrige apenas descrições do catálogo.

## Fora de escopo

Checkout online, prova antifraude de presença, vínculo institucional, entrega, alterações em
produção, novas regras de agendamento e marcador preciso do balcão.

## Plano

1. Restaurar criação com reserva e preparo antecipado, mantendo compatibilidade dos legados.
2. Aplicar georrestrição no domínio/API e obter posição recente no envio da sacola.
3. Atualizar textos, contratos e decisão proposta; executar validações proporcionais.

## Fontes e validação

Fontes geográficas e limitações: [fluxo de pedidos](../../../docs/arquitetura/fluxo-de-pedidos.md).
Evidências atuais: [validação da implementação](validation.md).
