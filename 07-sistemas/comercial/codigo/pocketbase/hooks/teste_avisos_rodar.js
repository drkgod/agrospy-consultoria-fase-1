// FASE 2 — SPEC-2-002: rota de teste da geração de avisos.
// Superusuário roda para todas; Administrador roda só para a empresa dele.
// Recebe { "agora": "ISO opcional", "empresa": "id opcional" }.
// A lógica de geração está INLINE (o runtime não aceita require('./local')).
routerAdd('POST', '/backend/v1/teste/avisos/rodar', (e) => {
  const auth = e.auth
  const superUser = e.hasSuperuserAuth()
  if (!auth && !superUser) throw e.unauthorizedError('Entre para rodar.')

  const corpo = e.requestInfo().body || {}
  let empresaId = corpo.empresa ? String(corpo.empresa) : ''

  if (!superUser) {
    const admin = auth.getStringSlice('acesso_admin')
    if (empresaId) {
      if (admin.indexOf(empresaId) < 0) throw e.forbiddenError('Só Administrador da empresa.')
    } else {
      if (admin.length === 0) throw e.forbiddenError('Só Administrador da empresa.')
      empresaId = admin[0]
    }
  }

  const agora = new Date(corpo.agora || new Date().toISOString())
  const br = new Date(agora.getTime() - 3 * 60 * 60 * 1000)
  const hojeBR = br.toISOString().slice(0, 10)
  const horaBR = br.toISOString().slice(11, 16)

  const resultado = { empresas: 0, doDia: 0, atraso: 0, copias: 0, puladas: 0 }

  const empresas = $app.findRecordsByFilter(
    'empresas',
    empresaId ? 'id = {:id}' : '',
    '',
    200,
    0,
    empresaId ? { id: empresaId } : {},
  )
  for (const empresa of empresas) {
    let config = null
    try {
      config = $app.findFirstRecordByFilter('config_avisos', 'empresa = {:e}', { e: empresa.id })
    } catch (err) {
      config = null
    }
    const ativo = config ? config.getBool('ativo') : true
    if (!ativo) continue
    const horario = (config && config.getString('horario')) || '07:00'
    const repetir = (config && config.getInt('repetir_atraso_dias')) || 3
    const comCopia = config ? config.getBool('copia_gestor') : true

    if (config) {
      const ultima = config.getString('ultima_execucao')
      if (ultima && String(ultima).slice(0, 10) === hojeBR) {
        resultado.puladas++
        continue
      }
    }
    if (horaBR < horario) {
      resultado.puladas++
      continue
    }

    resultado.empresas++

    const gestores = []
    if (comCopia) {
      const users = $app.findRecordsByFilter('users', '', '', 500, 0, {})
      for (const u of users) {
        const gestao = u.getStringSlice('acesso_gestao')
        const admin2 = u.getStringSlice('acesso_admin')
        if (gestao.indexOf(empresa.id) < 0 && admin2.indexOf(empresa.id) < 0) continue
        let desligada = false
        try {
          const p = $app.findFirstRecordByFilter(
            'preferencias_avisos',
            'usuario = {:u} && empresa = {:e}',
            { u: u.id, e: empresa.id },
          )
          desligada = p.getBool('copia_desligada')
        } catch (err) {
          desligada = false
        }
        if (!desligada) gestores.push(u.id)
      }
    }

    const oportunidades = $app.findRecordsByFilter(
      'oportunidades',
      'empresa = {:e} && situacao = "aberta"',
      'proxima_acao_data',
      500,
      0,
      { e: empresa.id },
    )

    for (const op of oportunidades) {
      const dataAcao = String(op.getString('proxima_acao_data')).slice(0, 10)
      if (!dataAcao) continue
      const responsavel = op.getString('responsavel')
      let nomeProdutor = 'Produtor'
      try {
        nomeProdutor = $app.findRecordById('produtores', op.getString('produtor')).getString('nome')
      } catch (err) {}
      const acao = op.getString('proxima_acao')

      const criar = (destinatario, tipo, textoCurto) => {
        const chave = op.id + '|' + tipo + '|' + destinatario + '|' + hojeBR
        try {
          $app.findFirstRecordByFilter('avisos', 'chave_unica = {:c}', { c: chave })
          return false
        } catch (err) {}
        const rec = new Record($app.findCollectionByNameOrId('avisos'))
        rec.set('empresa', empresa.id)
        rec.set('destinatario', destinatario)
        rec.set('oportunidade', op.id)
        rec.set('tipo', tipo)
        rec.set('referencia_data', dataAcao + ' 12:00:00.000Z')
        rec.set('texto_curto', textoCurto)
        rec.set('detalhe', nomeProdutor + ' · ' + (acao || 'próxima ação'))
        rec.set('envio', 'pendente')
        rec.set('chave_unica', chave)
        $app.save(rec)
        return true
      }

      if (dataAcao === hojeBR && responsavel) {
        if (criar(responsavel, 'do_dia', 'Agrospy: você tem 1 ação para hoje')) resultado.doDia++
      } else if (dataAcao < hojeBR) {
        const dias = Math.floor(
          (new Date(hojeBR + 'T00:00:00Z').getTime() -
            new Date(dataAcao + 'T00:00:00Z').getTime()) /
            86400000,
        )
        const tocaHoje = dias === 1 || (dias > 1 && (dias - 1) % repetir === 0)
        if (tocaHoje && responsavel) {
          if (criar(responsavel, 'atraso', 'Agrospy: 1 ação atrasada')) resultado.atraso++
          for (const g of gestores) {
            if (g === responsavel) continue
            if (criar(g, 'copia_gestor', 'Agrospy: 1 ação atrasada na equipe')) resultado.copias++
          }
        }
      }
    }

    if (config) {
      config.set('ultima_execucao', agora.toISOString())
      $app.save(config)
    } else {
      const nova = new Record($app.findCollectionByNameOrId('config_avisos'))
      nova.set('empresa', empresa.id)
      nova.set('ativo', true)
      nova.set('horario', '07:00')
      nova.set('repetir_atraso_dias', 3)
      nova.set('copia_gestor', true)
      nova.set('ultima_execucao', agora.toISOString())
      $app.save(nova)
    }
  }
  return e.json(200, resultado)
})
