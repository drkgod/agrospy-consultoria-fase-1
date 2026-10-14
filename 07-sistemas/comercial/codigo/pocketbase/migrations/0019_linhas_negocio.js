// SPEC-1-003 — coleção linhas_negocio (RN-20): linha de negócio por empresa.
// Único por (empresa, nome); "Relacionamento — retorno sem linha definida" é fixa e
// nasce ativa; em uso não é apagada, só desativada (ninguém apaga registros aqui).
migrate(
  (app) => {
    const empId = app.findCollectionByNameOrId('empresas').id

    const col = new Collection({
      name: 'linhas_negocio',
      type: 'base',
      fields: [
        {
          name: 'empresa',
          type: 'relation',
          required: true,
          collectionId: empId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'nome', type: 'text', required: true, min: 1, max: 120 },
        { name: 'ativa', type: 'bool' },
        { name: 'fixa', type: 'bool' },
      ],
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })
    app.save(col)

    const criarIndice = (sql) => {
      try {
        app.db().newQuery({ query: sql }).execute()
      } catch (e) {
        console.log('indice: ' + e)
      }
    }
    criarIndice(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_ln_empresa_nome ON linhas_negocio (empresa, nome)',
    )
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('linhas_negocio'))
  },
)
