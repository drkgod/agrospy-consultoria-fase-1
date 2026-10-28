// FASE 2 — backfill das datas criadas na 0036. Os registros antigos ficaram com
// created/updated vazios; sem isso o indicador "oportunidades criadas na semana" nunca
// conta nada do passado. Backfill com a melhor fonte disponível por coleção:
//   visitas        -> data da visita
//   oportunidades  -> criado_em_aparelho; se vazio, a data da visita de origem;
//                     se ainda vazio, o volta da próxima ação menos 7 dias
//   acoes_oportunidade -> data da nova ação menos 7 dias (proxy)
//   produtores/propriedades -> sem fonte confiável: fica a data da migração
// Idempotente: só toca linhas com created vazio.
migrate(
  (app) => {
    const exec = (sql, rotulo) => {
      try {
        app.db().newQuery(sql).execute()
        console.log('0037 backfill ' + rotulo + ' ok')
      } catch (e) {
        console.log('0037 backfill ' + rotulo + ' falhou: ' + e)
      }
    }

    exec(
      "UPDATE visitas SET created = data, updated = data WHERE (created IS NULL OR created = '') AND data IS NOT NULL AND data != ''",
      'visitas',
    )
    exec(
      "UPDATE oportunidades SET created = criado_em_aparelho, updated = criado_em_aparelho WHERE (created IS NULL OR created = '') AND criado_em_aparelho IS NOT NULL AND criado_em_aparelho != ''",
      'oportunidades (aparelho)',
    )
    exec(
      "UPDATE oportunidades SET created = (SELECT v.data FROM visitas v WHERE v.id = oportunidades.visita_origem), updated = (SELECT v.data FROM visitas v WHERE v.id = oportunidades.visita_origem) WHERE (created IS NULL OR created = '') AND visita_origem IS NOT NULL AND visita_origem != ''",
      'oportunidades (visita)',
    )
    exec(
      "UPDATE oportunidades SET created = datetime(proxima_acao_data, '-7 days'), updated = datetime(proxima_acao_data, '-7 days') WHERE (created IS NULL OR created = '') AND proxima_acao_data IS NOT NULL AND proxima_acao_data != ''",
      'oportunidades (proxy)',
    )
    exec(
      "UPDATE acoes_oportunidade SET created = datetime(nova_data, '-7 days'), updated = datetime(nova_data, '-7 days') WHERE (created IS NULL OR created = '') AND nova_data IS NOT NULL AND nova_data != ''",
      'acoes',
    )
    exec(
      "UPDATE produtores SET created = datetime('now'), updated = datetime('now') WHERE created IS NULL OR created = ''",
      'produtores',
    )
    exec(
      "UPDATE propriedades SET created = datetime('now'), updated = datetime('now') WHERE created IS NULL OR created = ''",
      'propriedades',
    )
  },
  (app) => {
    console.log('0037 down: backfill de datas não é reversível (mantém as datas preenchidas)')
  },
)
