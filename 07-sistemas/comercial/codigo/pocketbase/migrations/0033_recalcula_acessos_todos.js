// ed490cca/0033 — RECALCULA os campos acesso_* de TODOS os usuários a partir dos
// vínculos ativos (mesma lógica dos hooks recalcula_acessos_*). Correção do estado
// inconsistente do teste.admin (acesso_admin zerado após a 0032 setar o campo direto
// no user, fora do fluxo dos hooks). Idempotente: pode rodar quantas vezes precisar.
migrate(
  (app) => {
    const usuarios = app.findRecordsByFilter('users', '', '', 999, 0)
    let corrigidos = 0
    for (const usuario of usuarios) {
      const vinculos = app.findRecordsByFilter(
        'vinculos',
        'usuario = {:uid} && ativo = true',
        '',
        999,
        0,
        { uid: usuario.id },
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
        add(v.getString('empresa'), v.getString('perfil'))
      }
      usuario.set('acesso_empresas', empresas)
      usuario.set('acesso_admin', admin)
      usuario.set('acesso_gestao', gestao)
      usuario.set('acesso_comercial', comercial)
      app.save(usuario)
      corrigidos++
    }
    console.log('0033 recalc acesso_*: ' + corrigidos + ' usuarios')
  },
  (app) => {
    console.log('0033 down: recálculo é idempotente — nada a reverter')
  },
)
