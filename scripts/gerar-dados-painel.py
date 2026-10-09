"""Atualiza docs/resultados.json, que é a FONTE OFICIAL dos resultados (lida pelo painel).

O que é editado à mão no JSON: o status de cada cenário (`cenarios[].resultado`, `bugs`,
`evidencias`) e de cada bug (`bugs[]`). Todo o resto é derivado por este script:
  - `resumo`: contagens calculadas a partir das listas de cenários, bugs e observações;
  - `automacao`: números da última execução (reports/playwright.json e reports/resumo-api.json);
  - `cenarios[].gherkin` e `tags`: lidos de docs/02-cenarios.feature;
  - `analise`, `execucao`, `usoDeIA`: lidos dos documentos docs/01, 03 e 05;
  - `galeria`: lida de docs/evidencias/ui.
Também confere a consistência entre o Gherkin, o JSON e as evidências e falha se algo divergir.

Uso: python3 scripts/gerar-dados-painel.py   (ou npm run painel:dados)
"""
import json
import pathlib
import re
import sys
import textwrap

R = pathlib.Path(__file__).resolve().parent.parent
D = R / "docs"
res = json.loads((D / "resultados.json").read_text(encoding="utf-8"))
erros = []


def tabela_apos(md, marcador):
    """Primeira tabela markdown que aparece depois do texto `marcador`."""
    if marcador not in md:
        erros.append(f"marcador não encontrado: {marcador!r}")
        return []
    bloco = []
    for linha in md.split(marcador, 1)[1].splitlines():
        if linha.startswith("|"):
            bloco.append(linha)
        elif bloco:
            break
    return _linhas_da_tabela(bloco)


def tabela_com_cabecalho(md, primeira_coluna):
    """Tabela cujo cabeçalho começa com `| primeira_coluna |`."""
    linhas = md.splitlines()
    for i, l in enumerate(linhas):
        if l.startswith(f"| {primeira_coluna} |"):
            bloco = []
            for x in linhas[i:]:
                if not x.startswith("|"):
                    break
                bloco.append(x)
            return _linhas_da_tabela(bloco)
    erros.append(f"tabela com cabeçalho {primeira_coluna!r} não encontrada")
    return []


def _linhas_da_tabela(bloco):
    if len(bloco) < 3:
        return []
    cab = [x.strip() for x in bloco[0].strip("|").split("|")]
    return [dict(zip(cab, [x.strip() for x in l.strip("|").split("|")])) for l in bloco[2:]]


# ---------- Gherkin por cenário ----------
feat = (D / "02-cenarios.feature").read_text(encoding="utf-8")
blocos, atual = {}, None
for linha in feat.splitlines():
    if re.match(r"\s*(Funcionalidade|Regra):", linha):
        atual = None
        continue
    m = re.match(r"\s*(@CT\d+)\b", linha)
    if m:
        atual = m.group(1)[1:]
        blocos[atual] = {"tags": linha.split(), "linhas": []}
        continue
    if atual:
        blocos[atual]["linhas"].append(linha)
for c in res["cenarios"]:
    b = blocos.get(c["id"])
    if not b:
        erros.append(f"{c['id']} está no JSON mas não no Gherkin")
        continue
    c["gherkin"] = textwrap.dedent("\n".join(b["linhas"])).strip()
    c["tags"] = b["tags"]
for ct in blocos:
    if not any(c["id"] == ct for c in res["cenarios"]):
        erros.append(f"{ct} está no Gherkin mas não no JSON")

# ---------- consistência de bugs e evidências ----------
ids_bugs = {b["id"] for b in res["bugs"]}
for c in res["cenarios"]:
    for b in c["bugs"]:
        if b not in ids_bugs:
            erros.append(f"{c['id']} cita {b}, que não existe em bugs[]")
    if c["bugs"] and c["resultado"] != "falhou":
        erros.append(f"{c['id']} tem bug ligado mas resultado {c['resultado']!r}")
    for e in c["evidencias"]:
        if not (R / e).exists():
            erros.append(f"{c['id']}: evidência não encontrada {e}")
for b in res["bugs"]:
    if not any(b["id"] in c["bugs"] for c in res["cenarios"]):
        erros.append(f"{b['id']} não está ligado a nenhum cenário")

