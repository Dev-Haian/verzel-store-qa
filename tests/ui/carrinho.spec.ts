import { test, expect } from '@playwright/test';
import { Loja, evidencia } from './support/loja';
import { calcularEsperado } from './support/calculo';

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

  test('CT29 · tela, API e regra de negócio chegam aos mesmos valores', async ({ page }, testInfo) => {
    const loja = new Loja(page);
    await loja.adicionar('P002');
    await loja.adicionar('P004', 2);
    await loja.abrirCarrinho();

    const respostaComCupom = page.waitForResponse(
      (r) => r.url().includes('/api/carrinho/calcular') && (r.request().postData() ?? '').includes('"cupom":"BEMVINDO10"'),
    );
    await loja.aplicarCupom('BEMVINDO10');
    const api = await (await respostaComCupom).json();
    await expect(loja.areaCupom).toContainText('Cupom BEMVINDO10 aplicado.');

    // 1) Regra de negócio: cálculo independente em centavos inteiros (support/calculo.ts).
    const regra = calcularEsperado([{ produtoId: 'P002', quantidade: 1 }, { produtoId: 'P004', quantidade: 2 }], 'BEMVINDO10');
    // 2) A API devolve os valores da regra, inclusive o estado lógico do frete.
    expect(api).toMatchObject({ ...regra, freteGratis: true });
    // 3) A tela mostra os mesmos valores da API.
    const tela = await loja.resumo();
    expect(tela).toEqual({ subtotal: api.subtotal, desconto: api.desconto, frete: api.frete, total: api.total });
    // E tudo bate com o exemplo da documentação (239,70 − 23,97 + 0 = 215,73).
    expect(tela).toEqual({ subtotal: 239.7, desconto: 23.97, frete: 0, total: 215.73 });
    await evidencia(page, testInfo, 'CT29_tela_igual_api');
  });
});

test.describe('Transições de estado do carrinho', () => {
  let loja: Loja;

  test.beforeEach(async ({ page }) => {
    loja = new Loja(page);
    await loja.adicionar('P001'); // Camiseta Essencial · 59,90
    await loja.abrirCarrinho();
    await loja.aplicarCupom('BEMVINDO10');
    await expect(loja.areaCupom).toContainText('Cupom BEMVINDO10 aplicado.');
  });

  test('CT33 · alterar a quantidade com o cupom aplicado recalcula todos os valores', async ({ page }, testInfo) => {
    const dois = calcularEsperado([{ produtoId: 'P001', quantidade: 2 }], 'BEMVINDO10');
    await Promise.all([loja.esperarCalculo(), loja.aumentar('Camiseta Essencial').click()]);
    await expect(loja.quantidade('Camiseta Essencial')).toHaveText('2');
    await expect(loja.valor('subtotal')).toHaveText('R$ 119,80');
    await expect(loja.valor('desconto')).toHaveText('- R$ 11,98');
    await expect(loja.valor('frete')).toHaveText('R$ 19,90');
    await expect(loja.valor('total')).toHaveText('R$ 127,72');
    await expect(loja.avisoFrete).toHaveText('Faltam R$ 80,20 para o frete grátis.');
    expect(await loja.resumo()).toEqual({ subtotal: dois.subtotal, desconto: dois.desconto, frete: dois.frete, total: dois.total });
    await evidencia(page, testInfo, 'CT33_quantidade_com_cupom');

    await Promise.all([loja.esperarCalculo(), page.getByLabel('Diminuir quantidade de Camiseta Essencial').click()]);
    await expect(loja.valor('desconto')).toHaveText('- R$ 5,99');
    await expect(loja.valor('total')).toHaveText('R$ 73,81');
  });

  test('CT34 · remover um produto com o cupom aplicado recalcula todos os valores', async ({ page }, testInfo) => {
    await loja.adicionar('P002'); // + Calça Jeans Slim · 139,90 → 199,80
    await loja.abrirCarrinho();
    await expect(loja.valor('subtotal')).toHaveText('R$ 199,80');
    await expect(loja.valor('desconto')).toHaveText('- R$ 19,98');

    await Promise.all([loja.esperarCalculo(), page.getByLabel('Remover Calça Jeans Slim do carrinho').click()]);
    await expect(page.getByLabel('Remover Calça Jeans Slim do carrinho')).toHaveCount(0);
    await expect(loja.valor('subtotal')).toHaveText('R$ 59,90');
    await expect(loja.valor('desconto')).toHaveText('- R$ 5,99');
    await expect(loja.valor('frete')).toHaveText('R$ 19,90');
    await expect(loja.valor('total')).toHaveText('R$ 73,81');
    await expect(loja.areaCupom).toContainText('Cupom BEMVINDO10 aplicado.');
    await evidencia(page, testInfo, 'CT34_remover_produto_com_cupom');
  });

  test('CT35 · recarregar a página mantém o carrinho e o cupom da aba', async ({ page }) => {
    const antes = await loja.resumo();
    await Promise.all([loja.esperarCalculo(), page.reload()]);

    await expect(loja.quantidade('Camiseta Essencial')).toHaveText('1');
    await expect(loja.areaCupom).toContainText('Cupom BEMVINDO10 aplicado.');
    await expect(loja.valor('total')).toHaveText('R$ 73,81');
    expect(await loja.resumo()).toEqual(antes);
  });
});
