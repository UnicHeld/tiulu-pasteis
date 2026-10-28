# Notebook pessoal

`.notebook/` guarda estudo e investigação de quem trabalha no clone. É ignorado por Git e Docker,
assim como `CLAUDE.local.md`. Nunca forçar inclusão com `git add -f`.

Estrutura sugerida: `INDEX.md`, `estudos/`, `investigacoes/` e `glossario.md`. O índice descreve cada
nota em uma linha. Agentes consultam o índice quando o usuário citar suas anotações, por caminho
explícito, pois buscas comuns respeitam `.gitignore`.

As notas podem estar defasadas: `AGENTS.md`, documentação canônica e código prevalecem. Escrever
somente sob pedido e atualizar o índice. Não armazenar segredos, payloads ou dados pessoais.
Conteúdo útil para o projeto só é promovido para docs após revisão, sem copiar informação privada.

Claude Code pode carregar o índice por `@.notebook/INDEX.md` em `CLAUDE.local.md` local.
Cada pessoa cuida do backup privado; este repositório não sincroniza o notebook.
