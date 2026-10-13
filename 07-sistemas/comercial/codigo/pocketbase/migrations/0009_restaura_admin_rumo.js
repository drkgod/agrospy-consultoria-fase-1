migrate(
  (app) => {
    // Restauração pontual: o teste de 12/10 rebaixou o único administrador da
    // Rumo Agro (vínculo g7jkhzwwgsakkw0) — o sistema permitiu e a tela de
    // usuários fechou. O hook de proteção só existe a partir da v0.0.17/0.0.19.
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
