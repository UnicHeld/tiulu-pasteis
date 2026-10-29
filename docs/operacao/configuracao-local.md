# Configuração local

## Node.js

Requisitos: Node.js 22+, npm e PostgreSQL 17 em banco local isolado.

```bash
cp .env.example .env
npm ci
```

Configure `.env` localmente sem versionar seu conteúdo. Aponte `DATABASE_URL` para o banco de
desenvolvimento. Comandos carregam o arquivo explicitamente:

```bash
node --env-file=.env --import tsx src/server/migrate.ts
node --env-file=.env node_modules/concurrently/dist/bin/concurrently.js "tsx watch src/server/index.ts" "vite --host 0.0.0.0"
```

Abra `http://localhost:5173`; `/api` é encaminhada à porta 3000. `npm run dev` usa variáveis
já exportadas, sem carregar `.env` automaticamente no servidor.

Para testar pedidos fora do expediente, inicie a API com `NODE_ENV=development` e
`ALLOW_OUT_OF_HOURS_ORDERS=1`. A opção libera noites e fins de semana somente em desenvolvimento,
inclusive na confirmação presencial. Novos pedidos não aceitam agendamento. Remova a opção ou
defina `0` e reinicie a API para restaurar o expediente normal.

Configure Google OAuth para registrar novos pedidos. Para operar estoque e ler QR, abra
`/gestao` diretamente; essa área não tem link na navegação pública. Depois da migração,
os novos produtos têm estoque zero: informe a disponibilidade real antes de testar compras.

## Docker

Para validação sem Node.js no host:

```bash
docker compose -f compose.validation.yaml run --rm quality
docker compose -f compose.validation.yaml run --rm integration
docker compose -f compose.validation.yaml run --rm harness
```

A configuração é isolada do Compose operacional, usa credenciais fictícias e PostgreSQL efêmero
em tmpfs. Não lê `.env` nem usa o volume de dados da aplicação. A imagem de validação roda
`npm ci` a partir do lockfile. Depois de alterar dependências ou Dockerfile, use `--build`.

## Variáveis

| Variável                                   | Uso                                                      |
| ------------------------------------------ | -------------------------------------------------------- |
| `DATABASE_URL`                             | conexão PostgreSQL da API e migração                     |
| `APP_ORIGIN`                               | origem exata da interface, sem barra final               |
| `PORT`                                     | porta HTTP, padrão 3000                                  |
| `NODE_ENV`                                 | `production` habilita cookie Secure e assets compilados  |
| `ALLOW_OUT_OF_HOURS_ORDERS`                | `1` libera expediente somente com `NODE_ENV=development` |
| `ADMIN_EMAILS`                             | e-mails verificados dos gestores, separados por vírgula  |
| `ADMIN_PASSWORD`                           | senha opcional de bootstrap, no mínimo 16 caracteres     |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | cliente OAuth Web                                        |
| `POSTGRES_PASSWORD`                        | senha usada pelo Compose operacional                     |
| `RUN_DB_TESTS`                             | `1` habilita testes que modificam o banco isolado        |

Nunca prefixar segredo com `VITE_`. Exemplo de nomes: `.env.example`; valores reais ficam fora
do repositório. Para operação com TLS, seguir [implantação](implantacao.md).
