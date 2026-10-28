// FASE 2 — dados que faltavam: as coleções de negócio da Fase 1 nasceram SEM os campos
// de data automáticos (`created`/`updated`), então filtrar por período dava 400 e não havia
// como medir "quantas oportunidades foram criadas na semana" (indicador do guardanapo).
// Adiciona `created`/`updated` (autodate) nas 4 coleções de negócio. Idempotente.
// Observação: registros antigos ficam com as datas do momento da migração (não há como
// recuperar o passado) — os indicadores passam a valer a partir daqui.
migrate(
  (app) => {
    for (const nome of [
      'produtores',
      'propriedades',
      'visitas',
      'oportunidades',
      'acoes_oportunidade',
    ]) {
      const col = app.findCollectionByNameOrId(nome)
      const tem = (n) => {
        try {
          return !!col.fields.getByName(n)
        } catch (e) {
          return false
        }
      }
      if (!tem('created')) {
        col.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }))
      }
      if (!tem('updated')) {
        col.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
      }
      app.save(col)
      console.log('0036 datas em ' + nome)
    }
  },
  (app) => {
    for (const nome of [
      'produtores',
      'propriedades',
      'visitas',
      'oportunidades',
      'acoes_oportunidade',
    ]) {
      const col = app.findCollectionByNameOrId(nome)
      for (const campo of ['updated', 'created']) {
        try {
          col.fields.removeByName(campo)
        } catch (e) {
          /* já não existe */
        }
      }
      app.save(col)
    }
  },
)
