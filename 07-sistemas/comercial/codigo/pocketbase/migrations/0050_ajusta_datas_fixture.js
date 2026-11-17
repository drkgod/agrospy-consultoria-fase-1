// MANUTENÇÃO DE FIXTURE (09/11/2026): recoloca a ação de teste na data certa.
//
// A fixture da SPEC-2-003 foi criada em 02/11 com "amanhã" calculado NAQUELE dia —
// ou seja, 03/11. Na prova de 09/11 a ação já estava 6 dias atrasada e o assistente
// respondia corretamente "não encontrei ações para amanhã". O teste estava medindo a
// fixture vencida, não o código.
// Aqui a ação do "TESTE — Produtor A" é movida para amanhã (e uma segunda para hoje),
// para as provas GREEN 1 terem o dado que a spec exige. Idempotente.
migrate(
  (app) => {
    const agoraBR = new Date(Date.now() - 3 * 60 * 60 * 1000)
    const iso = (d) => d.toISOString().slice(0, 10) + ' 12:00:00.000Z'
    const hoje = iso(agoraBR)
    const amanha = iso(new Date(agoraBR.getTime() + 86400000))
    const semana = iso(new Date(agoraBR.getTime() + 5 * 86400000))

    let prod = null
    try {
      prod = app.findFirstRecordByFilter('produtores', 'nome = "TESTE — Produtor A"')
    } catch (err) {
      console.log('[0050] produtor de teste ausente — nada a ajustar')
      return
    }

    const users = app.findCollectionByNameOrId('users')
    let c1 = null
    try {
      c1 = app.findFirstRecordByFilter(users, 'email = "teste.comercial1@agrospy.com.br"')
    } catch (err) {
      console.log('[0050] usuario de teste ausente')
      return
    }

    const oportunidades = app.findCollectionByNameOrId('oportunidades')
    const existentes = app.findRecordsByFilter(oportunidades, 'produtor = {:p}', '', 10, 0, {
      p: prod.id,
    })

    const ajustar = (rec, data, acao) => {
      rec.set('proxima_acao_data', data)
      rec.set('proxima_acao', acao)
      rec.set('responsavel', c1.id)
      rec.set('situacao', 'aberta')
      app.save(rec)
    }

    if (existentes.length === 0) {
      // Cria as duas (hoje e amanhã) para cobrir as duas perguntas da spec.
      let linha = null
      try {
        linha = app.findFirstRecordByFilter('linhas_negocio', 'empresa = {:e}', {
          e: prod.getString('empresa'),
        })
      } catch (err) {
        const nl = new Record(app.findCollectionByNameOrId('linhas_negocio'))
        nl.set('empresa', prod.getString('empresa'))
        nl.set('nome', 'Consultoria')
        nl.set('ativa', true)
        app.save(nl)
        linha = nl
      }
      const criar = (data, acao, desc) => {
        const o = new Record(oportunidades)
        o.set('empresa', prod.getString('empresa'))
        o.set('produtor', prod.id)
        o.set('linha_negocio', linha.id)
        o.set('descricao', desc)
        o.set('responsavel', c1.id)
        o.set('situacao', 'aberta')
        o.set('proxima_acao', acao)
        o.set('proxima_acao_data', data)
        app.save(o)
      }
      criar(amanha, 'Levar proposta de calcário', 'TESTE — proposta de calcário (amanhã)')
      criar(hoje, 'Ligar sobre a análise de solo', 'TESTE — ligação (hoje)')
      console.log('[0050] duas oportunidades de teste criadas (hoje e amanhã)')
    } else {
      // Reaproveita as existentes: a primeira vai para amanhã, a segunda para hoje.
      ajustar(existentes[0], amanha, 'Levar proposta de calcário')
      if (existentes.length > 1) ajustar(existentes[1], hoje, 'Ligar sobre a análise de solo')
      console.log(
        '[0050] oportunidades de teste reposicionadas (hoje=' +
          hoje.slice(0, 10) +
          ', amanhã=' +
          amanha.slice(0, 10) +
          ')',
      )
    }

    // Uma terceira para a semana, para a pergunta "ações da semana".
    if (existentes.length < 3) {
      let linha = null
      try {
        linha = app.findFirstRecordByFilter('linhas_negocio', 'empresa = {:e}', {
          e: prod.getString('empresa'),
        })
      } catch (err) {
        linha = null
      }
      if (linha) {
        const o = new Record(oportunidades)
        o.set('empresa', prod.getString('empresa'))
        o.set('produtor', prod.id)
        o.set('linha_negocio', linha.id)
        o.set('descricao', 'TESTE — follow-up da semana')
        o.set('responsavel', c1.id)
        o.set('situacao', 'aberta')
        o.set('proxima_acao', 'Follow-up da proposta')
        o.set('proxima_acao_data', semana)
        app.save(o)
      }
    }
  },
  (app) => {
    // sem reversão: dado de teste, limpo pela SPEC-2-004
  },
)
