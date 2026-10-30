// FASE 2 — SPEC-2-001: rota `retomar` (botão "Tentar de novo" do rascunho `falhou`).
// Zera as tentativas e devolve o rascunho para `recebido`; o áudio continua guardado.
// Só o autor ou Gestão/Administrador da empresa (RN-29/RN-30).
routerAdd(
  'POST',
  '/backend/v1/rascunhos/{id}/retomar',
  (e) => {
    const auth = e.auth
    if (!auth) throw e.unauthorizedError('Entre para retomar.')
    let r
    try {
      r = $app.findRecordById('rascunhos', e.request.pathValue('id'))
    } catch (err) {
      throw e.notFoundError('Rascunho nao encontrado.')
    }
    const empresa = r.getString('empresa')
    const gestao = auth.getStringSlice('acesso_gestao')
    const admin = auth.getStringSlice('acesso_admin')
    const pode =
      r.getString('autor') === auth.id ||
      gestao.indexOf(empresa) >= 0 ||
      admin.indexOf(empresa) >= 0
    if (!pode) throw e.forbiddenError('Sem acesso a este rascunho.')
    const st = r.getString('status')
    if (st === 'confirmado' || st === 'descartado') {
      throw e.badRequestError('Rascunho ja finalizado.')
    }
    r.set('status', 'recebido')
    r.set('tentativas', 0)
    r.set('motivo_falha', '')
    $app.save(r)
    return e.json(200, { status: 'recebido' })
  },
  $apis.requireAuth(),
)
