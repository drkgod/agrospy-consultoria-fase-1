// FASE 2 — SPEC-2-001: hook de criação dos rascunhos.
// 1) O cliente NUNCA escolhe o estado em que o rascunho nasce nem os campos que só o
//    servidor calcula — senão daria para criar já "pronto_para_revisar", pulando a
//    transcrição e a validação da proposta.
// 2) Duplicata (RN-33) recebe resposta clara em vez do erro técnico do índice:
//    - mesma chave_dedup: devolve o rascunho existente e não cria outro;
//    - mesmo hash_conteudo na empresa: avisa sem abrir o rascunho de outra pessoa.
onRecordCreateRequest((e) => {
  const rec = e.record
  rec.set('status', 'recebido')
  rec.set('tentativas', 0)
  rec.set('visita_criada', '')
  rec.set('confirmado_por', '')
  rec.set('confirmado_em', '')
  rec.set('motivo_falha', '')
  if (!rec.getString('chave_dedup')) {
    throw new BadRequestError('A gravação precisa de uma chave de identificação.')
  }

  const empresa = rec.getString('empresa')
  const chave = rec.getString('chave_dedup')
  const hash = rec.getString('hash_conteudo')
  const autor = rec.getString('autor')

  // Já existe a mesma porta de entrada? Não cria de novo.
  try {
    const mesmo = $app.findFirstRecordByFilter('rascunhos', 'chave_dedup = {:c}', { c: chave })
    if (mesmo && mesmo.id) {
      throw new ApiError(409, 'Esta gravação já foi enviada.', {
        rascunho: mesmo.getString('autor') === autor ? mesmo.id : '',
        ja_enviado: true,
      })
    }
  } catch (err) {
    if (err && err.status === 409) throw err
    // sem registro: segue
  }

  // Mesmo conteúdo na empresa, por outra pessoa (ou por esta): avisa sem abrir.
  if (hash) {
    try {
      const igual = $app.findFirstRecordByFilter(
        'rascunhos',
        'empresa = {:e} && hash_conteudo = {:h}',
        { e: empresa, h: hash },
      )
      if (igual && igual.id) {
        const meu = igual.getString('autor') === autor
        throw new ApiError(
          409,
          meu
            ? 'Esta gravação já foi enviada.'
            : 'Esta gravação já foi enviada por outra pessoa da empresa.',
          { rascunho: meu ? igual.id : '', ja_enviado: true },
        )
      }
    } catch (err) {
      if (err && err.status === 409) throw err
    }
  }
  return e.next()
}, 'rascunhos')
