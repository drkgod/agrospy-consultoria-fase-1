// FASE 2 — SPEC-2-001 (task 0b522b2b): fila de rascunhos do pós-visita.
// Coleção única que as SPECs 2-003 (assistente) e 2-004 (gravadores) também usam.
// Regras: padrão da fase 1 com @request.auth.acesso_* (nunca regra vazia).
// Campos controlados pelo servidor (status, transcricao, proposta, visita_criada,
// confirmado_por, confirmado_em, midia, chave_dedup, hash_conteudo, empresa, autor,
// origem) são travados por hook de request na migração seguinte.
migrate(
  (app) => {
    const empresaId = app.findCollectionByNameOrId('empresas').id
    const usersId = app.findCollectionByNameOrId('users').id
    const produtoresId = app.findCollectionByNameOrId('produtores').id
    const visitasId = app.findCollectionByNameOrId('visitas').id

    const col = new Collection({
      name: 'rascunhos',
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
        {
          name: 'autor',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'origem',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['app_audio', 'app_texto', 'arquivo_gravador', 'drive'],
        },
        { name: 'midia', type: 'file', maxSelect: 1, maxSize: 26214400, protected: true },
        { name: 'texto_original', type: 'text', max: 20000 },
        { name: 'chave_dedup', type: 'text', max: 200, required: true },
        { name: 'hash_conteudo', type: 'text', max: 100 },
        { name: 'id_local', type: 'text', max: 64 },
        { name: 'criado_em_aparelho', type: 'date' },
        {
          name: 'status',
          type: 'select',
          maxSelect: 1,
          values: [
            'recebido',
            'aguardando_transcricao',
            'transcrevendo',
            'pronto_para_revisar',
            'confirmado',
            'descartado',
            'falhou',
          ],
        },
        { name: 'transcricao', type: 'text', max: 50000 },
        { name: 'proposta', type: 'json', maxSize: 100000 },
        {
          name: 'produtor',
          type: 'relation',
          collectionId: produtoresId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'motivo_falha', type: 'text', max: 500 },
        { name: 'tentativas', type: 'number', onlyInt: true, min: 0, max: 99 },
        {
          name: 'visita_criada',
          type: 'relation',
          collectionId: visitasId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'confirmado_por',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'confirmado_em', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      // RN-29: autor, Gestão ou Administrador da mesma empresa.
      listRule:
        "@request.auth.id != '' && (autor = @request.auth.id || @request.auth.acesso_gestao.id ?= empresa || @request.auth.acesso_admin.id ?= empresa)",
      viewRule:
        "@request.auth.id != '' && (autor = @request.auth.id || @request.auth.acesso_gestao.id ?= empresa || @request.auth.acesso_admin.id ?= empresa)",
      // Quem cria é o próprio autor, e só nos perfis que registram visita (RN-35).
      createRule:
        "@request.auth.id != '' && @request.body.autor = @request.auth.id && (@request.auth.acesso_admin.id ?= @request.body.empresa || @request.auth.acesso_gestao.id ?= @request.body.empresa || @request.auth.acesso_comercial.id ?= @request.body.empresa)",
      updateRule:
        "@request.auth.id != '' && (autor = @request.auth.id || @request.auth.acesso_gestao.id ?= empresa || @request.auth.acesso_admin.id ?= empresa)",
      deleteRule: null,
      indexes: [
        // RN-33: um rascunho por porta de entrada (chave_dedup) e por conteúdo (hash).
        'CREATE UNIQUE INDEX idx_rascunhos_chave_dedup ON rascunhos (chave_dedup)',
        "CREATE UNIQUE INDEX idx_rascunhos_hash ON rascunhos (empresa, hash_conteudo) WHERE hash_conteudo != ''",
      ],
    })
    app.save(col)
    console.log('0039 rascunhos ok')
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('rascunhos'))
  },
)
