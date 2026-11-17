// WORKER ÚNICO NA RAIZ — resolve o conflito que impedia o push (01/11/2026).
//
// HISTÓRICO DO ERRO:
// O app tinha dois service workers disputando o escopo '/': este (OneSignal) e o
// sw.js da casca. Dois workers no mesmo escopo se substituem. Pior: quando movi este
// para /push/onesignal/, o SDK continuou pedindo /OneSignalSDKWorker.js na raiz —
// porque o painel do OneSignal está no modo "Typical Site", que manda no caminho do
// worker e ignora o serviceWorkerPath do init(). Resultado no aparelho:
//   "id no SDK: erro: Script .../OneSignalSDKWorker.js load failed"
// O SDK não registrava worker, não criava inscrição, e a inscrição antiga ficava
// órfã — o servidor enviava, o OneSignal aceitava (successful=1) e nada aparecia.
//
// SOLUÇÃO: UM só worker na raiz, com as duas responsabilidades:
//   1) importScripts do SDK do OneSignal (traz os tratadores de push/click);
//   2) cache da casca do app (SPEC-1-004, uso sem internet).
// NÃO adicione tratador de 'push' aqui: o SDK já traz o dele e duplicaria a
// notificação na tela.
//
// NÃO renomeie nem mova este arquivo: o painel do OneSignal exige este caminho.
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js')

/* ---- Casca do app (SPEC-1-004): network-first com fallback ao cache ---- */
const CACHE = 'agrospy-shell-v3'
const SHELL = ['/', '/index.html', '/logo-agrospy.svg', '/favicon.ico']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        // Tolerante: um arquivo do shell que falhar não pode impedir a instalação.
        Promise.allSettled(SHELL.map((arquivo) => cache.add(arquivo))),
      )
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  // Só GET do próprio domínio; API e o próprio worker nunca vão ao cache.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.indexOf('OneSignalSDKWorker') >= 0) return

  event.respondWith(
    fetch(event.request)
      .then((resposta) => {
        const copia = resposta.clone()
        caches.open(CACHE).then((cache) => cache.put(event.request, copia))
        return resposta
      })
      .catch(() =>
        caches.match(event.request).then((doCache) => doCache || caches.match('/index.html')),
      ),
  )
})
