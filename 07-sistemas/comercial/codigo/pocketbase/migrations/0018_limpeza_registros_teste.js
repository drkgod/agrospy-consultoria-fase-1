// Fechamento da task 147a4f1b — limpeza dos registros de teste criados durante a
// implementação (aprovado pelo Diogo: "testado e aprovado"; os cadastros de teste
// poluem a lista real). Migração roda como servidor: apaga sem regra de API.
// Ordem: eventos (referenciam o produtor) → propriedades → produtores.
// Preserva: usuários de teste (Task 3) e "José das Couve" (cadastro real do teste
// do Diogo — ele decide depois se mantém).
migrate(
  (app) => {
    const nomesTeste = [
      'Produtor Teste Comercial',
      'Teste Tecnologia',
      'Produto Evento Teste',
      'Outro Nome',
      'Doc Outra Empresa',
      'Seu Antonio Indicado',
      'Doc Base',
      'Doc Primeiro',
      'Doc Outra',
      'Teste Edit Prop',
      'Teste Exclusao Prop',
    ]
    let apagadosEv = 0
    let apagadosProp = 0
    let apagadosProd = 0
    for (const nome of nomesTeste) {
      const lista = app.findRecordsByFilter('produtores', 'nome = {:n}', '', 200, 0, { n: nome })
      for (const p of lista) {
        const evs = app.findRecordsByFilter('eventos', 'registro = {:rid}', '', 200, 0, { rid: p.id })
        for (const ev of evs) {
          app.delete(ev)
          apagadosEv++
        }
        const props = app.findRecordsByFilter('propriedades', 'produtor = {:pid}', '', 200, 0, { pid: p.id })
        for (const pr of props) {
          app.delete(pr)
          apagadosProp++
        }
        app.delete(p)
        apagadosProd++
      }
    }
    console.log(`0018: limpeza — ${apagadosProd} produtores, ${apagadosProp} propriedades, ${apagadosEv} eventos apagados`)
  },
  (app) => {
    // down: nada a restaurar (eram registros de teste).
    console.log('0018 down: nada a fazer')
  },
)
