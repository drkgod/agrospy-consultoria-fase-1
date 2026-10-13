migrate(
  (app) => {
    // SPEC-1-002 — emenda do Diogo (13/10/2026): nível de tecnologia do produtor
    // (baixa/media/alta/muito_alta), descrição das tecnologias (automação,
    // agricultura de precisão, implementos) e link do Google Maps na propriedade.
    const p = app.findCollectionByNameOrId('produtores')
    p.fields.add(
      new Field({
        name: 'nivel_tecnologia',
        type: 'select',
        maxSelect: 1,
        values: ['baixa', 'media', 'alta', 'muito_alta'],
      }),
    )
    p.fields.add(new Field({ name: 'tecnologias', type: 'text', max: 5000 }))
    app.save(p)

    const prop = app.findCollectionByNameOrId('propriedades')
    prop.fields.add(new Field({ name: 'link_maps', type: 'text', max: 500 }))
    app.save(prop)
  },
  (app) => {
    const p = app.findCollectionByNameOrId('produtores')
    p.fields.removeByName('nivel_tecnologia')
    p.fields.removeByName('tecnologias')
    app.save(p)
    const prop = app.findCollectionByNameOrId('propriedades')
    prop.fields.removeByName('link_maps')
    app.save(prop)
  },
)
