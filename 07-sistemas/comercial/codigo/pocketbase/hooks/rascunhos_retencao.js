// FASE 2 — SPEC-2-001 (RN-50): retenção dos áudios.
// Rotina diária (03:30 UTC = 00:30 em Brasília): limpa o que já não precisa ficar.
//  - rascunho `descartado` ou `falhou` há mais de 30 dias: tira midia, transcricao e
//    texto_original (o rascunho fica como registro de que existiu, sem conteúdo);
//  - rascunho `confirmado`: tira a midia depois que o áudio já está em visitas.audio
//    (não apaga antes de confirmar que a visita tem o arquivo).
// Prazo confirmado pelo Diogo no teste (abc5e491). Até lá, 30 dias é o padrão da SPEC.
cronAdd('retencao_rascunhos', '30 3 * * *', () => {
  const dias = 30
  const limite =
    new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19) +
    'Z'
  let limpos = 0
  try {
    // 1) Descartados e falhos antigos: perdem todo o conteúdo.
    const velhos = $app.findRecordsByFilter(
      'rascunhos',
      '(status = "descartado" || status = "falhou") && updated < {:limite}',
      'updated',
      50,
      0,
      { limite: limite },
    )
    for (const r of velhos) {
      r.set('midia', '')
      r.set('transcricao', '')
      r.set('texto_original', '')
      r.set('proposta', null)
      $app.save(r)
      limpos++
    }

    // 2) Confirmados: a mídia só sai quando o áudio já está na visita.
    const confirmados = $app.findRecordsByFilter(
      'rascunhos',
      'status = "confirmado" && midia != ""',
      'updated',
      50,
      0,
      {},
    )
    for (const r of confirmados) {
      const visitaId = r.getString('visita_criada')
      if (!visitaId) continue
      let visita
      try {
        visita = $app.findRecordById('visitas', visitaId)
      } catch (err) {
        continue // visita não existe: NÃO apaga o áudio, é a única cópia
      }
      if (!visita.getString('audio')) continue // cópia não confirmada: preserva
      r.set('midia', '')
      $app.save(r)
      limpos++
    }
  } catch (err) {
    $app.logger().error('retencao rascunhos falhou', 'erro', String(err))
  }
  if (limpos > 0) {
    $app.logger().info('retencao rascunhos', 'limpos', limpos)
  }
})
