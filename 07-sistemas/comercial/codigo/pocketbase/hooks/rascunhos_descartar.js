// FASE 2 — SPEC-2-001 (RN-32): rota `descartar`.
// O status é campo controlado pelo servidor — a tela não pode mudar pela API, então o
// descarte precisa passar por aqui. Pede o motivo? Não: a SPEC só exige confirmação,
// que a tela faz. Não entra no histórico.
// Só o autor ou Gestão/Administrador (RN-29/RN-30). Confirmado/descartado não volta.
routerAdd(
  'POST',
  '/backend/v1/rascunhos/{id}/descartar',
  (e) => {
    const auth = e.auth
    if (!auth) throw e.unauthorizedError('Entre para descartar.')
    let r
    try {
      r = $app.findRecordById('rascunhos', e.request.pathValue('id'))
    } catch (err) {
      throw e.notFoundError('Rascunho nao encontrado.')
    }
    const empresa = r.getString('empresa')
    const pode =
      r.getString('autor') === auth.id ||
      auth.getStringSlice('acesso_gestao').indexOf(empresa) >= 0 ||
      auth.getStringSlice('acesso_admin').indexOf(empresa) >= 0
    if (!pode) throw e.forbiddenError('Sem acesso a este rascunho.')
    const st = r.getString('status')
    if (st === 'confirmado') {
      throw e.badRequestError('Este rascunho ja virou visita e nao pode ser descartado.')
    }
    if (st === 'descartado') {
      return e.json(200, { status: 'descartado', ja_descartado: true })
    }
    r.set('status', 'descartado')
    $app.save(r)
    return e.json(200, { status: 'descartado', ja_descartado: false })
  },
  $apis.requireAuth(),
)
