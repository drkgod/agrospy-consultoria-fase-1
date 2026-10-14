// SPEC-1-003 — coleções oportunidades e acoes_oportunidade.
// Oportunidade aberta exige linha de negócio (mesma empresa), responsável, próxima
// ação e data (RN-19: data passada é recusada no hook). Histórico de ações é só de
// inclusão: ninguém edita nem apaga (CA-1-12).
migrate(
  (app) => {
    const empId = app.findCollectionByNameOrId('empresas').id
    const usersId = app.findCollectionByNameOrId('users').id
    const produtoresId = app.findCollectionByNameOrId('produtores').id
    const propriedadesId = app.findCollectionByNameOrId('propriedades').id
    const lnId = app.findCollectionByNameOrId('linhas_negocio').id
    const visitasId = app.findCollectionByNameOrId('visitas').id

    const oport = new Collection({
      name: 'oportunidades',
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
        {
          name: 'produtor',
          type: 'relation',
          required: true,
          collectionId: produtoresId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'propriedade',
          type: 'relation',
          collectionId: propriedadesId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'linha_negocio',
          type: 'relation',
          required: true,
          collectionId: lnId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'descricao', type: 'text', required: true, min: 1, max: 2000 },
        {
          name: 'responsavel',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'situacao', type: 'select', maxSelect: 1, values: ['aberta'] },
        { name: 'proxima_acao', type: 'text', required: true, min: 1, max: 500 },
        { name: 'proxima_acao_data', type: 'date', required: true },
        {
          name: 'visita_origem',
          type: 'relation',
          collectionId: visitasId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'criado_em_aparelho', type: 'date' },
        { name: 'id_local', type: 'text', max: 64 },
      ],
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })
    app.save(oport)

    const acoes = new Collection({
      name: 'acoes_oportunidade',
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
        {
          name: 'oportunidade',
          type: 'relation',
          required: true,
          collectionId: oport.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['criada', 'concluida', 'reagendada'],
        },
        { name: 'resultado', type: 'text', max: 2000 },
        { name: 'nova_acao', type: 'text', required: true, min: 1, max: 500 },
        { name: 'nova_data', type: 'date', required: true },
        {
          name: 'registrado_por',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'registrado_em', type: 'date' },
        { name: 'id_local', type: 'text', max: 64 },
      ],
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })
    app.save(acoes)

    const criarIndice = (sql) => {
      try {
        app.db().newQuery({ query: sql }).execute()
      } catch (e) {
        console.log('indice: ' + e)
      }
    }
    criarIndice(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_oport_id_local ON oportunidades (id_local) WHERE id_local != ''",
    )
    criarIndice(
      'CREATE INDEX IF NOT EXISTS idx_oport_empresa_produtor ON oportunidades (empresa, produtor)',
    )
    criarIndice(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_acao_id_local ON acoes_oportunidade (id_local) WHERE id_local != ''",
    )
    criarIndice(
      'CREATE INDEX IF NOT EXISTS idx_acao_oportunidade ON acoes_oportunidade (oportunidade)',
    )
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('acoes_oportunidade'))
    app.delete(app.findCollectionByNameOrId('oportunidades'))
  },
)
