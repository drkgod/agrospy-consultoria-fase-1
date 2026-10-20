// ed490cca/0034 — BUG REAL provado em teste: o campo `ativo` (bool REQUIRED) rejeita
// false via API — "validation_required: Cannot be blank" no PATCH {ativo:false} E no
// CREATE com ativo=false. O PocketBase trata false como blank em campo bool required,
// então a tela "Desativar" (que faz update {ativo:false}) está quebrada para todos.
// Correção: required sai do campo (false é um valor legítimo). O hook de recálculo já
// filtra ativo = true, e as regras de acesso não dependem do required. Idempotente.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('vinculos')
    const campo = col.fields.getByName('ativo')
    campo.required = false
    app.save(col)
    console.log('0034 ativo.required=false ok')
  },
  (app) => {
    const col = app.findCollectionByNameOrId('vinculos')
    const campo = col.fields.getByName('ativo')
    campo.required = true
    app.save(col)
  },
)
