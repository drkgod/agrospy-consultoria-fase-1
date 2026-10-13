migrate(
  (app) => {
    // Regras validadas em PocketBase local (v0.23.12) — padrão @collection self-join:
    // o lado direito é o campo do registro (@collection.empresas.id), não "id" nu.
    const col = app.findCollectionByNameOrId('vinculos')
    col.listRule =
      "@request.auth.id != '' && (usuario = @request.auth.id || @collection.empresas.users_via_acesso_admin.id ?= @request.auth.id)"
    col.viewRule =
      "@request.auth.id != '' && (usuario = @request.auth.id || @collection.empresas.users_via_acesso_admin.id ?= @request.auth.id)"
    col.createRule =
      "@request.auth.id != '' && @collection.empresas.users_via_acesso_admin.id ?= @request.auth.id && @collection.empresas.id ?= @request.body.empresa"
    col.updateRule =
      "@request.auth.id != '' && @collection.empresas.users_via_acesso_admin.id ?= @request.auth.id && @request.body.usuario:isset != true && @request.body.empresa:isset != true"
    col.deleteRule = null
    app.save(col)

    const emp = app.findCollectionByNameOrId('empresas')
    emp.listRule = "@request.auth.id != '' && users_via_acesso_empresas.id ?= @request.auth.id"
    emp.viewRule = "@request.auth.id != '' && users_via_acesso_empresas.id ?= @request.auth.id"
    emp.updateRule = "@request.auth.id != '' && users_via_acesso_admin.id ?= @request.auth.id"
    app.save(emp)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('vinculos')
    col.listRule = "@request.auth.id != '' && usuario = @request.auth.id"
    col.viewRule = "@request.auth.id != '' && usuario = @request.auth.id"
    col.createRule = ''
    col.updateRule = ''
    col.deleteRule = ''
    app.save(col)
    const emp = app.findCollectionByNameOrId('empresas')
    emp.listRule = "@request.auth.id != ''"
    emp.viewRule = "@request.auth.id != ''"
    emp.updateRule = ''
    app.save(emp)
  },
)
