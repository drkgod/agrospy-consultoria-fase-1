/* DESATIVADO EM 01/11/2026 — NÃO REGISTRAR ESTE ARQUIVO.
   Ele disputava o escopo '/' com o worker do OneSignal e derrubava o push.
   O worker único agora é /OneSignalSDKWorker.js (push + cache da casca).
   Este arquivo fica apenas como registro histórico; ver src/main.tsx.
   Estratégia: network-first com fallback ao cache para a CASCA (index.html, assets,
   manifest, logo). A API do PocketBase NUNCA é cacheada.

   IMPORTANTE (01/11/2026) — CONFLITO QUE IMPEDIA O PUSH:
   Este worker ocupa o escopo raiz (/). O OneSignalSDKWorker.js estava no MESMO escopo,
   e dois workers no mesmo escopo se substituem: como este aqui é registrado a cada
   abertura (src/main.tsx) e não tinha tratador de 'push', toda notificação era
   descartada em silêncio — a Apple aceitava, o OneSignal dizia successful=1 e
   received=0, e nada aparecia.
   Correções: (1) o worker do OneSignal foi para /push/onesignal/ (escopo próprio);
   (2) aqui embaixo ficam os tratadores de 'push' e 'notificationclick' como rede de
   segurança, para que nenhuma notificação morra se cair neste escopo. */
const CACHE = 'agrospy-shell-v2'
const SHELL = ['/', '/index.html', '/logo-agrospy.svg', '/favicon.ico']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        // Cache tolerante: um arquivo do shell que falhar não pode impedir a instalação.
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
  // Só intercepta GET do próprio domínio; API do backend nunca vai ao cache.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return
  // O worker do push não pode ser cacheado por aqui.
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

/* ---- Push: rede de segurança contra notificação perdida ---- */
self.addEventListener('push', (event) => {
  let dados = {}
  try {
    dados = event.data ? event.data.json() : {}
  } catch (err) {
    dados = {}
  }
  const titulo = (dados.headings && (dados.headings.pt || dados.headings.en)) || 'Agrospy'
  const corpo =
    (dados.contents && (dados.contents.pt || dados.contents.en)) ||
    (dados.body ? String(dados.body) : 'Você tem uma ação.')
  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: corpo,
      icon: '/logo-agrospy.svg',
      badge: '/logo-agrospy.svg',
      data: dados.data || {},
      tag: 'agrospy-aviso',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const urlAbrir = '/avisos'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      for (const j of janelas) {
        if (j.url.indexOf(self.location.origin) === 0 && 'focus' in j) {
          j.navigate(urlAbrir).catch(() => {})
          return j.focus()
        }
      }
      return self.clients.openWindow(urlAbrir)
    }),
  )
})
