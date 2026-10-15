// SPEC-1-003 — hook "próxima ação vigente": ao incluir uma ação em acoes_oportunidade
// (concluida ou reagendada), atualiza proxima_acao/proxima_acao_data da oportunidade
// com a ação de registrado_em mais recente (RN-17/RN-18). Recalcula a partir do
// histórico (idempotente). Request hook: precisa de auth para registrado_por.
// Padrão da casa: e.next() no fim de cada bloco.
// Datas comparadas por STRING (o runtime não tem startOfDay(); DateTime.string()
// também não existe — lição dos logs: TypeError vira "Failed to create record.").
// Data de hoje no fuso de Brasília (SPEC-1-005, RN-26) — "YYYY-MM-DD".
// UTC erra entre 00h e 03h de Brasília (ainda é ontem). O JSVM NÃO TEM Intl
// (ReferenceError: Intl is not defined — lição dos logs) — Brasília = UTC-3 fixo,
// sem horário de verão. LÓGICA INLINE nos callbacks: o JSVM não expõe declarações
// top-level dentro deles (scoping error do QA).
onRecordCreateRequest((e) => {
  const acao = e.record
  const tipo = acao.getString('tipo')
  const oportId = acao.getString('oportunidade')

  // RN-17: concluir exige resultado
  if (tipo === 'concluida' && !acao.getString('resultado').trim()) {
    throw new BadRequestError('Concluir a ação exige o resultado do que foi feito.')
  }

  // CA-1-21: reagendar/concluir para data passada é recusado (fuso de Brasília).
  const hojeAcao = new Date(new Date().getTime() - 3 * 3600000).toISOString().slice(0, 10)
  const novaDataAcao = String(acao.getString('nova_data') || '').slice(0, 10)
  if (novaDataAcao && novaDataAcao < hojeAcao) {
    throw new BadRequestError('A data da próxima ação não pode ser anterior a hoje.')
  }

  if (!acao.getString('registrado_em')) {
    acao.set('registrado_em', new Date().toISOString())
  }
  if (!acao.getString('registrado_por') && e.auth) acao.set('registrado_por', e.auth.id)

  // Recalcula a próxima ação vigente a partir do histórico (idempotente)
  const oport = $app.findRecordById('oportunidades', oportId)
  const historico = $app.findRecordsByFilter(
    'acoes_oportunidade',
    `oportunidade = "${oportId}"`,
    '-registrado_em',
    1,
    0,
  )
  // Na criação, a ação atual é sempre a mais recente (registrado_em = agora) e
  // AINDA NÃO ESTÁ no histórico buscado (e.next() só roda depois deste bloco).
  oport.set('proxima_acao', acao.getString('nova_acao'))
  oport.set('proxima_acao_data', acao.getString('nova_data'))
  $app.save(oport)
  return e.next()
}, 'acoes_oportunidade')

// RN-19 — data da próxima ação no passado é recusada na criação da oportunidade
// (com internet). Sem internet, criado_em_aparelho é a referência (SPEC-1-004).
onRecordCreateRequest((e) => {
  const oport = e.record
  const hoje = new Date(new Date().getTime() - 3 * 3600000).toISOString().slice(0, 10)
  const refAparelho = String(oport.getString('criado_em_aparelho') || '').slice(0, 10)
  const ref = refAparelho || hoje
  const dataAcao = String(oport.getString('proxima_acao_data') || '').slice(0, 10)
  if (dataAcao && dataAcao < ref) {
    throw new BadRequestError('A data da próxima ação não pode ser anterior a hoje.')
  }
  return e.next()
}, 'oportunidades')
