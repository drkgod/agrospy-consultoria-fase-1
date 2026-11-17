// Hook de acesso (SPEC-1-001): recalcula os campos acesso_* do usuário a partir dos
// vínculos ATIVOS. Um hook por arquivo; lógica inline (regra do guia de hooks).
onRecordCreate((e) => {
  // Recálculo completo e idempotente: vínculos ATIVOS no banco + o registro em processamento
  // (hook roda ANTES da gravação, então o novo valor ainda não está no banco).
  const recalcularCom = (uid, atual, excluirId) => {
    if (!uid) return
    let usuario
    try {
      usuario = $app.findRecordById('users', uid)
    } catch (_) {
      return
    }
    const vinculos = $app.findRecordsByFilter(
      'vinculos',
      'usuario = {:uid} && ativo = true',
      '',
      999,
      0,
      { uid },
    )
    const empresas = []
    const admin = []
    const gestao = []
    const comercial = []
    const add = (emp, perfil) => {
      if (!emp) return
      if (empresas.indexOf(emp) < 0) empresas.push(emp)
      if (perfil === 'administrador') {
        admin.push(emp)
        gestao.push(emp)
      } else if (perfil === 'comercial') {
        comercial.push(emp)
      }
    }
    for (const v of vinculos) {
      if (excluirId && v.id === excluirId) continue
      add(v.getString('empresa'), v.getString('perfil'))
    }
    if (atual && atual.getBool('ativo')) add(atual.getString('empresa'), atual.getString('perfil'))
    usuario.set('acesso_empresas', empresas)
    usuario.set('acesso_admin', admin)
    usuario.set('acesso_gestao', gestao)
    usuario.set('acesso_comercial', comercial)
    $app.save(usuario)
  }
  recalcularCom(e.record.getString('usuario'), e.record, '')
  return e.next()
}, 'vinculos')
