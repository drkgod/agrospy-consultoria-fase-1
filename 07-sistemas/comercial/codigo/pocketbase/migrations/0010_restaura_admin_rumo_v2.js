migrate(
  (app) => {
    // Restauração pontual (2ª vez): a prova da v0.0.17 mostrou que o hook não
    // bloqueava (original() indisponível) e o rebaixamento de teste passou de novo.
    // Hook corrigido na v0.0.19; esta migração devolve o perfil.
    const alvo = app.findFirstRecordByFilter('vinculos', 'id = {:id}', { id: 'g7jkhzwwgsakkw0' })
    if (alvo.getString('perfil') !== 'administrador') {
      alvo.set('perfil', 'administrador')
      app.save(alvo)
    }
    const uid = alvo.getString('usuario')
    const u = app.findRecordById('users', uid)
    const vins = app.findRecordsByFilter('vinculos', 'usuario = {:uid} && ativo = true', '', 999, 0, { uid })
    const empresas = []
    const admin = []
    const gestao = []
    const comercial = []
    for (const v of vins) {
      const emp = v.getString('empresa')
      const perfil = v.getString('perfil')
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
  },
  (app) => {
    // Rollback: sem ação (restauração de dado).
  },
)
