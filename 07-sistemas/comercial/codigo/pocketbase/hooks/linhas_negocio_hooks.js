// SPEC-1-003 — RN-20: linha fixa ("Relacionamento — retorno sem linha definida")
// não é desativada; linha em uso não é apagada (deleteRule já é null — este hook
// protege a fixa também na edição).
onRecordUpdateRequest((e) => {
  const rec = e.record
  const armazenada = $app.findRecordById('linhas_negocio', rec.id)
  if (armazenada.getBool('fixa') && !rec.getBool('ativa')) {
    throw new BadRequestError(
      'A linha "Relacionamento — retorno sem linha definida" é fixa e não pode ser desativada.',
    )
  }
  return e.next()
}, 'linhas_negocio')
