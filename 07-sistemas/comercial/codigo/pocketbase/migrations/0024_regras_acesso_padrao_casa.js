// SPEC-1-003 — correção das regras de acesso: padrão da casa é @request.auth.acesso_*
// (campos recalculados nos users), não back-relation de vinculos.
migrate(
  (app) => {
    const ln = app.findCollectionByNameOrId('linhas_negocio')
    ln.listRule = `@request.auth.id != '' && @request.auth.acesso_empresas.id ?= empresa`
    ln.viewRule = `@request.auth.id != '' && @request.auth.acesso_empresas.id ?= empresa`
    ln.createRule = `@request.auth.id != '' && @request.auth.acesso_admin.id ?= @request.body.empresa`
    ln.updateRule = `@request.auth.id != '' && @request.auth.acesso_admin.id ?= empresa`
    app.save(ln)

    const oport = app.findCollectionByNameOrId('oportunidades')
    const oportVista = `@request.auth.id != '' && (@request.auth.acesso_gestao.id ?= empresa || responsavel = @request.auth.id)`
    oport.listRule = oportVista
    oport.viewRule = oportVista
    oport.createRule = `@request.auth.id != '' && (@request.auth.acesso_gestao.id ?= @request.body.empresa || (@request.auth.acesso_comercial.id ?= @request.body.empresa && (@request.body.responsavel = @request.auth.id || @request.body.responsavel:isset != true)))`
    oport.updateRule = `@request.auth.id != '' && (@request.auth.acesso_gestao.id ?= empresa || responsavel = @request.auth.id)`
    app.save(oport)

    const acoes = app.findCollectionByNameOrId('acoes_oportunidade')
    const acoesVista = `@request.auth.id != '' && (@request.auth.acesso_gestao.id ?= empresa || oportunidade.responsavel = @request.auth.id)`
    acoes.listRule = acoesVista
    acoes.viewRule = acoesVista
    acoes.createRule = acoesVista
    acoes.updateRule = null
    acoes.deleteRule = null
    app.save(acoes)

    const visitas = app.findCollectionByNameOrId('visitas')
    const visitaVista = `@request.auth.id != '' && (@request.auth.acesso_gestao.id ?= empresa || responsavel_visita = @request.auth.id || produtor.responsavel = @request.auth.id)`
    visitas.listRule = visitaVista
    visitas.viewRule = visitaVista
    visitas.createRule = `@request.auth.id != '' && (@request.auth.acesso_gestao.id ?= @request.body.empresa || (@request.auth.acesso_comercial.id ?= @request.body.empresa && @request.body.produtor.responsavel = @request.auth.id))`
    visitas.updateRule = `@request.auth.id != '' && (@request.auth.acesso_gestao.id ?= empresa || responsavel_visita = @request.auth.id)`
    app.save(visitas)
  },
  (app) => {
    // reversão: volta às regras erradas de 0019/0021/0022 (sem efeito prático; as
    // coleções foram criadas com elas, mas o estado correto é o desta migração)
  },
)
