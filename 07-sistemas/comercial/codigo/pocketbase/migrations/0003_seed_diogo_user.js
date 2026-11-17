migrate(
  (app) => {
    const empresas = app.findCollectionByNameOrId('empresas')
    const users = app.findCollectionByNameOrId('users')
    const vinculos = app.findCollectionByNameOrId('vinculos')

    // Usuário do Diogo (idempotente)
    let diogo
    try {
      diogo = app.findAuthRecordByEmail('_pb_users_auth_', 'diogo.rojas@agrospy.com.br')
    } catch (_) {
      diogo = new Record(users)
      diogo.setEmail('diogo.rojas@agrospy.com.br')
      diogo.setName
        ? diogo.setName('Diogo Cardoso Rojas')
        : diogo.set('name', 'Diogo Cardoso Rojas')
      diogo.setPassword('Agrospy#2026')
      diogo.setVerified(true)
      app.save(diogo)
      diogo = app.findAuthRecordByEmail('_pb_users_auth_', 'diogo.rojas@agrospy.com.br')
    }

    // Vínculo Administrador nas duas empresas (idempotente)
    const seedVinculo = (empresaSlug, perfil) => {
      const empresa = app.findFirstRecordByData('empresas', 'slug', empresaSlug)
      try {
        const existentes = app.findRecordsByFilter(
          'vinculos',
          `usuario = "${diogo.id}" && empresa = "${empresa.id}"`,
          '',
          1,
          0,
        )
        if (existentes.length > 0) return
      } catch (_) {}
      const v = new Record(vinculos)
      v.set('usuario', diogo.id)
      v.set('empresa', empresa.id)
      v.set('perfil', perfil)
      v.set('ativo', true)
      v.set('nome_exibicao', 'Diogo Cardoso Rojas')
      app.save(v)
    }
    seedVinculo('agrospy', 'administrador')
    seedVinculo('rumo-agro', 'administrador')
  },
  (app) => {
    // down: remove o usuário e os vínculos do Diogo
    try {
      const diogo = app.findAuthRecordByEmail('_pb_users_auth_', 'diogo.rojas@agrospy.com.br')
      app.delete(diogo)
    } catch (_) {}
  },
)
