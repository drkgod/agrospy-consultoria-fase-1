// FASE 2 — SPEC-2-002 (task 2ae01199): envio dos avisos pelo OneSignal.
// Roda junto com a geração: depois de criar os avisos, tenta enviar a notificação
// para o destinatário. Regras da SPEC:
//  - o texto da tela bloqueada é só o texto_curto ("Agrospy: você tem 1 ação para hoje");
//  - quem não tem inscrição ativa fica `sem_inscricao` e o aviso continua na lista;
//  - falha de envio vira `falhou_envio` (não perde o aviso, não repete o aviso);
//  - 2 tentativas, timeout de 10s;
//  - $http.send não lança em não-2xx: conferir statusCode.
// A REST API Key vem do cofre (PUSH_API_KEY). Sem ela, nada é enviado.
routerAdd('POST', '/backend/v1/teste/avisos/enviar', (e) => {
  const superUser = e.hasSuperuserAuth()
  const auth = e.auth
  if (!auth && !superUser) throw e.unauthorizedError('Entre para enviar.')
  if (!superUser) {
    const admin = auth.getStringSlice('acesso_admin')
    if (admin.length === 0) throw e.forbiddenError('Só Administrador.')
  }

  const appId = $secrets.get('PUSH_APP_ID') || ''
  const chave = $secrets.get('PUSH_API_KEY') || ''
  if (!appId) return e.json(200, { enviados: 0, motivo: 'PUSH_APP_ID ausente' })
  if (!chave) {
    // Sem a chave REST: marca o que não pôde ser enviado, sem apagar o aviso.
    return e.json(200, { enviados: 0, motivo: 'PUSH_API_KEY ausente no cofre' })
  }

  const corpo = e.requestInfo().body || {}
  const empresaFiltro = corpo.empresa ? String(corpo.empresa) : ''
  const avisos = $app.findRecordsByFilter(
    'avisos',
    'envio = "pendente"' + (empresaFiltro ? ' && empresa = {:e}' : ''),
    'created',
    50,
    0,
    empresaFiltro ? { e: empresaFiltro } : {},
  )

  let enviados = 0
  let semInscricao = 0
  let falhas = 0
  for (const a of avisos) {
    const destinatario = a.getString('destinatario')
    let inscricao = null
    try {
      inscricao = $app.findFirstRecordByFilter(
        'inscricoes_push',
        'usuario = {:u} && ativa = true',
        { u: destinatario },
      )
    } catch (err) {
      inscricao = null
    }
    if (!inscricao) {
      a.set('envio', 'sem_inscricao')
      $app.save(a)
      semInscricao++
      continue
    }

    // Envio por ID DA INSCRIÇÃO, não por alias.
    // PROVADO EM 01/11: include_aliases/external_id volto HTTP 200 com
    // {"errors":{"invalid_aliases":{"external_id":[...]}}} e NÃO entrega —
    // falso sucesso. A inscrição estava saudável (SafariPush, enabled, token Apple).
    // Por include_subscription_ids entregou de primeira: successful=1, failed=0,
    // safari_web_push. Não voltar para o caminho do alias.
    const idInscricao = inscricao.getString('id_inscricao')
    let ok = false
    let ultimoErro = ''
    for (let tentativa = 0; tentativa < 2 && !ok; tentativa++) {
      try {
        const res = $http.send({
          url: 'https://api.onesignal.com/notifications',
          method: 'POST',
          headers: {
            Authorization: 'Key ' + chave,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            app_id: appId,
            include_subscription_ids: [idInscricao],
            headings: { en: 'Agrospy', pt: 'Agrospy' },
            contents: { en: a.getString('texto_curto'), pt: a.getString('texto_curto') },
            // Tela bloqueada: só o texto curto, sem o produtor (privacidade).
            data: { aviso: a.id, oportunidade: a.getString('oportunidade') },
          }),
          timeout: 10,
        })
        // 200 com invalid_aliases é FALHA, não sucesso: conferir o corpo.
        let c = res.body
        try {
          c = res.json ? res.json : JSON.parse(res.body)
        } catch (err) {}
        const temErro = c && c.errors && Object.keys(c.errors).length > 0
        if (res.statusCode >= 200 && res.statusCode < 300 && !temErro) {
          ok = true
        } else {
          ultimoErro = 'HTTP ' + res.statusCode + (temErro ? ' ' + JSON.stringify(c.errors) : '')
        }
      } catch (err) {
        ultimoErro = String(err)
      }
    }

    a.set('envio', ok ? 'enviado' : 'falhou_envio')
    $app.save(a)
    if (ok) enviados++
    else {
      falhas++
      $app.logger().warn('envio de aviso falhou', 'aviso', a.id, 'erro', ultimoErro)
    }
  }
  return e.json(200, { enviados: enviados, semInscricao: semInscricao, falhas: falhas })
})
