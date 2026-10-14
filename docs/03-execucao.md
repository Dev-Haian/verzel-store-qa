# 3. Execução dos testes

> 📊 **Visualização interativa desta execução:** [verzel-store-qa-painel.lovable.app](https://verzel-store-qa-painel.lovable.app). O painel traz todos os cenários, bugs, observações e evidências desta página, com filtros e gráficos.

| | |
|---|---|
| **Ambiente** | https://verzel-store.qa-test-verzel-store.workers.dev |
| **Entrega** | VZS-142 · versão 2.3.0 |
| **Navegador** | Chromium 141 (Playwright 1.63) · resolução 1280 × 720 e 1280 × 900 |
| **API** | Postman (collection em `postman/`) executada com Newman 6.2 |
| **Data** | 08/10/2026 (execução inicial) e 09/10/2026 (reexecução completa após a revisão técnica) |
| **Executado por** | Haian Vilas Boas |

Legenda: ✅ Passou · ❌ Falhou · ⛔ Bloqueado

## 3.1 Resumo

| Cenários | ✅ Passou | ❌ Falhou | ⛔ Bloqueado | Achados | Observações |
|---|---|---|---|---|---|
| 36 | 31 | 5 | 0 | 6: 3 defeitos confirmados · 1 divergência · 2 a confirmar (severidade: alta 2 · média 1 · baixa 3) | 7 |

**Automação** (última execução: 09/10/2026)
- **Validação do Gherkin:** `docs/02-cenarios.feature` passa no parser oficial (`@cucumber/gherkin`, idioma pt), com 6 regras e 36 cenários.
- **Playwright (interface):** 24 testes, 24 passam e 0 falham, sem testes instáveis. Não há `test.fail()`. O BUG01 tem um teste próprio, no bloco "Bugs conhecidos", que afirma o comportamento atual (frete cobrado com R$ 200,00). Ele passa enquanto o bug existir e falha quando o bug for corrigido. Assim, um erro de navegação ou de tela nunca é confundido com "falha esperada".
- **Postman/Newman (API):** 48 requisições e 289 asserções. Falham 7 requisições, todas marcadas com `[BUG01]`, `[BUG02]`, `[BUG04]` ou `[BUG05]`, e há 0 falhas inesperadas. O `scripts/api.mjs` aplica essa política: qualquer falha fora dos bugs conhecidos, ou um bug conhecido que passe a funcionar, reprova a execução. Relatório: [evidencias/api/relatorio-newman.html](evidencias/api/relatorio-newman.html) (baixe e abra no navegador).

A fonte oficial destes resultados é o [resultados.json](resultados.json). As contagens acima são calculadas a partir dele pelo `scripts/gerar-dados-painel.py`, que também confere se o Gherkin, os bugs e as evidências estão consistentes entre si.

## 3.2 Cenários executados

| ID | Cenário | Regra | Prioridade | Camada | Execução | Resultado | Bug | Evidência |
|---|---|---|---|---|---|---|---|---|
| CT01 | Cupom válido aplica 10% sobre o subtotal | CA01 | Alta | UI + API | Playwright + Postman | ✅ Passou | — | [1](evidencias/ui/CT01_cupom_valido.png) · [2](evidencias/api/relatorio-newman.html) |
| CT02 | Código não diferencia maiúsculas de minúsculas | CA02 | Alta | UI + API | Playwright + Postman | ✅ Passou | — | [1](evidencias/ui/CT02_cupom_normalizado.png) · [2](evidencias/api/relatorio-newman.html) |
| CT03 | Espaços no início e no fim são ignorados | CA02 | Média | UI + API | Playwright + Postman | ✅ Passou | — | [1](evidencias/ui/CT03_cupom_normalizado.png) · [2](evidencias/api/relatorio-newman.html) |
| CT04 | Espaço no meio do código torna o cupom inválido | CA02 | Baixa | API | Postman | ✅ Passou | — | [1](evidencias/api/relatorio-newman.html) |
| CT05 | Cupom inexistente mostra "Cupom inválido." | CA03 | Alta | UI + API | Playwright + Postman | ✅ Passou | — | [1](evidencias/ui/CT05_cupom_xpto.png) · [2](evidencias/api/relatorio-newman.html) |
| CT06 | Cupom expirado mostra "Cupom expirado." | CA04 | Alta | UI + API | Playwright + Postman | ✅ Passou | — | [1](evidencias/ui/CT06_cupom_verao2026.png) · [2](evidencias/api/relatorio-newman.html) |
| CT07 | Campo vazio pede para informar um cupom | CA03 | Baixa | UI | Playwright | ✅ Passou | — | [1](evidencias/ui/CT07_cupom_vazio.png) |
| CT08 | Apenas um cupom por vez | CA05 | Alta | UI | Playwright | ✅ Passou | — | [1](evidencias/ui/CT08_um_cupom_por_vez.png) |
| CT09 | Remover o cupom e aplicar outro, sem desconto residual | CA05 | Média | UI | Playwright | ✅ Passou | — | [1](evidencias/ui/CT09_trocar_cupom.png) |
| CT10 | Carrinho sem cupom não tem desconto | CA01 | Média | API | Postman | ✅ Passou | — | [1](evidencias/api/relatorio-newman.html) |
| CT11 | Pedido com cupom inválido ou expirado é recusado (422) | CA03, CA04 | Alta | API | Postman | ✅ Passou | — | [1](evidencias/api/relatorio-newman.html) |
| CT12 | Valor-limite do frete grátis (R$ 199,80 / 200,00 / 219,80) | CA06 | Alta | UI + API | Playwright + Postman | ❌ Falhou | [BUG01](04-bugs.md#bug01) | [1](evidencias/ui/CT12_BUG01_frete_200.png) · [2](evidencias/ui/BUG01_200_com_cupom.png) · [3](evidencias/api/relatorio-newman.html) |
| CT13 | Abaixo de R$ 200,00 informa quanto falta | CA07 | Alta | UI + API | Playwright + Postman | ✅ Passou | — | [1](evidencias/ui/CT13_faltante_frete.png) · [2](evidencias/api/relatorio-newman.html) |
| CT14 | Frete grátis usa o subtotal antes do desconto | CA08 | Alta | UI + API | Playwright + Postman | ✅ Passou | — | [1](evidencias/ui/CT14_frete_antes_do_desconto.png) · [2](evidencias/api/relatorio-newman.html) |
| CT15 | Desconto não incide sobre o frete | CA09 | Alta | UI + API | Playwright + Postman | ✅ Passou | — | [1](evidencias/api/relatorio-newman.html) |
| CT16 | Fórmula do total em 40 carrinhos aleatórios | CA01, CA06, CA09 | Alta | API | Playwright (`tests/api`) | ✅ Passou | — | Saída do script na seção 3.4 |
| CT17 | Arredondamento em 2 casas decimais | CA11 | Média | API | Postman | ✅ Passou | — | [1](evidencias/api/relatorio-newman.html) |
| CT18 | Interface limita 5 unidades por produto | CA10 | Alta | UI | Playwright | ✅ Passou | — | [1](evidencias/ui/CT18_limite_vitrine.png) · [2](evidencias/ui/CT18_limite_carrinho.png) |
| CT19 | API aplica o limite de 5 unidades a cada produto | CA10 | Alta | API | Postman | ❌ Falhou | [BUG02](04-bugs.md#bug02) | [1](evidencias/api/relatorio-newman.html) |
| CT20 | Quantidade inválida (0, -1, 1.5, texto, ausente) | CA10 | Média | API | Postman | ✅ Passou | — | [1](evidencias/api/relatorio-newman.html) |
| CT21 | Listar produtos | — | Média | API | Postman | ✅ Passou | — | [1](evidencias/api/relatorio-newman.html) |
| CT22 | Consultar um produto (200 / 404) | — | Média | API | Postman | ✅ Passou | — | [1](evidencias/api/relatorio-newman.html) |
| CT23 | Validação da lista de itens | — | Média | API | Postman | ✅ Passou | — | [1](evidencias/api/relatorio-newman.html) |
| CT24 | Erros gerais (400 / 404 / 405) | — | Baixa | API | Postman | ✅ Passou | — | [1](evidencias/api/relatorio-newman.html) |
| CT25 | Pedido com cupom confirmado com os valores do carrinho | CA01, CA06 | Alta | UI + API | Playwright + Postman | ✅ Passou | — | [1](evidencias/ui/CT25_pedido_confirmado.png) · [2](evidencias/api/relatorio-newman.html) |
| CT26 | Dados do cliente inválidos bloqueiam o pedido na tela | RE01, RE02, RE03 | Média | UI | Playwright | ✅ Passou | — | [1](evidencias/ui/CT26_validacao_cliente.png) |
| CT27 | Dados do cliente inválidos na API | RE01, RE02, RE03 | Média | API | Postman | ✅ Passou | — | [1](evidencias/api/relatorio-newman.html) |
| CT28 | CEP com ou sem hífen é aceito | RE03 | Média | API | Postman | ✅ Passou | — | [1](evidencias/api/relatorio-newman.html) |
| CT29 | Tela, API e regra de negócio chegam aos mesmos valores | CA01, CA06 | Alta | UI | Playwright | ✅ Passou | — | [1](evidencias/ui/CT29_tela_igual_api.png) |
| CT30 | Comunicação da promoção na home segue a regra | CA01 | Média | UI | Manual | ❌ Falhou | [BUG03](04-bugs.md#bug03) | [1](evidencias/ui/BUG03_banner_primeira_compra.png) |
| CT31 | Cupom é removido quando o carrinho fica vazio | CA05 | Baixa | UI | Manual | ❌ Falhou | [BUG06](04-bugs.md#bug06) | [1](evidencias/ui/BUG06_1_carrinho_vazio.png) · [2](evidencias/ui/BUG06_2_cupom_continua_aplicado.png) · [3](evidencias/ui/BUG06_3_esvaziar_remove_cupom.png) |
| CT32 | Casos de borda de nome e e-mail | RE01, RE02 | Baixa | API | Postman | ❌ Falhou | [BUG04](04-bugs.md#bug04), [BUG05](04-bugs.md#bug05) | [1](evidencias/api/relatorio-newman.html) |
| CT33 | Alterar a quantidade com o cupom aplicado recalcula tudo | CA01, CA07 | Alta | UI | Playwright | ✅ Passou | — | [1](evidencias/ui/CT33_quantidade_com_cupom.png) |
| CT34 | Remover um produto com o cupom aplicado recalcula tudo | CA01, CA06 | Alta | UI | Playwright | ✅ Passou | — | [1](evidencias/ui/CT34_remover_produto_com_cupom.png) |
| CT35 | Recarregar a página mantém o carrinho e o cupom da aba | CA05 | Média | UI | Playwright | ✅ Passou | — | Relatório do Playwright |
| CT36 | Pedido recusado pela API (422 / 500) não mostra confirmação | CA03, CA04 | Média | UI | Playwright (API simulada) | ✅ Passou | — | [1](evidencias/ui/CT36_pedido_recusado.png) |

## 3.3 Testes exploratórios

Sessões curtas com um objetivo (charter). Cada uma gerou cenários novos ou bugs.

### Sessão 1 · Limite do frete grátis na interface e na API (30 min)
- **O que fiz:** montei carrinhos com subtotal logo abaixo, exatamente em e acima de R$ 200,00, com e sem cupom. Repeti a mesma combinação na API.
- **O que encontrei:** **BUG01**. Com R$ 200,00 o frete é cobrado e a mensagem diz "Faltam R$ 0,00 para o frete grátis". A API devolve `freteGratis: false` e `valorFaltanteFreteGratis: 0` ao mesmo tempo, então o erro está no backend e chega até o pedido.
- **Dúvidas e ideias:** a mensagem "Faltam R$ 20,30" logo abaixo de um total de R$ 199,60 confunde (OBS01).

### Sessão 2 · Limite de 5 unidades por camada (20 min)
- **O que fiz:** tentei passar de 5 unidades pela vitrine, pelo botão "+" do carrinho e direto na API, em `/carrinho/calcular` e `/pedidos`.
- **O que encontrei:** a interface bloqueia nos dois pontos. A API aceita 6 e até 1.000 unidades, e o pedido é confirmado (**BUG02**).
- **Dúvidas e ideias:** com dois erros no mesmo item (produto duplicado e quantidade 6), a API responde `ITEM_DUPLICADO`. Não é bug, mas a ordem de validação não está documentada (AMB10).

### Sessão 3 · Ciclo de vida do cupom no carrinho (25 min)
- **O que fiz:** apliquei, removi e troquei o cupom; recarreguei a página; alterei quantidades com o cupom aplicado; esvaziei o carrinho pelo link e removendo item a item.
- **O que encontrei:** o cupom sobrevive ao recarregar a página, o que é coerente com o carrinho guardado na aba. Ao remover os itens um a um, o cupom continua aplicado quando um produto novo é adicionado; pelo "Esvaziar carrinho" ele sai (**BUG06**).
- **Dúvidas e ideias:** a home anuncia o cupom "na primeira compra" (**BUG03**).

### Sessão 4 · Formatos de cupom e de dados na API (30 min)
- **O que fiz:** enviei cupom com tab e quebra de linha, vazio, só espaços, `null`, lista e número; nomes, e-mails e CEPs no limite da regra; corpo sem `Content-Type`.
- **O que encontrei:** **BUG04** (nome "123 456" aceito) e **BUG05** (e-mail `maria@exemplo..com` aceito), além das observações OBS02 a OBS07.

## 3.4 Consistência tela × API

| Situação | Tela | API (`/carrinho/calcular`) | Igual? |
|---|---|---|---|
| P002 + P004 × 2 + BEMVINDO10 | 239,70 · −23,97 · Grátis · **215,73** | 239.7 · 23.97 · 0 · **215.73** | ✅ (CT29, automatizado) |
| P001 × 3 | 179,70 · 0,00 · 19,90 · **199,60** · faltam 20,30 | 179.7 · 0 · 19.9 · **199.6** · 20.3 | ✅ |
| P005 × 2 | 200,00 · 0,00 · **19,90** · 219,90 · faltam 0,00 | 200 · 0 · **19.9** · 219.9 · 0 | ✅ iguais, mas os dois errados (BUG01) |
| P007 + BEMVINDO10 | 229,90 · −22,99 · Grátis · **206,91** | 229.9 · 22.99 · 0 · **206.91** | ✅ |
| Checkout → confirmação (CT25) | 215,73 | `/pedidos` 201 · 215.73 | ✅ |

**CT16 · 40 carrinhos aleatórios:** gerei 40 carrinhos (1 a 4 produtos, 1 a 5 unidades, com e sem cupom) e comparei subtotal, desconto, frete, faltante e total da API com um cálculo independente em decimal (arredondamento meio para cima). Resultado: **0 diferenças**. Nenhum carrinho caiu exatamente em R$ 200,00, por isso o CT12 cobre esse ponto separadamente.

> **Atualização pós-feedback (14/10):** na entrega original o CT16 foi rodado por um script exploratório que não ficou versionado. Ele agora está em [`tests/api/ct16-carrinhos-aleatorios.spec.ts`](../tests/api/ct16-carrinhos-aleatorios.spec.ts): carrinhos gerados por **seed** (reproduzíveis), comparação com o mesmo `calcularEsperado` em centavos dos testes de interface e fronteiras fixas (R$ 199,80, R$ 200,00 com o BUG01 e R$ 219,80). Roda no CI com seed fixa (`npm run test:ct16`) e uma vez por dia com seed aleatória (`.github/workflows/ct16-diario.yml`).

