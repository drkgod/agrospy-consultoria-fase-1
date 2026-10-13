// SPEC-1-002 — hook de produtores (REQUEST hooks: têm e.requestInfo()).
// Valida documento único por empresa (RN-08), exige indicado_por quando origem é
// indicação (RN-07), preenche responsavel/criado_por (RN-10) e registra evento de
// troca de responsável (RN-11). Um hook por arquivo; lógica inline.
onRecordCreateRequest((e) => {
  const rec = e.record
  const empresa = rec.getString('empresa')
  const documento = rec.getString('documento').replace(/\D/g, '')

  // RN-07: indicação exige quem indicou.
  const origem = rec.getString('origem')
  if (
    (origem === 'indicacao_cliente' || origem === 'indicacao_socio_parceiro') &&
    !rec.getString('indicado_por')
  ) {
    throw new BadRequestError('Indicação exige o nome de quem indicou.')
  }

  // Normaliza o documento (só dígitos).
  if (documento !== rec.getString('documento')) rec.set('documento', documento)

  // RN-08: documento repetido na MESMA empresa é recusado (outra empresa pode ter).
  if (documento) {
    const dup = $app.findRecordsByFilter(
      'produtores',
      'empresa = {:emp} && documento = {:doc}',
      '',
      1,
      0,
      { emp: empresa, doc: documento },
    )
    if (dup.length > 0) {
      throw new BadRequestError('Já cadastrado nesta empresa (documento existente).')
    }
  }

  // RN-10: quem cadastra vira o responsável quando o campo não veio (Comercial).
  const auth = e.requestInfo().auth
  if (!rec.getString('responsavel') && auth) rec.set('responsavel', auth.id)
  if (!rec.getString('criado_por') && auth) rec.set('criado_por', auth.id)

  return e.next()
}, 'produtores')

onRecordUpdateRequest((e) => {
  const rec = e.record
  const documento = rec.getString('documento').replace(/\D/g, '')
  if (documento !== rec.getString('documento')) rec.set('documento', documento)

  // RN-08 no update; empresa nunca muda depois de criada.
  const armazenado = $app.findRecordById('produtores', rec.id)
  if (armazenado.getString('empresa') !== rec.getString('empresa')) {
    throw new BadRequestError('A empresa do produtor não muda depois de criada.')
  }
  if (documento) {
    const dup = $app.findRecordsByFilter(
      'produtores',
      'empresa = {:emp} && documento = {:doc} && id != {:id}',
      '',
      1,
      0,
      { emp: rec.getString('empresa'), doc: documento, id: rec.id },
    )
    if (dup.length > 0) {
      throw new BadRequestError('Já cadastrado nesta empresa (documento existente).')
    }
  }

  // RN-11: troca de responsável — registra o evento (de, para, por, quando).
  const de = armazenado.getString('responsavel')
  const para = rec.getString('responsavel')
  if (de && para && de !== para) {
    const colEv = $app.findCollectionByNameOrId('eventos')
    const ev = new Record(colEv)
    ev.set('empresa', rec.getString('empresa'))
    ev.set('tipo', 'troca_responsavel')
    ev.set('registro', rec.id)
    ev.set('de', de)
    ev.set('para', para)
    const auth = e.requestInfo().auth
    ev.set('por', auth ? auth.id : de)
    $app.save(ev)
  }

  return e.next()
}, 'produtores')
