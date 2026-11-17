// LIMPEZA (09/11 13:30) — apaga os rascunhos criados durante a prova da SPEC-2-004.
// Os dois rascunhos de teste ("transcricao.txt" e "transcricao.docx") não são visitas
// reais; ficaram na fila do Diogo e poluiriam a tela. Protegida pela chave.
routerAdd('POST', '/backend/v1/publico/limpar-gravacoes-teste', (e) => {
  if (e.request.header.get('X-Contagem') !== 'conta-agrospy-2026-11') {
    throw e.forbiddenError('Sem chave.')
  }
  const out = { apagados: 0, ids: [] }
  const alvos = ['18f3qne3rsixq7y', '590d00d67gkce3u']
  for (const id of alvos) {
    try {
      $app.delete($app.findRecordById('rascunhos', id))
      out.apagados++
      out.ids.push(id)
    } catch (err) {}
  }
  // Também qualquer rascunho de transporte da voz (não deveria sobrar nenhum).
  for (const r of $app.findRecordsByFilter(
    'rascunhos',
    'chave_dedup ~ "voz-pergunta"',
    '',
    50,
    0,
    {},
  )) {
    try {
      $app.delete($app.findRecordById('rascunhos', r.id))
      out.apagados++
    } catch (err) {}
  }
  out.restantes = $app.findRecordsByFilter('rascunhos', '', 'created', 50, 0, {}).length
  return e.json(200, out)
})
