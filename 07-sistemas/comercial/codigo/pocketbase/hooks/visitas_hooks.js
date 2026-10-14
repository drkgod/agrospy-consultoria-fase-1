// SPEC-1-003 — hooks de visitas: destino obrigatório com motivo quando
// sem_oportunidade (CA-1-11), responsável da visita padrão o usuário, e
// empresa/produtor imutáveis no update.
onRecordCreateRequest((e) => {
  const rec = e.record

  const destino = rec.getString('destino')
  if (!destino) throw new BadRequestError('A visita precisa de um destino: qual o próximo passo?')
  if (destino === 'sem_oportunidade' && !rec.getString('motivo_sem_oportunidade')) {
    throw new BadRequestError('Sem oportunidade agora exige o motivo.')
  }

  const auth = e.requestInfo().auth
  if (!rec.getString('responsavel_visita') && auth) rec.set('responsavel_visita', auth.id)

  return e.next()
}, 'visitas')

onRecordUpdateRequest((e) => {
  const rec = e.record
  const armazenada = $app.findRecordById('visitas', rec.id)
  if (armazenada.getString('empresa') !== rec.getString('empresa')) {
    throw new BadRequestError('A empresa da visita não muda depois de criada.')
  }
  if (armazenada.getString('produtor') !== rec.getString('produtor')) {
    throw new BadRequestError('O produtor da visita não muda depois de criada.')
  }
  return e.next()
}, 'visitas')
