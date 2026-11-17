// FASE 2 — SPEC-2-003: fixtures de teste (exigidas pelo TDD da spec).
//
// A spec lista os dados/fixtures necessários:
//   - comercial1, comercial2, gestao, operador e um usuário da Rumo Agro;
//   - teste.multi@agrospy.com.br com vínculo Comercial nas DUAS empresas (testa RN-42);
//   - "TESTE — Produtor A" com visitas e uma oportunidade com ação para amanhã.
//
// A limpeza de 01/11 apagou todas as fixtures antigas; esta migração recria o mínimo
// que as provas RED 1 / RED 2 / GREEN 1-3 / REFACTOR exigem. Tudo aqui é de TESTE e
// está marcado como tal: a SPEC-2-004 manda limpar de novo no fim da fase.
// Idempotente: rodar de novo não duplica nada.
migrate(
  (app) => {
    const SENHA = 'Teste#2026'
    const users = app.findCollectionByNameOrId('users')
    const vinculos = app.findCollectionByNameOrId('vinculos')
    const produtores = app.findCollectionByNameOrId('produtores')
    const visitas = app.findCollectionByNameOrId('visitas')
    const oportunidades = app.findCollectionByNameOrId('oportunidades')
    const empresas = app.findCollectionByNameOrId('empresas')

    const agro = app.findFirstRecordByFilter(empresas, 'nome = "Agrospy"')
    let rumo = null
    try {
      rumo = app.findFirstRecordByFilter(empresas, 'nome ~ "Rumo"')
    } catch (e) {
      rumo = null
    }

    const garanteUsuario = (email, nome) => {
      let u
      try {
        u = app.findFirstRecordByFilter(users, 'email = {:e}', { e: email })
      } catch (err) {
        u = new Record(users)
        u.set('email', email)
        u.set('name', nome)
        u.set('password', SENHA)
        u.set('passwordConfirm', SENHA)
        app.save(u)
      }
      u.setPassword(SENHA)
      app.save(u)
      return u
    }

    const garanteVinculo = (usuario, empresa, perfil) => {
      if (!empresa) return
      try {
        const v = app.findFirstRecordByFilter(vinculos, 'usuario = {:u} && empresa = {:e}', {
          u: usuario.id,
          e: empresa.id,
        })
        v.set('perfil', perfil)
        v.set('ativo', true)
        v.set('email', usuario.getString('email'))
        app.save(v)
      } catch (err) {
        const nv = new Record(vinculos)
        nv.set('usuario', usuario.id)
        nv.set('empresa', empresa.id)
        nv.set('perfil', perfil)
        nv.set('ativo', true)
        nv.set('email', usuario.getString('email'))
        app.save(nv)
      }
    }

    // ---- usuários de teste -------------------------------------------------
    const c1 = garanteUsuario('teste.comercial1@agrospy.com.br', 'Teste Comercial 1')
    const c2 = garanteUsuario('teste.comercial2@agrospy.com.br', 'Teste Comercial 2')
    const ge = garanteUsuario('teste.gestao@agrospy.com.br', 'Teste Gestão')
    const op = garanteUsuario('teste.operador@agrospy.com.br', 'Teste Operador')
    const mu = garanteUsuario('teste.multi@agrospy.com.br', 'Teste Multi Empresa')

    garanteVinculo(c1, agro, 'comercial')
    garanteVinculo(c2, agro, 'comercial')
    garanteVinculo(ge, agro, 'gestao')
    garanteVinculo(op, agro, 'operador')
    // RN-42: o mesmo usuário nas duas empresas, para provar a separação de memória.
    garanteVinculo(mu, agro, 'comercial')
    garanteVinculo(mu, rumo, 'comercial')

    // ---- "TESTE — Produtor A" com visitas e oportunidade --------------------
    let prod = null
    try {
      prod = app.findFirstRecordByFilter(produtores, 'nome = "TESTE — Produtor A"')
    } catch (err) {
      prod = new Record(produtores)
      prod.set('empresa', agro.id)
      prod.set('nome', 'TESTE — Produtor A')
      // Obrigatórios do schema (0011): sem eles o save é recusado.
      prod.set('municipio', 'Campo Mourão PR')
      prod.set('origem', 'prospeccao_ativa')
      prod.set('responsavel', c1.id)
      app.save(prod)
    }

    // Uma visita para o GREEN 1 ("o que conversei com o produtor")
    const jaTemVisita = app.findRecordsByFilter(visitas, 'produtor = {:p}', '', 5, 0, {
      p: prod.id,
    }).length
    if (jaTemVisita === 0) {
      const v = new Record(visitas)
      v.set('empresa', agro.id)
      v.set('produtor', prod.id)
      v.set('data', new Date().toISOString())
      v.set('responsavel_visita', c1.id)
      v.set(
        'assuntos_tratados',
        'Conversamos sobre correção de solo e ele pediu proposta de calcário.',
      )
      // Obrigatórios do schema (0021): sem eles o save é recusado.
      v.set('destino', 'sem_oportunidade')
      v.set('motivo_sem_oportunidade', 'sem_interesse_agora')
      app.save(v)
    }

    // Oportunidade com ação para AMANHÃ (GREEN 1: "minhas ações de amanhã")
    // `linha_negocio` é obrigatória (0022): sem ela o save é recusado.
    let linha = null
    try {
      linha = app.findFirstRecordByFilter('linhas_negocio', 'empresa = {:e}', { e: agro.id })
    } catch (err) {
      linha = null
    }
    if (!linha) {
      const nl = new Record(app.findCollectionByNameOrId('linhas_negocio'))
      nl.set('empresa', agro.id)
      nl.set('nome', 'Consultoria')
      nl.set('ativa', true)
      app.save(nl)
      linha = nl
    }

    const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const amanhaISO = amanha.toISOString().slice(0, 10) + ' 12:00:00.000Z'
    try {
      app.findFirstRecordByFilter(oportunidades, 'produtor = {:p} && situacao = "aberta"', {
        p: prod.id,
      })
    } catch (err) {
      const o = new Record(oportunidades)
      o.set('empresa', agro.id)
      o.set('produtor', prod.id)
      o.set('linha_negocio', linha.id)
      o.set('descricao', 'TESTE — proposta de calcário')
      o.set('responsavel', c1.id)
      o.set('situacao', 'aberta')
      o.set('proxima_acao', 'Levar proposta de calcário')
      o.set('proxima_acao_data', amanhaISO)
      app.save(o)
    }

    // ---- recálculo de acesso_* (sem isso as regras da fase 1 não liberam nada) --
    for (const x of app.findRecordsByFilter(users, '', '', 999, 0)) {
      const meus = app.findRecordsByFilter(vinculos, 'usuario = {:u} && ativo = true', '', 999, 0, {
        u: x.id,
      })
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

    console.log('[0043] fixtures da SPEC-2-003 prontas (5 usuários de teste + Produtor A)')
  },
  (app) => {
    // Sem reversão automática: apagar usuários aqui derrubaria vínculos e dados de
    // teste que a SPEC-2-004 limpa explicitamente no fim da fase.
  },
)
