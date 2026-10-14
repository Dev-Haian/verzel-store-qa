import { test, expect, APIRequestContext } from '@playwright/test';
import { calcularEsperado, PRECOS_CENTAVOS, type Item } from '../ui/support/calculo';
import type { ProdutoId } from '../ui/support/loja';

/**
 * CT16 · Fórmula do total em carrinhos variados (CA01, CA06, CA09) — teste baseado em propriedades.
 *
 * Versionado depois do feedback do teste técnico: na entrega original o CT16 foi rodado por um
 * script exploratório que não ficou no repositório. Aqui ele vira parte da suíte, reproduzível e no CI.
 *
 * Como funciona:
 * - Gera N carrinhos aleatórios (1 a 4 produtos distintos, 1 a 5 unidades, com e sem cupom) a partir
 *   de uma SEED. Mesma seed = mesmos carrinhos, então qualquer falha pode ser reproduzida exatamente.
 * - Cada carrinho é calculado na API e comparado com calcularEsperado(), a mesma regra em centavos
 *   usada nos testes de interface. Uma única fonte de verdade, sem duplicar a regra.
 * - Fronteiras do frete (R$ 199,80, R$ 200,00 e R$ 219,80) entram sempre, para não depender da sorte.
 *
 * Variáveis:
 *   CT16_SEED  seed do gerador (padrão fixo, para o CI do PR ser determinístico)
 *   CT16_QTD   quantidade de carrinhos aleatórios (padrão 40)
 *
 * Reproduzir uma falha:  CT16_SEED=<seed do log> npx playwright test --project=api
 */

const SEED = Number(process.env.CT16_SEED ?? 20261014);
const QTD = Number(process.env.CT16_QTD ?? 40);
const LIMITE_FRETE_GRATIS = 20000; // centavos

/** Gerador pseudoaleatório com seed (mulberry32): pequeno, rápido e reproduzível. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Carrinho = { nome: string; itens: Item[]; cupom?: string };

const subtotalCentavos = (itens: Item[]) =>
  itens.reduce((s, i) => s + PRECOS_CENTAVOS[i.produtoId] * i.quantidade, 0);

function gerarCarrinhos(seed: number, qtd: number): Carrinho[] {
  const rnd = mulberry32(seed);
  const inteiro = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
  const produtos = Object.keys(PRECOS_CENTAVOS) as ProdutoId[];
  const carrinhos: Carrinho[] = [];

  while (carrinhos.length < qtd) {
    const embaralhados = [...produtos].sort(() => rnd() - 0.5);
    const itens = embaralhados
      .slice(0, inteiro(1, 4))
      .map((produtoId) => ({ produtoId, quantidade: inteiro(1, 5) }));
    const cupom = rnd() < 0.5 ? 'BEMVINDO10' : undefined;

    // Subtotal exatamente em R$ 200,00 cai no BUG01 e é coberto pelas fronteiras abaixo.
    // Sem este desvio, uma seed nova poderia falhar por um bug já conhecido.
    if (subtotalCentavos(itens) === LIMITE_FRETE_GRATIS) continue;

    carrinhos.push({ nome: `aleatório ${carrinhos.length + 1}`, itens, cupom });
  }
  return carrinhos;
}

async function calcularNaApi(request: APIRequestContext, carrinho: Carrinho) {
  const resposta = await request.post('/api/carrinho/calcular', {
    data: { itens: carrinho.itens, ...(carrinho.cupom ? { cupom: carrinho.cupom } : {}) },
  });
  expect(resposta.status(), `${carrinho.nome}: status`).toBe(200);
  return resposta.json();
}

function valoresComparaveis(api: any) {
  return {
    subtotal: api.subtotal,
    desconto: api.desconto,
    frete: api.frete,
    total: api.total,
    valorFaltanteFreteGratis: api.valorFaltanteFreteGratis,
  };
}

test.describe('CT16 · fórmula do total', () => {
  test(`CT16 · ${QTD} carrinhos aleatórios batem com a regra (seed ${SEED})`, async ({ request }, testInfo) => {
    testInfo.annotations.push({ type: 'seed', description: `CT16_SEED=${SEED} CT16_QTD=${QTD}` });
    const carrinhos = gerarCarrinhos(SEED, QTD);
    const divergencias: unknown[] = [];

    for (const carrinho of carrinhos) {
      const api = await calcularNaApi(request, carrinho);
      const esperado = calcularEsperado(carrinho.itens, carrinho.cupom);
      const obtido = valoresComparaveis(api);
      const freteGratisCoerente = api.freteGratis === (esperado.frete === 0);

      if (JSON.stringify(obtido) !== JSON.stringify(esperado) || !freteGratisCoerente) {
        divergencias.push({ carrinho, esperado, obtido, freteGratis: api.freteGratis });
      }
    }

    await testInfo.attach('ct16-carrinhos.json', {
      body: JSON.stringify({ seed: SEED, qtd: QTD, carrinhos, divergencias }, null, 2),
      contentType: 'application/json',
    });

    expect(
      divergencias,
      `Divergências entre API e regra. Reproduza com CT16_SEED=${SEED} CT16_QTD=${QTD}`,
    ).toEqual([]);
  });

  const fronteiras: Carrinho[] = [
    { nome: 'R$ 199,80 (abaixo do limite)', itens: [{ produtoId: 'P002', quantidade: 1 }, { produtoId: 'P001', quantidade: 1 }] },
    { nome: 'R$ 199,80 com cupom', itens: [{ produtoId: 'P002', quantidade: 1 }, { produtoId: 'P001', quantidade: 1 }], cupom: 'BEMVINDO10' },
    { nome: 'R$ 219,80 (acima do limite)', itens: [{ produtoId: 'P003', quantidade: 1 }, { produtoId: 'P006', quantidade: 1 }] },
    { nome: 'R$ 219,80 com cupom', itens: [{ produtoId: 'P003', quantidade: 1 }, { produtoId: 'P006', quantidade: 1 }], cupom: 'BEMVINDO10' },
  ];

  for (const carrinho of fronteiras) {
    test(`CT16 · fronteira ${carrinho.nome}`, async ({ request }) => {
      const api = await calcularNaApi(request, carrinho);
      const esperado = calcularEsperado(carrinho.itens, carrinho.cupom);
      expect(valoresComparaveis(api)).toEqual(esperado);
      expect(api.freteGratis).toBe(esperado.frete === 0);
    });
  }
});

/**
 * Bug conhecido (docs/04-bugs.md#bug01). Mesmo padrão dos testes de interface: afirma o comportamento
 * ATUAL (errado), então passa enquanto o bug existir. Quando o BUG01 for corrigido, este teste falha
 * avisando, e basta trocar pela expectativa da regra: frete 0, freteGratis true e total = subtotal - desconto.
 */
test.describe('Bugs conhecidos', () => {
  test('BUG01 · CT16 · fronteira de exatamente R$ 200,00 ainda cobra frete', async ({ request }, testInfo) => {
    testInfo.annotations.push({ type: 'bug conhecido', description: 'BUG01 · esperado: frete 0 e freteGratis true (CA06)' });
    const carrinho: Carrinho = { nome: 'R$ 200,00', itens: [{ produtoId: 'P005', quantidade: 2 }] };
    const api = await calcularNaApi(request, carrinho);
    expect(calcularEsperado(carrinho.itens).frete).toBe(0); // a regra diz frete grátis
    expect(api).toMatchObject({ subtotal: 200, frete: 19.9, freteGratis: false, valorFaltanteFreteGratis: 0, total: 219.9 });
  });
});
