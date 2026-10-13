migrate(
  (app) => {
    // Emenda do Diogo (13/10/2026): permitir excluir propriedade.
    // Mesma matriz da edição: Gestão/Administrador da empresa OU Comercial
    // responsável pelo produtor da propriedade.
    const prop = app.findCollectionByNameOrId('propriedades')
    prop.deleteRule =
      "@request.auth.id != '' && (" +
      '@request.auth.acesso_gestao.id ?= empresa' +
      ' || (@request.auth.acesso_comercial.id ?= empresa && produtor.responsavel ?= @request.auth.id)' +
      ')'
    app.save(prop)
  },
  (app) => {
    const prop = app.findCollectionByNameOrId('propriedades')
    prop.deleteRule = null
    app.save(prop)
  },
)
