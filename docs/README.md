# Documentação da Tiulu Pastéis

Arquivos usam português, minúsculas e `kebab-case`. `README.md` é reservado para índices.
Cada fato tem uma fonte principal; outras páginas resumem e apontam para ela.

## Categorias

| Categoria      | Escopo                                           | Não deve conter                    |
| -------------- | ------------------------------------------------ | ---------------------------------- |
| `arquitetura/` | contratos, camadas, regras, autenticação e dados | runbooks ou status de entrega      |
| `operacao/`    | configuração, implantação, backups e diagnóstico | decisões históricas                |
| `integracoes/` | contratos específicos de serviços externos       | regras internas duplicadas         |
| `decisoes/`    | ADRs: contexto, opções e consequências           | plano e contrato vivo              |
| `iniciativas/` | escopo, status e rollout de mudanças             | documentação permanente do runtime |
| `qualidade/`   | camadas de verificação e harness                 | regras comerciais                  |
| `processos/`   | desenvolvimento, decisões e notebook             | arquitetura do produto             |

## Arquitetura canônica

- [Conceitos fundamentais](arquitetura/conceitos-fundamentais.md)
- [Camadas e conexões](arquitetura/camadas-e-conexoes.md)
- [Fluxo de pedidos](arquitetura/fluxo-de-pedidos.md)
- [Dados e persistência](arquitetura/dados-e-persistencia.md)
- [Autenticação do cliente](arquitetura/autenticacao-do-cliente.md)
- [Contratos de integração e API](arquitetura/contratos-de-integracao.md)

## Operação e integrações

- [Configuração local](operacao/configuracao-local.md)
- [Implantação e recuperação](operacao/implantacao.md)
- [Observabilidade](operacao/observabilidade.md)
- [Imagens do cardápio](integracoes/imagens-do-cardapio.md) — fontes, créditos e uso de fotos ilustrativas.
- [Google OAuth](integracoes/google-oauth.md)
- [Pagamentos](integracoes/pagamentos.md)

## Qualidade e processo

- [Visão geral das avaliações](qualidade/visao-geral-de-avaliacoes.md)
- [Harness de desenvolvimento](qualidade/harness.md)
- [Desenvolvimento orientado a especificação](processos/desenvolvimento-orientado-a-especificacao.md)
- [Registro de decisões](processos/registro-de-decisoes.md)
- [Notebook pessoal](processos/notebook-pessoal.md)
- [Índice de decisões](decisoes/README.md)
- [Índice de iniciativas](iniciativas/README.md)
