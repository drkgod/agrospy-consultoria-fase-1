// FASE 2 — SPEC-2-002: geração dos avisos da próxima ação.
// Regras: RN-36 (aviso do dia ao responsável), RN-37 (atraso no dia seguinte e a cada
// N dias), RN-38 (cópia a Gestão/Administrador ativos que não desligaram), RN-40
// (Brasília = UTC−3 fixo; o runtime não tem Intl), RN-39 (aviso não altera a oportunidade).
// A chave_unica (oportunidade+tipo+destinatário+data) impede repetição em execuções
// múltiplas no mesmo dia.
// Chamado pela rotina de 10 minutos e pela rota de teste.
const gerarAvisos = (agoraISO, somenteEmpresa) => {
  const agora = new Date(agoraISO || new Date().toISOString())
  // Brasília = UTC−3, calculado sem Intl (o runtime não tem).
  const br = new Date(agora.getTime() - 3 * 60 * 60 * 1000)
  const isoBR = br.toISOString()
  const hojeBR = isoBR.slice(0, 10)
  const horaBR = isoBR.slice(11, 16)

  const resultado = { empresas: 0, doDia: 0, atraso: 0, copias: 0, puladas: 0 }

  const filtroEmp = somenteEmpresa ? 'id = {:id}' : ''
  const empresas = $app.findRecordsByFilter(
    'empresas',
    filtroEmp,
    '',
    200,
    0,
    somenteEmpresa ? { id: somenteEmpresa } : {},
  )
  for (const empresa of empresas) {
    let config = null
    try {
      config = $app.findFirstRecordByFilter('config_avisos', 'empresa = {:e}', { e: empresa.id })
    } catch (err) {
      config = null
    }
    // Sem configuração: usa o padrão da SPEC (ativo, 07:00, 3 dias, com cópia).
    const ativo = config ? config.getBool('ativo') : true
    if (!ativo) continue
    const horario = (config && config.getString('horario')) || '07:00'
    const repetir = (config && config.getInt('repetir_atraso_dias')) || 3
    const comCopia = config ? config.getBool('copia_gestor') : true

    // Já rodou hoje? (RN-40 + ultima_execucao)
    if (config) {
      const ultima = config.getString('ultima_execucao')
      if (ultima && String(ultima).slice(0, 10) === hojeBR) {
        resultado.puladas++
        continue
      }
    }
    // Antes do horário configurado, nada (comparação de string HH:MM funciona).
    if (horaBR < horario) {
      resultado.puladas++
      continue
    }

    resultado.empresas++

    // Quem são os gestores desta empresa que aceitam cópia.
    const gestores = []
    if (comCopia) {
      const users = $app.findRecordsByFilter('users', '', '', 500, 0, {})
      for (const u of users) {
        const gestao = u.getStringSlice('acesso_gestao')
        const admin = u.getStringSlice('acesso_admin')
        const ehGestor = gestao.indexOf(empresa.id) >= 0 || admin.indexOf(empresa.id) >= 0
        if (!ehGestor) continue
        // A própria pessoa pode ter desligado a cópia (CA-2-09).
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
      const produtorId = op.getString('produtor')
      let nomeProdutor = ''
      try {
        nomeProdutor = $app.findRecordById('produtores', produtorId).getString('nome')
      } catch (err) {
        nomeProdutor = 'Produtor'
      }
      const acao = op.getString('proxima_acao')

      const criar = (destinatario, tipo, textoCurto) => {
        const chave = op.id + '|' + tipo + '|' + destinatario + '|' + hojeBR
        try {
          $app.findFirstRecordByFilter('avisos', 'chave_unica = {:c}', { c: chave })
          return false // já existe: não repete (CA-2-08)
        } catch (err) {
          // não existe: cria
        }
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

      if (dataAcao === hojeBR) {
        // RN-36: aviso do dia ao responsável.
        if (responsavel) {
          if (criar(responsavel, 'do_dia', 'Agrospy: você tem 1 ação para hoje')) resultado.doDia++
        } else {
          // Responsável inativo/ausente: cai na cópia aos gestores.
          for (const g of gestores) {
            if (criar(g, 'copia_gestor', 'Agrospy: 1 ação sem responsável para hoje'))
              resultado.copias++
          }
        }
      } else if (dataAcao < hojeBR) {
        // RN-37: atraso no dia seguinte e a cada N dias.
        const dias = Math.floor(
          (new Date(hojeBR + 'T00:00:00Z').getTime() -
            new Date(dataAcao + 'T00:00:00Z').getTime()) /
            86400000,
        )
        const tocaHoje = dias === 1 || (dias > 1 && (dias - 1) % repetir === 0)
        if (tocaHoje && responsavel) {
          if (criar(responsavel, 'atraso', 'Agrospy: 1 ação atrasada')) resultado.atraso++
          // RN-38: cópia aos gestores, sem duplicar para o próprio responsável.
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
      // Cria a configuração padrão na primeira execução (para registrar a execução).
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
  return resultado
}

module.exports = { gerarAvisos }
