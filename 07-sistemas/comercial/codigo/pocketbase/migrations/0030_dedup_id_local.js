// SPEC-1-004 (task 4da366fe) — etapa 1 da deduplicação (antes do índice único da 0031).
// Mantém o registro mais antigo de cada id_local e apaga os demais (duplicatas dos
// testes de idempotência de hoje). Sem índice aqui — só dados.
// LIÇÃO (causa-raiz dos índices ausentes): no JSVM, newQuery recebe a SQL POSICIONAL —
// newQuery({query: sql}) vira "[object Object]" e o try/catch das migrações antigas
// engoliu esse erro, por isso os índices de 0011/0021/0022 nunca existiram.
migrate(
  (app) => {
    const deduplica = (tabela) => {
      const sql = `DELETE FROM ${tabela} WHERE id_local != '' AND id NOT IN (SELECT MIN(id) FROM ${tabela} WHERE id_local != '' GROUP BY id_local)`
      app.db().newQuery(sql).execute()
      console.log(`0030 dedup ${tabela}: ok`)
    }
    deduplica('produtores')
    deduplica('propriedades')
    deduplica('visitas')
    deduplica('oportunidades')
    deduplica('acoes_oportunidade')
  },
  (app) => {
    console.log('0030 down: deduplicação não é reversível (dados já consolidados)')
  },
)
