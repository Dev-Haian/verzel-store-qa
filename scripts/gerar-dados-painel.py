"""Complementa docs/resultados.json com o conteúdo dos documentos (Gherkin, análise,
execução, uso de IA) para o painel exibir tudo. Rode: python3 scripts/gerar-dados-painel.py"""
import json, re, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
D = R / "docs"
res = json.loads((D / "resultados.json").read_text())

# ---------- Gherkin por cenário ----------
feat = (D / "02-cenarios.feature").read_text()
blocos, func, atual = {}, None, None
for linha in feat.splitlines():
    if linha.startswith("Funcionalidade:"):
        func = linha.split(":", 1)[1].strip(); atual = None; continue
    m = re.match(r"\s*@(CT\d+)", linha)
    if m:
        atual = m.group(1); blocos[atual] = {"tags": linha.strip(), "linhas": []}; continue
    if atual and (linha.strip() == "" and blocos[atual]["linhas"] and blocos[atual]["linhas"][-1] == ""):
        continue
    if atual and not linha.startswith("Funcionalidade"):
        if re.match(r"\s*@CT", linha): continue
        blocos[atual]["linhas"].append(linha[2:] if linha.startswith("  ") else linha)
for c in res["cenarios"]:
    b = blocos.get(c["id"])
    if b:
        c["gherkin"] = "\n".join(b["linhas"]).strip()
        c["tags"] = b["tags"].split()

# ---------- tabelas markdown ----------
def tabela(md, titulo):
    sec = md.split(titulo, 1)[1]
    linhas = [l for l in sec.splitlines() if l.startswith("|")]
    out = []
    # pega a primeira tabela contínua
    bloco = []
    for l in sec.splitlines():
        if l.startswith("|"): bloco.append(l)
        elif bloco: break
    cab = [x.strip() for x in bloco[0].strip("|").split("|")]
    for l in bloco[2:]:
        cel = [x.strip() for x in l.strip("|").split("|")]
        out.append(dict(zip(cab, cel)))
    return out

a = (D / "01-analise-da-documentacao.md").read_text()
lim = a.split("## 1.1", 1)[1].split("## 1.2", 1)[0]
res["analise"] = {
    "resumo": "Entrega VZS-142: cupom de desconto no carrinho e regra de frete grátis. Os cálculos são feitos pela API e a interface apenas exibe o resultado, por isso a estratégia testa as duas camadas e compara uma com a outra.",
    "limitacoesDoAmbiente": [l[2:].strip() for l in lim.splitlines() if l.startswith("- ")],
    "regras": tabela(a, "## 1.2"),
    "limitesDeValor": tabela(a, "**Combinações úteis para valor-limite**"),
    "api": tabela(a, "## 1.3"),
    "ambiguidades": tabela(a, "## 1.4"),
    "estrategia": [l[2:].strip() for l in a.split("## 1.5", 1)[1].splitlines() if l.startswith("- ")],
}

e = (D / "03-execucao.md").read_text()
sess = []
for s in e.split("### Sessão")[1:]:
    titulo = s.splitlines()[0].strip()
    itens = {}
    for l in s.splitlines():
        m = re.match(r"- \*\*(.+?):\*\* (.*)", l.strip())
        if m: itens[m.group(1)] = m.group(2)
    sess.append({"titulo": "Sessão" + " " + titulo, "oQueFiz": itens.get("O que fiz", ""), "oQueEncontrei": itens.get("O que encontrei", ""), "duvidas": itens.get("Dúvidas e ideias", "")})
res["execucao"] = {
    "ambiente": [{"campo": m.group(1), "valor": m.group(2).strip()} for m in re.finditer(r"^\| \*\*(.+?)\*\* \| (.+?) \|$", e.split("## 3.1")[0], re.M)],
    "sessoesExploratorias": sess,
    "telaVsApi": tabela(e, "## 3.4"),
    "carrinhosAleatorios": "40 carrinhos aleatórios (1 a 4 produtos, 1 a 5 unidades, com e sem cupom) comparados com um cálculo independente: 0 diferenças.",
}
u = (D / "05-uso-de-ia.md").read_text()
res["usoDeIA"] = tabela(u, "| Etapa |".replace("| Etapa |", "Abaixo, onde e como."))

