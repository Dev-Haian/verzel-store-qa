# language: pt
#
# Cenários levantados a partir da documentação da entrega VZS-142.
# Tags: @CTxx = ID do cenário · @CAxx/@REx = regra coberta (docs/01) · @alta/@media/@baixa = prioridade
#       @ui = executado na interface · @api = executado na API
#       @playwright / @postman = automatizado (tests/ui e postman/)
#       @BUGxx = cenário falhou; detalhes em docs/04-bugs.md
#
# Arquivo validado com o parser oficial do Gherkin (@cucumber/gherkin), idioma pt.
#
# Dados usados: preços e cupons da seção "Dados para teste" da documentação.

Funcionalidade: Cupom de desconto e frete grátis (VZS-142)
  Entrega que adiciona à Verzel Store a aplicação de cupom de desconto no carrinho
  e a regra de frete grátis. Os cálculos são feitos pela API e a interface exibe o resultado.
  Cada bloco "Regra" agrupa os cenários de uma parte da entrega.

  Regra: Cupom de desconto
    Como cliente da Verzel Store
    Quero aplicar um cupom de desconto no carrinho
    Para pagar menos nas minhas compras

    Contexto:
      Dado que o carrinho tem 1 "Mochila Urbana 20L" de R$ 100,00

    @CT01 @CA01 @alta @ui @api @playwright @postman
    Cenário: Cupom válido aplica 10% sobre o subtotal dos produtos
      Quando aplico o cupom "BEMVINDO10"
      Então vejo a mensagem "Cupom BEMVINDO10 aplicado."
      E o desconto é de R$ 10,00
      E o frete continua R$ 19,90
      E o total é R$ 109,90

    @CT02 @CA02 @alta @ui @api @playwright @postman
    Cenário: Código do cupom não diferencia maiúsculas de minúsculas
      Quando aplico o cupom "bemvindo10"
      Então o cupom "BEMVINDO10" é aplicado com desconto de R$ 10,00

    @CT03 @CA02 @media @ui @api @playwright @postman
    Cenário: Espaços no início e no fim do código são ignorados
      Quando aplico o cupom "  BemVindo10  "
      Então o cupom "BEMVINDO10" é aplicado com desconto de R$ 10,00

    @CT04 @CA02 @baixa @api @postman
    Cenário: Espaço no meio do código torna o cupom inválido
      # Interpretação AMB02
      Quando aplico o cupom "BEM VINDO10"
      Então vejo a mensagem "Cupom inválido."
      E nenhum desconto é aplicado

    @CT05 @CA03 @alta @ui @api @playwright @postman
    Cenário: Cupom inexistente
      Quando aplico o cupom "XPTO"
      Então vejo a mensagem "Cupom inválido."
      E o desconto é de R$ 0,00
      E o total é R$ 119,90

    @CT06 @CA04 @alta @ui @api @playwright @postman
    Cenário: Cupom fora da validade
      Quando aplico o cupom "VERAO2026"
      Então vejo a mensagem "Cupom expirado."
      E o desconto é de R$ 0,00
      E o total é R$ 119,90

    @CT07 @CA03 @baixa @ui @playwright
    Cenário: Aplicar o cupom com o campo vazio ou só com espaços
      # Interpretação AMB03
      Quando aplico o cupom "   "
      Então vejo a mensagem "Informe um cupom."
      E nenhum desconto é aplicado

    @CT08 @CA05 @alta @ui @playwright
    Cenário: Apenas um cupom pode ser aplicado por vez
      Dado que apliquei o cupom "BEMVINDO10"
      Então o campo de cupom não fica mais disponível
      E vejo a opção "Remover cupom"

    @CT09 @CA05 @media @ui @playwright
    Cenário: Remover o cupom atual e aplicar outro
      Dado que apliquei o cupom "BEMVINDO10"
      Quando removo o cupom
      Então o desconto volta a R$ 0,00 e o total a R$ 119,90
      E consigo aplicar o cupom "VERAO2026", que mostra "Cupom expirado."

    @CT10 @CA01 @media @api @postman
    Cenário: Carrinho sem cupom não tem desconto
      Quando calculo o carrinho sem informar cupom
      Então o desconto é 0
      E o campo "cupom" da resposta é null

    @CT11 @CA03 @CA04 @alta @api @postman
    Esquema do Cenário: Pedido com cupom inválido ou expirado é recusado
      # No cálculo do carrinho, o mesmo cupom não é erro (responde 200). No pedido, é 422.
      Quando envio um pedido com o cupom "<cupom>"
      Então a API responde 422 com o código "<codigo>" no campo "cupom"

      Exemplos:
        | cupom     | codigo         |
        | XPTO      | CUPOM_INVALIDO |
        | VERAO2026 | CUPOM_EXPIRADO |

    @CT31 @CA05 @baixa @ui @BUG06
    Cenário: Cupom é removido quando o carrinho fica vazio
      # Interpretação AMB13
      Dado que apliquei o cupom "BEMVINDO10"
      Quando removo todos os itens do carrinho um a um
      E adiciono outro produto
      Então o carrinho não tem cupom aplicado


  Regra: Frete grátis e cálculo do total
    Como cliente da Verzel Store
    Quero ganhar frete grátis em compras a partir de R$ 200,00
    Para não pagar a entrega

    @CT12 @CA06 @alta @ui @api @playwright @postman @BUG01
    Esquema do Cenário: Valor-limite do frete grátis
      Dado que o carrinho tem "<itens>" com subtotal de R$ <subtotal>
      E o cupom aplicado é "<cupom>"
      Quando calculo o carrinho
      Então o frete é R$ <frete>
      E o total é R$ <total>

      Exemplos:
        | itens         | subtotal | cupom      | frete | total  | resultado |
        | P001 + P002   | 199,80   |            | 19,90 | 219,70 | passou    |
        | P005 × 2      | 200,00   |            | 0,00  | 200,00 | falhou    |
        | P008 × 4      | 200,00   |            | 0,00  | 200,00 | falhou    |
        | P005 × 2      | 200,00   | BEMVINDO10 | 0,00  | 180,00 | falhou    |
        | P003 + P006   | 219,80   |            | 0,00  | 219,80 | passou    |

    @CT13 @CA07 @alta @ui @api @playwright @postman
    Cenário: Abaixo de R$ 200,00 o carrinho informa quanto falta
      Dado que o carrinho tem 3 "Camiseta Essencial" (subtotal R$ 179,70)
      Então o frete é R$ 19,90
      E o total é R$ 199,60
      E vejo "Faltam R$ 20,30 para o frete grátis."

    @CT14 @CA08 @alta @ui @api @playwright @postman
    Cenário: Frete grátis considera o subtotal antes do desconto
      Dado que o carrinho tem 1 "Jaqueta Corta-Vento" (subtotal R$ 229,90)
      Quando aplico o cupom "BEMVINDO10"
      Então o desconto é R$ 22,99
      E o frete continua grátis, mesmo com os produtos custando R$ 206,91 depois do desconto
      E o total é R$ 206,91

    @CT15 @CA09 @alta @ui @api @playwright @postman
    Cenário: Desconto não incide sobre o frete
      Dado que o carrinho tem 1 "Mochila Urbana 20L" (subtotal R$ 100,00)
      Quando aplico o cupom "BEMVINDO10"
      Então o desconto é R$ 10,00 e não R$ 11,99
      E o total é R$ 109,90

    @CT16 @CA01 @CA06 @CA09 @alta @api
    Cenário: Fórmula do total em carrinhos variados
      Dado 40 carrinhos aleatórios, de 1 a 4 produtos, de 1 a 5 unidades, com e sem cupom
      Quando calculo cada carrinho na API
      Então subtotal, desconto, frete, faltante e total batem com um cálculo independente
      # Nenhum dos 40 caiu exatamente em R$ 200,00; esse caso é coberto pelo CT12.

    @CT17 @CA11 @media @api @postman
    Cenário: Valores arredondados para 2 casas decimais
      Dado que o carrinho tem 3 "Camiseta Essencial" (59,90 × 3 = 179,70)
      Quando aplico o cupom "BEMVINDO10"
      Então nenhum valor da resposta tem mais de 2 casas decimais
      E o total é R$ 181,63

    @CT29 @CA01 @CA06 @alta @ui @playwright
    Cenário: Os valores da tela são os mesmos devolvidos pela API
      Dado que o carrinho tem 1 "Calça Jeans Slim" e 2 "Boné Aba Curva"
      Quando aplico o cupom "BEMVINDO10"
      Então subtotal, desconto, frete e total exibidos são iguais aos da resposta de /api/carrinho/calcular
      E batem com o exemplo da documentação (239,70 − 23,97 + 0 = 215,73)

    @CT30 @CA01 @media @ui @BUG03
    Cenário: A comunicação da promoção na home segue a regra do cupom
      Quando acesso a página inicial
      Então o texto do cupom BEMVINDO10 não traz restrições que não existem na regra


  Regra: Limite de quantidade por produto
    Como loja
    Quero limitar cada produto a 5 unidades por pedido
    Para cumprir a regra comercial da entrega

    @CT18 @CA10 @alta @ui @playwright
    Cenário: A interface não deixa passar de 5 unidades
      Quando adiciono 5 unidades de "Camiseta Essencial" pela vitrine
      Então o botão "Adicionar ao carrinho" fica desabilitado com "Limite de 5 unidades atingido."
      E no carrinho o botão "+" fica desabilitado com "Limite de 5 unidades por produto."

    @CT19 @CA10 @alta @api @postman @BUG02
    Esquema do Cenário: A API aplica o limite de 5 unidades a cada produto
      Quando envio <itens> para "<endpoint>"
      Então a API responde <status>

      Exemplos:
        | itens                 | endpoint               | status                         | resultado |
        | 1 × P001              | /api/carrinho/calcular | 200                            | passou    |
        | 5 × P001              | /api/carrinho/calcular | 200                            | passou    |
        | 5 × P001 e 5 × P002   | /api/carrinho/calcular | 200 (limite é por produto)     | passou    |
        | 6 × P001              | /api/carrinho/calcular | 422 QUANTIDADE_MAXIMA_EXCEDIDA | falhou    |
        | 6 × P001              | /api/pedidos           | 422 QUANTIDADE_MAXIMA_EXCEDIDA | falhou    |

    @CT20 @CA10 @media @api @postman
    Esquema do Cenário: Quantidade que não é inteiro maior ou igual a 1
      Quando envio a quantidade <quantidade> para o cálculo do carrinho
      Então a API responde 422 com o código "QUANTIDADE_INVALIDA"

      Exemplos:
        | quantidade  |
        | 0           |
        | -1          |
        | 1.5         |
        | "2" (texto) |
        | ausente     |


  Regra: Transições de estado do carrinho
    Como cliente da Verzel Store
    Quero que o carrinho recalcule tudo quando eu mudar alguma coisa
    Para nunca ver um valor antigo ou um desconto que não vale mais

    @CT33 @CA01 @CA07 @alta @ui @playwright
    Cenário: Alterar a quantidade com o cupom aplicado recalcula todos os valores
      Dado que o carrinho tem 1 "Camiseta Essencial" e o cupom "BEMVINDO10" aplicado
      Quando aumento a quantidade para 2
      Então o subtotal é R$ 119,80, o desconto R$ 11,98, o frete R$ 19,90 e o total R$ 127,72
      E vejo "Faltam R$ 80,20 para o frete grátis."
      Quando diminuo a quantidade para 1
      Então o desconto volta a R$ 5,99 e o total a R$ 73,81

    @CT34 @CA01 @CA06 @alta @ui @playwright
    Cenário: Remover um produto com o cupom aplicado recalcula todos os valores
      Dado que o carrinho tem 1 "Camiseta Essencial", 1 "Calça Jeans Slim" e o cupom "BEMVINDO10" aplicado
      E o subtotal é R$ 199,80 com desconto de R$ 19,98
      Quando removo a "Calça Jeans Slim"
      Então o subtotal é R$ 59,90, o desconto R$ 5,99, o frete R$ 19,90 e o total R$ 73,81
      E o cupom continua aplicado

    @CT35 @CA05 @media @ui @playwright
    Cenário: Recarregar a página mantém o carrinho e o cupom da aba
      # "Sobre este ambiente": o carrinho fica guardado na aba do navegador.
      Dado que o carrinho tem 1 "Camiseta Essencial" e o cupom "BEMVINDO10" aplicado
      Quando recarrego a página do carrinho
      Então o item, o cupom e os valores continuam os mesmos

  Regra: Contrato da API
    Como integrador da Verzel Store
    Quero que a API siga o contrato documentado
    Para que a interface e outros clientes possam confiar nas respostas

    @CT21 @media @api @postman
    Cenário: Listar produtos
      Quando consulto GET /api/produtos
      Então recebo 200 com os 8 produtos e os preços da documentação

    @CT22 @media @api @postman
    Esquema do Cenário: Consultar um produto
      Quando consulto GET /api/produtos/<id>
      Então recebo <status>

      Exemplos:
        | id   | status                         |
        | P003 | 200 com o Tênis Casual Urbano  |
        | P999 | 404 PRODUTO_NAO_ENCONTRADO     |

    @CT23 @media @api @postman
    Esquema do Cenário: Validação da lista de itens
      Quando envio para o cálculo do carrinho <itens>
      Então a API responde 422 com o código "<codigo>"

      Exemplos:
        | itens                       | codigo                 |
        | uma lista vazia             | ITENS_OBRIGATORIOS     |
        | um corpo sem "itens"        | ITENS_OBRIGATORIOS     |
        | um item que não é objeto    | ITEM_INVALIDO          |
        | o produto P999              | PRODUTO_NAO_ENCONTRADO |
        | o produto P001 duas vezes   | ITEM_DUPLICADO         |

    @CT24 @baixa @api @postman
    Esquema do Cenário: Erros gerais da API
      Quando envio <requisicao>
      Então a API responde <status> com o código "<codigo>"

      Exemplos:
        | requisicao                          | status | codigo               |
        | um corpo que não é JSON válido      | 400    | JSON_INVALIDO        |
        | GET para /api/nao-existe            | 404    | ROTA_NAO_ENCONTRADA  |
        | GET para /api/carrinho/calcular     | 405    | METODO_NAO_PERMITIDO |


  Regra: Finalização do pedido
    Como cliente da Verzel Store
    Quero informar meus dados e confirmar o pedido
    Para receber os produtos e pagar na entrega

    @CT25 @CA01 @CA06 @alta @ui @api @playwright @postman
    Cenário: Pedido com cupom confirmado com os mesmos valores do carrinho
      Dado que o carrinho tem 1 "Calça Jeans Slim", 2 "Boné Aba Curva" e o cupom "BEMVINDO10"
      Quando informo "Maria Silva", "maria@exemplo.com", "01310-100" e confirmo o pedido
      Então a API responde 201 com um número no formato "VZ-000000"
      E vejo "Pedido confirmado" com subtotal R$ 239,70, desconto R$ 23,97, frete grátis e total R$ 215,73

    @CT26 @RE01 @RE02 @RE03 @media @ui @playwright
    Cenário: Dados do cliente inválidos bloqueiam o pedido na tela
      Quando confirmo o pedido com os campos vazios
      Então vejo "Informe o nome completo.", "Informe o e-mail." e "Informe o CEP."
      Quando informo "Maria", "maria@" e "0131010"
      Então vejo "Informe nome e sobrenome.", "Informe um e-mail válido." e "Informe um CEP com 8 dígitos."
      E nenhum pedido é enviado para a API

    @CT27 @RE01 @RE02 @RE03 @media @api @postman
    Esquema do Cenário: Dados do cliente inválidos na API
      Quando envio um pedido com <dado>
      Então a API responde 422 "DADOS_INVALIDOS" com "<mensagem>" para o campo "<campo>"

      Exemplos:
        | dado                     | campo         | mensagem                      |
        | nome "Maria"             | cliente.nome  | Informe nome e sobrenome.     |
        | e-mail "maria@"          | cliente.email | Informe um e-mail válido.     |
        | CEP "0131010"            | cliente.cep   | Informe um CEP com 8 dígitos. |
        | CEP "013101-00"          | cliente.cep   | Informe um CEP com 8 dígitos. |

    @CT28 @RE03 @media @api @postman
    Cenário: CEP com ou sem hífen é aceito
      Quando envio um pedido com o CEP "01310100"
      Então a API responde 201
      E o CEP volta normalizado como "01310100"

    @CT32 @RE01 @RE02 @baixa @api @postman @BUG04 @BUG05
    Esquema do Cenário: Casos de borda de nome e e-mail
      # Interpretação AMB12. Regras anteriores à entrega.
      Quando envio um pedido com <dado>
      Então a API responde 422 "DADOS_INVALIDOS" para o campo "<campo>"

      Exemplos:
        | dado                          | campo         | resultado |
        | nome "123 456"                | cliente.nome  | falhou    |
        | e-mail "maria@exemplo..com"   | cliente.email | falhou    |

    @CT36 @CA03 @CA04 @media @ui @playwright
    Esquema do Cenário: Pedido recusado pela API não mostra confirmação
      # A API real só recusa cupom no pedido se a tela deixar passar; aqui a resposta é simulada.
      Dado que estou no checkout com 1 "Camiseta Essencial" e o cupom "BEMVINDO10"
      E a API de pedidos vai responder <status>
      Quando confirmo o pedido com dados válidos
      Então continuo no checkout e vejo "<mensagem>"
      E o carrinho continua com o item e o cupom

      Exemplos:
        | status                 | mensagem                                              |
        | 422 CUPOM_EXPIRADO     | Cupom expirado.                                       |
        | 500 (erro do servidor) | Não foi possível confirmar o pedido. Tente novamente. |
