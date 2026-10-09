import type { ProdutoId } from './loja';

/**
 * Cálculo independente das regras da documentação (VZS-142), feito em CENTAVOS INTEIROS
 * para não depender de ponto flutuante binário (ex.: 59.9 * 3 = 179.70000000000002 em JS).
 * Serve de "terceira fonte" nos testes: API, tela e regra de negócio precisam concordar.
 */
export const PRECOS_CENTAVOS: Record<ProdutoId, number> = {
  P001: 5990, P002: 13990, P003: 18990, P004: 4990,
  P005: 10000, P006: 2990, P007: 22990, P008: 5000,
};

const LIMITE_FRETE_GRATIS = 20000; // R$ 200,00 (CA06, inclusive)
const FRETE_FIXO = 1990;           // R$ 19,90 (CA07)
const CUPONS_VALIDOS: Record<string, number> = { BEMVINDO10: 10 }; // % (CA01)

export type Item = { produtoId: ProdutoId; quantidade: number };

export function calcularEsperado(itens: Item[], cupom?: string) {
  const subtotal = itens.reduce((s, i) => s + PRECOS_CENTAVOS[i.produtoId] * i.quantidade, 0);
  const percentual = cupom ? CUPONS_VALIDOS[cupom.trim().toUpperCase()] ?? 0 : 0;
  // Desconto sobre o subtotal dos produtos (CA01, CA09), arredondado ao centavo (CA11).
  const desconto = Math.round((subtotal * percentual) / 100);
  // Frete pelo subtotal ANTES do desconto (CA08).
  const frete = subtotal >= LIMITE_FRETE_GRATIS ? 0 : FRETE_FIXO;
  const total = subtotal - desconto + frete;
  const faltante = Math.max(LIMITE_FRETE_GRATIS - subtotal, 0);
  const reais = (c: number) => c / 100;
  return {
    subtotal: reais(subtotal),
    desconto: reais(desconto),
    frete: reais(frete),
    total: reais(total),
    valorFaltanteFreteGratis: reais(faltante),
  };
}
