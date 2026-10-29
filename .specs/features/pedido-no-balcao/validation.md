# Validação

## Implementação

- Pré-pedido autenticado, aceite de retirada, validade de duas horas e limite por conta.
- Confirmação presencial com pagamento, reserva e preparo atômicos; compatibilidade legada.
- Histórico/detalhes com itens, etapas, pagamento, validade e QR sem dados pessoais.
- Leitor de QR por câmera, consulta manual e gestão sem link público em `/gestao`.
- Catálogo de 28 produtos e migrações incrementais registradas.
- ADR-0002 registrado como Proposto; nenhuma aprovação formal presumida.

## Verificações executadas

- `npm run format:check`: aprovado; conferência final também executada no serviço quality.
- `npm run lint`, `npm run typecheck`, `npm run build`: aprovados após ajustes de interface.
- `docker compose -f compose.validation.yaml run --build --rm quality`: aprovado (exit code 0),
  incluindo formatação, lint, tipos, testes sem banco, build, links/docs e sete testes de harness.
- `npm test`: 27 aprovados; suíte PostgreSQL omitida nesse comando conforme configuração.
- `docker compose -f compose.validation.yaml run --build --rm integration`: primeira execução
  expôs erro de tipos na fixture SQL de usuário; corrigido separando os parâmetros.
- `docker compose -f compose.validation.yaml run --rm integration`: 42 testes aprovados,
  incluindo 15 de PostgreSQL. Reexecução expôs dependência do estado de disponibilidade
  deixado pela fixture anterior; corrigida e reexecutada com 42 aprovados.
- Reaplicação de `src/server/migrate.ts` no banco isolado: catálogo, estoque e disponibilidade
  preservados; duas migrações registradas.
- `python3 scripts/check-docs.py`: aprovado.
- `python3 -m unittest discover -s tests/harness -p 'test_*.py'`: sete aprovados.
- `git diff --check`: aprovado.
- Revisão independente de autorização, estoque, expiração e efeitos React; corrigida a
  reabertura dos detalhes do mesmo pedido, sem achados acionáveis restantes na revisão.

## Navegador

Playwright MCP bloqueado por ausência de Chrome. Instalação do Chrome exigiu sudo indisponível.
Chromium temporário baixado em `/tmp`; bibliotecas nativas ausentes no host exigiram contêiner
temporário, sem recursos de produção. Script Playwright temporário concluído com exit code 0.
Fixtures de sessão são sintéticas; OAuth real e cobrança real não foram chamados.

Verificado em navegador real, contra a API e o PostgreSQL isolados:

- Visitante sem link de gestão e com login exigido na sacola.
- Cliente em viewport 390×844: registro, QR gerado, ausência de overflow horizontal,
  reabertura imediata de detalhes e histórico finalizado após retirada.
- Gestor: QR decodificado pelo leitor usando vídeo sintético; leitura não altera estado;
  confirmação explícita de presença/pagamento, preparo, pronto e retirada persistidos.
- Sem erros JavaScript. Screenshots inspecionadas; QR reposicionado para aparecer inteiro
  antes dos itens e das etapas no celular. QR omitido dos detalhes do gestor.
- Artefatos temporários em `/tmp/tiulu-browser-artifacts/`, com dados sintéticos.

As tentativas iniciais expuseram limitações ambientais e seletores ambíguos do script de
validação. A imagem do vídeo sintético precisava de namespace SVG na serialização; corrigido
no teste. A execução final passou; câmera física não foi testada.

## Pendências

- Pagamento online: usuário precisa indicar provedor/conta e política de reserva antecipada.
  Nenhum checkout, cobrança, webhook ou confirmação automática foi simulado.
- Georrestrição: campus/contorno ainda não informado. Presença confirmada pelo atendente.
- Homologar câmera e instalação da PWA em Android/iOS reais com HTTPS.
- Migrações executadas somente no banco de validação; nenhum deploy, push ou alteração de
  banco operacional. Novos produtos exigem estoque real informado pelo gestor.
