migrate(
  (app) => {
    // SPEC-1-002 — regras de acesso (matriz da SPEC-1-001):
    // produtores: listar/ver = perfis da empresa (acesso_empresas);
    // criar = acesso_gestao OU acesso_comercial com responsavel = o próprio;
    // editar = acesso_gestao OU Comercial responsável (sem alterar responsavel);
    // trocar responsavel/arquivar = acesso_gestao (Gestão/Administrador);
    // apagar = ninguém (null). empresa nunca muda depois de criada.
    const p = app.findCollectionByNameOrId('produtores')
    p.listRule =
      "@request.auth.id != '' && @request.auth.acesso_empresas.id ?= empresa"
    p.viewRule =
      "@request.auth.id != '' && @request.auth.acesso_empresas.id ?= empresa"
    p.createRule =
      "@request.auth.id != '' && (" +
      '@request.auth.acesso_gestao.id ?= @request.body.empresa' +
      ' || (@request.auth.acesso_comercial.id ?= @request.body.empresa && (@request.body.responsavel = @request.auth.id || @request.body.responsavel:isset != true))' +
      ') && @request.body.empresa:isset = true'
    p.updateRule =
      "@request.auth.id != '' && @request.body.empresa:isset != true && (" +
      '@request.auth.acesso_gestao.id ?= empresa' +
      ' || (@request.auth.acesso_comercial.id ?= empresa && responsavel = @request.auth.id && @request.body.responsavel:isset != true)' +
      ' || (@request.auth.acesso_comercial.id ?= empresa && responsavel = @request.auth.id && @request.body.responsavel = @request.auth.id)' +
      ')'
    p.deleteRule = null
    app.save(p)

    const prop = app.findCollectionByNameOrId('propriedades')
    prop.listRule =
      "@request.auth.id != '' && @request.auth.acesso_empresas.id ?= empresa"
    prop.viewRule =
      "@request.auth.id != '' && @request.auth.acesso_empresas.id ?= empresa"
    prop.createRule =
      "@request.auth.id != '' && (" +
      '@request.auth.acesso_gestao.id ?= @request.body.empresa' +
      ' || @request.auth.acesso_comercial.id ?= @request.body.empresa' +
      ') && produtor.empresa ?= @request.body.empresa'
    prop.updateRule =
      "@request.auth.id != '' && (" +
      '@request.auth.acesso_gestao.id ?= empresa' +
      ' || (@request.auth.acesso_comercial.id ?= empresa && produtor.responsavel ?= @request.auth.id)' +
      ') && @request.body.empresa:isset != true && @request.body.produtor:isset != true'
    prop.deleteRule = null
    app.save(prop)

    // eventos: listar/ver = acesso_gestao (Gestão/Administrador); criar = só o servidor
    // (hook); editar/apagar = ninguém. O Comercial vê o evento pela ficha do produtor
    // via expand do hook de resposta? NÃO — a ficha usa a lista de produtores; o
    // histórico de troca de responsável fica visível para Gestão/Administrador.
    const ev = app.findCollectionByNameOrId('eventos')
    ev.listRule = "@request.auth.id != '' && @request.auth.acesso_gestao.id ?= empresa"
    ev.viewRule = "@request.auth.id != '' && @request.auth.acesso_gestao.id ?= empresa"
    ev.createRule = null
    ev.updateRule = null
    ev.deleteRule = null
    app.save(ev)
  },
  (app) => {
    const p = app.findCollectionByNameOrId('produtores')
    p.listRule = null
    p.viewRule = null
    p.createRule = null
    p.updateRule = null
    p.deleteRule = null
    app.save(p)
    const prop = app.findCollectionByNameOrId('propriedades')
    prop.listRule = null
    prop.viewRule = null
    prop.createRule = null
    prop.updateRule = null
    prop.deleteRule = null
    app.save(prop)
    const ev = app.findCollectionByNameOrId('eventos')
    ev.listRule = null
    ev.viewRule = null
    ev.createRule = null
    ev.updateRule = null
    ev.deleteRule = null
    app.save(ev)
  },
)
