import { test, expect } from '@playwright/test';
import { Loja, evidencia } from './support/loja';

test.describe('Checkout', () => {
  let loja: Loja;

  test.beforeEach(async ({ page }) => {
    loja = new Loja(page);
    await loja.adicionar('P002');
    await loja.adicionar('P004', 2);
    await loja.abrirCarrinho();
    await loja.aplicarCupom('BEMVINDO10');
    await expect(loja.areaCupom).toContainText('Cupom BEMVINDO10 aplicado.');
    await loja.irParaCheckout();
  });

  test('CT25 · pedido com cupom é confirmado com os mesmos valores do carrinho', async ({ page }, testInfo) => {
    await loja.preencherCliente('Maria Silva', 'maria@exemplo.com', '01310-100');

    const [resposta] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/pedidos')),
      loja.confirmarPedido(),
    ]);
    expect(resposta.status()).toBe(201);
    const pedido = await resposta.json();
    expect(pedido.cupom).toMatchObject({ codigo: 'BEMVINDO10', aplicado: true });

    await expect(page).toHaveURL(/\/pedido-confirmado$/);
    await expect(page.getByText('Pedido confirmado', { exact: true })).toBeVisible();
    await expect(page.getByText(/^Pedido VZ-\d{6}$/)).toHaveText(`Pedido ${pedido.numero}`);
    await expect(loja.valor('subtotal')).toHaveText('R$ 239,70');
    await expect(loja.valor('desconto')).toHaveText('- R$ 23,97');
    await expect(loja.valor('frete')).toHaveText('Grátis');
    await expect(loja.valor('total')).toHaveText('R$ 215,73');
    await evidencia(page, testInfo, 'CT25_pedido_confirmado');
  });

  test('CT26 · dados do cliente inválidos bloqueiam o pedido', async ({ page }, testInfo) => {
    let chamouPedido = false;
    page.on('request', (r) => { if (r.url().includes('/api/pedidos')) chamouPedido = true; });

    await loja.confirmarPedido();
    await expect(page.getByText('Informe o nome completo.')).toBeVisible();
    await expect(page.getByText('Informe o e-mail.')).toBeVisible();
    await expect(page.getByText('Informe o CEP.')).toBeVisible();

    await loja.preencherCliente('Maria', 'maria@', '0131010');
    await loja.confirmarPedido();
    await expect(page.getByText('Informe nome e sobrenome.')).toBeVisible();
    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible();
    await expect(page.getByText('Informe um CEP com 8 dígitos.')).toBeVisible();
    await evidencia(page, testInfo, 'CT26_validacao_cliente');

    await expect(page).toHaveURL(/\/checkout$/);
    expect(chamouPedido).toBe(false);
  });
});