# ---------- resumo calculado (nunca editado à mão) ----------
cen = res["cenarios"]
sev = lambda s: sum(1 for b in res["bugs"] if b["severidade"] == s)
cls = lambda s: sum(1 for b in res["bugs"] if b.get("classificacao", "").startswith(s))
res["resumo"] = {
    "cenarios": len(cen),
    "passou": sum(1 for c in cen if c["resultado"] == "passou"),
    "falhou": sum(1 for c in cen if c["resultado"] == "falhou"),
    "bloqueado": sum(1 for c in cen if c["resultado"] == "bloqueado"),
    "bugs": {"total": len(res["bugs"]), "critica": sev("Crítica"), "alta": sev("Alta"), "media": sev("Média"), "baixa": sev("Baixa")},
    "classificacao": {"confirmados": cls("Defeito confirmado"), "divergencias": cls("Divergência"), "aConfirmar": cls("A confirmar")},
    "observacoes": len(res["observacoes"]),
}

# ---------- automação: números da última execução ----------
pw = R / "reports" / "playwright.json"
if pw.exists():
    st = json.loads(pw.read_text(encoding="utf-8"))["stats"]
    total = st["expected"] + st["unexpected"] + st["flaky"] + st["skipped"]
    res["automacao"]["playwright"] = {
        "testes": total, "passou": st["expected"], "falhou": st["unexpected"], "instaveis": st["flaky"],
        "guardasDeBugConhecido": 1,
        "nota": "Sem test.fail(): o teste do BUG01 afirma o comportamento atual e falha quando o bug for corrigido.",
    }
api = R / "reports" / "resumo-api.json"
if api.exists():
    a = json.loads(api.read_text(encoding="utf-8"))
    res["automacao"]["postman"] = {
        "requisicoes": a["requisicoes"], "assercoes": a["assercoes"], "assercoesFalharam": a["assercoesFalharam"],
        "requisicoesFalharam": len(a["falhasDeBugsConhecidos"]) + len(a["falhasInesperadas"]),
        "falhasInesperadas": len(a["falhasInesperadas"]), "veredito": a["veredito"],
        "nota": "Só falham as requisições marcadas com [BUGxx]; qualquer outra falha deixa o pipeline vermelho (scripts/api.mjs).",
    }

# ---------- análise, execução e uso de IA (lidos dos documentos) ----------
a = (D / "01-analise-da-documentacao.md").read_text(encoding="utf-8")
lim = a.split("## 1.1", 1)[1].split("## 1.2", 1)[0]
res["analise"] = {
    "resumo": "Entrega VZS-142: cupom de desconto no carrinho e regra de frete grátis. Os cálculos são feitos pela API e a interface apenas exibe o resultado, por isso a estratégia testa as duas camadas e compara uma com a outra.",
    "limitacoesDoAmbiente": [l[2:].strip() for l in lim.splitlines() if l.startswith("- ")],
    "regras": tabela_apos(a, "## 1.2"),
    "limitesDeValor": tabela_apos(a, "**Combinações úteis para valor-limite**"),
    "api": tabela_apos(a, "## 1.3"),
    "ambiguidades": tabela_apos(a, "## 1.4"),
    "estrategia": [l[2:].strip() for l in a.split("## 1.5", 1)[1].splitlines() if l.startswith("- ")],
}
e = (D / "03-execucao.md").read_text(encoding="utf-8")
sessoes = []
for s in e.split("### Sessão")[1:]:
    itens = dict(re.findall(r"^- \*\*(.+?):\*\* (.*)$", s, re.M))
    sessoes.append({"titulo": "Sessão " + s.splitlines()[0].strip(), "oQueFiz": itens.get("O que fiz", ""),
                    "oQueEncontrei": itens.get("O que encontrei", ""), "duvidas": itens.get("Dúvidas e ideias", "")})
res["execucao"] = {
    "ambiente": [{"campo": m.group(1), "valor": m.group(2).strip()}
                 for m in re.finditer(r"^\| \*\*(.+?)\*\* \| (.+?) \|$", e.split("## 3.1")[0], re.M)],
    "sessoesExploratorias": sessoes,
    "telaVsApi": tabela_apos(e, "## 3.4"),
    "carrinhosAleatorios": "40 carrinhos aleatórios (1 a 4 produtos, 1 a 5 unidades, com e sem cupom) comparados com um cálculo independente: 0 diferenças.",
}
res["usoDeIA"] = tabela_com_cabecalho((D / "05-uso-de-ia.md").read_text(encoding="utf-8"), "Etapa")

