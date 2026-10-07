# 1. Análise da documentação

Antes de escrever os cenários, li a documentação inteira da entrega e extraí as regras de negócio, o que é limitação proposital do ambiente e os pontos ambíguos.

## 1.1 O que é limitação do ambiente (não é bug)

> Copiar aqui, com as suas palavras, o que a seção **"Sobre este ambiente"** diz que foi simplificado de propósito.

- …

## 1.2 Regras de negócio da entrega

Cada regra recebe um ID para ser ligada aos cenários (rastreabilidade).

| ID | Regra | Fonte (seção da doc) |
|---|---|---|
| RN01 | Cupom: … | |
| RN02 | Cupom: … | |
| RN03 | Frete grátis: … | |
| RN04 | Cupom + frete grátis juntos: … | |

Perguntas que ajudam a não esquecer regras:
- Quais cupons existem? Valem por percentual ou valor fixo? Têm valor mínimo, validade, limite de uso?
- O desconto é calculado sobre o subtotal, sobre o total com frete, antes ou depois do frete grátis?
- Qual o valor mínimo do frete grátis? Exatamente o mínimo já ganha? E um centavo abaixo?
- O que acontece se eu remover itens depois de aplicar o cupom e o carrinho ficar abaixo do mínimo?
- Maiúsculas/minúsculas e espaços no código do cupom fazem diferença?
- Dá para aplicar dois cupons? Trocar de cupom? Remover o cupom?
- Como são arredondados os centavos?
- Quais mensagens de erro a documentação define?

## 1.3 API

| Método | Endpoint | Para que serve | Observações |
|---|---|---|---|
| | | | |

## 1.4 Ambiguidades e interpretações

As regras do teste pedem que, diante de ambiguidade, eu registre a minha interpretação e siga em frente.

| ID | Trecho / situação ambígua | Minha interpretação | Por quê |
|---|---|---|---|
| AMB01 | | | |

## 1.5 Estratégia

- **Prioridade:** regras de cálculo (valor errado = prejuízo ou reclamação do cliente) > fluxo de compra > mensagens e usabilidade.
- **Técnicas:** particionamento de equivalência e **análise de valor-limite** nos valores mínimos; testes negativos; exploratório guiado por sessões.
- **Camadas:** interface e API, conferindo se o valor exibido na tela é o mesmo retornado pela API.
- **Fora do escopo:** carga, estresse e segurança (regra do teste).
