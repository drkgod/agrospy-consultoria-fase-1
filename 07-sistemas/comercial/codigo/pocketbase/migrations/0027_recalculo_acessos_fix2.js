// SPEC-1-003 — fix 2 do recálculo: a 0026 comparou getString antes/depois do set e
// getString não reflete o set em relação múltipla — nada foi salvo. Agora salva
// sempre e confere relendo o registro do banco.
migrate(
  (app) => {
    const vinculos = app.findCollectionByNameOrId('vinculos')
    const users = app.findCollectionByNameOrId('users')
    const todos = app.findRecordsByFilter(users, '')
    let ajustados = 0
    for (const u of todos) {
      const meus = app.findRecordsByFilter(
        vinculos,
        `usuario = "${u.id}" && ativo = true`,
        '',
        999,
        0,
      )
      const empresas = []
      const admin = []
      const gestao = []
      const comercial = []
      for (const v of meus) {
        const emp = v.getString('empresa')
        const perfil = v.getString('perfil')
        if (!emp) continue
        if (empresas.indexOf(emp) < 0) empresas.push(emp)
        if (perfil === 'administrador') {
          admin.push(emp)
          gestao.push(emp)
        } else if (perfil === 'gestao') {
          gestao.push(emp)
        } else if (perfil === 'comercial') {
          comercial.push(emp)
        }
      }
      u.set('acesso_empresas', empresas)
      u.set('acesso_admin', admin)
      u.set('acesso_gestao', gestao)
      u.set('acesso_comercial', comercial)
      app.save(u)
      ajustados++
    }
    // conferência: relê o usuário de teste gestão
    try {
      const conf = app.findFirstRecordByFilter(users, 'email = "teste.gestao@agrospy.com.br"')
      console.log(
        `[0027] salvos: ${ajustados}; gestao agora: ${JSON.stringify(conf.get('acesso_gestao'))}`,
      )
    } catch (e) {
      console.log(`[0027] salvos: ${ajustados}; conferencia falhou: ${e}`)
    }
  },
  (app) => {
    // reversão: sem efeito (recálculo é derivado dos vínculos)
  },
)
