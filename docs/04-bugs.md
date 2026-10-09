# 4. Bugs encontrados

> 📊 Os bugs também estão no [painel de resultados](https://verzel-store-qa-painel.lovable.app), aba **Bugs**, com as evidências de cada um.

**Severidade** (impacto no negócio): Crítica · Alta · Média · Baixa
**Prioridade** (urgência sugerida de correção): P1 · P2 · P3
**Classificação** (o quanto o requisito sustenta o achado):
- **Defeito confirmado:** viola uma regra escrita na documentação.
- **Divergência (decisão de Produto):** duas fontes oficiais dizem coisas diferentes, e o Produto precisa decidir qual vale.
- **A confirmar (requisito não definido):** o comportamento parece errado, mas a regra não define o resultado esperado. Registrei a minha interpretação, e o achado só vira defeito depois de confirmado.

**Ambiente de todos os bugs:** https://verzel-store.qa-test-verzel-store.workers.dev · Chromium 141 · API via Postman/Newman · 08/10/2026

## Resumo

| ID | Título | Classificação | Severidade | Prioridade | Cenário | Regra | Status |
|---|---|---|---|---|---|---|---|
| [BUG01](#bug01) | Frete de R$ 19,90 é cobrado quando o subtotal é exatamente R$ 200,00 | **Defeito confirmado** | **Alta** | P1 | CT12 | CA06 | Aberto |
| [BUG02](#bug02) | API aceita mais de 5 unidades do mesmo produto | **Defeito confirmado** | **Alta** | P1 | CT19 | CA10 | Aberto |
| [BUG03](#bug03) | Home anuncia BEMVINDO10 só "na primeira compra", regra que não existe na entrega | Divergência (decisão de Produto) | Média | P2 | CT30 | CA01 | Aberto · aguardando Produto |
| [BUG04](#bug04) | Nome formado só por números é aceito como nome e sobrenome | A confirmar (requisito não definido) | Baixa | P3 | CT32 | RE01 | Aberto · aguardando confirmação |
| [BUG05](#bug05) | E-mail com pontos seguidos no domínio é aceito | **Defeito confirmado** | Baixa | P3 | CT32 | RE02 | Aberto |
| [BUG06](#bug06) | Cupom continua aplicado depois de remover todos os itens um a um | A confirmar (requisito não definido) | Baixa | P3 | CT31 | CA05 | Aberto · aguardando confirmação |

**Em números:** 6 achados, sendo **3 defeitos confirmados** (BUG01, BUG02, BUG05), **1 divergência** que depende de decisão de Produto (BUG03) e **2 achados a confirmar** (BUG04, BUG06). Mantive os IDs dos 6 para não quebrar a rastreabilidade com os cenários, a automação e as evidências.

**Recomendação:** a entrega **não deve ir para produção** antes da correção do BUG01 e do BUG02. O BUG01 cobra frete do cliente exatamente no valor anunciado pela campanha, e o BUG02 deixa a API aceitar pedidos que a regra proíbe. O BUG05 pode entrar no próximo ciclo. O BUG03, o BUG04 e o BUG06 dependem primeiro de uma definição do Produto sobre o resultado esperado.

---

<a id="bug01"></a>
## BUG01 · Frete de R$ 19,90 é cobrado quando o subtotal é exatamente R$ 200,00

| | |
|---|---|
| **Classificação** | **Defeito confirmado**. Viola o texto da CA06 e a tabela de Regras de cálculo. |
| **Severidade** | Alta |
| **Prioridade** | P1 |
| **Onde** | API (`/carrinho/calcular` e `/pedidos`) e, por consequência, carrinho, checkout e confirmação |
| **Regra violada** | CA06 "O frete é grátis para compras com subtotal a partir de R$ 200,00, **inclusive**" e Regras de cálculo "R$ 0,00 quando o subtotal é **igual ou maior** que R$ 200,00" |
| **Cenário** | CT12 |
| **Frequência** | Sempre |

**Passos para reproduzir**
1. Na vitrine, adicione 2 unidades de "Mochila Urbana 20L" (R$ 100,00 cada).
2. Abra o carrinho.

**Resultado esperado**
Subtotal R$ 200,00 · Frete **Grátis** · Total **R$ 200,00**, sem mensagem de "quanto falta".

**Resultado obtido**
Subtotal R$ 200,00 · Frete **R$ 19,90** · Total **R$ 219,90** e a mensagem "**Faltam R$ 0,00** para o frete grátis."

**Evidências**
- [Carrinho com R$ 200,00](evidencias/ui/CT12_BUG01_frete_200.png)
- [Carrinho com R$ 200,00 e cupom](evidencias/ui/BUG01_200_com_cupom.png): total R$ 199,90, quando deveria ser R$ 180,00.
- Requisição na API:
```http
POST /api/carrinho/calcular
{ "itens": [ { "produtoId": "P005", "quantidade": 2 } ] }
```
```json
{ "subtotal": 200, "desconto": 0, "frete": 19.9, "freteGratis": false,
  "valorFaltanteFreteGratis": 0, "total": 219.9, "cupom": null }
```

**Impacto**
O cliente que monta o carrinho para atingir exatamente o valor da campanha paga R$ 19,90 a mais. O pedido (`POST /api/pedidos`) é confirmado com o frete cobrado. A resposta também é incoerente: `freteGratis: false` com `valorFaltanteFreteGratis: 0`.

**Observações**
- Reproduz com outras combinações de R$ 200,00 (P008 × 4; P005 + P008 × 2). Com R$ 199,80 o frete é cobrado (correto), e com R$ 219,80 é grátis (correto). O erro está só no "inclusive".
- Causa provável: comparação `subtotal > 200` em vez de `subtotal >= 200`. O cálculo do "faltante" usa a fórmula certa, por isso mostra R$ 0,00.
- Como a interface só exibe o que a API calcula, a correção é no backend.

---

<a id="bug02"></a>
## BUG02 · API aceita mais de 5 unidades do mesmo produto

| | |
|---|---|
| **Classificação** | **Defeito confirmado**. Viola a CA10, que diz explicitamente que a regra vale para a API, e o código de erro documentado nunca é retornado. |
| **Severidade** | Alta |
| **Prioridade** | P1 |
| **Onde** | API (`/carrinho/calcular` e `/pedidos`). A interface bloqueia corretamente (CT18). |
| **Regra violada** | CA10 "Cada produto pode ter no máximo 5 unidades por pedido. A regra vale para a interface **e para a API**." e o código documentado `422 QUANTIDADE_MAXIMA_EXCEDIDA` |
| **Cenário** | CT19 |
| **Frequência** | Sempre |

**Passos para reproduzir**
1. Envie para a API:
```http
POST /api/pedidos
{ "cliente": { "nome": "Maria Silva", "email": "maria@exemplo.com", "cep": "01310-100" },
  "itens": [ { "produtoId": "P001", "quantidade": 6 } ] }
```

**Resultado esperado**
`422` com `{ "erro": { "codigo": "QUANTIDADE_MAXIMA_EXCEDIDA", "campo": "itens[0].quantidade", ... } }`

**Resultado obtido**
`201`, pedido confirmado com 6 unidades:
```json
{ "numero": "VZ-623880", "itens": [ { "produtoId": "P001", "quantidade": 6, "total": 359.4 } ],
  "subtotal": 359.4, "frete": 0, "freteGratis": true, "total": 359.4 }
```
O mesmo acontece em `/api/carrinho/calcular`, que responde `200`, e com quantidades maiores: 1.000 unidades deram subtotal R$ 59.900,00.

**Evidências**
- [Relatório Newman](evidencias/api/relatorio-newman.html), requisições "CT19 · Quantidade 6 …".

**Impacto**
Qualquer cliente da API, ou alguém que altere a requisição da tela, consegue confirmar pedidos que a regra comercial proíbe. O código de erro `QUANTIDADE_MAXIMA_EXCEDIDA` está documentado, mas nunca é retornado.

**Observações**
A validação existe só no front-end. As outras validações de quantidade (0, negativa, decimal, texto, ausente) funcionam na API (CT20).

---

<a id="bug03"></a>
## BUG03 · Home anuncia BEMVINDO10 só "na primeira compra", regra que não existe na entrega

| | |
|---|---|
| **Classificação** | **Divergência (decisão de Produto)**. O banner e a documentação da entrega dizem coisas diferentes. Assumi a documentação como fonte (AMB01), mas o Produto precisa decidir qual texto vale: corrigir o banner ou incluir e implementar a regra de primeira compra. |
| **Severidade** | Média |
| **Prioridade** | P2 |
| **Onde** | Interface, banner da página inicial |
| **Regra violada** | CA01 "O cupom BEMVINDO10 aplica 10% de desconto sobre o subtotal dos produtos", sem restrição de primeira compra |
| **Cenário** | CT30 |

**Passos para reproduzir**
1. Acesse a página inicial.
2. Leia o banner: "E **na primeira compra**, o cupom BEMVINDO10 dá 10% de desconto nos produtos."

**Resultado esperado**
O texto da promoção segue a regra documentada, sem restrição de primeira compra (ou a documentação passa a incluir a regra e ela é implementada).

**Resultado obtido**
O banner diz "na primeira compra", mas o cupom funciona em qualquer compra e o sistema nem tem como saber qual é a primeira, já que não guarda pedidos nem clientes.

**Evidências**
- [Banner da home](evidencias/ui/BUG03_banner_primeira_compra.png)

**Impacto**
Comunicação comercial divergente da regra. Pode afastar clientes recorrentes ou gerar reclamação se a regra for aplicada depois. Precisa de decisão de produto: corrigir o texto ou a documentação.

---

<a id="bug04"></a>
## BUG04 · Nome formado só por números é aceito como nome e sobrenome

| | |
|---|---|
| **Classificação** | **A confirmar (requisito não definido)**. A RE01 pede "nome e sobrenome" mas não define quais caracteres são válidos. Pela minha interpretação (AMB12), um nome precisa ter letras. Vira defeito se o Produto confirmar esse critério. |
| **Severidade** | Baixa |
| **Prioridade** | P3 |
| **Onde** | API (`/pedidos`) e checkout (que usa a mesma validação) |
| **Regra violada** | RE01 "O nome do cliente precisa ter nome e sobrenome" (regra anterior à entrega; interpretação AMB12) |
| **Cenário** | CT32 |

**Passos para reproduzir**
1. Envie um pedido com `"nome": "123 456"` (ou `"Maria 123"`) e os demais dados válidos.

**Resultado esperado**
`422 DADOS_INVALIDOS` com "Informe nome e sobrenome." em `cliente.nome`.

**Resultado obtido**
`201`, pedido confirmado com o nome "123 456".

**Evidências**
- [Relatório Newman](evidencias/api/relatorio-newman.html), requisição "CT32 · Nome só com números …".

**Impacto**
Dados de entrega de baixa qualidade. Severidade baixa porque a regra é anterior à entrega e não afeta o cálculo.

**Observações**
A validação parece só contar palavras: "Maria" e "Maria-Silva" são recusados, e "123 456" é aceito.

---

<a id="bug05"></a>
## BUG05 · E-mail com pontos seguidos no domínio é aceito

| | |
|---|---|
| **Classificação** | **Defeito confirmado**. Pontos seguidos no domínio e ponto no início da parte local não formam um e-mail válido em nenhuma definição usual (RFC 5322 / validação HTML). Formatos inválidos reproduzidos: `maria@exemplo..com`, `.maria@exemplo.com`. |
| **Severidade** | Baixa |
| **Prioridade** | P3 |
| **Onde** | API (`/pedidos`) e checkout |
| **Regra violada** | RE02 "O e-mail precisa ter um formato válido" |
| **Cenário** | CT32 |

**Passos para reproduzir**
1. Envie um pedido com `"email": "maria@exemplo..com"` e os demais dados válidos.

**Resultado esperado**
`422 DADOS_INVALIDOS` com "Informe um e-mail válido." em `cliente.email`.

**Resultado obtido**
`201`, pedido confirmado. O mesmo acontece com `.maria@exemplo.com`, que começa com ponto.

**Evidências**
- [Relatório Newman](evidencias/api/relatorio-newman.html), requisição "CT32 · E-mail com pontos seguidos …".

**Impacto**
E-mail impossível de entregar fica gravado no pedido. A validação recusa os casos comuns (sem `@`, sem domínio, sem TLD, com espaço, `@@`), mas não esses.

---

<a id="bug06"></a>
## BUG06 · Cupom continua aplicado depois de remover todos os itens um a um

| | |
|---|---|
| **Classificação** | **A confirmar (requisito não definido)**. Nenhuma regra diz o que acontece com o cupom quando o carrinho fica vazio. O achado é a inconsistência entre "Remover" item a item e "Esvaziar carrinho" (AMB13). Vira defeito quando o Produto definir o comportamento esperado. |
| **Severidade** | Baixa |
| **Prioridade** | P3 |
| **Onde** | Interface, carrinho |
| **Regra relacionada** | CA05 (ciclo de vida do cupom); interpretação AMB13 |
| **Cenário** | CT31 |

**Passos para reproduzir**
1. Adicione "Mochila Urbana 20L" e aplique o cupom BEMVINDO10.
2. Clique em "Remover" no item. O carrinho fica vazio.
3. Adicione "Garrafa Térmica 750ml" e abra o carrinho.

**Resultado esperado**
Carrinho sem cupom, igual ao que acontece ao usar "Esvaziar carrinho".

**Resultado obtido**
O cupom BEMVINDO10 continua aplicado e o desconto já aparece (−R$ 5,00). Pelo "Esvaziar carrinho", o cupom é removido.

**Evidências**
- [1. Carrinho vazio após remover o item](evidencias/ui/BUG06_1_carrinho_vazio.png)
- [2. Novo produto já entra com o cupom](evidencias/ui/BUG06_2_cupom_continua_aplicado.png)
- [3. Pelo "Esvaziar carrinho" o cupom sai](evidencias/ui/BUG06_3_esvaziar_remove_cupom.png)

**Impacto**
Comportamento inconsistente entre duas formas de esvaziar o carrinho. Hoje o impacto é pequeno, porque só existe um cupom válido e ele não tem restrição. Passa a importar se surgirem cupons com regras (valor mínimo, primeira compra).

---

## Observações (não são bugs)

Pontos que não violam uma regra escrita, mas merecem conversa com o time:

| ID | Observação |
|---|---|
| OBS01 | A mensagem "Faltam R$ X" logo abaixo do total com frete confunde (ex.: total R$ 199,60 e "Faltam R$ 20,30"). A regra está correta; sugestão: deixar claro que o valor se refere aos produtos. |
| OBS02 | `GET /api` devolve a página HTML da loja (200) em vez de um JSON `404 ROTA_NAO_ENCONTRADA`. As demais rotas inexistentes em `/api/*` respondem certo. |
| OBS03 | A API aceita cupom que não é texto (lista ou número) e converte para texto (`"BEMVINDO10,VERAO2026"`) em vez de recusar o tipo. |
| OBS04 | Na API, cupom `""` vira `cupom: null`, mas cupom `"   "` volta como "Cupom inválido." com código vazio. Comportamentos diferentes para casos equivalentes. |
| OBS05 | CEP enviado como número (`1310100`) retorna "Informe o CEP.", como se estivesse vazio; a mensagem esperada seria sobre o formato. |
| OBS06 | A API aceita requisições sem o cabeçalho `Content-Type: application/json`, que a documentação pede. |
| OBS07 | "Maria S" é recusado como nome sem sobrenome. A regra não diz se sobrenome de uma letra vale; fica como pergunta. |
