// SPEC-1-003 — fix: migrações rodam antes dos hooks registrarem, então os vínculos
// criados pela 0023 não passaram pelo recálculo de acesso_* (o usuário de teste
// gestão ficou com acesso_gestao vazio e as listRules escondiam visitas/oportunidades).
// Recalcula acesso_* de TODOS os usuários a partir dos vínculos ativos (idempotente).
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
      const antes = JSON.stringify([
        u.getString('acesso_empresas'),
        u.getString('acesso_admin'),
        u.getString('acesso_gestao'),
        u.getString('acesso_comercial'),
      ])
      u.set('acesso_empresas', empresas)
      u.set('acesso_admin', admin)
      u.set('acesso_gestao', gestao)
      u.set('acesso_comercial', comercial)
      const depois = JSON.stringify([
        u.getString('acesso_empresas'),
        u.getString('acesso_admin'),
        u.getString('acesso_gestao'),
        u.getString('acesso_comercial'),
      ])
      if (antes !== depois) {
        app.save(u)
        ajustados++
      }
    }
    console.log(`[0026] usuarios com acesso_* recalculado: ${ajustados}`)
  },
  (app) => {
    // reversão: sem efeito (recálculo é derivado dos vínculos)
  },
)
