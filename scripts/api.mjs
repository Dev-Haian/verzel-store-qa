// Roda a collection do Postman com o Newman e decide o resultado com uma política explícita:
//
//   - Requisição com [BUGxx] no nome = bug conhecido (docs/04-bugs.md). Ela valida o requisito
//     e é ESPERADO que falhe enquanto o bug estiver aberto.
//   - Qualquer outra falha (asserção, erro de rede, timeout, script) = falha INESPERADA → exit 1.
//   - Requisição [BUGxx] que passou = o bug parece corrigido → exit 1, para atualizar a
//     documentação e retirar a marcação.
//
// Uso: npm run test:api   (relatórios em reports/newman.html e reports/newman.json)
import newman from 'newman';
import { mkdirSync, writeFileSync } from 'node:fs';

const BUGS_ABERTOS = ['BUG01', 'BUG02', 'BUG04', 'BUG05'];
const baseUrl = process.env.BASE_URL;

mkdirSync('reports', { recursive: true });

newman.run(
  {
    collection: 'postman/verzel-store.postman_collection.json',
    environment: 'postman/verzel-store.postman_environment.json',
    envVar: baseUrl ? [{ key: 'baseUrl', value: baseUrl }] : [],
    delayRequest: 150, // ambiente compartilhado: sem rajadas de requisições
    timeoutRequest: 20_000,
    reporters: ['cli', 'htmlextra', 'json'],
    reporter: {
      htmlextra: { export: 'reports/newman.html', title: 'Verzel Store · API (VZS-142)', browserTitle: 'Verzel Store API' },
      json: { export: 'reports/newman.json' },
    },
  },
  (erroExecucao, resumo) => {
    if (erroExecucao) {
      console.error('\n✘ O Newman não conseguiu executar a collection:', erroExecucao.message);
      process.exit(1);
    }

    const conhecidos = [];
    const inesperados = [];
    const corrigidos = [];

    for (const ex of resumo.run.executions) {
      const nome = ex.item.name;
      const bug = nome.match(/\[(BUG\d+)\]/)?.[1];
      const falhas = (ex.assertions ?? []).filter((a) => a.error).map((a) => a.assertion);
      const erroRequisicao = ex.requestError?.message;

      if (erroRequisicao) inesperados.push(`${nome} → erro de requisição: ${erroRequisicao}`);
      else if (bug && falhas.length) conhecidos.push(`${nome} → ${falhas.length} asserção(ões) falharam`);
      else if (bug && !falhas.length) corrigidos.push(nome);
      else if (falhas.length) inesperados.push(`${nome} → ${falhas.join(' | ')}`);
    }
    for (const f of resumo.run.failures.filter((f) => f.error?.name !== 'AssertionError')) {
      inesperados.push(`${f.source?.name ?? 'collection'} → ${f.error?.name}: ${f.error?.message}`);
    }

    const bugsSemTeste = BUGS_ABERTOS.filter((b) => !resumo.run.executions.some((e) => e.item.name.includes(`[${b}]`)));
    const s = resumo.run.stats;
    const veredito = inesperados.length || corrigidos.length || bugsSemTeste.length ? 'falhou' : 'passou';
    const resultado = {
      veredito,
      requisicoes: s.requests.total,
      assercoes: s.assertions.total,
      assercoesFalharam: s.assertions.failed,
      falhasDeBugsConhecidos: conhecidos,
      falhasInesperadas: inesperados,
      bugsQueParecemCorrigidos: corrigidos,
      bugsAbertosSemRequisicao: bugsSemTeste,
    };
    writeFileSync('reports/resumo-api.json', JSON.stringify(resultado, null, 2));

    console.log('\n──────── Política de bugs conhecidos ────────');
    console.log(`Requisições: ${s.requests.total} · Asserções: ${s.assertions.total} (${s.assertions.failed} falharam)`);
    console.log(`Falhas esperadas de bugs abertos (${conhecidos.length}):`);
    conhecidos.forEach((c) => console.log(`  • ${c}`));
    if (corrigidos.length) {
      console.log(`\n✘ Requisições [BUG] que passaram — o bug parece corrigido; atualize docs/04-bugs.md:`);
      corrigidos.forEach((c) => console.log(`  • ${c}`));
    }
    if (bugsSemTeste.length) console.log(`\n✘ Bugs abertos sem requisição na collection: ${bugsSemTeste.join(', ')}`);
    if (inesperados.length) {
      console.log(`\n✘ Falhas inesperadas (${inesperados.length}):`);
      inesperados.forEach((i) => console.log(`  • ${i}`));
    }
    console.log(veredito === 'passou' ? '\n✔ API: só falharam os bugs conhecidos.' : '\n✘ API: há falhas fora da política de bugs conhecidos.');
    process.exit(veredito === 'passou' ? 0 : 1);
  },
);
