migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('vinculos')

    // Matriz (SPEC-1-001): listar/ver = próprio usuário OU administrador da empresa;
    // criar = quem tem a empresa ENVIADA no corpo em acesso_admin (CA-1-05);
    // editar = administrador da empresa do vínculo, sem trocar usuario/empresa;
    // apagar = ninguém (desativar é update de ativo=false).
    col.listRule =
      "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.acesso_admin ?= empresa)"
    col.viewRule =
      "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.acesso_admin ?= empresa)"
    col.createRule = "@request.auth.id != '' && @request.auth.acesso_admin ?= @request.body.empresa"
    col.updateRule =
      "@request.auth.id != '' && @request.auth.acesso_admin ?= empresa && @request.body.usuario:isset != true && @request.body.empresa:isset != true"
    col.deleteRule = null

    // E-mail denormalizado no vínculo: a tela de usuários lista sem expand de users
    // (users só permite ver o próprio usuário).
    if (!col.fields.getByName('email')) {
      col.fields.add(new TextField({ name: 'email' }))
    }

    app.save(col)

    // Regras de empresas (SPEC-1-001): listar/ver = quem tem acesso; editar = acesso_admin;
    // criar/apagar = só por migração (null = superusuário).
    const emp = app.findCollectionByNameOrId('empresas')
    emp.listRule = "@request.auth.id != '' && @request.auth.acesso_empresas ?= id"
    emp.viewRule = "@request.auth.id != '' && @request.auth.acesso_empresas ?= id"
    emp.updateRule = "@request.auth.id != '' && @request.auth.acesso_admin ?= id"
    emp.createRule = null
    emp.deleteRule = null
    app.save(emp)

    // Cor definitiva da Rumo Agro enviada pelo Diogo (logo azul-petróleo #304A54).
    let rumo
    try {
      rumo = app.findFirstRecordByData('empresas', 'slug', 'rumo-agro')
    } catch (_) {
      return
    }
    if (rumo.getString('cor_primaria') !== '#304A54') {
      rumo.set('cor_primaria', '#304A54')
      app.save(rumo)
    }

    // Recálculo inicial dos campos acesso_* (usuários criados antes do hook existir).
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
  },
  (app) => {
    const col = app.findCollectionByNameOrId('vinculos')
    col.listRule = "@request.auth.id != '' && usuario = @request.auth.id"
    col.viewRule = "@request.auth.id != '' && usuario = @request.auth.id"
    col.createRule = ''
    col.updateRule = ''
    col.deleteRule = ''
    if (col.fields.getByName('email')) {
      col.fields.removeByName('email')
    }
    app.save(col)
    const emp = app.findCollectionByNameOrId('empresas')
    emp.listRule = "@request.auth.id != ''"
    emp.viewRule = "@request.auth.id != ''"
    emp.updateRule = ''
    emp.createRule = ''
    emp.deleteRule = ''
    app.save(emp)
    try {
      const rumo = app.findFirstRecordByData('empresas', 'slug', 'rumo-agro')
      rumo.set('cor_primaria', '#37474F')
      app.save(rumo)
    } catch (_) {}
  },
)
