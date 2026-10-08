import { Page, Locator, expect, TestInfo } from '@playwright/test';

/** Ids dos produtos da documentação. */
export type ProdutoId = 'P001' | 'P002' | 'P003' | 'P004' | 'P005' | 'P006' | 'P007' | 'P008';

/** Converte "R$ 1.234,56" para 1234.56. */
export function emReais(texto: string): number {
  return Number(texto.replace(/[^\d,]/g, '').replace(',', '.'));
}

/** Formata 1234.5 como "R$ 1.234,50", igual à loja. */
export function brl(valor: number): string {
  return 'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export class Loja {
  constructor(private readonly page: Page) {}

  // ---------- Vitrine ----------
  botaoAdicionar(id: ProdutoId): Locator {
    return this.page.locator(`article[aria-labelledby="nome-${id}"]`).getByRole('button', { name: 'Adicionar ao carrinho' });
  }

  async adicionar(id: ProdutoId, quantidade = 1) {
    await this.page.goto('/');
    for (let i = 0; i < quantidade; i++) {
      // Cada clique recalcula o carrinho na API; espera a resposta antes do próximo clique.
      await Promise.all([this.esperarCalculo(), this.botaoAdicionar(id).click()]);
    }
  }

  // ---------- Carrinho ----------
  async abrirCarrinho() {
    await Promise.all([this.esperarCalculo(), this.page.goto('/carrinho')]);
  }

  esperarCalculo() {
    return this.page.waitForResponse((r) => r.url().includes('/api/carrinho/calcular') && r.request().method() === 'POST');
  }

  get campoCupom() {
    return this.page.locator('#campo-cupom');
  }

  get areaCupom() {
    return this.page.locator('form.cupom, .cupom-aplicado');
  }

  async aplicarCupom(codigo: string) {
    await this.campoCupom.fill(codigo);
    await this.page.getByRole('button', { name: 'Aplicar cupom' }).click();
  }

  async removerCupom() {
    await Promise.all([this.esperarCalculo(), this.page.getByRole('button', { name: 'Remover cupom' }).click()]);
  }

  aumentar(nomeProduto: string) {
    return this.page.getByLabel(`Aumentar quantidade de ${nomeProduto}`);
  }

  quantidade(nomeProduto: string) {
    return this.page.locator(`output[aria-label="Quantidade de ${nomeProduto}"]`);
  }

  valor(campo: 'subtotal' | 'desconto' | 'frete' | 'total') {
    return this.page.locator(`.resumo dd[data-valor="${campo}"]`);
  }

  get avisoFrete() {
    return this.page.locator('.aviso-frete');
  }

  /** Lê os valores do resumo como números (frete "Grátis" vira 0, desconto negativo vira positivo). */
  async resumo() {
    const ler = async (c: 'subtotal' | 'desconto' | 'frete' | 'total') => {
      const t = (await this.valor(c).innerText()).trim();
      return /gr[aá]tis/i.test(t) ? 0 : emReais(t);
    };
    return { subtotal: await ler('subtotal'), desconto: await ler('desconto'), frete: await ler('frete'), total: await ler('total') };
  }

  // ---------- Checkout ----------
  async irParaCheckout() {
    await this.page.getByRole('link', { name: 'Finalizar compra' }).click();
    await expect(this.page).toHaveURL(/\/checkout$/);
  }

  async preencherCliente(nome: string, email: string, cep: string) {
    await this.page.fill('#campo-nome', nome);
    await this.page.fill('#campo-email', email);
    await this.page.fill('#campo-cep', cep);
  }

  async confirmarPedido() {
    await this.page.getByRole('button', { name: 'Confirmar pedido' }).click();
  }
}

/**
 * Salva um print em docs/evidencias/ui quando a variável EVIDENCIAS=1 está ligada.
 * Também anexa o print ao relatório HTML do Playwright.
 */
export async function evidencia(page: Page, testInfo: TestInfo, nome: string) {
  const img = await page.screenshot({ fullPage: true });
  await testInfo.attach(nome, { body: img, contentType: 'image/png' });
  if (process.env.EVIDENCIAS === '1') {
    await page.screenshot({ path: `docs/evidencias/ui/${nome}.png`, fullPage: true });
  }
}