# ---------- galeria das telas da loja ----------
TITULOS = {
    "CT01_cupom_valido": "Cupom BEMVINDO10 aplicado (10%)",
    "CT02_cupom_normalizado": "Cupom em minúsculas aceito",
    "CT03_cupom_normalizado": "Cupom com espaços aceito",
    "CT05_cupom_xpto": "Cupom inexistente: \"Cupom inválido.\"",
    "CT06_cupom_verao2026": "Cupom expirado: \"Cupom expirado.\"",
    "CT07_cupom_vazio": "Campo vazio: \"Informe um cupom.\"",
    "CT08_um_cupom_por_vez": "Um cupom por vez",
    "CT09_trocar_cupom": "Remover e trocar o cupom, sem desconto residual",
    "CT12_BUG01_frete_200": "Subtotal R$ 200,00 cobrando frete",
    "BUG01_200_com_cupom": "Subtotal R$ 200,00 com cupom cobrando frete",
    "CT13_faltante_frete": "Abaixo de R$ 200: quanto falta",
    "CT14_frete_antes_do_desconto": "Frete grátis antes do desconto",
    "CT18_limite_vitrine": "Limite de 5 unidades na vitrine",
    "CT18_limite_carrinho": "Limite de 5 unidades no carrinho",
    "CT25_pedido_confirmado": "Pedido confirmado",
    "CT26_validacao_cliente": "Validação dos dados do cliente",
    "CT29_tela_igual_api": "Valores da tela iguais aos da API",
    "CT33_quantidade_com_cupom": "Quantidade alterada com cupom: tudo recalculado",
    "CT34_remover_produto_com_cupom": "Produto removido com cupom: tudo recalculado",
    "CT36_pedido_recusado": "Pedido recusado pela API: sem confirmação",
    "BUG03_banner_primeira_compra": "Banner \"na primeira compra\"",
    "BUG06_1_carrinho_vazio": "1. Carrinho vazio após remover o item",
    "BUG06_2_cupom_continua_aplicado": "2. Cupom continua aplicado",
    "BUG06_3_esvaziar_remove_cupom": "3. \"Esvaziar carrinho\" remove o cupom",
}
galeria = []
for p in sorted((D / "evidencias" / "ui").glob("*.png")):
    caminho = f"docs/evidencias/ui/{p.name}"
    rel = next((c for c in cen if caminho in c["evidencias"]), None)
    if not rel:
        erros.append(f"evidência sem cenário: {caminho}")
    galeria.append({"arquivo": caminho, "titulo": TITULOS.get(p.stem, p.stem.replace("_", " ")),
                    "cenario": rel["id"] if rel else None, "cenarioTitulo": rel["titulo"] if rel else None,
                    "resultado": rel["resultado"] if rel else None,
                    "bugs": re.findall(r"BUG\d+", p.stem) or (rel["bugs"] if rel else [])})
res["galeria"] = galeria
res["documentos"] = [
    {"titulo": "Análise da documentação", "arquivo": "docs/01-analise-da-documentacao.md"},
    {"titulo": "Cenários (Gherkin)", "arquivo": "docs/02-cenarios.feature"},
    {"titulo": "Execução", "arquivo": "docs/03-execucao.md"},
    {"titulo": "Bugs", "arquivo": "docs/04-bugs.md"},
    {"titulo": "Uso de IA", "arquivo": "docs/05-uso-de-ia.md"},
]

if erros:
    print("✘ Inconsistências encontradas — resultados.json NÃO foi alterado:")
    for x in erros:
        print("  •", x)
    sys.exit(1)

(D / "resultados.json").write_text(json.dumps(res, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
r = res["resumo"]
print(f"✔ resultados.json atualizado · {r['cenarios']} cenários ({r['passou']} passou, {r['falhou']} falhou) · "
      f"{r['bugs']['total']} bugs ({r['classificacao']['confirmados']} confirmados) · {len(galeria)} telas")
