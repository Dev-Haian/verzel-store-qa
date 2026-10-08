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

  test('CT12 · subtotal de exatamente R$ 200,00 tem frete grátis', async ({ page }, testInfo) => {
    // BUG01: a API trata o limite como "maior que" e cobra R$ 19,90 quando o subtotal é R$ 200,00.
    // test.fail(): o teste passa enquanto o bug existir e avisa quando ele for corrigido.
    test.fail(true, 'BUG01 · frete cobrado com subtotal exatamente R$ 200,00');
    testInfo.annotations.push({ type: 'bug', description: 'BUG01' });

    const loja = new Loja(page);
    await loja.adicionar('P005', 2); // 2 x 100,00 = 200,00
    await loja.abrirCarrinho();
    await expect(loja.valor('subtotal')).toHaveText('R$ 200,00');
    await evidencia(page, testInfo, 'CT12_BUG01_frete_200');

    await expect(loja.valor('frete')).toHaveText('Grátis', { timeout: 3_000 });
    await expect(loja.valor('total')).toHaveText('R$ 200,00', { timeout: 3_000 });
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

  test('CT15 · o desconto não incide sobre o frete', async ({ page }, testInfo) => {
    const loja = new Loja(page);
    await loja.adicionar('P005'); // 100,00
    await loja.abrirCarrinho();
    await loja.aplicarCupom('BEMVINDO10');

    // 10% de 100,00 = 10,00. Se incidisse sobre o frete, seria 11,99.
    await expect(loja.valor('desconto')).toHaveText('- R$ 10,00');
    await expect(loja.valor('total')).toHaveText('R$ 109,90');
  });
});
