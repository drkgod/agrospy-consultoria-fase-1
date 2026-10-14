// SPEC-1-003 — hooks de oportunidades: linha de negócio da mesma empresa (RN-20) e
// situacao sempre "aberta" nesta fase (ganho/perda é da fase 3).
onRecordCreateRequest((e) => {
  const rec = e.record
  // Responsável padrão: o responsável pela carteira do produtor (RN-10 da SPEC-1-002).
  // Blindado: falha aqui não pode derrubar a criação (viraria "Failed to create
  // record." genérico); sem responsável a validação do campo recusa com mensagem.
  if (!rec.getString('responsavel')) {
    try {
      const produtor = $app.findRecordById('produtores', rec.getString('produtor'))
      if (produtor.getString('responsavel')) {
        rec.set('responsavel', produtor.getString('responsavel'))
      }
    } catch (err) {
      console.error('oportunidades hook (responsavel padrao): ' + err)
    }
  }
  if (!rec.getString('linha_negocio')) {
    throw new BadRequestError('A oportunidade precisa de uma linha de negócio.')
  }
  const linha = $app.findRecordById('linhas_negocio', rec.getString('linha_negocio'))
  if (linha.getString('empresa') !== rec.getString('empresa')) {
    throw new BadRequestError('A linha de negócio precisa ser da mesma empresa.')
  }
  if (!linha.getBool('ativa')) {
    throw new BadRequestError('Linha de negócio desativada não entra em nova oportunidade.')
  }
  if (!rec.getString('situacao')) rec.set('situacao', 'aberta')
  return e.next()
}, 'oportunidades')

onRecordUpdateRequest((e) => {
  const rec = e.record
  const armazenada = $app.findRecordById('oportunidades', rec.id)
  if (armazenada.getString('empresa') !== rec.getString('empresa')) {
    throw new BadRequestError('A empresa da oportunidade não muda depois de criada.')
  }
  const linha = $app.findRecordById('linhas_negocio', rec.getString('linha_negocio'))
  if (linha.getString('empresa') !== rec.getString('empresa')) {
    throw new BadRequestError('A linha de negócio precisa ser da mesma empresa.')
  }
  return e.next()
}, 'oportunidades')
