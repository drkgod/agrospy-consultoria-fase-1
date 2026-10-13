migrate(
  (app) => {
    // Reaplica o deleteRule de propriedades (a 0016 rodou antes do publish da
    // 0.0.38 — o DELETE ainda respondia 403 "Only superusers").
    const prop = app.findCollectionByNameOrId('propriedades')
    prop.deleteRule =
      "@request.auth.id != '' && (" +
      '@request.auth.acesso_gestao.id ?= empresa' +
      ' || (@request.auth.acesso_comercial.id ?= empresa && produtor.responsavel ?= @request.auth.id)' +
      ')'
    app.save(prop)
    console.log('0017: deleteRule de propriedades reaplicada')
  },
  (app) => {
    const prop = app.findCollectionByNameOrId('propriedades')
    prop.deleteRule = null
    app.save(prop)
  },
)
