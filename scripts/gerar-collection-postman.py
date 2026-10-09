"""Gera postman/verzel-store.postman_collection.json e o environment.
Uso: python3 scripts/gerar-collection-postman.py
Requisições com [BUGxx] no nome validam o requisito e falham enquanto o bug existir."""
import json, sys, uuid, pathlib
out=str(pathlib.Path(__file__).resolve().parent.parent / "postman")
def req(name, method, path, body=None, tests="", raw=None, headers=True):
    r={"method":method,"header":[{"key":"Content-Type","value":"application/json"}] if headers else [],
       "url":{"raw":"{{baseUrl}}"+path,"host":["{{baseUrl}}"],"path":[p for p in path.strip("/").split("/")]}}
    if body is not None or raw is not None:
        r["body"]={"mode":"raw","raw":raw if raw is not None else json.dumps(body,ensure_ascii=False,indent=2),"options":{"raw":{"language":"json"}}}
    return {"name":name,"request":r,"event":[{"listen":"test","script":{"type":"text/javascript","exec":tests.strip().split("\n")}}]}

C="/api/carrinho/calcular"; P="/api/pedidos"
cli={"nome":"Maria Silva","email":"maria@exemplo.com","cep":"01310-100"}
def it(*a): return [{"produtoId":p,"quantidade":q} for p,q in a]

# Helpers ficam no pré-request da collection (funções em pm.globals não são boas práticas);
# cada teste usa utilitários simples e explícitos.
OK="""const b = pm.response.json();
pm.test('{id} · status {st}', () => pm.response.to.have.status({st}));"""
def money(field,val,label=None):
    return f"pm.test('{label or field} = {val}', () => pm.expect(b.{field}).to.eql({val}));"
def erro(id,st,cod,campo=None):
    s=f"""const b = pm.response.json();
const e = b.erro || {{}};
pm.test('{id} · status {st}', () => pm.response.to.have.status({st}));
pm.test('{id} · código de erro {cod}', () => pm.expect(e.codigo).to.eql('{cod}'));
pm.test('{id} · erro tem mensagem', () => pm.expect(e.mensagem).to.be.a('string').and.not.empty);"""
    if campo: s+=f"\npm.test('{id} · campo {campo}', () => pm.expect(e.campo).to.eql('{campo}'));"
    return s
def calc_ok(id,sub,des,fr,tot,falt,grat,extra=""):
    return OK.format(id=id,st=200)+f"""
pm.test('{id} · subtotal = {sub}', () => pm.expect(b.subtotal).to.eql({sub}));
pm.test('{id} · desconto = {des}', () => pm.expect(b.desconto).to.eql({des}));
pm.test('{id} · frete = {fr}', () => pm.expect(b.frete).to.eql({fr}));
pm.test('{id} · freteGratis = {str(grat).lower()}', () => pm.expect(b.freteGratis).to.eql({str(grat).lower()}));
pm.test('{id} · valorFaltanteFreteGratis = {falt}', () => pm.expect(b.valorFaltanteFreteGratis).to.eql({falt}));
pm.test('{id} · total = {tot}', () => pm.expect(b.total).to.eql({tot}));
pm.test('{id} · total = subtotal - desconto + frete', () => pm.expect(b.total).to.eql(Math.round((b.subtotal - b.desconto + b.frete) * 100) / 100));
"""+extra
def cupom(id,cod,apl,msg):
    c="null" if cod is None else f"'{cod}'"
    return f"""pm.test('{id} · cupom.codigo = {cod}', () => pm.expect(b.cupom.codigo).to.eql({c}));
pm.test('{id} · cupom.aplicado = {str(apl).lower()}', () => pm.expect(b.cupom.aplicado).to.eql({str(apl).lower()}));
pm.test('{id} · cupom.mensagem = "{msg}"', () => pm.expect(b.cupom.mensagem).to.eql('{msg}'));"""
MSG_OK="Cupom aplicado: 10% de desconto nos produtos."

