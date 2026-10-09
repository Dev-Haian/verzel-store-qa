# 1. Análise da documentação

Antes de escrever os cenários, li a [documentação da entrega](https://verzel-store.qa-test-verzel-store.workers.dev/documentacao) (card **VZS-142**, versão 2.3.0, publicada em 30/09/2026, status "Pronto para teste") e extraí as regras de negócio, o que é limitação proposital do ambiente e os pontos ambíguos.

**Resumo da entrega:** aplicação de cupom de desconto no carrinho e regra de frete grátis. Os cálculos são feitos pela API e a interface apenas exibe o resultado. Por isso a estratégia testa **as duas camadas** e compara uma com a outra.

## 1.1 O que é limitação do ambiente (não é bug)

Segundo a seção "Sobre este ambiente", estes comportamentos são esperados e **não** foram reportados:

- O carrinho fica guardado só na aba do navegador. Outra aba, outro navegador ou janela anônima começam vazios.
- Os pedidos não são armazenados. O número gerado é fictício e não há consulta de pedidos (por isso `GET /api/pedidos` responder 405 é esperado).
- Nenhum e-mail é enviado e nenhuma cobrança é feita.
- Produtos, preços e cupons são fixos e iguais para todos. Não existe controle de estoque.
- A API não guarda nada entre uma chamada e outra.
- Fora do escopo: login, cadastro de clientes, pagamento online e consulta de pedidos.
- Fora do escopo pelas regras do teste: carga, estresse e segurança.

## 1.2 Regras de negócio

Usei os próprios IDs dos critérios de aceite (CA) como regra, para a rastreabilidade ficar direta. As regras que já existiam antes da entrega receberam o prefixo **RE**.

| ID | Regra | Fonte |
|---|---|---|
| CA01 | BEMVINDO10 dá 10% de desconto sobre o **subtotal dos produtos** | Critérios de aceite |
| CA02 | Código não diferencia maiúsculas/minúsculas; espaços no início e no fim são ignorados | Critérios de aceite |
| CA03 | Cupom inexistente → "Cupom inválido." e nenhum desconto | Critérios de aceite |
| CA04 | Cupom fora da validade → "Cupom expirado." e nenhum desconto | Critérios de aceite |
| CA05 | Um cupom por vez; para trocar, remove o atual e aplica outro | Critérios de aceite |
| CA06 | Frete grátis com subtotal **a partir de R$ 200,00, inclusive** | Critérios de aceite + Regras de cálculo |
| CA07 | Abaixo de R$ 200,00: frete fixo R$ 19,90 e o carrinho informa quanto falta (`200 − subtotal`, nunca < 0) | Critérios de aceite + Regras de cálculo |
| CA08 | Frete grátis considera o subtotal **antes** do desconto | Critérios de aceite |
| CA09 | Desconto não incide sobre o frete | Critérios de aceite |
| CA10 | Máximo de 5 unidades por produto, **na interface e na API** | Critérios de aceite + Códigos de erro (`QUANTIDADE_MAXIMA_EXCEDIDA`) |
| CA11 | Todos os valores arredondados para 2 casas | Critérios de aceite |
| — | `total = subtotal − desconto + frete` | Regras de cálculo |
| RE01 | Nome do cliente com nome e sobrenome | Outras regras da loja |
| RE02 | E-mail em formato válido | Outras regras da loja |
| RE03 | CEP com 8 dígitos, com ou sem hífen | Outras regras da loja |
| RE04 | Pagamento na entrega, sem etapa online | Outras regras da loja |

**Dados de teste:** 8 produtos (P001 a P008) e 2 cupons: `BEMVINDO10` (10%, válido) e `VERAO2026` (15%, expirado em 31/03/2026).

**Combinações úteis para valor-limite**, já que todos os preços terminam em ,90 ou ,00:

| Subtotal | Carrinho | Por quê |
|---|---|---|
| R$ 199,40 | P006 × 5 + P004 | logo abaixo do limite |
| R$ 199,80 | P001 + P002 | o mais perto possível abaixo do limite (faltam R$ 0,20) |
| **R$ 200,00** | P005 × 2 · P008 × 4 · P005 + P008 × 2 | **exatamente no limite** |
| R$ 219,80 | P003 + P006 | acima do limite |

## 1.3 API

| Método | Endpoint | Para que serve | Observações |
|---|---|---|---|
| GET | `/api/produtos` | Lista os produtos | 200 |
| GET | `/api/produtos/{id}` | Consulta um produto | 200 ou 404 `PRODUTO_NAO_ENCONTRADO` |
| POST | `/api/carrinho/calcular` | Calcula o carrinho sem gravar | Cupom inválido/expirado **não** é erro: 200, sem desconto, motivo em `cupom.mensagem` |
| POST | `/api/pedidos` | Valida e confirma o pedido | 201 com número `VZ-000000`; cupom inválido/expirado **é** erro 422 |

Erros sempre no formato `{ "erro": { "codigo", "mensagem", "campo" } }`, com 11 códigos documentados (400, 404, 405 e 422).

## 1.4 Ambiguidades e interpretações

As regras do teste pedem que, diante de ambiguidade, eu registre a minha interpretação e siga em frente.

| ID | Situação ambígua | Minha interpretação | Por quê |
|---|---|---|---|
| AMB01 | A home diz "**na primeira compra**, o cupom BEMVINDO10 dá 10%". O CA01 não restringe à primeira compra, e o ambiente nem guarda pedidos. | Vale o CA01: o cupom funciona em qualquer compra. O texto da home é uma divergência de comunicação e foi reportado (BUG03). | A documentação da entrega é a especificação; a regra "primeira compra" nem é verificável aqui. |
| AMB02 | CA02 fala de espaços "no início e no fim". E espaço no meio, tab, quebra de linha? | Espaço no meio = cupom inválido. Tab e quebra de linha nas pontas contam como espaço e são ignorados. | Leitura literal do CA02. A API se comportou assim. |
| AMB03 | Cupom vazio ou só com espaços: é "sem cupom" ou "Cupom inválido."? | Na tela, pede "Informe um cupom." sem chamar a API. Na API, é tratado como sem cupom. | É o comportamento mais amigável e não gera desconto indevido. Registrei a diferença da API (vazio → `cupom: null`; só espaços → "Cupom inválido.") como observação. |
| AMB04 | CA05 não diz **como** a tela impede o segundo cupom. | Qualquer forma que impeça é válida. A loja esconde o campo e mostra "Remover cupom". | O critério é sobre o resultado, não sobre o componente. |
| AMB05 | CA07 não define o texto do "quanto falta". | Aceito qualquer texto que mostre o valor certo (`200 − subtotal`). A loja usa "Faltam R$ X para o frete grátis." | — |
| AMB06 | O "quanto falta" é calculado sobre o subtotal, mas a tela mostra o total com frete logo acima (ex.: total R$ 199,60 e "Faltam R$ 20,30"). | Está correto pela regra. Registrei como sugestão de melhoria de usabilidade, não como bug. | Cumpre CA07/CA08, mas confunde quem compara com o total. |
| AMB07 | CA11 não diz o método de arredondamento (meio para cima ou bancário) nem em que etapa arredondar. | Arredondar cada valor exibido para 2 casas, meio para cima. | Com os preços atuais, 10% de qualquer subtotal já dá 2 casas exatas, então o risco real é erro de ponto flutuante (ex.: 59,90 × 3). Conferi isso. |
| AMB08 | Validade do VERAO2026 ("expirado em 31/03/2026"): o dia 31 vale? Qual fuso? | Não testável: os dados são fixos e a data já passou. Fica como pergunta para o time. | — |
| AMB09 | Mensagens do CA03/CA04 valem também para `cupom.mensagem` da API? | Sim. A API usa exatamente "Cupom inválido." e "Cupom expirado." | Consistência entre camadas. |
| AMB10 | Prioridade entre erros quando há vários problemas no mesmo pedido não é definida. | Qualquer ordem é aceitável, desde que um erro documentado seja retornado. A API valida os dados do cliente primeiro e lista todos os campos inválidos juntos. | — |
| AMB11 | `DADOS_INVALIDOS` diz que os detalhes vêm em `campos`, mas o único exemplo de erro mostra `campo`. | `campos` é uma lista de `{ campo, mensagem }`. A API seguiu isso. | — |
| AMB12 | O que é "nome e sobrenome" e "e-mail válido" não está definido. | Nome: pelo menos duas palavras com letras. E-mail: formato usual `usuario@dominio.tld`. | Com essa leitura, "123 456" e `maria@exemplo..com` deveriam ser recusados (BUG04, BUG05, severidade baixa, regras anteriores à entrega). "Maria S" é recusado pela loja e deixei como ponto em aberto. |
| AMB13 | O que acontece com o cupom quando o carrinho fica vazio? | O cupom deveria sair junto, como acontece no "Esvaziar carrinho". | Ao remover os itens um a um, o cupom continua aplicado (BUG06). |

## 1.5 Estratégia

- **Prioridade:** regras de cálculo (valor errado = prejuízo ou reclamação) > fluxo de compra > mensagens e usabilidade.
- **Técnicas:** particionamento de equivalência, **análise de valor-limite** nos R$ 200,00 e nas 5 unidades, testes negativos, conferência de 40 carrinhos aleatórios contra um cálculo independente e sessões de teste exploratório.
- **Camadas:** interface (Playwright) e API (Postman/Newman), conferindo se o valor exibido na tela é o mesmo retornado pela API e o mesmo de um cálculo independente da regra, feito em centavos inteiros (`tests/ui/support/calculo.ts`).
- **Transições de estado:** alterar a quantidade, remover produto e recarregar com o cupom aplicado, além do tratamento de erro da API no pedido, onde costumam aparecer defeitos que testes isolados não pegam.
- **Classificação dos achados:** separo defeito confirmado (viola regra escrita), divergência entre fontes (decisão de Produto) e achado a confirmar (requisito não definido), para não apresentar suposição como requisito.
- **Fora do escopo:** carga, estresse e segurança (regra do teste). As chamadas foram feitas com intervalo entre elas para não sobrecarregar o ambiente compartilhado.
