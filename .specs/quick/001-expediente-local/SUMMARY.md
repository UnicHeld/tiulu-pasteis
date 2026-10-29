# Resultado

`ALLOW_OUT_OF_HOURS_ORDERS=1` libera o expediente somente com `NODE_ENV=development`.
Agendamentos mantêm antecedência de 15 minutos a 7 dias. Opção documentada no exemplo de
ambiente e na configuração local; servidor reiniciado com a opção ativa.

## Validação executada

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`: exit code 0.
- Testes: 24 aprovados e 9 de integração PostgreSQL pulados por configuração.
- Prettier nos arquivos TypeScript e Markdown alterados, `python3 scripts/check-docs.py`
  e `git diff --check`: aprovados.
- Primeiro comando do Prettier incluiu `.env.example` e retornou 2 por ausência de parser;
  repetição apenas com formatos suportados passou.
- API local com banco Docker isolado: pedido imediato fora do expediente retornou 201;
  acompanhamento retornou 200, estado `received` e total de R$ 9,00.
  Um pedido de exemplo foi mantido no banco local, consumindo uma unidade de Carne da casa.

## Limitações

Suíte completa de integração e Compose de qualidade não executados nesta alteração.
Verificação visual indisponível: Chrome do Playwright ausente na sessão.
Produção e ambientes sem ativação explícita continuam validando o expediente.
