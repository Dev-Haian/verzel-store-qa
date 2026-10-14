# Verzel Store · Teste técnico de QA

Validação da entrega **VZS-142 · cupom de desconto + frete grátis** da Verzel Store, feita como teste técnico para a vaga de QA Júnior na Verzel.

| | |
|---|---|
| **Loja** | https://verzel-store.qa-test-verzel-store.workers.dev/ |
| **Documentação da entrega** | https://verzel-store.qa-test-verzel-store.workers.dev/documentacao |
| **API** | https://verzel-store.qa-test-verzel-store.workers.dev/api |
| **Painel de resultados** | **https://verzel-store-qa-painel.lovable.app** |
| **Autor** | Haian Vilas Boas · [LinkedIn](https://www.linkedin.com/in/haian-vilas-boas-806647221) · [GitHub](https://github.com/Dev-Haian) |

## 📊 Painel de resultados: comece por aqui

### 👉 **[verzel-store-qa-painel.lovable.app](https://verzel-store-qa-painel.lovable.app)**

**Todas as informações deste teste estão no painel**, em uma só tela e sem precisar abrir arquivo por arquivo:

- **Visão geral:** números da execução, taxa de aprovação, recomendação de liberação e gráficos por resultado, severidade e funcionalidade.
- **Cenários:** os 36 cenários em abas por funcionalidade, com o Gherkin de cada um, resultado, regra coberta, camada (UI/API), tipo de execução e evidências.
- **Bugs:** os 6 achados por severidade e classificação (defeito confirmado, divergência ou a confirmar), com a regra, os prints e o link para o report completo, além das 7 observações.
- **Evidências:** galeria com as 24 telas da loja capturadas durante os testes.
- **Execução, Análise e Uso de IA:** sessões exploratórias, tela × API, regras, ambiguidades e onde a IA foi usada.
- **Documentos:** todos os documentos do repositório, renderizados dentro do painel.
- **Automação:** resultados do Playwright (interface) e do Postman/Newman (API).

[![Painel de resultados dos testes](docs/painel.png)](https://verzel-store-qa-painel.lovable.app)

O painel foi feito com o **Lovable** e serve só para exibir os resultados. Ele lê os dados direto deste repositório ([docs/resultados.json](docs/resultados.json)) e os prints de [docs/evidencias/](docs/evidencias/). Qualquer atualização feita aqui aparece lá automaticamente. Os documentos abaixo trazem o mesmo conteúdo com o detalhamento completo.

## Resumo da execução

| Cenários | ✅ Passou | ❌ Falhou | ⛔ Bloqueado | Achados |
|---|---|---|---|---|
| 36 | 31 | 5 | 0 | 6: **3 defeitos confirmados** · 1 divergência (decisão de Produto) · 2 a confirmar |

**Recomendação: a entrega não deve ir para produção antes da correção dos dois defeitos de severidade alta.**

- **[BUG01](docs/04-bugs.md#bug01):** o frete de R$ 19,90 é cobrado quando o subtotal é **exatamente R$ 200,00**. A regra diz "a partir de R$ 200,00, inclusive". O erro está na API e chega ao pedido.
- **[BUG02](docs/04-bugs.md#bug02):** a API aceita **mais de 5 unidades** por produto, e o pedido é confirmado. A tela bloqueia, mas a regra vale também para a API.

O restante do cupom e do frete está correto nas duas camadas: desconto sobre o subtotal, maiúsculas e espaços, cupom inválido e expirado, um cupom por vez, frete calculado antes do desconto, desconto fora do frete, arredondamento, recálculo ao mudar o carrinho e os valores da tela iguais aos da API e à regra.

Separei o que é **defeito confirmado** (viola uma regra escrita: BUG01, BUG02, BUG05) do que **depende de uma decisão do Produto** (BUG03: o banner diverge da documentação) e do que **ainda precisa de um requisito definido** (BUG04 e BUG06). O critério de cada um está em [docs/04-bugs.md](docs/04-bugs.md). Também registrei 7 observações.

## Onde encontrar cada entrega

| Entrega pedida | Arquivo |
|---|---|
| **Painel com todos os resultados** | **https://verzel-store-qa-painel.lovable.app** |
| Análise da documentação, premissas e ambiguidades | [docs/01-analise-da-documentacao.md](docs/01-analise-da-documentacao.md) |
| Cenários de teste (Gherkin) | [docs/02-cenarios.feature](docs/02-cenarios.feature) |
| Execução dos testes manuais e exploratórios, com resultados | [docs/03-execucao.md](docs/03-execucao.md) |
| Report dos bugs encontrados | [docs/04-bugs.md](docs/04-bugs.md) |
| Evidências da execução | [docs/evidencias/](docs/evidencias/): prints da interface em `ui/` e relatório da API em `api/relatorio-newman.html` |
| Automação da interface (Playwright) | [tests/ui/](tests/ui/) |
| Automação da API (Postman) | [postman/](postman/) |
| Resultados em formato estruturado (fonte oficial) | [docs/resultados.json](docs/resultados.json) |
| Uso de IA | [docs/05-uso-de-ia.md](docs/05-uso-de-ia.md) |

## Como rodar a automação

Pré-requisitos: **Node.js 18+** e Git. Funciona no Linux, no macOS e no Windows.

```bash
git clone https://github.com/Dev-Haian/verzel-store-qa.git
cd verzel-store-qa
npm ci                      # instala exatamente as versões do package-lock.json
npx playwright install chromium

npm test                    # valida o Gherkin, roda a interface e depois a API
npm run lint:gherkin        # valida docs/02-cenarios.feature no parser oficial do Gherkin
npm run test:ui             # só a interface (Playwright)
npm run test:api            # só a API (collection do Postman via Newman)
npm run test:ct16           # CT16: carrinhos aleatórios com seed (CT16_SEED=123 para reproduzir)
npm run test:headed         # interface com o navegador aberto
npm run report              # abre o relatório HTML do Playwright
npm run evidencias          # roda a interface e salva os prints em docs/evidencias/ui
npm run painel:dados        # recalcula o resultados.json a partir dos documentos e da última execução (Python 3)
```

Os relatórios ficam em `reports/`: `newman.html`, `newman.json` e `resumo-api.json` para a API, e `playwright.json` para a interface. O relatório HTML do Playwright fica em `playwright-report/`.

### No Postman

1. Importe `postman/verzel-store.postman_collection.json` e `postman/verzel-store.postman_environment.json`.
2. Selecione o environment **Verzel Store · QA**.
3. Rode a collection pelo **Collection Runner**, com um *delay* de uns 150 ms.

Cada requisição tem o ID do cenário (`CTxx`) no nome. A collection é gerada por `scripts/gerar-collection-postman.py`.

### Resultado esperado da automação

| Suíte | Total | Resultado esperado hoje |
|---|---|---|
| Gherkin | 6 regras · 36 cenários | Arquivo válido no parser oficial. |
| Playwright (interface) | 24 testes | **24 passam.** Um deles, no bloco "Bugs conhecidos", afirma o comportamento atual do BUG01. |
| Postman/Newman (API) | 48 requisições · 289 asserções | Falham só as 7 requisições marcadas com `[BUG01]`, `[BUG02]`, `[BUG04]` e `[BUG05]`. O comando termina com sucesso. |

## Limitações conhecidas da suíte

Alguns testes validam comportamentos que hoje estão errados na loja. Para que isso fique explícito, e não escondido, segui esta política:

- **API (Postman):** as requisições com `[BUGxx]` no nome validam o **requisito** e falham de propósito enquanto o bug estiver aberto. O `scripts/api.mjs` só aprova a execução se essas forem as **únicas** falhas. Qualquer outra falha (asserção, erro de rede, timeout) reprova. Um `[BUGxx]` que passe a funcionar também reprova, para lembrar de atualizar a documentação.
- **Interface (Playwright):** não uso `test.fail()`, porque ele trataria qualquer falha como esperada, inclusive um timeout. O BUG01 tem um teste próprio que afirma o **comportamento atual** e falha quando o bug for corrigido. O comentário no teste indica a asserção correta para trocar depois.
- **CT36** simula a resposta de erro de `/api/pedidos` (422 e 500) para testar o tratamento de erro da tela, porque a API real nunca recusa um pedido que a tela deixou passar.
- Os prints em `docs/evidencias/` são da execução de **09/10/2026**. Para garantir que eles correspondem ao estado atual da loja, rode `npm run evidencias` de novo.

### Trocar a URL da loja

```bash
BASE_URL=https://outra-url npm run test:ui
BASE_URL=https://outra-url npm run test:api
```

No Windows (PowerShell), defina antes a variável: `$env:BASE_URL="https://outra-url"`.

### CI

Os testes rodam no **GitHub Actions** a cada push ([.github/workflows/playwright.yml](.github/workflows/playwright.yml)), em três jobs: Gherkin, Interface e API. Nenhum passo usa `continue-on-error`. O pipeline fica vermelho em qualquer falha fora da política acima. Os relatórios do Playwright e do Newman são publicados como artefatos mesmo quando os testes falham.

## Fonte única dos resultados

- **Fonte oficial:** [`docs/resultados.json`](docs/resultados.json). O resultado de cada cenário e de cada bug é registrado ali.
- **Derivado por script:** o `scripts/gerar-dados-painel.py` (`npm run painel:dados`) recalcula as contagens, lê o Gherkin, a análise, a execução e o uso de IA dos documentos e pega os números de automação da última execução em `reports/`. Ele também confere se o Gherkin, os bugs e as evidências batem entre si. Se encontrar divergência, não grava nada e mostra o problema.
- **Painel:** lê esse JSON direto do GitHub, então atualiza sozinho a cada push.
- **Documentos (`docs/01` a `05`):** trazem o detalhamento e a justificativa de cada resultado.

### Estrutura

```
├── docs/
│   ├── 01-analise-da-documentacao.md   ← regras, API, ambiguidades e estratégia
│   ├── 02-cenarios.feature             ← 36 cenários em Gherkin (6 regras), validado no parser oficial
│   ├── 03-execucao.md                  ← resultado por cenário, sessões exploratórias, tela × API
│   ├── 04-bugs.md                      ← 6 achados classificados e 7 observações
│   ├── 05-uso-de-ia.md
│   ├── resultados.json                 ← fonte oficial dos resultados (lida pelo painel)
│   └── evidencias/                     ← prints (ui/) e relatório Newman (api/)
├── tests/ui/                           ← Playwright + TypeScript
│   └── support/
│       ├── loja.ts                     ← page object da loja
│       └── calculo.ts                  ← regra de negócio em centavos (terceira fonte de verdade)
├── postman/                            ← collection e environment
├── scripts/
│   ├── api.mjs                         ← roda o Newman com a política de bugs conhecidos
│   ├── validar-gherkin.mjs             ← valida o .feature
│   ├── gerar-collection-postman.py     ← gera a collection
│   └── gerar-dados-painel.py           ← atualiza e confere o resultados.json
├── playwright.config.ts
└── .github/workflows/                  ← CI
```

## Fora do escopo

Conforme as regras do teste, **não** foram feitos testes de carga, estresse ou segurança, porque o ambiente é compartilhado com outros candidatos. As chamadas automáticas usam intervalo entre requisições e no máximo 2 navegadores em paralelo.
