// FASE 2 — SPEC-2-001 (5f42475d): rotina de 10 minutos.
// Pega rascunhos em `recebido` — ou `transcrevendo` há mais de 15 minutos (processo que
// morreu no meio) — com tentativas < 3, um por execução, e reprocessa.
// cronAdd roda em UTC; o intervalo mínimo do Skip é 10 minutos.
// O processamento é feito em linha (não dá para chamar a rota de outro contexto):
// mesma lógica de transcrição + proposta, aqui só o essencial para não duplicar regra:
// esta rotina chama a rota interna por HTTP com token de superusuário não existe, então
// ela apenas devolve o rascunho para a fila e o app/rota processa — ver nota abaixo.
cronAdd('processa_rascunhos_pendentes', '*/10 * * * *', () => {
  // Nota de desenho: a transcrição exige a chave do cofre e o token do autor. A rotina
  // NÃO processa sozinha — ela garante que nada fica preso: recoloca em `recebido` o que
  // travou em `transcrevendo` (processo interrompido) e marca `falhou` o que estourou as
  // tentativas, para aparecer com "Tentar de novo" na tela.
  try {
    const travados = $app.findRecordsByFilter(
      'rascunhos',
      'status = "transcrevendo" && updated < {:limite}',
      'updated',
      20,
      0,
      {
        limite:
          new Date(Date.now() - 15 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19) + 'Z',
      },
    )
    for (const r of travados) {
      r.set('status', 'recebido')
      r.set('motivo_falha', 'Reprocessando (a tentativa anterior foi interrompida).')
      $app.save(r)
    }

    const estourou = $app.findRecordsByFilter(
      'rascunhos',
      'status = "recebido" && tentativas >= 3',
      'updated',
      20,
      0,
      {},
    )
    for (const r of estourou) {
      r.set('status', 'falhou')
      $app.save(r)
    }
  } catch (err) {
    $app.logger().error('rotina rascunhos falhou', 'erro', String(err))
  }
})
