migrate(
  (app) => {
    // Correção das regras de empresas: a comparação "@request.auth.acesso_empresas ?= id"
    // não resolve no PocketBase; o padrão documentado é back-relation a partir do registro
    // da empresa (users_via_<campo>). Mesma correção no createRule de users (o fix da 0004
    // não chegou ao banco porque a migração já tinha rodado).
    const emp = app.findCollectionByNameOrId('empresas')
    emp.listRule = "@request.auth.id != '' && users_via_acesso_empresas.id ?= @request.auth.id"
    emp.viewRule = "@request.auth.id != '' && users_via_acesso_empresas.id ?= @request.auth.id"
    emp.updateRule = "@request.auth.id != '' && users_via_acesso_admin.id ?= @request.auth.id"
    app.save(emp)

    const users = app.findCollectionByNameOrId('users')
    users.createRule =
      "@request.auth.id != '' && @request.auth.acesso_admin:length > 0" +
      ' && @request.body.acesso_empresas:isset != true' +
      ' && @request.body.acesso_admin:isset != true' +
      ' && @request.body.acesso_gestao:isset != true' +
      ' && @request.body.acesso_comercial:isset != true'
    app.save(users)
  },
  (app) => {
    const emp = app.findCollectionByNameOrId('empresas')
    emp.listRule = "@request.auth.id != '' && @request.auth.acesso_empresas ?= id"
    emp.viewRule = "@request.auth.id != '' && @request.auth.acesso_empresas ?= id"
    emp.updateRule = "@request.auth.id != '' && @request.auth.acesso_admin ?= id"
    app.save(emp)
    const users = app.findCollectionByNameOrId('users')
    users.createRule = "@request.auth.id != '' && @request.auth.acesso_admin:length > 0"
    app.save(users)
  },
)
