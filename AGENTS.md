# Tiulu Pastéis

Aplicação de pedidos para retirada, com React, TypeScript e Vite no cliente, Fastify na API e
PostgreSQL 17. O runtime é um monólito modular para uma única loja.

## Desenvolvimento

Este arquivo é a fonte canônica de regras para agentes de código. `.claude/`, `.codex/`,
`.agents/` e `.cursor/` mantêm somente adaptações, workflows e hooks das ferramentas.
Para revisão humana ou automatizada, ler também `REVIEW.md`.

- Comunicar em português brasileiro, com precisão e sem ocultar erros ou incerteza.
- Antes de editar, ler README, configurações relevantes e instruções do caminho; inspecionar
  estrutura, dependências e `git status`. Para mudanças multiarquivo, apresentar plano curto.
- Fazer a menor alteração completa; preservar mudanças locais não relacionadas.
- Usar npm e o `package-lock.json`; não instalar pacotes globalmente nem substituir a stack.
- Não adicionar dependência quando a biblioteca padrão ou as dependências existentes resolverem.
- Separar regras de negócio, apresentação e infraestrutura. Preferir nomes explícitos e evitar
  abstrações antecipadas. Comentários explicam intenção ou restrições.

### Ambiente e qualidade

Setup e alternativas Docker estão em `docs/operacao/configuracao-local.md`. Requisitos locais:
Node.js 22+, npm e PostgreSQL 17. Não ler, imprimir nem versionar `.env` ou credenciais.
`.env.example` documenta apenas nomes e valores fictícios.

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
python3 scripts/check-docs.py
python3 -m unittest discover -s tests/harness -p 'test_*.py'
npx --yes harness-score@1.6.5 . --min-level 4
```

- Executar formatador, lint, tipos e testes relevantes após implementação; build quando a
  mudança afetar produção. Para docs, conferir formatação, estrutura e links.
- Testes PostgreSQL modificam dados: usar somente banco isolado, nunca produção.
- Nunca afirmar que uma validação passou sem executar o comando até o fim com sucesso.
- Falta de ferramenta ou falha de infraestrutura deve constar no relatório.
- O CI executa qualidade, testes com banco, build, verificações documentais e harness L4.
  Harness score verifica estrutura; não comprova correção do produto nem segurança dos hooks.

### Notebook pessoal

`.notebook/` é contexto pessoal ignorado pelo Git e Docker. Quando o usuário citar suas notas,
ler `.notebook/INDEX.md` por caminho explícito. Código, `AGENTS.md` e docs prevalecem em conflito.
Escrever no notebook somente sob pedido e atualizar seu índice. Não promover conteúdo pessoal
automaticamente para arquivos versionados. Guia: `docs/processos/notebook-pessoal.md`.

## Arquitetura e contratos obrigatórios

Consultar `docs/README.md` e os capítulos de `docs/arquitetura/` antes de mudar contratos.

| Caminho       | Responsabilidade                                         |
| ------------- | -------------------------------------------------------- |
| `src/domain/` | regras puras, preços, quantidades, horários e transições |
| `src/server/` | HTTP, autenticação, autorização, SQL e transações        |
| `src/client/` | interface React, sacola e consultas HTTP                 |
| `db/`         | esquema e catálogo inicial                               |
| `public/`     | manifest, service worker, ícones e página offline        |
| `tests/`      | domínio, proteção HTTP, integração e harness             |

Invariantes de implementação:

- Preços, total, autorização e estoque são decididos no servidor; validar toda entrada externa.
- Domínio não importa React, Fastify ou PostgreSQL.
- SQL é parametrizado. Reserva, pedido, itens e evento ficam na mesma transação; bloquear
  produtos em ordem de ID. Cancelamento repõe estoque atomicamente.
- Preservar transições; entrega exige pagamento confirmado. Pix e cartão são pagos no balcão.
  Não anunciar checkout online, resgate de fidelidade ou Verocard como implementados.
- Sessão e código de acompanhamento são credenciais. Não expor hashes, cookies, códigos OAuth,
  tokens de acompanhamento, payloads completos ou dados pessoais em logs ou artefatos.
- Permissões de gestor e verificação de origem ficam na API. Cookies são HttpOnly e Secure em
  produção. OAuth exige state e e-mail verificado.
- Não armazenar respostas de API no service worker nem enfileirar pedidos offline.
- Não introduzir migração destrutiva ou alterar dados de produção sem autorização explícita.
- Variável nova exige atualização do exemplo, do código e da documentação relevante.

## Decisões arquiteturais (ADRs)

ADRs ficam em `docs/decisoes/NNNN-titulo.md`, com índice, status, escopo e paths regidos em
`docs/decisoes/README.md`. Processo e modelo estão em `docs/processos/registro-de-decisoes.md`
e `docs/decisoes/_modelo.md`.

- Antes de editar, cruzar paths com os ADRs `Aceito` e seguir suas regras para quem implementa.
- Diante de conflito, informar o ADR e a regra; mudança de decisão exige ADR novo que o supere.
- Corpo de ADR `Aceito`, `Rejeitado`, `Deprecado` ou `Supersedido` é imutável; só Status e Links
  mudam. Não remover registros históricos.
- Criar ADR para decisão difícil de reverter, padrão estrutural, fronteira entre camadas,
  dependência estrutural ou gate de CI. Decisão local de feature fica na spec ou no PR.
- Agentes escrevem ADR como `Proposto`; aprovação humana registrada define a aceitação.

## Desenvolvimento orientado a especificação

```text
ESPECIFICAR -> DESENHAR* -> TAREFAS* -> EXECUTAR
```

`spec-driven` dimensiona o fluxo. Features usam `.specs/features/<feature>/`; correções pequenas,
`.specs/quick/<id>-<slug>/`. Design e tarefas separados são opcionais conforme complexidade.
Antes de retomar trabalho, consultar `.specs/project/STATE.md`. Não inventar aprovação ou teste.

## Git e entrega

- Inspecionar `git status` antes e depois; adicionar apenas arquivos da tarefa.
- Commit, push, PR e deploy exigem pedido explícito; autorização existente na conversa vale
  para seu escopo, sem confirmação repetida.
- Usar Conventional Commits. Preservar a identidade Git do usuário; não adicionar autoria,
  coautoria ou assinatura de agente às mensagens ou documentos.
- Não alterar commits, reescrever histórico, fazer force push, `git reset --hard` ou
  `git clean -fd` sem autorização explícita.
- Não apagar bancos, volumes ou recursos; alterar credenciais/DNS; fazer deploy em produção;
  enviar e-mails, notificações ou pagamentos reais sem autorização explícita.
- Nunca executar validações contra integrações reais ou recursos de produção.

### Checklist ao concluir

1. Atualizar docs no mesmo trabalho quando comportamento, contrato, arquitetura, operação ou
   variáveis mudarem. Cada fato tem uma fonte principal; outras páginas apontam para ela.
2. Conferir ADRs aplicáveis, links e ausência de segredos, dados pessoais e artefatos locais.
3. Informar implementação, principais arquivos, validações executadas, falhas/omissões e riscos
   ou próximos passos. Status pendente de CI não é sucesso nem falha.
