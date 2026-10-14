// SPEC-1-003 — administrador de teste para a tela de linhas de negócio (CA-1-14)
// + recálculo de acesso_* (mesma lógica da 0027: salvar sempre, reler para conferir).
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const vinculos = app.findCollectionByNameOrId('vinculos')
    const empresas = app.findCollectionByNameOrId('empresas')
    const agro = app.findFirstRecordByFilter(empresas, 'nome = "Agrospy"')
    const SENHA = 'Teste#2026'
    const EMAIL = 'teste.admin@agrospy.com.br'

    let u
    try {
      u = app.findFirstRecordByFilter(users, `email = "${EMAIL}"`)
    } catch (e) {
      u = new Record(users)
      u.set('email', EMAIL)
      u.set('name', 'Teste Administrador')
      u.set('password', SENHA)
      u.set('passwordConfirm', SENHA)
      app.save(u)
    }
    u.setPassword(SENHA)
    app.save(u)
    try {
      app.findFirstRecordByFilter(vinculos, `usuario = "${u.id}" && empresa = "${agro.id}"`)
    } catch (e) {
      const nv = new Record(vinculos)
      nv.set('usuario', u.id)
      nv.set('empresa', agro.id)
      nv.set('perfil', 'administrador')
      nv.set('email', EMAIL)
      nv.set('ativo', true)
      app.save(nv)
    }

    const todos = app.findRecordsByFilter(users, '')
    for (const x of todos) {
      const meus = app.findRecordsByFilter(
        vinculos,
        `usuario = "${x.id}" && ativo = true`,
        '',
        999,
        0,
      )
      const empresasArr = []
      const admin = []
      const gestao = []
      const comercial = []
      for (const v of meus) {
        const emp = v.getString('empresa')
        const perfil = v.getString('perfil')
        if (!emp) continue
        if (empresasArr.indexOf(emp) < 0) empresasArr.push(emp)
        if (perfil === 'administrador') {
          admin.push(emp)
          gestao.push(emp)
        } else if (perfil === 'gestao') {
          gestao.push(emp)
        } else if (perfil === 'comercial') {
          comercial.push(emp)
        }
      }
      x.set('acesso_empresas', empresasArr)
      x.set('acesso_admin', admin)
      x.set('acesso_gestao', gestao)
      x.set('acesso_comercial', comercial)
      app.save(x)
    }
    const conf = app.findFirstRecordByFilter(users, `email = "${EMAIL}"`)
    console.log(`[0028] admin de teste pronto; acesso_admin: ${JSON.stringify(conf.get('acesso_admin'))}`)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    try {
      const u = app.findFirstRecordByFilter(users, 'email = "teste.admin@agrospy.com.br"')
      app.delete(u)
    } catch (e) { /* não existe */ }
  },
)
