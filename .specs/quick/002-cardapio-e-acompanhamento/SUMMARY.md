# Resultado

Cardápio público agrupa pequeno/grande num cartão por sabor, com seletor acessível, preço,
quantidade e disponibilidade do tamanho escolhido. Sacola e API preservam IDs e estoque
independentes. Bebidas continuam individuais; gestão mantém variantes para controlar estoque.
Sem mudança de contratos, migrações, dependências ou pedidos históricos.

Acompanhamento legado exige consulta explícita. Código salvo apenas preenche o campo;
não dispara chamada ao carregar. 404 limpa referência e detalhes e encerra polling; falhas
temporárias preservam código. Polling só ocorre com modal de acompanhamento aberto.
Persistência bloqueada não derruba a página; nova consulta do mesmo código dispara imediatamente.

Instância local iniciada sem `ADMIN_PASSWORD`; nenhuma senha lida, divulgada ou alterada.

## Verificações

- `npm test`: exit 0, 38 testes aprovados, incluindo cinco de agrupamento; 17 testes
  PostgreSQL omitidos. Banco não revalidado nesta mudança de apresentação.
- `npm run typecheck`, `npm run lint`, `npm run build`: exit 0 na execução final.
  Primeira execução de tipos identificou import removido de `Flame`, ainda usado no cabeçalho;
  corrigido e tipos/lint/build reexecutados com sucesso.
- `npm run format:check`, `python3 scripts/check-docs.py`, `git diff --check`: exit 0.
- Chromium real com Playwright no contêiner isolado: exit 0 (`BROWSER_OK`).
  MCP sem Chrome na sessão; reutilizado navegador isolado já instalado.
- Navegador verificou 8 sabores/12 bebidas, tamanhos selecionáveis, quantidades independentes,
  total de dois pequenos e um grande (R$ 30), ausência de consulta inicial, 404 limpando código
  sem nova tentativa após 11 segundos, 503 preservando código, armazenamento bloqueado tolerado,
  viewport 390×844 sem overflow e ausência de erros JavaScript.
- Código inexistente consultado na API real do banco isolado. Estoques dos dois tamanhos
  substituídos somente na resposta de catálogo do roteiro, sem alteração do banco. Respostas
  de sucesso/503 sintéticas para o teste de persistência, sem credenciais ou dados reais.
- Primeiro roteiro de navegador exigiu ajustar seletor para a linha da sacola, que combina
  nome e preço. Roteiro corrigido passou. Screenshot: `/tmp/tiulu-menu-mobile.png`.

## Limitações

Sem OAuth real, cobrança externa, migração, deploy, push ou alteração de credenciais.
Aplicação segue em `http://localhost:5173`, com atualização pelo Vite.
