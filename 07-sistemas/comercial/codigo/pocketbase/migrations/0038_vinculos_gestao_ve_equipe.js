// FASE 2 (achado na f2-005) — a Visão do gestor mostrava IDs no lugar dos nomes para
// quem é GESTÃO: a listRule de `vinculos` só permitia o Administrador da empresa ou o
// próprio usuário, então o mapa de nomes vinha vazio (só o próprio vínculo).
// A matriz da SPEC-1-001 dá à Gestão a visão de toda a carteira da empresa — ver o nome
// de quem é o responsável é parte disso. Amplia list/view para incluir acesso_gestao,
// mantendo create/update/delete como estavam (só Administrador cria/edita vínculo).
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('vinculos')
    const regra =
      "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.acesso_gestao.id ?= empresa || @collection.empresas.users_via_acesso_admin.id ?= @request.auth.id)"
    col.listRule = regra
    col.viewRule = regra
    app.save(col)
    console.log('0038 vinculos list/view com gestao ok')
  },
  (app) => {
    const col = app.findCollectionByNameOrId('vinculos')
    const regra =
      "@request.auth.id != '' && (usuario = @request.auth.id || @collection.empresas.users_via_acesso_admin.id ?= @request.auth.id)"
    col.listRule = regra
    col.viewRule = regra
    app.save(col)
  },
)