folders=[]
folders.append(("01 · Produtos",[
 req("CT21 · Listar produtos","GET","/api/produtos",tests="""const b = pm.response.json();
pm.test('CT21 · status 200', () => pm.response.to.have.status(200));
pm.test('CT21 · 8 produtos', () => pm.expect(b).to.have.lengthOf(8));
const esperado = {P001:59.9,P002:139.9,P003:189.9,P004:49.9,P005:100,P006:29.9,P007:229.9,P008:50};
pm.test('CT21 · preços iguais aos da documentação', () => b.forEach(p => pm.expect(p.preco, p.id).to.eql(esperado[p.id])));
pm.test('CT21 · contrato de cada produto', () => b.forEach(p => pm.expect(p).to.have.all.keys('id','nome','descricao','categoria','preco')));"""),
 req("CT22 · Consultar produto existente","GET","/api/produtos/P003",tests="""const b = pm.response.json();
pm.test('CT22 · status 200', () => pm.response.to.have.status(200));
pm.test('CT22 · produto P003 Tênis Casual Urbano', () => { pm.expect(b.id).to.eql('P003'); pm.expect(b.nome).to.eql('Tênis Casual Urbano'); pm.expect(b.preco).to.eql(189.9); });"""),
 req("CT22 · Consultar produto inexistente","GET","/api/produtos/P999",tests=erro("CT22",404,"PRODUTO_NAO_ENCONTRADO")),
]))
folders.append(("02 · Cupom",[
 req("CT01 · BEMVINDO10 aplica 10% sobre o subtotal (exemplo da doc)","POST",C,{"itens":it(("P002",1),("P004",2)),"cupom":"BEMVINDO10"},calc_ok("CT01",239.7,23.97,0,215.73,0,True,cupom("CT01","BEMVINDO10",True,MSG_OK))),
 req("CT02 · Cupom em minúsculas é aceito","POST",C,{"itens":it(("P005",1)),"cupom":"bemvindo10"},calc_ok("CT02",100,10,19.9,109.9,100,False,cupom("CT02","BEMVINDO10",True,MSG_OK))),
 req("CT03 · Espaços no início e no fim são ignorados","POST",C,{"itens":it(("P005",1)),"cupom":"  BemVindo10  "},calc_ok("CT03",100,10,19.9,109.9,100,False,cupom("CT03","BEMVINDO10",True,MSG_OK))),
 req("CT04 · Espaço no meio do código torna o cupom inválido","POST",C,{"itens":it(("P005",1)),"cupom":"BEM VINDO10"},calc_ok("CT04",100,0,19.9,119.9,100,False,cupom("CT04","BEM VINDO10",False,"Cupom inválido."))),
 req("CT05 · Cupom inexistente: 200, sem desconto, 'Cupom inválido.'","POST",C,{"itens":it(("P005",1)),"cupom":"XPTO"},calc_ok("CT05",100,0,19.9,119.9,100,False,cupom("CT05","XPTO",False,"Cupom inválido."))),
 req("CT06 · Cupom expirado: 200, sem desconto, 'Cupom expirado.'","POST",C,{"itens":it(("P005",1)),"cupom":"VERAO2026"},calc_ok("CT06",100,0,19.9,119.9,100,False,cupom("CT06","VERAO2026",False,"Cupom expirado."))),
 req("CT10 · Sem cupom: desconto zero e cupom null","POST",C,{"itens":it(("P005",1))},calc_ok("CT10",100,0,19.9,119.9,100,False,"pm.test('CT10 · cupom = null', () => pm.expect(b.cupom).to.eql(null));")),
 req("CT11 · Pedido com cupom inexistente → 422 CUPOM_INVALIDO","POST",P,{"cliente":cli,"itens":it(("P005",1)),"cupom":"XPTO"},erro("CT11",422,"CUPOM_INVALIDO","cupom")),
 req("CT11 · Pedido com cupom expirado → 422 CUPOM_EXPIRADO","POST",P,{"cliente":cli,"itens":it(("P005",1)),"cupom":"VERAO2026"},erro("CT11",422,"CUPOM_EXPIRADO","cupom")),
]))
folders.append(("03 · Frete grátis e cálculo",[
 req("CT12 · Subtotal R$ 199,80 cobra frete e faltam R$ 0,20","POST",C,{"itens":it(("P001",1),("P002",1))},calc_ok("CT12",199.8,0,19.9,219.7,0.2,False)),
 req("CT12 · Subtotal R$ 200,00 exato tem frete grátis [BUG01]","POST",C,{"itens":it(("P005",2))},calc_ok("CT12",200,0,0,200,0,True)),
 req("CT12 · Subtotal R$ 200,00 com cupom continua com frete grátis [BUG01]","POST",C,{"itens":it(("P005",2)),"cupom":"BEMVINDO10"},calc_ok("CT12",200,20,0,180,0,True)),
 req("CT12 · Subtotal R$ 219,80 tem frete grátis","POST",C,{"itens":it(("P003",1),("P006",1))},calc_ok("CT12",219.8,0,0,219.8,0,True)),
 req("CT13 · Abaixo de R$ 200 informa quanto falta","POST",C,{"itens":it(("P001",3))},calc_ok("CT13",179.7,0,19.9,199.6,20.3,False)),
 req("CT14 · Frete grátis usa o subtotal antes do desconto","POST",C,{"itens":it(("P007",1)),"cupom":"BEMVINDO10"},calc_ok("CT14",229.9,22.99,0,206.91,0,True)),
 req("CT15 · Desconto não incide sobre o frete","POST",C,{"itens":it(("P005",1)),"cupom":"BEMVINDO10"},calc_ok("CT15",100,10,19.9,109.9,100,False)),
 req("CT17 · Arredondamento em 2 casas (59,90 x 3 com cupom)","POST",C,{"itens":it(("P001",3)),"cupom":"BEMVINDO10"},calc_ok("CT17",179.7,17.97,19.9,181.63,20.3,False,"""pm.test('CT17 · nenhum valor com mais de 2 casas', () => ['subtotal','desconto','frete','total','valorFaltanteFreteGratis'].forEach(k => pm.expect(Math.round(b[k]*100)/100, k).to.eql(b[k])));
pm.test('CT17 · total do item = 179.7', () => pm.expect(b.itens[0].total).to.eql(179.7));""")),
]))
folders.append(("04 · Quantidade",[
 req("CT19 · Quantidade 1 é aceita","POST",C,{"itens":it(("P001",1))},calc_ok("CT19",59.9,0,19.9,79.8,140.1,False)),
 req("CT19 · Quantidade 5 é aceita","POST",C,{"itens":it(("P001",5))},calc_ok("CT19",299.5,0,0,299.5,0,True)),
 req("CT19 · 5 unidades de dois produtos são aceitas (limite por produto)","POST",C,{"itens":it(("P001",5),("P002",5))},calc_ok("CT19",999,0,0,999,0,True,"pm.test('CT19 · os dois itens com 5 unidades', () => pm.expect(b.itens.map(i => i.quantidade)).to.eql([5, 5]));")),
 req("CT19 · Quantidade 6 no cálculo → 422 QUANTIDADE_MAXIMA_EXCEDIDA [BUG02]","POST",C,{"itens":it(("P001",6))},erro("CT19",422,"QUANTIDADE_MAXIMA_EXCEDIDA","itens[0].quantidade")),
 req("CT19 · Quantidade 6 no pedido → 422 QUANTIDADE_MAXIMA_EXCEDIDA [BUG02]","POST",P,{"cliente":cli,"itens":it(("P001",6))},erro("CT19",422,"QUANTIDADE_MAXIMA_EXCEDIDA","itens[0].quantidade")),
]+[req(f"CT20 · Quantidade {lbl} → 422 QUANTIDADE_INVALIDA","POST",C,{"itens":[dict({"produtoId":"P001"},**({} if v=="__ausente__" else {"quantidade":v}))]},erro("CT20",422,"QUANTIDADE_INVALIDA","itens[0].quantidade"))
   for lbl,v in [("0",0),("-1",-1),("1.5",1.5),('"2" (texto)',"2"),("ausente","__ausente__")]]))
