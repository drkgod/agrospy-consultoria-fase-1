migrate(
  (app) => {
    // Segurança: na v0.0.10 (createRule de users sem o bloqueio de acesso_*), um usuário
    // de teste foi criado COM acesso_admin no corpo — o campo pode ter ficado setado.
    // 1) Recalcula acesso_* de TODOS os usuários a partir dos vínculos (zera qualquer
    //    valor injetado); 2) remove os usuários de teste órfãos.
    const usuarios = app.findRecordsByFilter('users', 'id != ""', '', 999, 0)
    for (const u of usuarios) {
      const vins = app.findRecordsByFilter(
        'vinculos',
        'usuario = {:uid} && ativo = true',
        '',
        999,
        0,
        { uid: u.id },
      )
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
    }

    for (const email of ['y@y.com', 'teste.perfis@agrospy.com.br']) {
      try {
        const lixo = app.findFirstRecordByFilter('users', 'email = {:email}', { email })
        app.delete(lixo)
      } catch (_) {}
    }
  },
  (app) => {
    // Rollback: sem ação (a limpeza é irreversível por natureza; os campos acesso_*
    // e o recálculo continuam válidos).
  },
)
