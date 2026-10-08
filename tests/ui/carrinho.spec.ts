import { test, expect } from '@playwright/test';
import { Loja, evidencia } from './support/loja';

test.describe('Carrinho', () => {
  test('CT18 · cada produto tem no máximo 5 unidades na interface', async ({ page }, testInfo) => {
    const loja = new Loja(page);
    await loja.adicionar('P001', 5);

    // Vitrine: o botão desabilita e avisa o limite.
    await expect(loja.botaoAdicionar('P001')).toBeDisabled();
    await expect(page.locator('#aviso-P001')).toHaveText('Limite de 5 unidades atingido.');
    await evidencia(page, testInfo, 'CT18_limite_vitrine');

    // Carrinho: o botão "+" também fica desabilitado em 5.
    await loja.abrirCarrinho();
    await expect(loja.quantidade('Camiseta Essencial')).toHaveText('5');
    await expect(loja.aumentar('Camiseta Essencial')).toBeDisabled();
    await expect(page.getByText('Limite de 5 unidades por produto.')).toBeVisible();
    await evidencia(page, testInfo, 'CT18_limite_carrinho');
  });

  test('CT29 · os valores da tela são os mesmos devolvidos pela API', async ({ page }, testInfo) => {
    const loja = new Loja(page);
    await loja.adicionar('P002');
    await loja.adicionar('P004', 2);
    await loja.abrirCarrinho();

    const respostaComCupom = page.waitForResponse(
      (r) => r.url().includes('/api/carrinho/calcular') && (r.request().postData() ?? '').includes('"cupom":"BEMVINDO10"'),
    );
    await loja.aplicarCupom('BEMVINDO10');
    const resposta = await respostaComCupom;
    const api = await resposta.json();
    await expect(loja.areaCupom).toContainText('Cupom BEMVINDO10 aplicado.');

    const tela = await loja.resumo();
    expect(tela).toEqual({ subtotal: api.subtotal, desconto: api.desconto, frete: api.frete, total: api.total });
    // E batem com o exemplo da documentação.
    expect(tela).toEqual({ subtotal: 239.7, desconto: 23.97, frete: 0, total: 215.73 });
    await evidencia(page, testInfo, 'CT29_tela_igual_api');
  });
});
