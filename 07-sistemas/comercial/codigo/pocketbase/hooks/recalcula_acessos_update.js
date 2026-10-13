// Hook de acesso (SPEC-1-001): recalcula os campos acesso_* do usuário a partir dos
// vínculos ATIVOS. Um hook por arquivo; lógica inline (regra do guia de hooks).
onRecordUpdate((e) => {
  // Proteção: o ÚLTIMO administrador ativo da empresa não pode rebaixar o próprio
  // perfil nem desativar o próprio vínculo — a empresa ficaria sem admin e a tela
  // de usuários fecharia para todos (bug reproduzido em 12/10/2026). Promover outro
  // administrador primeiro é o caminho.
  const atual = e.record
  // Estado ANTES do update: o registro armazenado (o hook roda antes da gravação).
  // Não usar e.record.original() — indisponível no runtime e o try/catch engolia o erro.
  const armazenado = $app.findRecordById('vinculos', atual.id)
  const eraAdminAtivo =
    armazenado.getString('perfil') === 'administrador' && armazenado.getBool('ativo')
  const deixaDeSerAdmin = atual.getString('perfil') !== 'administrador'
  const desativa = atual.getBool('ativo') === false
  if (eraAdminAtivo && (deixaDeSerAdmin || desativa)) {
    const uid = atual.getString('usuario')
    const emp = atual.getString('empresa')
    const outros = $app.findRecordsByFilter(
      'vinculos',
      'usuario != {:uid} && empresa = {:emp} && perfil = "administrador" && ativo = true',
      '',
      1,
      0,
      { uid, emp },
    )
    if (outros.length === 0) {
      const auth = $requestInfo && $requestInfo.auth ? $requestInfo.auth : null
      const ehProprio = auth && auth.id === uid
      const msg = ehProprio
        ? 'Você é o último administrador desta empresa. Promova outro administrador antes de mudar o seu perfil.'
        : 'Esta empresa precisa de pelo menos um administrador ativo. Promova outro administrador antes.'
      throw new BadRequestError(msg)
    }
  }

  // Recálculo completo e idempotente: vínculos ATIVOS no banco + o registro em processamento
  // (hook roda ANTES da gravação, então o novo valor ainda não está no banco).
  const recalcularCom = (uid, atual2, excluirId) => {
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
      } else if (perfil === 'gestao') {
        gestao.push(emp)
      } else if (perfil === 'comercial') {
        comercial.push(emp)
      }
    }
    for (const v of vinculos) {
      if (excluirId && v.id === excluirId) continue
      add(v.getString('empresa'), v.getString('perfil'))
    }
    if (atual2 && atual2.getBool('ativo'))
      add(atual2.getString('empresa'), atual2.getString('perfil'))
    usuario.set('acesso_empresas', empresas)
    usuario.set('acesso_admin', admin)
    usuario.set('acesso_gestao', gestao)
    usuario.set('acesso_comercial', comercial)
    $app.save(usuario)
  }
  recalcularCom(atual.getString('usuario'), atual, atual.id)
  return e.next()
}, 'vinculos')