# ---------- galeria das telas da loja ----------
TITULOS = {
 "CT01_cupom_valido": "Cupom BEMVINDO10 aplicado (10%)",
 "CT02_cupom_normalizado": "Cupom em minúsculas aceito",
 "CT03_cupom_normalizado": "Cupom com espaços aceito",
 "CT05_cupom_xpto": "Cupom inexistente: \"Cupom inválido.\"",
 "CT06_cupom_verao2026": "Cupom expirado: \"Cupom expirado.\"",
 "CT07_cupom_vazio": "Campo vazio: \"Informe um cupom.\"",
 "CT08_um_cupom_por_vez": "Um cupom por vez",
 "CT09_trocar_cupom": "Remover e trocar o cupom",
 "CT12_BUG01_frete_200": "Subtotal R$ 200,00 cobrando frete",
 "BUG01_200_com_cupom": "Subtotal R$ 200,00 com cupom cobrando frete",
 "CT13_faltante_frete": "Abaixo de R$ 200: quanto falta",
 "CT14_frete_antes_do_desconto": "Frete grátis antes do desconto",
 "CT18_limite_vitrine": "Limite de 5 unidades na vitrine",
 "CT18_limite_carrinho": "Limite de 5 unidades no carrinho",
 "CT25_pedido_confirmado": "Pedido confirmado",
 "CT26_validacao_cliente": "Validação dos dados do cliente",
 "CT29_tela_igual_api": "Valores da tela iguais aos da API",
 "BUG03_banner_primeira_compra": "Banner \"na primeira compra\"",
 "BUG06_1_carrinho_vazio": "1. Carrinho vazio após remover o item",
 "BUG06_2_cupom_continua_aplicado": "2. Cupom continua aplicado",
 "BUG06_3_esvaziar_remove_cupom": "3. \"Esvaziar carrinho\" remove o cupom",
}
ui = sorted((D / "evidencias" / "ui").glob("*.png"))
gal = []
for p in ui:
    nome = p.stem
    cen = re.match(r"(CT\d+)", nome)
    bug = re.findall(r"(BUG\d+)", nome)
    rel = next((c for c in res["cenarios"] if f"docs/evidencias/ui/{p.name}" in c["evidencias"]), None)
    gal.append({"arquivo": f"docs/evidencias/ui/{p.name}",
                "titulo": TITULOS.get(nome, nome.replace("_", " ")),
                "cenario": rel["id"] if rel else (cen.group(1) if cen else None),
                "cenarioTitulo": rel["titulo"] if rel else None,
                "resultado": rel["resultado"] if rel else None,
                "bugs": bug or (rel["bugs"] if rel else [])})
res["galeria"] = gal
res["documentos"] = [
    {"titulo": "Análise da documentação", "arquivo": "docs/01-analise-da-documentacao.md"},
    {"titulo": "Cenários (Gherkin)", "arquivo": "docs/02-cenarios.feature"},
    {"titulo": "Execução", "arquivo": "docs/03-execucao.md"},
    {"titulo": "Bugs", "arquivo": "docs/04-bugs.md"},
    {"titulo": "Uso de IA", "arquivo": "docs/05-uso-de-ia.md"},
]
(D / "resultados.json").write_text(json.dumps(res, ensure_ascii=False, indent=2) + "\n")
print("cenários com gherkin:", sum(1 for c in res["cenarios"] if c.get("gherkin")), "| regras", len(res["analise"]["regras"]),
      "| ambiguidades", len(res["analise"]["ambiguidades"]), "| sessões", len(sess), "| tela×api", len(res["execucao"]["telaVsApi"]),
      "| IA", len(res["usoDeIA"]), "| galeria", len(gal))
