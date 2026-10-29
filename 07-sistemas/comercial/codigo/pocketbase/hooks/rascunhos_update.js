// FASE 2 — SPEC-2-001 (task 0b522b2b): hook de request dos rascunhos.
// Campos controlados pelo servidor: empresa, autor, origem, midia, chave_dedup,
// hash_conteudo, status, transcricao, proposta, visita_criada, confirmado_por,
// confirmado_em.
// Este hook só roda em requisições de API — as rotas do backend usam $app.save, que
// não passa por hooks de request. Ou seja: pela API ninguém muda esses campos; o
// servidor muda por dentro. É exatamente a regra da SPEC (CA-2-04).
// Sem funções no topo do arquivo (regra do guia): tudo dentro do handler.
onRecordUpdateRequest((e) => {
  const atual = e.record
  const armazenado = $app.findRecordById('rascunhos', atual.id)
  const travados = [
    'empresa',
    'autor',
    'origem',
    'midia',
    'chave_dedup',
    'hash_conteudo',
    'status',
    'transcricao',
    'proposta',
    'visita_criada',
    'confirmado_por',
    'confirmado_em',
  ]
  for (const campo of travados) {
    const antes = JSON.stringify(armazenado.get(campo))
    const depois = JSON.stringify(atual.get(campo))
    if (antes !== depois) {
      throw new BadRequestError('O campo ' + campo + ' só pode ser alterado pelo sistema.')
    }
  }
  return e.next()
}, 'rascunhos')
