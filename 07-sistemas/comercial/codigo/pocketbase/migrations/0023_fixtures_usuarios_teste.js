// SPEC-1-003 — fixtures de teste (SPEC f1425ca3): garante os usuários de teste da
// SPEC-1-001 com a senha documentada (Teste#2026) e os vínculos por perfil.
// Idempotente; a limpeza acontece no fechamento da task (migração própria).
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const vinculos = app.findCollectionByNameOrId('vinculos')
    const empresas = app.findCollectionByNameOrId('empresas')
    const agro = app.findFirstRecordByFilter(empresas, 'nome = "Agrospy"')
    const rumo = app.findFirstRecordByFilter(empresas, 'nome = "Rumo Agro"')
    const SENHA = 'Teste#2026'

    const garante = (email, nome, vinculosDesejados) => {
      let u
      try {
        u = app.findFirstRecordByFilter(users, `email = "${email}"`)
      } catch (e) {
        u = new Record(users)
        u.set('email', email)
        u.set('name', nome)
        u.set('password', SENHA)
        u.set('passwordConfirm', SENHA)
        app.save(u)
      }
      u.setPassword(SENHA)
      app.save(u)
      for (const v of vinculosDesejados) {
        try {
          app.findFirstRecordByFilter(vinculos, `usuario = "${u.id}" && empresa = "${v.empresa}"`)
        } catch (e) {
          const nv = new Record(vinculos)
          nv.set('usuario', u.id)
          nv.set('empresa', v.empresa)
          nv.set('perfil', v.perfil)
          nv.set('email', email)
          nv.set('ativo', true)
          app.save(nv)
        }
      }
      return u.id
    }

    garante('teste.gestao@agrospy.com.br', 'Teste Gestão', [{ empresa: agro.id, perfil: 'gestao' }])
    garante('teste.comercial1@agrospy.com.br', 'Teste Comercial 1', [
      { empresa: agro.id, perfil: 'comercial' },
    ])
    garante('teste.comercial2@agrospy.com.br', 'Teste Comercial 2', [
      { empresa: agro.id, perfil: 'comercial' },
    ])
    garante('teste.operador@agrospy.com.br', 'Teste Operador', [
      { empresa: agro.id, perfil: 'operador' },
    ])
    garante('teste.comercial@rumoagro.com.br', 'Teste Comercial Rumo', [
      { empresa: rumo.id, perfil: 'comercial' },
    ])
    garante('teste.multi@agrospy.com.br', 'Teste Multi', [
      { empresa: agro.id, perfil: 'comercial' },
      { empresa: rumo.id, perfil: 'operador' },
    ])
    console.log('[0023] usuários de teste garantidos')
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const emails = [
      'teste.gestao@agrospy.com.br',
      'teste.comercial1@agrospy.com.br',
      'teste.comercial2@agrospy.com.br',
      'teste.operador@agrospy.com.br',
      'teste.comercial@rumoagro.com.br',
      'teste.multi@agrospy.com.br',
    ]
    for (const email of emails) {
      try {
        const u = app.findFirstRecordByFilter(users, `email = "${email}"`)
        app.delete(u)
      } catch (e) {
        /* não existe */
      }
    }
  },
)
