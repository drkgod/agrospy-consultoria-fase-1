/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'

// @skip-protected: Do not remove. Required for React rendering.
createRoot(document.getElementById('root')!).render(<App />)

// SERVICE WORKERS — corrigido em 02/11/2026.
//
// HISTÓRICO DO ERRO (que custou 3 rodadas de teste com o Diogo):
// 1ª versão: dois workers no escopo '/' (sw.js da casca + OneSignalSDKWorker.js).
//            Eles se substituem e o que perde não trata 'push' — notificação morria.
// 2ª versão: movi o do OneSignal para /push/onesignal/, mas o painel está em
//            "Typical Site" e EXIGE /OneSignalSDKWorker.js na raiz. O SDK falhava
//            com "load failed" e o aparelho ficava sem inscrição.
// 3ª versão: unifiquei em /OneSignalSDKWorker.js e desregistrei o resto — mas
//            ESQUECI DE REGISTRAR o worker unificado. O SDK só registra quando
//            init() roda, e init() só roda ao tocar em "Ativar avisos". Numa
//            abertura normal ficava ZERO worker no aparelho: a inscrição existia
//            no OneSignal, a Apple aceitava o envio e não havia quem exibisse.
//            Era isso que a checagem "worker com push: NAO" estava apontando.
//
// AGORA: o worker do OneSignal é registrado explicitamente a cada abertura, com
// escopo '/', e qualquer outro worker (sw.js legado) é removido — dois no mesmo
// escopo derrubam o push. É idempotente: registrar de novo não faz mal.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const UNIFICADO = '/OneSignalSDKWorker.js'

    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => {
        // 1) Remove qualquer worker que NÃO seja o unificado na raiz.
        const remover = []
        let jaTemUnificado = false
        for (const r of regs) {
          const script = (r.active || r.installing || r.waiting)?.scriptURL || ''
          const naRaiz = r.scope.replace(location.origin, '') === '/'
          const ehUnificado = script.indexOf(UNIFICADO) >= 0 && naRaiz
          if (ehUnificado) jaTemUnificado = true
          else remover.push(r.unregister().catch(() => {}))
        }
        return Promise.all(remover).then(() => jaTemUnificado)
      })
      .then((jaTem) => {
        // 2) Garante o registro do worker unificado. Sem isto o aparelho fica sem
        //    worker de push até alguém tocar em "Ativar avisos".
        if (!jaTem) {
          return navigator.serviceWorker.register(UNIFICADO, { scope: '/' }).catch(() => {})
        }
        return null
      })
      .catch(() => {})
  })
}
