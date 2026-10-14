// SPEC-1-003 — coleção visitas (RN-13): produtor, data e assuntos tratados obrigatórios;
// destino obrigatório (RN-11/CA-1-11) e motivo quando sem_oportunidade. Roteiro completo
// opcional em "Mais detalhes". empresa/produtor imutáveis (sem campo update nos updateRules).
migrate(
  (app) => {
    const empId = app.findCollectionByNameOrId('empresas').id
    const usersId = app.findCollectionByNameOrId('users').id
    const produtoresId = app.findCollectionByNameOrId('produtores').id
    const propriedadesId = app.findCollectionByNameOrId('propriedades').id
    const lnId = app.findCollectionByNameOrId('linhas_negocio').id

    const col = new Collection({
      name: 'visitas',
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
        { name: 'data', type: 'date', required: true },
        {
          name: 'responsavel_visita',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'acompanhantes', type: 'text', max: 500 },
        { name: 'assuntos_tratados', type: 'text', required: true, min: 1, max: 10000 },
        { name: 'estrutura_existente', type: 'text', max: 2000 },
        {
          name: 'perfil_tecnologico',
          type: 'select',
          maxSelect: 1,
          values: ['baixo', 'medio', 'alto', 'nao_avaliado'],
        },
        {
          name: 'nivel_investimento',
          type: 'select',
          maxSelect: 1,
          values: ['baixo', 'medio', 'alto', 'nao_avaliado'],
        },
        { name: 'maquinas', type: 'text', max: 2000 },
        { name: 'area_potencial', type: 'text', max: 500 },
        { name: 'necessidades', type: 'text', max: 5000 },
        { name: 'acordos', type: 'text', max: 5000 },
        {
          name: 'interesses',
          type: 'relation',
          collectionId: lnId,
          maxSelect: 8,
          cascadeDelete: false,
        },
        {
          name: 'destino',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['nova_oportunidade', 'oportunidade_atualizada', 'sem_oportunidade'],
        },
        {
          name: 'motivo_sem_oportunidade',
          type: 'select',
          maxSelect: 1,
          values: ['sem_interesse_agora', 'sem_perfil', 'atendido_por_concorrente', 'outro'],
        },
        { name: 'id_local', type: 'text', max: 64 },
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
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_visita_id_local ON visitas (id_local) WHERE id_local != ''",
    )
    criarIndice(
      'CREATE INDEX IF NOT EXISTS idx_visita_empresa_produtor ON visitas (empresa, produtor)',
    )
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('visitas'))
  },
)
