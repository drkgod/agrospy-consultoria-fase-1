migrate(
  (app) => {
    const collection = new Collection({
      name: 'empresas',
      type: 'base',
      listRule: "@request.auth.id != '' && @request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true },
        { name: 'cor_primaria', type: 'text', required: true },
        { name: 'logo', type: 'file', maxSelect: 1, mimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml'], maxSize: 5242880 },
        { name: 'ativa', type: 'bool', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX `idx_empresas_slug` ON `empresas` (`slug`)",
        "CREATE UNIQUE INDEX `idx_empresas_nome` ON `empresas` (`nome`)",
      ],
    })
    app.save(collection)

    // Seed idempotente das duas empresas
    const seed = (nome, slug, cor, ativa) => {
      try {
        app.findFirstRecordByData('empresas', 'slug', slug)
        return // já existe
      } catch (_) {}
      const rec = new Record(collection)
      rec.set('nome', nome)
      rec.set('slug', slug)
      rec.set('cor_primaria', cor)
      rec.set('ativa', ativa)
      app.save(rec)
    }
    seed('Agrospy', 'agrospy', '#153A1D', true)
    seed('Rumo Agro', 'rumo-agro', '#37474F', true)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('empresas')
    app.delete(collection)
  },
)