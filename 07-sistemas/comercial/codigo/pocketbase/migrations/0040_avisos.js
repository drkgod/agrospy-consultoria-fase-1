// FASE 2 — SPEC-2-002 (task bdca5efe): avisos da próxima ação.
// Quatro coleções:
//  - avisos: um por oportunidade+tipo+destinatário+data (chave_unica impede repetição);
//  - inscricoes_push: aparelho inscrito no serviço de push (OneSignal), external_id = usuário;
//  - config_avisos: por empresa — ativo, horário (padrão 07:00 BRT), repetição do atraso, cópia ao gestor;
//  - preferencias_avisos: cada gestor desliga a própria cópia.
// Regras: usuário vê só o que é dele; config: vínculo lê, só Administrador muda.
migrate(
  (app) => {
    const empresaId = app.findCollectionByNameOrId('empresas').id
    const usersId = app.findCollectionByNameOrId('users').id
    const oportunidadesId = app.findCollectionByNameOrId('oportunidades').id

    // ---------- avisos ----------
    const avisos = new Collection({
      name: 'avisos',
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
          name: 'destinatario',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'oportunidade',
          type: 'relation',
          required: true,
          collectionId: oportunidadesId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['do_dia', 'atraso', 'copia_gestor'],
        },
        { name: 'referencia_data', type: 'date' },
        { name: 'texto_curto', type: 'text', max: 200 },
        { name: 'detalhe', type: 'text', max: 500 },
        { name: 'lido_em', type: 'date' },
        {
          name: 'envio',
          type: 'select',
          maxSelect: 1,
          values: ['pendente', 'enviado', 'sem_inscricao', 'falhou_envio'],
        },
        { name: 'chave_unica', type: 'text', required: true, max: 300 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      // Cada pessoa vê só os próprios avisos (CA-2-08).
      listRule: '@request.auth.id != "" && destinatario = @request.auth.id',
      viewRule: '@request.auth.id != "" && destinatario = @request.auth.id',
      // Só o servidor cria (a rotina). O usuário apenas marca como lido.
      createRule: null,
      updateRule: '@request.auth.id != "" && destinatario = @request.auth.id',
      deleteRule: null,
      indexes: ['CREATE UNIQUE INDEX idx_avisos_chave ON avisos (chave_unica)'],
    })
    app.save(avisos)

    // ---------- inscricoes_push ----------
    const inscricoes = new Collection({
      name: 'inscricoes_push',
      type: 'base',
      fields: [
        {
          name: 'usuario',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'id_inscricao', type: 'text', required: true, max: 300 },
        { name: 'ativa', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      listRule: '@request.auth.id != "" && usuario = @request.auth.id',
      viewRule: '@request.auth.id != "" && usuario = @request.auth.id',
      createRule: '@request.auth.id != "" && @request.body.usuario = @request.auth.id',
      updateRule: '@request.auth.id != "" && usuario = @request.auth.id',
      deleteRule: '@request.auth.id != "" && usuario = @request.auth.id',
      indexes: [
        'CREATE UNIQUE INDEX idx_inscricoes_usuario ON inscricoes_push (usuario, id_inscricao)',
      ],
    })
    app.save(inscricoes)

    // ---------- config_avisos ----------
    const config = new Collection({
      name: 'config_avisos',
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
        { name: 'ativo', type: 'bool' },
        { name: 'horario', type: 'text', max: 5 },
        { name: 'repetir_atraso_dias', type: 'number', onlyInt: true, min: 1, max: 30 },
        { name: 'copia_gestor', type: 'bool' },
        { name: 'ultima_execucao', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      // Vínculo com a empresa lê; só Administrador muda (CA-2-09).
      listRule: '@request.auth.id != "" && @request.auth.acesso_empresas.id ?= empresa',
      viewRule: '@request.auth.id != "" && @request.auth.acesso_empresas.id ?= empresa',
      createRule:
        '@request.auth.id != "" && @request.auth.acesso_admin.id ?= @request.body.empresa',
      updateRule: '@request.auth.id != "" && @request.auth.acesso_admin.id ?= empresa',
      deleteRule: null,
      indexes: ['CREATE UNIQUE INDEX idx_config_empresa ON config_avisos (empresa)'],
    })
    app.save(config)

    // ---------- preferencias_avisos ----------
    const prefs = new Collection({
      name: 'preferencias_avisos',
      type: 'base',
      fields: [
        {
          name: 'usuario',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'empresa',
          type: 'relation',
          required: true,
          collectionId: empresaId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'copia_desligada', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      listRule: '@request.auth.id != "" && usuario = @request.auth.id',
      viewRule: '@request.auth.id != "" && usuario = @request.auth.id',
      createRule: '@request.auth.id != "" && @request.body.usuario = @request.auth.id',
      updateRule: '@request.auth.id != "" && usuario = @request.auth.id',
      deleteRule: '@request.auth.id != "" && usuario = @request.auth.id',
      indexes: [
        'CREATE UNIQUE INDEX idx_prefs_usuario_empresa ON preferencias_avisos (usuario, empresa)',
      ],
    })
    app.save(prefs)

    console.log('0040 avisos ok')
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('avisos'))
    app.delete(app.findCollectionByNameOrId('inscricoes_push'))
    app.delete(app.findCollectionByNameOrId('config_avisos'))
    app.delete(app.findCollectionByNameOrId('preferencias_avisos'))
  },
)
