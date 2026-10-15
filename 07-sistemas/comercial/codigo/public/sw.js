/* SPEC-1-004 — service worker da casca do app (task 4da366fe).
   Estratégia: network-first com fallback ao cache para a CASCA (index.html, assets,
   manifest, logo). A API do PocketBase NUNCA é cacheada (dados sempre do servidor
   quando há rede; offline, as telas leem da cópia local em IndexedDB).
   Ativação: limpa caches antigos; skipWaiting + clients.claim para valer na hora. */
const CACHE = 'agrospy-shell-v1'
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/logo-agrospy.svg', '/favicon.ico']

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
