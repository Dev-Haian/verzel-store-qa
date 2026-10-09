import { test, expect } from '@playwright/test';
import { Loja, evidencia } from './support/loja';

test.describe('Cupom de desconto', () => {
  let loja: Loja;

  test.beforeEach(async ({ page }) => {
    loja = new Loja(page);
    await loja.adicionar('P005'); // Mochila Urbana 20L · R$ 100,00
    await loja.abrirCarrinho();
  });

  test('CT01 · BEMVINDO10 aplica 10% sobre o subtotal dos produtos', async ({ page }, testInfo) => {
    await loja.aplicarCupom('BEMVINDO10');

    await expect(loja.areaCupom).toContainText('Cupom BEMVINDO10 aplicado.');
    await expect(loja.valor('subtotal')).toHaveText('R$ 100,00');
    await expect(loja.valor('desconto')).toHaveText('- R$ 10,00');
    await expect(loja.valor('frete')).toHaveText('R$ 19,90');
    await expect(loja.valor('total')).toHaveText('R$ 109,90');
    await evidencia(page, testInfo, 'CT01_cupom_valido');
  });

  for (const [id, codigo] of [
    ['CT02', 'bemvindo10'],
    ['CT03', '  BemVindo10  '],
  ] as const) {
    test(`${id} · código "${codigo}" é aceito (maiúsculas/espaços ignorados)`, async ({ page }, testInfo) => {
      await loja.aplicarCupom(codigo);

      await expect(loja.areaCupom).toContainText('Cupom BEMVINDO10 aplicado.');
      await expect(loja.valor('desconto')).toHaveText('- R$ 10,00');
      await evidencia(page, testInfo, `${id}_cupom_normalizado`);
    });
  }

  for (const [id, codigo, mensagem] of [
    ['CT05', 'XPTO', 'Cupom inválido.'],
    ['CT06', 'VERAO2026', 'Cupom expirado.'],
  ] as const) {
    test(`${id} · cupom ${codigo} mostra "${mensagem}" e não dá desconto`, async ({ page }, testInfo) => {
      await loja.aplicarCupom(codigo);

      await expect(loja.areaCupom).toContainText(mensagem);
      await expect(loja.valor('desconto')).toHaveText('R$ 0,00');
      await expect(loja.valor('total')).toHaveText('R$ 119,90');
      await evidencia(page, testInfo, `${id}_cupom_${codigo.toLowerCase()}`);
    });
  }

  test('CT07 · campo vazio ou só com espaços pede para informar um cupom', async ({ page }, testInfo) => {
    await loja.aplicarCupom('   ');

    await expect(loja.areaCupom).toContainText('Informe um cupom.');
    await expect(loja.valor('desconto')).toHaveText('R$ 0,00');
    await evidencia(page, testInfo, 'CT07_cupom_vazio');
  });

  test('CT08 · com um cupom aplicado não é possível aplicar outro', async ({ page }, testInfo) => {
    await loja.aplicarCupom('BEMVINDO10');
    await expect(loja.areaCupom).toContainText('Cupom BEMVINDO10 aplicado.');

    // O campo some e só resta a opção de remover o cupom atual.
    await expect(loja.campoCupom).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Remover cupom' })).toBeVisible();
    await evidencia(page, testInfo, 'CT08_um_cupom_por_vez');
  });

  test('CT09 · remover o cupom volta os valores e permite aplicar outro', async ({ page }, testInfo) => {
    await loja.aplicarCupom('BEMVINDO10');
    await expect(loja.valor('desconto')).toHaveText('- R$ 10,00');

    await loja.removerCupom();
    await expect(loja.valor('desconto')).toHaveText('R$ 0,00');
    await expect(loja.valor('total')).toHaveText('R$ 119,90');

    // Cupom inválido depois de remover o válido: nenhum desconto residual.
    await loja.aplicarCupom('VERAO2026');
    await expect(loja.areaCupom).toContainText('Cupom expirado.');
    await expect(loja.valor('desconto')).toHaveText('R$ 0,00');
    await expect(loja.valor('total')).toHaveText('R$ 119,90');
    await evidencia(page, testInfo, 'CT09_trocar_cupom');
  });
});
