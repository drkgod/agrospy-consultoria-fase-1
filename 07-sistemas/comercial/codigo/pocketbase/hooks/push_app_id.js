// FASE 2 — SPEC-2-002 (task 2ae01199): rota que entrega o App ID do push ao frontend.
// O App ID é público (vai no HTML do site), mas fica num só lugar: o cofre.
// Não expõe a REST API Key — essa nunca sai do servidor.
routerAdd('GET', '/backend/v1/push/app-id', (e) => {
  const appId = $secrets.get('PUSH_APP_ID') || ''
  return e.json(200, { appId: appId, configurado: !!appId })
})
