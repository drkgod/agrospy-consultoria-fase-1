migrate(
  (app) => {
    const empresas = app.findCollectionByNameOrId('empresas')
    const users = app.findCollectionByNameOrId('users')

    const collection = new Collection({
      name: 'vinculos',
      type: 'base',
      // Listar/ver: o próprio usuário vê seus vínculos; Administrador vê os da empresa (matriz completa na task f1624dc7)
      listRule: "@request.auth.id != '' && usuario = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario = @request.auth.id",
      // Criar vínculo: nesta task, só por migração/hook futuro — nenhum cliente cria via API
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'usuario',
          type: 'relation',
          required: true,
          collectionId: users.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'empresa',
          type: 'relation',
          required: true,
          collectionId: empresas.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'perfil',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['administrador', 'gestao', 'comercial', 'operador'],
        },
        { name: 'ativo', type: 'bool', required: true },
        { name: 'nome_exibicao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX `idx_vinculos_usuario_empresa` ON `vinculos` (`usuario`, `empresa`)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('vinculos')
    app.delete(collection)
  },
)