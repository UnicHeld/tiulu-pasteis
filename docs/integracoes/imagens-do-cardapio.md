# Imagens do cardápio

Fotografias reais de terceiros, usadas apenas como ilustração. Não retratam produtos ou instalações
do Tiulu. As fotos não definem recheio, porção, tamanho ou apresentação da loja. Não houve geração
por IA nem edição dos arquivos; algumas fontes fornecem miniaturas já dimensionadas.

## Créditos

| Arquivo                        | Autor                   | Fonte                                                                                                              | Licença                                                         |
| ------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `/images/pastel.jpg`           | Mauro Cateb             | [Pastel - Brazilian fried pastry.jpg](https://commons.wikimedia.org/wiki/File:Pastel_-_Brazilian_fried_pastry.jpg) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)  |
| `/images/pastel-queijo.jpg`    | BuenosAiresPhotographer | [Brazilian pastel.jpg](https://commons.wikimedia.org/wiki/File:Brazilian_pastel.jpg)                               | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0)  |
| `/images/mini-pizzas.jpg`      | Ceeseven                | [Mini Pizza in Hong Kong.jpg](https://commons.wikimedia.org/wiki/File:Mini_Pizza_in_Hong_Kong.jpg)                 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)  |
| `/images/coxinha.jpg`          | Márcia Cristina Machado | [Coxinha de frango.jpg](https://commons.wikimedia.org/wiki/File:Coxinha_de_frango.jpg)                             | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)  |
| `/images/empada.jpg`           | Melsj                   | [Empada de palmito.jpg](https://commons.wikimedia.org/wiki/File:Empada_de_palmito.jpg)                             | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| `/images/kibe.jpg`             | Mauro Cateb             | [Brazilian kibbeh.jpg](https://commons.wikimedia.org/wiki/File:Brazilian_kibbeh.jpg)                               | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)  |
| `/images/espetinho-frango.jpg` | Ruocaled                | [Chicken Skewers (7360565052).jpg](<https://commons.wikimedia.org/wiki/File:Chicken_Skewers_(7360565052).jpg>)     | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0)        |
| `/images/guarana.jpg`          | Adrian Michael          | [Guarana Drink.jpeg](https://commons.wikimedia.org/wiki/File:Guarana_Drink.jpeg)                                   | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)  |

Os créditos legíveis por máquina estão em `public/images/credits.json`; a página pública
`public/images/creditos.html` apresenta os mesmos autores, fontes e licenças de forma legível. A interface deve manter
acesso aos créditos e indicar que as imagens são ilustrativas. Licenças das imagens não alteram
a licença do código. Se houver recorte de apresentação por CSS, informar esse enquadramento nos
créditos; os arquivos fotográficos continuam com suas licenças originais.

## Correspondência com o catálogo

- `pastel.jpg`: imagem genérica de pastéis, sem recheio aparente; pode ilustrar diferentes sabores.
- `pastel-queijo.jpg`: recheio de queijo visível; usar somente para sabores compatíveis.
- `mini-pizzas.jpg`: fotografia genérica de mini pizza com coberturas variadas; não representa
  a receita de presunto, calabresa ou a escolha de três ingredientes feita pelo cliente.
- `coxinha.jpg`, `empada.jpg`, `kibe.jpg` e `espetinho-frango.jpg`: representam o tipo de salgado,
  sem prometer recheio, quantidade ou apresentação exatos da loja.
- `guarana.jpg`: mostra um copo e uma **garrafa de 1 litro**. Não usar como se fosse embalagem
  de 200 ml, nem mapear a fotografia inteira ao produto de 200 ml. Se apresentada junto da promoção,
  a interface deve explicitar o caráter ilustrativo e enquadrar o copo, sem sugerir que o combo
  inclui a garrafa de 1 litro. Não foi localizada fotografia reutilizável verificada da PET de 200 ml.

## Operação

Os arquivos são servidos localmente de `public/images/`, sem hotlink ou chamada ao Commons em
tempo de navegação. Substituir por fotografias próprias da loja quando forem fornecidas.
Fontes e licenças conferidas em 28/10/2026.
