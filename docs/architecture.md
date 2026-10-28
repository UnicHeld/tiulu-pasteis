# Arquitetura e decisões

## Organização

- `src/domain`: regras puras, tipos e validação Zod; sem dependência de React ou PostgreSQL.
- `src/server`: adaptador HTTP, autenticação, SQL parametrizado e transações.
- `src/client`: interface React, estado de sacola em memória e consultas HTTP.
- `db`: esquema e catálogo inicial, aplicados em transação sob advisory lock.
- `tests`: testes unitários e de proteção HTTP.

A escolha de TypeScript nas duas camadas reduz custo de manutenção. Fastify fornece servidor HTTP e limitações de carga; Zod valida toda entrada manipulada; pg fornece acesso explícito ao PostgreSQL; Lucide mantém ícones consistentes. Não há necessidade de NoSQL: pedidos, estoque, contas e sessões têm relações e exigem atomicidade.

## Fluxo do pedido

Cliente envia somente IDs, quantidades, nome, observações e opção de retirada/pagamento. API valida horário local, bloqueia produtos em ordem de ID para reduzir deadlocks, calcula total pelo catálogo, insere pedido/itens/evento e baixa estoque na mesma transação. O token anônimo é retornado uma vez e armazenado como hash no banco. O servidor consulta pedido pelo hash e nunca lista pedidos de terceiros para alunos.

Estados: `received → preparing → ready → completed`; cancelamento apenas em `received`. Entrega exige pagamento confirmado. Cancelamento repõe estoque na mesma transação. Histórico do produto/preço é preservado em `order_items`. Fidelidade é calculada a partir de pedidos pagos/entregues, sem saldo mutável sujeito a crédito duplicado.

## Segurança

Cookies HttpOnly, SameSite=Lax e Secure em produção. Mutações exigem Origin idêntica a APP_ORIGIN, mitigando CSRF; clientes de API também devem enviar esse cabeçalho. OAuth com state aleatório e userinfo obtido do Google usando token recebido diretamente no servidor; e-mail deve estar verificado. Gestores autorizados no servidor. Senha de bootstrap é comparada por hashes de tamanho constante, nunca persistida no banco; limitação de tentativas por IP. Rate limiting é local ao processo: múltiplas réplicas exigem um armazenamento compartilhado.

SQL parametrizado; HTML textual escapado pelo React. Logs ocultam cookies e authorization; códigos de acompanhamento não devem aparecer em logs de acesso do proxy. O serializador de logs do servidor oculta o token da rota de acompanhamento e remove query strings, incluindo códigos OAuth. Sessões e códigos precisam de proteção de acesso e backup. O código anônimo é uma credencial de leitura: quem o possui vê nome e itens daquele pedido. Não compartilhe publicamente.

## Limitações e evolução

Horários e produtos iniciais são dados exemplificativos, não informações comerciais verificadas. O painel altera estoque/disponibilidade, sem cadastro de novos produtos. Pagamentos online e resgates de fidelidade precisam de integração e regras comerciais. Sem idempotência de criação: se a resposta se perder após envio, recuperar por histórico autenticado ou conferir no balcão antes de reenviar. Adicionar chave de idempotência antes de operação com alto volume. Reservas reduzem estoque no momento do pedido, inclusive agendados; pedidos abandonados exigem cancelamento manual. Não há reembolso automático. Indicadores do painel são limitados aos últimos 100 pedidos, não substituem relatório financeiro.

Para evolução: migrações incrementais versionadas (a inicial é idempotente), checkout com webhook e reconciliação, trilha de auditoria por gestor, política de retenção de dados, ampliação dos testes de concorrência e testes de navegador com acessibilidade. Não escalar horizontalmente sem rever sessões operacionais e rate limiting. Limitar backup e retenção conforme operação.
