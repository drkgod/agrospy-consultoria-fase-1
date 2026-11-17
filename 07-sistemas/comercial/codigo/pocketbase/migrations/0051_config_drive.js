// FASE 2 — SPEC-2-004 (task 993bc32b): configuracao da pasta do Drive por empresa.
// Uma pasta por empresa. A rotina le a cada 10 minutos os arquivos novos desde
// ultima_leitura e cria um rascunho por arquivo, com o dono configurado.
// So o Administrador edita (regra da spec).
migrate(
  (app) => {
    const empresaId = app.findCollectionByNameOrId('empresas').id
    const usersId = app.findCollectionByNameOrId('users').id

    try {
      app.findCollectionByNameOrId('config_drive')
    } catch (e) {
      const col = new Collection({
        name: 'config_drive',
        type: 'base',
        fields: [
          {
            name: 'empresa',
            type: 'relation',
            required: true,
            collectionId: empresaId,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'pasta_id', type: 'text', required: true, max: 200 },
          { name: 'pasta_nome', type: 'text', max: 300 },
          {
            name: 'dono',
            type: 'relation',
            required: true,
            collectionId: usersId,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'ativa', type: 'bool' },
          { name: 'ultima_leitura', type: 'date' },
          { name: 'ultimo_erro', type: 'text', max: 500 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        listRule: "@request.auth.id != '' && @request.auth.acesso_empresas.id ?= empresa",
        viewRule: "@request.auth.id != '' && @request.auth.acesso_empresas.id ?= empresa",
        createRule: null,
        updateRule: "@request.auth.id != '' && @request.auth.acesso_admin.id ?= empresa",
        deleteRule: null,
        indexes: ['CREATE UNIQUE INDEX idx_config_drive_empresa ON config_drive (empresa)'],
      })
      app.save(col)
      console.log('0051 config_drive criada')
    }

    const agro = app.findFirstRecordByFilter('empresas', 'nome = "Agrospy"')
    let diogo = null
    try {
      diogo = app.findFirstRecordByFilter('users', 'email = "diogo.rojas@agrospy.com.br"')
    } catch (err) {
      diogo = null
    }

    if (agro && diogo) {
      let cfg = null
      try {
        cfg = app.findFirstRecordByFilter('config_drive', 'empresa = {:e}', { e: agro.id })
      } catch (err) {
        cfg = null
      }
      if (!cfg) {
        const rec = new Record(app.findCollectionByNameOrId('config_drive'))
        rec.set('empresa', agro.id)
        rec.set('pasta_id', '1g_bmkUOlP7Q72wUlQEZAFOOh48Zp4mux')
        rec.set('pasta_nome', 'Gravacoes')
        rec.set('dono', diogo.id)
        rec.set('ativa', true)
        app.save(rec)
        console.log('0051 config_drive da Agrospy apontando para a pasta Gravacoes')
      }
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('config_drive'))
    } catch (e) {}
  },
)
