# Estado do projeto

## Contexto atual

- Repositório público, branch principal `main`.
- Mudança atual: pedido antecipado para retirada com login e localização dentro do IBILCE.
- Reserva imediata no envio e preparo antes da chegada; pagamento presencial e entrega só paga.
- Catálogo, histórico e pré-pedidos legados preservados.
- Validação consolidada antes da entrega: 90 testes aprovados (23 PostgreSQL), qualidade,
  tipos, build, documentação e sete testes de harness aprovados no Docker isolado.
  Navegador real validado durante as implementações; evidências nos registros abaixo.

## Decisões

- Harness e gate L4 constam no ADR-0001, Proposto.
- ADR-0002 documenta a proposta anterior de confirmação presencial.
- ADR-0003 propõe reserva no envio e georrestrição; permanece Proposto.
- Não há ADR aceito registrado; não presumir aceitação de proposta.

## Handoff

Abertura anterior restaurada a pedido do usuário: título grande “Tá na hora de um pastel”,
ilustração e faixa de destaques; restante da experiência de promoções/sacola preservado.
[Resumo](../quick/003-restaurar-abertura/SUMMARY.md).

Experiência atual do cardápio concluída: abre em Promoções, combo exclusivo nessa aba, campanha
com fotos reais ilustrativas, escolhas de combo/mini pizza na sacola e reabertura sem duplicação.
[Spec](../features/experiencia-do-cardapio/spec.md) e [validação](../features/experiencia-do-cardapio/validation.md):
67 testes sem banco (20 novos da sacola), qualidade/build e navegador real com banco exclusivo
aprovados. Não houve mudança de servidor/esquema. Créditos públicos em `/images/creditos.html`.

Trabalho atual em [catálogo e combo](../features/catalogo-e-combo/spec.md) concluído: salgados
R$ 8, três mini pizzas R$ 8 com molho de tomate (personalizada até três ingredientes), queijo com
goiabada e combos grande R$ 15/pequeno R$ 10 em primeiro destaque. Desconto e ingredientes
preservados nos pedidos. Migrações 004/005 aplicadas só em bancos isolados. Qualidade, 70 testes
(23 PostgreSQL) e navegador real aprovados. [Evidências](../features/catalogo-e-combo/validation.md).
Aplicação local segue em `http://localhost:5173`; estoque real dos produtos novos depende da gestão.

Ajuste atual de apresentação concluído: cartão por sabor com tamanho selecionável e
acompanhamento legado somente por consulta explícita, sem erro recorrente de código antigo.
[Resumo e validação](../quick/002-cardapio-e-acompanhamento/SUMMARY.md): 38 testes sem banco,
tipos, lint, build e navegador real aprovados. Aplicação local em `http://localhost:5173`;
gestão sem senha configurada nesta instância.

[Spec atual](../features/retirada-no-campus/spec.md): implementado e validado pedido `received`
com reserva imediata, login e georrestrição na API. Pré-pedidos antigos preservam confirmação
no balcão. O contorno colaborativo OSM exige homologação local; GPS do navegador pode ser
falsificado. Localização não é persistida. Nenhuma alteração no banco operacional autorizada.

O histórico da mudança anterior permanece em [pedido no balcão](../features/pedido-no-balcao/spec.md)
e sua [validação](../features/pedido-no-balcao/validation.md).
Liberação opcional do expediente em desenvolvimento:
[resumo da correção](../quick/001-expediente-local/SUMMARY.md).

Validações e lacunas do harness estão em `.specs/features/docs-e-harness/validation.md`.
Antes de operar comercialmente, executar homologação em `docs/operacao/implantacao.md`.
