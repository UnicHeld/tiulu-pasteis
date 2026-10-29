# Cardápio visual e escolhas na sacola

## Objetivo e aceite

- Abrir em Promoções; combo aparece exclusivamente nessa aba. Todos contém somente avulsos.
- Oferta visual com fotografia real de referência e texto de campanha, sem formulário na grade.
- Tocar na oferta inclui um pastel e Guaraná200ml disponíveis e abre sacola com sabor/tamanho/
  bebida editáveis. Se Guaraná indisponível, permitir outro refri200ml elegível, mostrando a escolha.
- Reabrir a mesma oferta preserva seleção e quantidades; adicionar outro combo é ação explícita.
- Trocar sabor/tamanho/bebida move só uma unidade da linha, preservando avulsos/outros combos.
- Mini pizzas têm cartão compacto, foto, preço e botão Escolher; sabor/ingredientes só na sacola.
- Até3 ingredientes validados pela API; manter limites e preços atuais. Sem alterar contratos/banco.
- Persistir marcadores de edição junto da sacola; tolerar storage bloqueado e dados antigos.
- Fotos locais, de referência, com licença/fonte registradas; não anunciar como fotos da loja.
- Não usar embalagem de volume diferente para representar produto200ml. Sem foto adequada,
  usar fotografia ilustrativa focada no copo e explicitar o volume do produto no texto.
- Mobile sem overflow, botões e campos rotulados, teclado/escape e foco do modal preservados.

## Plano

1. Obter fotos reais e créditos; ajustar cartões. Abertura anterior com título grande,
   ilustração e faixa de destaques restaurada a pedido do usuário.
2. Mover configuração para sacola e preservar quantidades nas trocas/reaberturas.
3. Validar helpers e navegador em celular/desktop, qualidade/build e docs.
