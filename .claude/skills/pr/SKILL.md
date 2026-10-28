---
name: pr
description: Prepara commits convencionais, push e pull request com validação e template do projeto. Use quando o usuário pedir commit, envio de alterações ou abertura de PR.
---

# Preparar e publicar entrega

Ler `AGENTS.md`, template de PR, branch/upstream, status e diff. Identificar arquivos da tarefa e
preservar trabalho local alheio. Usar `validate-tiulu` conforme escopo e apresentar falhas reais.

Preparar agrupamento de arquivos, mensagem Conventional Commits e descrição com problema,
resultado, testes, compatibilidade e riscos. Manter a identidade Git existente e não adicionar
autoria, coautoria ou assinatura de agente.

Executar apenas ações externas autorizadas no pedido ou na conversa. Autorização de commit/push
para o mesmo escopo não exige nova confirmação. Se faltar autorização, preparar o resultado
concreto e pedir somente a permissão que falta. Não criar PR quando o pedido for apenas push.

Adicionar paths específicos, revisar staged diff, criar commit novo, fazer push normal e abrir
PR somente quando solicitado. Não usar amend, force push ou ignorar validações.
Para corpo multiline com `gh`, escrever arquivo temporário e usar `--body-file`.
Consultar resultado remoto e head atual do CI. Retornar URL, commit, checks e omissões.
