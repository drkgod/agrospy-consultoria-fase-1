migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    // Campos derivados de acesso (SPEC-1-001): só o hook grava; regras recusam envio pelo corpo.
    const empresasId = app.findCollectionByNameOrId('empresas').id
    const rel = {
      type: 'relation',
      required: false,
      collectionId: empresasId,
      cascadeDelete: false,
      maxSelect: 999,
    }
    users.fields.add(new RelationField({ name: 'acesso_empresas', ...rel }))
    users.fields.add(new RelationField({ name: 'acesso_admin', ...rel }))
    users.fields.add(new RelationField({ name: 'acesso_gestao', ...rel }))
    users.fields.add(new RelationField({ name: 'acesso_comercial', ...rel }))

    // CA-1-05: criar usuário exige ser Administrador de alguma empresa.
    // Autoproteção (RED 4): o próprio usuário não pode enviar campos acesso_* no corpo.
    const semAcesso = (campo) => `@request.body.${campo}:isset != true`
    users.createRule =
      "@request.auth.id != '' && @request.auth.acesso_admin:length > 0" +
      ' && @request.body.acesso_empresas:isset != true' +
      ' && @request.body.acesso_admin:isset != true' +
      ' && @request.body.acesso_gestao:isset != true' +
      ' && @request.body.acesso_comercial:isset != true'
    users.updateRule = [
      'id = @request.auth.id',
      semAcesso('acesso_empresas'),
      semAcesso('acesso_admin'),
      semAcesso('acesso_gestao'),
      semAcesso('acesso_comercial'),
    ].join(' && ')

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.updateRule = 'id = @request.auth.id'
    users.createRule = ''
    for (const f of ['acesso_empresas', 'acesso_admin', 'acesso_gestao', 'acesso_comercial']) {
      users.fields.removeByName(f)
    }
    app.save(users)
  },
)
