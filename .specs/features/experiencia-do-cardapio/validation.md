# Validação da experiência do cardápio

## Implementação

- Promoções é a aba inicial; oferta não aparece em Todos.
- Cartão de campanha com fotos reais locais de referência e preços grande15/pequeno10.
- Foto ou CTA abrem a sacola com pastel/refri inclusos. Guaraná200 é a primeira opção disponível.
- Tamanho, sabor e bebida configurados na sacola; reabrir e recarregar preservam o par sem duplicar.
- Trocar move só uma unidade, preservando avulsos e outros combos; outro combo tem ação explícita.
- Mini pizzas em cartões compactos e uniformes; foto/Escolher abrem sabor/ingredientes na sacola.
- Área de abertura compacta, fotos nos alimentos, filtros com rolagem horizontal e estado acessível,
  limite de três ingredientes com chips, botão de fechar persistente durante rolagem do modal.
- Contratos, preço autoritativo, estoque e regras de servidor preservados; sem migração/dependência.

## Arquivos principais

`src/client/main.tsx`, `cart.ts`, `CartChoices.tsx`, `ComboCard.tsx`, `MenuProductCard.tsx`,
`photos.ts`, `styles.css`, `tests/cart-ui.test.ts`, `public/images/`, documentação de conceitos,
créditos e specs. Fotos e licenças: [imagens do cardápio](../../../docs/integracoes/imagens-do-cardapio.md).

## Comandos e resultados

- `npx vitest run tests/cart-ui.test.ts`: exit0, 20 cenários de trocas, reabertura, estoque,
  capacidade, origens removidas, marcadores antigos e ausência de mutação.
- `docker.exe compose -f compose.validation.yaml run --rm quality`: exit0; formatação,
  lint, tipos, 67 testes sem banco, build, docs e sete testes Python aprovados. Os 23 testes
  PostgreSQL são omitidos nesse serviço; não contá-los como aprovados nesta execução.
- `npm run typecheck`, `npm run lint`, `npm run build`: exit0 após ajustes dos cartões.
  Primeira execução de lint identificou três imports sem uso após remover a abertura antiga;
  removidos e verificações reexecutadas com sucesso.
- Vite no Docker avisou de um chunk acima500kB; build concluiu, sem mudança de dependências.
- `python3 scripts/check-docs.py`, `git diff --check` e formatação dos artefatos finais: exit0.

## Navegador real

Chromium/Playwright em contêiner isolado, banco exclusivo, sessão e dados sintéticos.
MCP permanece sem Chrome no host; reutilizado Chromium instalado no contêiner.
Roteiro temporário final concluiu com exit0, `UX_BROWSER_OK`:

- Promoções selecionada ao abrir; sem produto avulso nessa aba no catálogo sem ofertas individuais.
- Foto e botão abrem a sacola. Reabrir/recarregar não aumenta quantidade.
- Dois avulsos prévios são preservados ao trocar tamanho/sabor de um combo. Outro combo tem sua
  unidade preservada ao trocar a unidade em edição. Indisponíveis/limites cobertos também nos20 testes.
- Todos sem banner,28 cartões avulsos e16 fotos de alimentos; imagens com carregamento verificado.
- Mini pizza: três cartões alinhados e sem inputs na grade. Selecionar abre sacola, até3 ingredientes,
  quarto bloqueado; trocar por pizza comum remove os campos e voltar preserva a escolha.
- Grande+pequeno+personalizada: total33, desconto5 e ingredientes conferidos na API e PostgreSQL.
- Viewport390×844 sem overflow horizontal ou errosJavaScript; captura desktop1280×900.
- Primeiro roteiro identificou diferença de altura dos cartões; títulos encurtados e altura padronizada,
  com nova execução aprovada. Após compactação final e botão sticky, roteiro reexecutado com sucesso.

Capturas inspecionadas: `/tmp/tiulu-ux-promo-mobile.png`, `/tmp/tiulu-ux-promo-desktop.png`,
`/tmp/tiulu-ux-pizzas.png`, `/tmp/tiulu-ux-cart.png`. Dados de cliente são sintéticos.
Revisão independente de estado, persistência e acessibilidade sem defeitos acionáveis.

## Fotos e limitações

Fotos Commons CC BY/CC BY-SA/CC0, sem IA, com créditos públicos em `/images/creditos.html`.
Não são fotos do Tiulu. Não foi encontrada foto verificável/reutilizável de embalagem Guaraná200ml;
na promoção, a fotografia é enquadrada no copo por CSS, sem expor garrafa1L como produto200ml.
Bebidas sem foto fiel mantêm representação gráfica, em vez de usar embalagem incompatível.
Sem chamadas OAuth/cobrança reais, deploy, push, alteração de credenciais ou produção.
Suíte PostgreSQL completa não reexecutada: nenhuma mudança de API/domínio/esquema; fluxo completo
foi validado com banco real exclusivo no navegador. Bancos/contêineres mantidos sem exclusões.
