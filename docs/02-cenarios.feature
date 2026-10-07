# language: pt
#
# Cenários levantados a partir da documentação da entrega.
# Cada cenário tem um ID (@CTxx), a regra que cobre (@RNxx) e a prioridade.
# Os marcados com @automatizado estão implementados em tests/.

Funcionalidade: Cupom de desconto
  Como cliente da Verzel Store
  Quero aplicar um cupom de desconto no carrinho
  Para pagar menos na minha compra

  Contexto:
    Dado que estou na Verzel Store com o carrinho vazio

  # ---- Modelo: substitua pelos cenários reais a partir das regras de docs/01 ----

  @CT01 @RN01 @alta
  Cenário: <descreva o comportamento esperado>
    Dado que adicionei <produto> ao carrinho
    Quando aplico o cupom "<CODIGO>"
    Então ...

  @CT02 @RN01 @alta
  Esquema do Cenário: Valor-limite do valor mínimo do cupom
    Dado que meu carrinho tem subtotal de R$ <subtotal>
    Quando aplico o cupom "<CODIGO>"
    Então o cupom deve ser <resultado>

    Exemplos:
      | subtotal | resultado |
      |          | recusado  |
      |          | aceito    |
      |          | aceito    |


Funcionalidade: Frete grátis
  Como cliente da Verzel Store
  Quero ganhar frete grátis quando atingir o valor definido
  Para não pagar entrega

  @CT10 @RN03 @alta
  Cenário: <descreva o comportamento esperado>
    Dado ...
    Quando ...
    Então ...
