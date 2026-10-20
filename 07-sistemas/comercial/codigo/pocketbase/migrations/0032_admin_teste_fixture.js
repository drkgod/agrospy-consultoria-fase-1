// SPEC-1-004/ed490cca — fixture: usuário de teste com perfil ADMINISTRADOR.
// Gap do 0023: sem admin de teste, a tela "Linhas de negócio" (só aparece p/ ehAdmin)
// e o createRule de linhas_negocio (exige acesso_admin) ficam sem prova automatizada.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const SENHA = 'Teste#2026'
    const agro = app.findFirstRecordByFilter(
      app.findCollectionByNameOrId('empresas'),
      'nome = "Agrospy"',
    )
    let u
    try {
      u = app.findFirstRecordByFilter(users, 'email = "teste.admin@agrospy.com.br"')
    } catch (e) {
      u = new Record(users)
      u.set('email', 'teste.admin@agrospy.com.br')
      u.set('name', 'Teste Admin')
      u.set('password', SENHA)
      u.set('passwordConfirm', SENHA)
      app.save(u)
    }
    // vínculo administrador na Agrospy (idempotente)
    const vinculos = app.findCollectionByNameOrId('vinculos')
    try {
      app.findFirstRecordByFilter(
        vinculos,
        'usuario = "' + u.id + '" && empresa = "' + agro.id + '"',
      )
    } catch (e) {
      const v = new Record(vinculos)
      v.set('usuario', u.id)
      v.set('empresa', agro.id)
      v.set('email', 'teste.admin@agrospy.com.br')
      v.set('perfil', 'administrador')
      v.set('ativo', true)
      app.save(v)
    }
    // recarrega os campos acesso_* do usuário (padrão das migrações 0008/0026/0027)
    const vinc = app.findFirstRecordByFilter(
      vinculos,
      'usuario = "' + u.id + '" && empresa = "' + agro.id + '"',
    )
    u.set('acesso_admin', [agro.id])
    u.set('acesso_gestao', [])
    u.set('acesso_comercial', [])
    u.set('acesso_empresas', [agro.id])
    app.save(u)
    console.log('0032 admin de teste ok')
  },
  (app) => {
    try {
      const u = app.findFirstRecordByFilter(
        app.findCollectionByNameOrId('users'),
        'email = "teste.admin@agrospy.com.br"',
      )
      app.delete(u)
    } catch (e) {
      /* não existe */
    }
  },
)
