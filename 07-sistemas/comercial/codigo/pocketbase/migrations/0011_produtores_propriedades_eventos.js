migrate(
  (app) => {
    // SPEC-1-002: coleções produtores, propriedades e eventos (troca de responsável).
    // Regras conforme a matriz da SPEC-1-001 (acesso_*) — ver migração 0011 de regras.
    const empId = app.findCollectionByNameOrId('empresas').id
    const usersId = app.findCollectionByNameOrId('users').id

    const produtores = new Collection({
      name: 'produtores',
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
        { name: 'nome', type: 'text', required: true, min: 2, max: 200 },
        { name: 'documento', type: 'text', max: 20 },
        { name: 'telefone', type: 'text', max: 30 },
        { name: 'email', type: 'text', max: 200 },
        { name: 'municipio', type: 'text', required: true, max: 120 },
        { name: 'regional', type: 'text', max: 120 },
        {
          name: 'origem',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: [
            'indicacao_cliente',
            'indicacao_socio_parceiro',
            'carteira_existente',
            'contato_direto',
            'prospeccao_ativa',
            'outro',
          ],
        },
        { name: 'indicado_por', type: 'text', max: 200 },
        { name: 'relacionamento', type: 'text', max: 200 },
        {
          name: 'responsavel',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'observacoes', type: 'text', max: 2000 },
        { name: 'arquivado', type: 'bool' },
        { name: 'motivo_arquivamento', type: 'text', max: 500 },
        { name: 'id_local', type: 'text', max: 64 },
        {
          name: 'criado_por',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
      ],
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })
    app.save(produtores)

    const propriedades = new Collection({
      name: 'propriedades',
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
          collectionId: produtores.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'nome', type: 'text', required: true, min: 1, max: 200 },
        { name: 'municipio', type: 'text', max: 120 },
        { name: 'area_ha', type: 'number' },
        {
          name: 'posse',
          type: 'select',
          maxSelect: 1,
          values: ['propria', 'arrendada', 'mista', 'nao_informado'],
        },
        { name: 'endereco_referencia', type: 'text', max: 500 },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'id_local', type: 'text', max: 64 },
      ],
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })
    app.save(propriedades)

    const eventos = new Collection({
      name: 'eventos',
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
          name: 'tipo',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['troca_responsavel'],
        },
        {
          name: 'registro',
          type: 'relation',
          required: true,
          collectionId: produtores.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'de', type: 'relation', collectionId: usersId, maxSelect: 1, cascadeDelete: false },
        {
          name: 'para',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'por',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'em', type: 'autodate', onCreate: true },
      ],
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })
    app.save(eventos)

    // Índices únicos: documento por empresa (quando existe) e id_local.
    const criarIndice = (sql) => {
      try {
        app.db().newQuery({ query: sql }).execute()
      } catch (e) {
        console.log('indice: ' + e)
      }
    }
    criarIndice(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_produtores_empresa_documento ON produtores (empresa, documento) WHERE documento != ''",
    )
    criarIndice(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_produtores_id_local ON produtores (id_local) WHERE id_local != ''",
    )
    criarIndice(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_propriedades_id_local ON propriedades (id_local) WHERE id_local != ''",
    )
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('eventos'))
    app.delete(app.findCollectionByNameOrId('propriedades'))
    app.delete(app.findCollectionByNameOrId('produtores'))
  },
)