folders.append(("05 · Validação de itens e contrato",[
 req("CT23 · Lista de itens vazia → ITENS_OBRIGATORIOS","POST",C,{"itens":[]},erro("CT23",422,"ITENS_OBRIGATORIOS","itens")),
 req("CT23 · Sem lista de itens → ITENS_OBRIGATORIOS","POST",C,{},erro("CT23",422,"ITENS_OBRIGATORIOS","itens")),
 req("CT23 · Item que não é objeto → ITEM_INVALIDO","POST",C,{"itens":["P001"]},erro("CT23",422,"ITEM_INVALIDO","itens[0]")),
 req("CT23 · Produto inexistente no carrinho → 422 PRODUTO_NAO_ENCONTRADO","POST",C,{"itens":it(("P999",1))},erro("CT23",422,"PRODUTO_NAO_ENCONTRADO","itens[0].produtoId")),
 req("CT23 · Produto repetido → ITEM_DUPLICADO","POST",C,{"itens":it(("P001",1),("P001",2))},erro("CT23",422,"ITEM_DUPLICADO","itens[1].produtoId")),
 req("CT24 · JSON inválido → 400 JSON_INVALIDO","POST",C,raw="{itens:",tests=erro("CT24",400,"JSON_INVALIDO")),
 req("CT24 · Rota inexistente → 404 ROTA_NAO_ENCONTRADA","GET","/api/nao-existe",tests=erro("CT24",404,"ROTA_NAO_ENCONTRADA")),
 req("CT24 · Método não permitido → 405 METODO_NAO_PERMITIDO","GET",C,tests=erro("CT24",405,"METODO_NAO_PERMITIDO")),
]))
pedido_ok="""const b = pm.response.json();
pm.test('{id} · status 201', () => pm.response.to.have.status(201));
pm.test('{id} · número no formato VZ-000000', () => pm.expect(b.numero).to.match(/^VZ-\\d{{6}}$/));
pm.test('{id} · criadoEm é data ISO', () => pm.expect(new Date(b.criadoEm).toISOString()).to.eql(b.criadoEm));
pm.test('{id} · CEP normalizado sem hífen', () => pm.expect(b.cliente.cep).to.eql('01310100'));
pm.test('{id} · subtotal {sub}, desconto {des}, frete {fr}, total {tot}', () => {{ pm.expect(b.subtotal).to.eql({sub}); pm.expect(b.desconto).to.eql({des}); pm.expect(b.frete).to.eql({fr}); pm.expect(b.total).to.eql({tot}); }});"""
def dados(id,campo,msg):
    return erro(id,422,"DADOS_INVALIDOS")+f"""
pm.test('{id} · campos contém {campo}', () => pm.expect((e.campos || []).map(c => c.campo)).to.include('{campo}'));
pm.test('{id} · mensagem "{msg}"', () => pm.expect(((e.campos || []).find(c => c.campo === '{campo}') || {{}}).mensagem).to.eql('{msg}'));"""
folders.append(("06 · Pedido",[
 req("CT25 · Pedido com cupom (exemplo da doc) → 201","POST",P,{"cliente":cli,"itens":it(("P005",1)),"cupom":"BEMVINDO10"},pedido_ok.format(id="CT25",sub=100,des=10,fr=19.9,tot=109.9)),
 req("CT28 · CEP sem hífen é aceito","POST",P,{"cliente":dict(cli,cep="01310100"),"itens":it(("P005",1))},pedido_ok.format(id="CT28",sub=100,des=0,fr=19.9,tot=119.9)),
 req("CT12 · Pedido com subtotal R$ 200,00 sem frete [BUG01]","POST",P,{"cliente":cli,"itens":it(("P005",2))},pedido_ok.format(id="CT12",sub=200,des=0,fr=0,tot=200)),
 req("CT27 · Nome sem sobrenome → DADOS_INVALIDOS","POST",P,{"cliente":dict(cli,nome="Maria"),"itens":it(("P005",1))},dados("CT27","cliente.nome","Informe nome e sobrenome.")),
 req("CT27 · E-mail sem domínio → DADOS_INVALIDOS","POST",P,{"cliente":dict(cli,email="maria@"),"itens":it(("P005",1))},dados("CT27","cliente.email","Informe um e-mail válido.")),
 req("CT27 · CEP com 7 dígitos → DADOS_INVALIDOS","POST",P,{"cliente":dict(cli,cep="0131010"),"itens":it(("P005",1))},dados("CT27","cliente.cep","Informe um CEP com 8 dígitos.")),
 req("CT27 · Hífen na posição errada do CEP → DADOS_INVALIDOS","POST",P,{"cliente":dict(cli,cep="013101-00"),"itens":it(("P005",1))},dados("CT27","cliente.cep","Informe um CEP com 8 dígitos.")),
 req("CT27 · Todos os dados inválidos listam os 3 campos","POST",P,{"cliente":{"nome":"M","email":"x","cep":"1"},"itens":it(("P005",1))},erro("CT27",422,"DADOS_INVALIDOS")+"\npm.test('CT27 · 3 campos com erro', () => pm.expect((e.campos || []).map(c => c.campo)).to.have.members(['cliente.nome','cliente.email','cliente.cep']));"),
 req("CT32 · Nome só com números é recusado [BUG04]","POST",P,{"cliente":dict(cli,nome="123 456"),"itens":it(("P005",1))},dados("CT32","cliente.nome","Informe nome e sobrenome.")),
 req("CT32 · E-mail com pontos seguidos é recusado [BUG05]","POST",P,{"cliente":dict(cli,email="maria@exemplo..com"),"itens":it(("P005",1))},dados("CT32","cliente.email","Informe um e-mail válido.")),
]))
col={"info":{"_postman_id":str(uuid.uuid5(uuid.NAMESPACE_URL,"verzel-store-qa")),"name":"Verzel Store · Cupom e frete grátis (VZS-142)",
 "description":"Testes de API da entrega VZS-142 (cupom de desconto e frete grátis). Cada requisição tem o ID do cenário (CTxx) de docs/02-cenarios.feature. Requisições marcadas com [BUGxx] falham de propósito enquanto o bug existir.",
 "schema":"https://schema.getpostman.com/json/collection/v2.1.0/collection.json"},
 "item":[{"name":n,"item":i} for n,i in folders],
 "variable":[{"key":"baseUrl","value":"https://verzel-store.qa-test-verzel-store.workers.dev"}]}
json.dump(col,open(out+"/verzel-store.postman_collection.json","w"),ensure_ascii=False,indent=2)
env={"id":str(uuid.uuid5(uuid.NAMESPACE_URL,"verzel-env")),"name":"Verzel Store · QA","values":[{"key":"baseUrl","value":"https://verzel-store.qa-test-verzel-store.workers.dev","enabled":True}],"_postman_variable_scope":"environment"}
json.dump(env,open(out+"/verzel-store.postman_environment.json","w"),ensure_ascii=False,indent=2)
print(sum(len(i) for _,i in folders),"requests")
