// SPEC-1-003 Emenda 1 — áudio na visita (pedido do Diogo 14/10/2026, adiantado da
// fase 2): campo audio (arquivo único, até 25 MB, sem lista de mimeTypes para aceitar
// m4a/mp3/wav/ogg/aac/amr/3gp/webm). Gravação no app e anexo do celular no frontend.
migrate(
  (app) => {
    const visitas = app.findCollectionByNameOrId('visitas')
    visitas.fields.add(
      new Field({
        type: 'file',
        name: 'audio',
        maxSelect: 1,
        maxSize: 26214400,
      }),
    )
    app.save(visitas)
  },
  (app) => {
    const visitas = app.findCollectionByNameOrId('visitas')
    visitas.fields.removeByName('audio')
    app.save(visitas)
  },
)
