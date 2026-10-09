import { test, expect } from '@playwright/test';
import { Loja, evidencia } from './support/loja';

test.describe('Frete grátis', () => {
  test('CT13 · abaixo de R$ 200,00 cobra R$ 19,90 e informa quanto falta', async ({ page }, testInfo) => {
    const loja = new Loja(page);
    await loja.adicionar('P001', 3); // 3 x 59,90 = 179,70
    await loja.abrirCarrinho();

    await expect(loja.valor('subtotal')).toHaveText('R$ 179,70');
    await expect(loja.valor('frete')).toHaveText('R$ 19,90');
    await expect(loja.valor('total')).toHaveText('R$ 199,60');
    // O faltante é calculado sobre o subtotal (200,00 - 179,70), não sobre o total.
    await expect(loja.avisoFrete).toHaveText('Faltam R$ 20,30 para o frete grátis.');
    await evidencia(page, testInfo, 'CT13_faltante_frete');
  });

  test('CT12 · subtotal de R$ 199,80 (logo abaixo do limite) cobra frete', async ({ page }) => {
    const loja = new Loja(page);
    await loja.adicionar('P001'); // 59,90
    await loja.adicionar('P002'); // 139,90 → 199,80
    await loja.abrirCarrinho();

    await expect(loja.valor('subtotal')).toHaveText('R$ 199,80');
    await expect(loja.valor('frete')).toHaveText('R$ 19,90');
    await expect(loja.avisoFrete).toHaveText('Faltam R$ 0,20 para o frete grátis.');
  });

  test('CT12 · subtotal de R$ 219,80 (acima do limite) tem frete grátis', async ({ page }) => {
    const loja = new Loja(page);
    await loja.adicionar('P003'); // 189,90
    await loja.adicionar('P006'); // 29,90 → 219,80
    await loja.abrirCarrinho();

    await expect(loja.valor('subtotal')).toHaveText('R$ 219,80');
    await expect(loja.valor('frete')).toHaveText('Grátis');
    await expect(loja.valor('total')).toHaveText('R$ 219,80');
    await expect(loja.avisoFrete).toHaveCount(0);
  });

  test('CT14 · frete grátis considera o subtotal antes do desconto do cupom', async ({ page }, testInfo) => {
    const loja = new Loja(page);
    await loja.adicionar('P007'); // 229,90
    await loja.abrirCarrinho();
    await loja.aplicarCupom('BEMVINDO10');

    // Depois do desconto os produtos ficam em 206,91, mas o frete continua grátis
    // porque a regra olha o subtotal de 229,90.
    await expect(loja.valor('desconto')).toHaveText('- R$ 22,99');
    await expect(loja.valor('frete')).toHaveText('Grátis');
    await expect(loja.valor('total')).toHaveText('R$ 206,91');
    await expect(loja.avisoFrete).toHaveCount(0);
    await evidencia(page, testInfo, 'CT14_frete_antes_do_desconto');
  });

  test('CT15 · o desconto não incide sobre o frete', async ({ page }) => {
    const loja = new Loja(page);
    await loja.adicionar('P005'); // 100,00
    await loja.abrirCarrinho();
    await loja.aplicarCupom('BEMVINDO10');

    // 10% de 100,00 = 10,00. Se incidisse sobre o frete, seria 11,99.
    await expect(loja.valor('desconto')).toHaveText('- R$ 10,00');
    await expect(loja.valor('total')).toHaveText('R$ 109,90');
  });
});

/**
 * Bugs conhecidos (docs/04-bugs.md).
 *
 * Estes testes NÃO usam test.fail(): eles afirmam o comportamento ATUAL, que está errado,
 * e por isso passam enquanto o bug existir. Assim, qualquer outro problema (navegação, timeout,
 * tela diferente) aparece como falha real. Quando o bug for corrigido, o teste falha avisando;
 * aí basta trocar as asserções pelo comportamento esperado indicado em cada um.
 */
test.describe('Bugs conhecidos', () => {
  test('BUG01 · CT12 · com subtotal de exatamente R$ 200,00 a loja ainda cobra frete', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'bug conhecido', description: 'BUG01 · esperado: frete Grátis e total R$ 200,00 (CA06)' });
    const loja = new Loja(page);
    await loja.adicionar('P005', 2); // 2 x 100,00 = 200,00
    await loja.abrirCarrinho();
    await expect(loja.valor('subtotal')).toHaveText('R$ 200,00');

    // Comportamento atual (errado). Esperado pela CA06: frete "Grátis" e total "R$ 200,00".
    await expect(loja.valor('frete')).toHaveText('R$ 19,90');
    await expect(loja.valor('total')).toHaveText('R$ 219,90');
    await expect(loja.avisoFrete).toHaveText('Faltam R$ 0,00 para o frete grátis.');
    await evidencia(page, testInfo, 'CT12_BUG01_frete_200');
  });
});
