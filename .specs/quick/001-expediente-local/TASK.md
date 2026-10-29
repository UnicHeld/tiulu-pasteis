# Liberar expediente local

Permitir ao usuário testar pedidos fora do expediente no ambiente local em execução.

## Aceite e plano

- Adicionar opção explícita `ALLOW_OUT_OF_HOURS_ORDERS=1`, restrita a `NODE_ENV=development`.
- Preservar expediente por padrão, validação de entrada e antecedência de agendamentos.
- Documentar a opção, testar domínio e proteção HTTP e reiniciar o servidor local com ela ativa.
- Verificar criação de pedido no banco local isolado sem registrar código de acompanhamento.

Fora de escopo: alterar expediente comercial, pagamentos, autenticação ou produção.
