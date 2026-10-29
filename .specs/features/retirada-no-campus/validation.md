# Validação do pedido para retirada no campus

## Implementação

- Login e georrestrição validados na API; posição solicitada uma vez por envio, sem persistência.
- Reserva no envio, status `received`, preparo antecipado e pagamento obrigatório na entrega.
- Histórico, QR opcional e compatibilidade com pré-pedidos legados preservados.
- Catálogo preservado; migração 003 corrige descrições sem alterar pedidos ou estoque.
- ADR-0003 Proposto; aprovação formal não presumida.

## Comandos executados

- `npm run typecheck`, `npm run lint`, `npm test`: exit 0; 33 testes sem banco aprovados,
  17 de PostgreSQL omitidos nessa execução local.
- `docker.exe compose -f compose.validation.yaml run --build --rm integration`: exit 0;
  50 testes aprovados, incluindo 17 PostgreSQL, contra banco isolado PostgreSQL 17.
- `docker.exe compose -f compose.validation.yaml run --build --rm quality`: exit 0;
  formatação, lint, tipos, testes sem banco, build, documentação e sete testes Python aprovados.
- `npm run build`: exit 0 após os ajustes finais dos textos da interface.
- `npm run format:check`, `python3 scripts/check-docs.py`, `git diff --check`: exit 0
  incluindo conferência dos artefatos finais.

Testes abrangem localização ausente, fora do polígono, incerteza cruzando o limite,
posição antiga/futura/imprecisa, limite concorrente por conta, última unidade, rollback de
cesta inválida, cancelamento com reposição única e entrega condicionada ao pagamento.

## Revisão e navegador

Revisão independente de estoque, autenticação, geometria e logs sem achados restantes após
corrigir instrução antiga do leitor: confirmar pagamento antes da retirada, não do preparo.

Playwright MCP tentou abrir a aplicação, mas falhou por ausência de Chrome no host.
Alternativa: Chromium real e Playwright instalados somente no contêiner `tiulu-campus-browser`,
ligado ao banco de testes. Roteiro temporário com sessões e dados sintéticos, sem OAuth real.
Tentativas iniciais do roteiro exigiram corrigir seletores para celular, fechar o aviso antes
de novo envio e consultar a instrução dentro do modal (também existe no cartão).
Roteiro final concluiu com exit 0 (`BROWSER_OK`). Verificado:

- Visitante precisa entrar; sessão sintética permite preencher a sacola.
- Posição fora do IBILCE retorna 403 e não cria pedido; sacola preservada.
- Recusa de permissão simulada mostra orientação e não envia pedido.
- Posição interna cria pedido `received`, reserva uma unidade e mantém pagamento pendente.
- Gestor inicia preparo, marca pronto, recebe bloqueio ao entregar sem pagar e conclui
  após confirmar pagamento. Estado final conferido diretamente no PostgreSQL.
- Viewport 390×844 sem overflow horizontal; nenhum erro JavaScript na página do cliente.
- Screenshot sintética em `/tmp/tiulu-campus-customer.png`, copiada do contêiner para inspeção.

Permissão negada foi simulada no navegador; comportamento nativo do prompt e GPS físico
continuam sujeitos à homologação no campus. Câmera física não foi testada nesta alteração.

## Limitações e operação

- Docker Linux não disponível na integração WSL; Docker Desktop acessado por `docker.exe`.
- Antes de o Docker ser ativado, consulta a binário PostgreSQL temporário foi tentada;
  não utilizado. Sem dependências novas no projeto para georrestrição ou navegador.
- npm no Node 22 emitiu aviso de engine da dependência transitiva existente `@zxing/library`
  (requer Node 24). Checks e testes passaram; compatibilidade de câmera em aparelhos reais
  continua pendente, sem mudança de dependências nesta tarefa.
- Homologar polígono OSM, precisão/localização física e PWA em celulares no IBILCE.
- Coordenadas do navegador são falsificáveis; restrição não comprova vínculo institucional.
- Sem cobrança externa, deploy, push ou alteração do banco operacional.
- Contêiner de navegador e banco isolado foram mantidos; não remover volumes ou recursos
  sem autorização. Harness L4 não reexecutado, pois não houve mudança do harness.
