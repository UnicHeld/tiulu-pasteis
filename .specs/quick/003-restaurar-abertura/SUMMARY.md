# Resultado

Restaurado somente o bloco superior em `src/client/main.tsx`: título grande “Tá na hora de
um pastel”, ilustração dos pastéis no prato vermelho, CTA e três destaques. CSS anterior já
estava disponível. Textos mantêm coerência com login, preparo antes da chegada e pagamento
na retirada. Fotos, Promoções inicial/exclusiva e configuração na sacola preservadas.
Spec de experiência e STATE atualizados para registrar a restauração.

## Validação

- `npm run typecheck`, `npm run lint`, `npm run build`: exit0.
- Chromium real/Playwright no contêiner existente: abertura, ilustração e três destaques,
  Promoções inicial e ausência do combo em Todos, viewport390×844 sem overflow ou errosJS.
  Roteiro terminou com `RESTORED_HERO_OK`, exit0.
- Captura sintética: `/tmp/tiulu-restored-hero-mobile.png` no contêiner de navegador.
- Formatação, docs/links e `git diff --check` conferidos após escrever os artefatos finais.

Não foram adicionados testes unitários para restauração de texto/markup. Suíte PostgreSQL
não reexecutada; nenhuma mudança de regra, API ou dados. Sem deploy, push ou credenciais.
