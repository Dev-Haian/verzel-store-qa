# Verzel Store · Teste técnico de QA

Validação da entrega **cupom de desconto + frete grátis** da Verzel Store, feita como teste técnico para a vaga de QA Júnior na Verzel.

| | |
|---|---|
| **Loja** | https://verzel-store.qa-test-verzel-store.workers.dev/ |
| **Documentação da entrega** | https://verzel-store.qa-test-verzel-store.workers.dev/documentacao |
| **API** | https://verzel-store.qa-test-verzel-store.workers.dev/api |
| **Autor** | Haian Vilas Boas · [LinkedIn](https://www.linkedin.com/in/haian-vilas-boas-806647221) · [GitHub](https://github.com/Dev-Haian) |

## Onde encontrar cada entrega

| Entrega pedida | Arquivo |
|---|---|
| Análise da documentação, premissas e ambiguidades | [docs/01-analise-da-documentacao.md](docs/01-analise-da-documentacao.md) |
| Cenários de teste (Gherkin) | [docs/02-cenarios.feature](docs/02-cenarios.feature) |
| Execução dos testes manuais e exploratórios, com resultados | [docs/03-execucao.md](docs/03-execucao.md) |
| Report dos bugs encontrados | [docs/04-bugs.md](docs/04-bugs.md) |
| Evidências da execução | [docs/evidencias/](docs/evidencias/) |
| Automação com Playwright | [tests/](tests/) |
| Uso de IA | [docs/05-uso-de-ia.md](docs/05-uso-de-ia.md) |

## Resumo da execução

> Preencher ao final: total de cenários, quantos passaram/falharam/bloqueados, quantidade de bugs por severidade e a principal recomendação (a entrega pode ou não ir para produção?).

| Cenários executados | Passou | Falhou | Bloqueado | Bugs (crítico / alto / médio / baixo) |
|---|---|---|---|---|
| – | – | – | – | – / – / – / – |

## Como rodar a automação

Pré-requisitos: **Node.js 18+** e Git.

```bash
git clone https://github.com/Dev-Haian/verzel-store-qa.git
cd verzel-store-qa
npm install
npx playwright install chromium

npm test                 # roda todos os testes (UI + API)
npm run test:ui          # só testes de interface
npm run test:api         # só testes de API
npm run test:headed      # abre o navegador para acompanhar
npm run report           # abre o relatório HTML da última execução
```

A URL da loja pode ser trocada pela variável `BASE_URL`:

```bash
BASE_URL=https://outra-url npm test
```

Os testes também rodam no **GitHub Actions** a cada push ([.github/workflows/playwright.yml](.github/workflows/playwright.yml)), e o relatório fica disponível como artefato da execução.

### Estrutura

```
├── docs/                    ← análise, cenários, execução, bugs, evidências e uso de IA
├── tests/
│   ├── ui/                  ← testes E2E na interface da loja
│   └── api/                 ← testes direto nos endpoints da API
├── playwright.config.ts
└── .github/workflows/       ← CI
```

## Fora do escopo

Conforme as regras do teste, **não** foram feitos testes de carga, estresse ou segurança, porque o ambiente é compartilhado com outros candidatos.
