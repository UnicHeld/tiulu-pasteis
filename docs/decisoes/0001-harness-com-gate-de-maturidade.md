# ADR-0001: Manter harness versionado com gate de maturidade L4

- **Data**: 2026-10-27
- **Status**: Proposto
- **Decisores**: Mantenedor do projeto
- **Aprovação**: Pendente de aceitação formal
- **Escopo**: plataforma

## Contexto e problema

O projeto tem comandos de qualidade e testes, mas precisa tornar descobríveis e verificáveis
as instruções, workflows e documentação usados por pessoas e agentes de código. Sem uma fonte
canônica, ferramentas diferentes podem receber regras divergentes.

## Drivers da decisão

- Mesmas regras de negócio e segurança em qualquer ferramenta.
- Documentação organizada por responsabilidade, sem cópias concorrentes.
- Validação reproduzível no desenvolvimento e no CI, sem credenciais de produção.

## Opções consideradas

1. **Harness versionado, adaptadores por ferramenta e gate L4**: automatiza regressões de
   estrutura, com custo de manter scripts e configuração.
2. **Apenas README e revisão manual**: menos arquivos, mas sem verificação automática da
   descoberta de workflows, hooks e regras.

## Decisão

A proposta usa `AGENTS.md` como fonte geral, `REVIEW.md` para revisão e `docs/` por categorias.
Workflows canônicos em `.claude/skills/` também são expostos em `.agents/skills/` por link.
O CI executa `harness-score@1.6.5 . --min-level 4`, além das validações reais da aplicação.
A implementação atende ao pedido de padronização; o registro permanece proposto até aceitação
formal, sem presumir aprovação de uma política permanente.

## Consequências

### Positivas

- Instruções e comandos ficam revisáveis junto do código.
- Remoção de partes estruturais que reduzam maturidade falha no CI.
- Não requer conector externo ou segredo para avaliar o harness.

### Negativas

- O gate depende do registro npm e pode falhar por indisponibilidade externa.
- L4 é uma medida estrutural; não comprova qualidade funcional ou segurança de execução.
- Hooks e symlinks dependem do suporte da ferramenta e do sistema de arquivos.

## Regras para quem implementa

- Manter versão e mínimo explícitos; mudanças exigem revisão.
- Executar o gate após mudanças em regras, workflows, hooks ou CI.
- Não adicionar conectores fictícios ou permissões pessoais ao repositório.
- Não duplicar regras gerais nos adaptadores; apontar para a fonte canônica.
- Nunca substituir lint, tipos, testes e build por uma pontuação de harness.

## Links

- [Harness](../qualidade/harness.md)
- [Processo de decisões](../processos/registro-de-decisoes.md)
- [harness-score](https://github.com/paladini/harness-score)
