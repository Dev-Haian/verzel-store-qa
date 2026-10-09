# 5. Uso de IA

As regras do teste permitem o uso de IA, desde que informado. Usei o **Claude** (Anthropic) como apoio ao longo do trabalho e o **Lovable** para montar o painel de resultados. Abaixo, o que fiz e onde a IA entrou em cada etapa.

| Etapa | Usei IA? | Como |
|---|---|---|
| Estrutura do repositório e documentação | Sim, em conjunto | A estrutura do repositório foi baseada em outro projeto que eu já tinha feito. A documentação partiu do que o Claude gerou com o contexto que ele já tinha do meu trabalho. Complementei e refinei o que foi gerado e sugeri uma forma melhor de visualizar os resultados, em um dashboard. |
| Leitura da documentação e levantamento das ambiguidades | Sim, em conjunto | A leitura e o levantamento foram feitos tanto por mim quanto pelo Claude. Depois definimos juntos o que era e o que não era ambíguo e qual interpretação seguir. |
| Testes exploratórios e cenários | Sim, em conjunto | Fiz os primeiros testes exploratórios na loja e encontrei um bug: o frete cobrado com subtotal de exatamente R$ 200,00 (BUG01). Depois disso, defini os principais cenários e os refinei com o Claude seguindo os padrões do Gherkin. |
| Execução na API | Sim, em conjunto | Depois de entender a API, a cobertura foi feita no Postman junto com o Claude, para que os testes pudessem ser executados. Também testei diretamente no Postman procurando erros na API. |
| Execução na interface | Sim, em conjunto | A execução foi feita tanto manualmente quanto por automação (Playwright). Os prints de evidência foram tirados pelo Playwright e também manualmente. |
| Report dos bugs | Sim, em conjunto | Defini o padrão do report, e o Claude adaptou esse padrão a cada problema encontrado. |
| Exibição dos resultados: painel ([link](https://verzel-store-qa-painel.lovable.app)) | Sim (Lovable) | Usei o **Lovable** para criar o painel que exibe os resultados: visão geral, cenários, bugs, observações, evidências e automação. O prompt foi escrito com apoio do Claude. O painel só exibe dados: lê o `docs/resultados.json` e as evidências direto deste repositório, sem cálculo ou alteração dos resultados. |
