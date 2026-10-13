migrate(
  (app) => {
    // Correção da createRule de produtores: aceitar responsavel AUSENTE no corpo
    // (o hook RN-10 preenche com o usuário autenticado). O fix anterior foi escrito
    // na própria 0013, que já tinha rodado — migração idempotente não re-executa.
    const p = app.findCollectionByNameOrId('produtores')
    p.createRule =
      "@request.auth.id != '' && (" +
      '@request.auth.acesso_gestao.id ?= @request.body.empresa' +
      ' || (@request.auth.acesso_comercial.id ?= @request.body.empresa && (@request.body.responsavel = @request.auth.id || @request.body.responsavel:isset != true))' +
      ') && @request.body.empresa:isset = true'
    app.save(p)
  },
  (app) => {
    const p = app.findCollectionByNameOrId('produtores')
    p.createRule =
      "@request.auth.id != '' && (" +
      '@request.auth.acesso_gestao.id ?= @request.body.empresa' +
      ' || (@request.auth.acesso_comercial.id ?= @request.body.empresa && @request.body.responsavel = @request.auth.id)' +
      ') && @request.body.empresa:isset = true'
    app.save(p)
  },
)
