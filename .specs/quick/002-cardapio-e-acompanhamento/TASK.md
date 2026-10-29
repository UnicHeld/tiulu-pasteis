# Cardápio por sabor e acompanhamento explícito

## Objetivo e aceite

- Mostrar um cartão por sabor com escolha pequeno/grande e preço do tamanho selecionado.
- Sacola mantém quantidades independentes por tamanho, com IDs/preços/estoques da API intactos.
- Bebidas continuam individuais. Busca, categorias e promoções continuam funcionando.
- Não consultar código salvo ao abrir a aplicação; acompanhamento só após consulta explícita.
- 404 limpa referência inválida e detalhes, sem repetir consulta/erro. Rede/500 não apagam código.
- Leitura/gravação de storage bloqueada não impede uso da página.
- Não alterar senha: instância local iniciada sem ADMIN_PASSWORD; informar configuração necessária.

## Plano

1. Agrupar variantes na apresentação e adicionar seletor acessível com preço/estoque por tamanho.
2. Corrigir consulta e persistência de acompanhamento; preservar histórico real do servidor.
3. Testar agrupamento, regressão no navegador, tipos, lint, build e documentação.

Sem migração ou alteração de contrato; não apagar pedidos ou estoques do banco.
