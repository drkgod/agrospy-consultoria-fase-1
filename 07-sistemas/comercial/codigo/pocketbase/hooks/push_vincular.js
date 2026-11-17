// FASE 2 — SPEC-2-002 (task 2ae01199): confirma que o aparelho está ligado ao usuário.
// NÃO cria nem altera o usuário no OneSignal: quem faz o vínculo é o SDK no aparelho
// (`OneSignal.login`), porque é ele quem conhece o TIPO real da inscrição — SafariPush
// no iPhone. Quando o servidor declarava "ChromePush", a entrega ia para o canal errado
// e falhava 1 de 1 (achado de 01/11).
// Aqui só conferimos, e devolvemos o estado real: inscrição habilitada? tipo? token?
routerAdd('POST', '/backend/v1/push/vincular', (e) => {
  const auth = e.auth
  if (!auth) throw e.unauthorizedError('Entre para ativar os avisos.')

  const corpo = e.requestInfo().body || {}
  const subId = String(corpo.subscription_id || '')
  if (!subId) throw e.badRequestError('Informe a inscrição do aparelho.')

  const appId = $secrets.get('PUSH_APP_ID') || ''
  const chave = $secrets.get('PUSH_API_KEY') || ''
  if (!appId || !chave) {
    return e.json(503, { ok: false, motivo: 'Avisos não configurados no servidor.' })
  }

  const externalId = auth.id
  const out = { ok: false, external_id: externalId, sub_id: subId }

  // O usuário existe com esse external_id, e a inscrição está entre as dele?
  try {
    const res = $http.send({
      url: 'https://api.onesignal.com/apps/' + appId + '/users/by/external_id/' + externalId,
      method: 'GET',
      headers: { Authorization: 'Key ' + chave },
      timeout: 15,
    })
    out.status_usuario = res.statusCode
    if (res.statusCode === 200) {
      let c = res.body
      try {
        c = res.json ? res.json : JSON.parse(res.body)
      } catch (err) {}
      const subs = c && c.subscriptions ? c.subscriptions : []
      for (const s of subs) {
        if (String(s.id) === subId) {
          out.tipo = s.type || null
          out.enabled = s.enabled !== undefined ? s.enabled : null
          out.notification_types = s.notification_types !== undefined ? s.notification_types : null
          out.tem_token = !!s.token && String(s.token).length > 10
          // Só consideramos vinculado quando a inscrição existe E aceita receber.
          out.ok = out.enabled === true && Number(out.notification_types) > 0
          break
        }
      }
      out.subscriptions = subs.length
    }
  } catch (err) {
    out.erro = String(err)
  }
  return e.json(200, out)
})
