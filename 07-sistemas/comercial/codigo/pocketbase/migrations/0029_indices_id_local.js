// SPEC-1-004 (task 4da366fe) — RED 1: os índices únicos de id_local criados nas
// migrações 0011/0021/0022 não chegaram ao banco (o try/catch do criarIndice engoliu
// o erro — prova: 2 POSTs com o mesmo id_local criaram 2 registros, CA-1-17 quebrada).
// Esta migração recria os índices únicos nas 5 coleções da fila. Idempotente.
migrate(
  (app) => {
    const criar = (sql) => {
      try {
        app.db().newQuery({ query: sql }).execute()
        console.log('0029 indice ok')
      } catch (e) {
        console.log('0029 indice: ' + e)
      }
    }
    criar(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_produtores_id_local ON produtores (id_local) WHERE id_local != ''",
    )
    criar(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_propriedades_id_local ON propriedades (id_local) WHERE id_local != ''",
    )
    criar(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_visita_id_local ON visitas (id_local) WHERE id_local != ''",
    )
    criar(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_oport_id_local ON oportunidades (id_local) WHERE id_local != ''",
    )
    criar(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_acao_id_local ON acoes_oportunidade (id_local) WHERE id_local != ''",
    )
  },
  (app) => {
    // down: remove os índices (não afeta dados).
    const drop = (sql) => {
      try {
        app.db().newQuery({ query: sql }).execute()
      } catch (e) {
        console.log('0029 down: ' + e)
      }
    }
    drop('DROP INDEX IF EXISTS idx_produtores_id_local')
    drop('DROP INDEX IF EXISTS idx_propriedades_id_local')
    drop('DROP INDEX IF EXISTS idx_visita_id_local')
    drop('DROP INDEX IF EXISTS idx_oport_id_local')
    drop('DROP INDEX IF EXISTS idx_acao_id_local')
  },
)
