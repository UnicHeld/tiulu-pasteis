# Tiulu Pastéis

Aplicação web responsiva com PWA para pedidos de retirada em uma pastelaria universitária. React + TypeScript + Vite, API Fastify e PostgreSQL. Sem assinatura ou mensalidade. Monólito modular para uma única loja, pronto para evoluir sem a complexidade operacional de microsserviços.

## Executar localmente

Requisitos: Node.js 22+, npm e PostgreSQL 17 (ou Docker).

```sh
cp .env.example .env
npm ci
# Configure DATABASE_URL no .env para um PostgreSQL local.
# Os comandos abaixo carregam o arquivo sem colocá-lo no código.
node --env-file=.env --import tsx src/server/migrate.ts
node --env-file=.env node_modules/concurrently/dist/bin/concurrently.js "tsx watch src/server/index.ts" "vite --host 0.0.0.0"
```

Abra http://localhost:5173. O Vite encaminha `/api` ao servidor na porta 3000. `.env` não é versionado. Nunca use prefixo `VITE_` para segredos. Os dados do catálogo são exemplos; preços, horários e disponibilidade precisam de revisão do estabelecimento.

## Recursos implementados

- Cardápio com busca, categorias, mais pedidos editoriais, preço, disponibilidade, estoque e promoções por produto (preço promocional definido pelo gestor).
- Sacola e pedido sem cadastro; retirada imediata durante o expediente ou agendada entre 15 minutos e 7 dias, de segunda a sexta, 9h–21h, America/Sao_Paulo.
- Total recalculado no servidor, estoque com bloqueio transacional, cancelamento com reposição e transições controladas.
- Acompanhamento com código secreto de 256 bits, guardado neste navegador; consulta automática a cada 10 segundos. Copie o código para usar em outro aparelho.
- Painel autenticado: lista dos últimos 100 pedidos, itens, observações, indicadores desse conjunto, confirmação de pagamento, transições e ajuste de estoque/disponibilidade.
- OAuth Google com cookie de sessão HttpOnly; histórico de pedidos feitos enquanto autenticado. Contagem de fidelidade por pedidos pagos e entregues.
- Manifest, ícone SVG e service worker com página offline. Pedidos nunca são enfileirados offline, evitando duplicidade. Instalação depende do navegador e de HTTPS (ou localhost); validar em aparelhos reais.

## Autenticação

Configure um cliente OAuth Web no Google Cloud, com redirecionamento exato `APP_ORIGIN/api/auth/google/callback`. Preencha `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`. Use `ADMIN_EMAILS` com e-mails verificados separados por vírgula para autorizar gestores. As permissões ficam na sessão por até 7 dias; ao revogar um gestor, remova suas sessões no banco imediatamente.

Opcionalmente configure `ADMIN_PASSWORD` aleatória com ao menos 16 caracteres para a gestão inicial. Prefira contas Google individuais na operação. Sessões expiram em 7 dias. Linhas expiradas podem ser removidas periodicamente (`DELETE FROM sessions WHERE expires_at < now()`).

## Pagamentos e limites desta versão

**Não há cobrança online nesta versão.** Pix e cartão indicam pagamento presencial no balcão; o pedido permanece pendente até confirmação manual pelo gestor. Não coletamos dados de cartão, não geramos QR Pix e não aprovamos pagamentos automaticamente.

Uma integração futura pode usar checkout hospedado, por exemplo [Mercado Pago Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/overview), com reconciliação e webhook autenticado/idempotente. Não confirme pagamento por retorno do navegador. Verocard está bloqueado na API: a aceitação exige confirmação comercial com a operadora e com o adquirente. Não foi encontrada documentação pública suficiente para implementar essa integração com segurança.

A fidelidade conta compras autenticadas pagas/entregues. Resgate, descontos e regras de recompensa **não estão implementados**. CRUD completo de produtos e configuração de horários pelo painel ficam como evolução; a interface não anuncia descontos fictícios. Não há recuperação de pedidos anônimos sem seu código, notificações externas ou associação retroativa de pedidos a contas.

## Qualidade

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Para testes com banco, use um banco **isolado**, aplique a migração e execute `RUN_DB_TESTS=1 DATABASE_URL=postgres://... npm test`. A suíte modifica estoque e cria pedidos; nunca execute contra produção.

Testes de domínio cobrem preços, estoque, quantidades, duplicação, agendamento e estados; testes HTTP cobrem validação, origem e autorização sem banco. Consulte [arquitetura](docs/architecture.md), [API](docs/api.md) e [operação](docs/deployment.md).
