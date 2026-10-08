# 5. Uso de IA

As regras do teste permitem o uso de IA, desde que informado. Usei o **Claude** (Anthropic) como par de trabalho. Abaixo, onde e como.

| Etapa | Usei IA? | Como |
|---|---|---|
| Estrutura do repositório, modelos de documento e configuração do Playwright/CI | Sim | Gerou o esqueleto do repositório, os modelos e o `playwright.config.ts`. |
| Leitura da documentação e levantamento das ambiguidades | Sim, em conjunto | Li a documentação e levantei pontos. O Claude listou as ambiguidades, e eu revisei e decidi as interpretações. |
| Primeiros testes exploratórios | Não | Fiz na loja e encontrei o frete cobrado com R$ 200,00 (BUG01). Com a IA, separei o que era bug do que era regra (o "Faltam R$ 20,30" estava correto). |
| Escrita dos cenários em Gherkin | Sim | O Claude escreveu os cenários a partir das regras e da análise. Revisei os nomes, as prioridades e a cobertura. |
| Execução na API | Sim | O Claude executou as chamadas na API e montou a collection do Postman, que eu rodo no Postman e pelo Newman. |
| Execução na interface | Sim | O Claude automatizou e executou os fluxos com Playwright e capturou as evidências. Conferi os prints e repeti os principais bugs manualmente na loja. |
| Report dos bugs | Sim | O Claude redigiu os reports a partir dos resultados. Revisei a severidade, a prioridade e a recomendação final. |
| Automação (Playwright + Postman) | Sim | O Claude escreveu os testes. Revisei, rodei localmente e no GitHub Actions. |
| Revisão final | Sim, em conjunto | Revisão cruzada das entregas antes do envio. |

**O que eu garanti:** cada bug foi reproduzido por mim na loja ou no Postman antes de entrar no repositório, e as interpretações das ambiguidades (docs/01, seção 1.4) são decisões minhas.

> Revisar esta tabela antes do envio para que ela reflita exatamente o que foi feito por você e o que foi feito pela IA.
