// SPEC-1-004 (task 4da366fe) — etapa 2: índices únicos de id_local (a dedup rodou na 0030).
// col.addIndex(nome, unique, colunas, where) — caminho gerenciado da plataforma (guia).
migrate(
  (app) => {
    const adiciona = (colecao, nome) => {
      const col = app.findCollectionByNameOrId(colecao)
      col.addIndex(nome, true, 'id_local', "id_local != ''")
      app.save(col)
    }
    adiciona('produtores', 'idx_produtores_id_local')
    adiciona('propriedades', 'idx_propriedades_id_local')
    adiciona('visitas', 'idx_visita_id_local')
    adiciona('oportunidades', 'idx_oport_id_local')
    adiciona('acoes_oportunidade', 'idx_acao_id_local')
  },
  (app) => {
    const remove = (colecao, nome) => {
      const col = app.findCollectionByNameOrId(colecao)
      col.removeIndex(nome)
      app.save(col)
    }
    remove('produtores', 'idx_produtores_id_local')
    remove('propriedades', 'idx_propriedades_id_local')
    remove('visitas', 'idx_visita_id_local')
    remove('oportunidades', 'idx_oport_id_local')
    remove('acoes_oportunidade', 'idx_acao_id_local')
  },
)
