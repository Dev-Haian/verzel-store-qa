// Valida docs/02-cenarios.feature com o parser oficial do Gherkin (idioma pt).
// Uso: npm run lint:gherkin
import { AstBuilder, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin';
import { IdGenerator } from '@cucumber/messages';
import { readFileSync } from 'node:fs';

const arquivo = process.argv[2] ?? 'docs/02-cenarios.feature';
const parser = new Parser(new AstBuilder(IdGenerator.uuid()), new GherkinClassicTokenMatcher('pt'));

try {
  const doc = parser.parse(readFileSync(arquivo, 'utf8'));
  const regras = doc.feature.children.filter((c) => c.rule).map((c) => c.rule);
  const cenarios = regras.flatMap((r) => r.children.filter((c) => c.scenario).map((c) => c.scenario));
  const ids = cenarios.map((c) => c.tags.find((t) => /^@CT\d+$/.test(t.name))?.name);
  const semId = cenarios.filter((_, i) => !ids[i]).map((c) => c.name);
  const repetidos = ids.filter((id, i) => id && ids.indexOf(id) !== i);
  if (semId.length || repetidos.length) {
    console.error('Cenários sem @CT:', semId, '| IDs repetidos:', repetidos);
    process.exit(1);
  }
  console.log(`✔ ${arquivo}: Gherkin válido · ${regras.length} regras · ${cenarios.length} cenários (${ids[0]} a ${ids.at(-1)})`);
} catch (e) {
  console.error(`✘ ${arquivo}: Gherkin inválido\n${e.message}`);
  process.exit(1);
}
