# ADR-0003: Reservar pedidos para retirada no envio dentro do campus

- **Data**: 2026-10-28
- **Status**: Proposto
- **Decisores**: Responsável pelo estabelecimento
- **Aprovação**: Pendente
- **Escopo**: domínio, servidor, dados e cliente

## Contexto e problema

O usuário corrigiu a orientação anterior: alunos precisam pedir de dentro do IBILCE e retirar
rapidamente, com preparo antes da chegada. A proposta do ADR-0002 aguardava confirmação no balcão,
o que eliminava esse benefício. Login e geolocalização passam a ser requisitos no envio.

## Drivers da decisão

- Antecipar preparo e garantir disponibilidade no envio.
- Limitar criação à área do campus, preservando autenticação e autoridade da API.
- Preservar pedidos, catálogo e compatibilidade com pré-pedidos existentes.

## Opções consideradas

1. **Confirmar no balcão**: reduz abandono e desperdício, mas exige espera após chegar.
2. **Reservar no envio autenticado no campus**: antecipa preparo; ausência ainda pode gerar desperdício.

## Decisão

Novos pedidos nascem em `received`, com estoque reservado, sem expiração automática e com fila
por envio. A API valida sessão, localização recente no polígono do IBILCE e limite de três pedidos
ativos por conta. O gestor começa o preparo antes da chegada; pagamento permanece presencial,
obrigatório antes da entrega. QR identifica o pedido na retirada e não libera preparo.

Localização é solicitada uma vez por envio, não armazenada nem registrada em logs. Usar o
contorno OSM do campus em vez de raio ao redor da loja; área de incerteza deve caber no contorno.
A indicação do Tiulu nos fundos da ASTAIBILCE vem do usuário, sem coordenada precisa da loja.

## Consequências

### Positivas

- Cliente acompanha o preparo e pode chegar para retirar o pedido pronto.
- Estoque é reservado atomicamente, com cancelamento antes do preparo repondo uma única vez.
- Sem dependência de mapas externos durante criação e sem persistência de coordenadas pessoais.

### Negativas

- Geolocalização pode ser falsificada; login não comprova vínculo institucional.
- Permissão negada, precisão ruim e proximidade do muro podem impedir pedidos legítimos.
- Contorno colaborativo precisa de homologação local; ausentes podem desperdiçar alimento.
- Cliente precisa de HTTPS e localização disponível; pagamento no balcão ainda pode gerar espera.

## Regras para quem implementa

- Login e georrestrição são validados na API, sem exceção de localização para gestor.
- Localização: idade até 120 segundos, futuro até 10 segundos, precisão até 100 metros,
  posição interna com distância mínima ao contorno maior ou igual à precisão informada.
- Reserva, itens e evento ficam na mesma transação; bloquear produtos em ordem de ID.
- Preservar expiração e confirmação de `awaiting_arrival` legados; não converter automaticamente.
- Não editar migrações aplicadas; a migração 003 corrige somente descrições do catálogo.
- Não registrar coordenadas, credenciais ou payload completo; não rastrear posição continuamente.

## Links

- [Proposta anterior ADR-0002](0002-reservar-estoque-na-confirmacao-presencial.md).
- [Especificação atual](../../.specs/features/retirada-no-campus/spec.md).
- [Fluxo de pedidos](../arquitetura/fluxo-de-pedidos.md).
- [Contorno OSM do IBILCE](https://www.openstreetmap.org/way/228464680).
