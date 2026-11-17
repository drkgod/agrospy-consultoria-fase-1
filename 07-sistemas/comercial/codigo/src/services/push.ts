// FASE 2 — SPEC-2-002 (task 2ae01199): inscrição do aparelho no push (OneSignal).
// App ID vem do servidor por rota própria (o segredo não sai do backend).
//
// LIMITES REAIS DO iPHONE (documentação Apple/WebKit e OneSignal):
//  - só a partir do iOS/iPadOS 16.4;
//  - SÓ funciona com o site adicionado à Tela de Início, aberto por esse ícone;
//  - uma aba do Safari NUNCA consegue pedir permissão — o pedido falha em silêncio,
//    sem erro e sem prompt (foi exatamente o que o Diogo viu em 01/11).
// Por isso `ativar` detecta o modo standalone e falha RÁPIDO com mensagem clara,
// em vez de ficar pendurado no "Aguarde…".
import pb from '@/lib/pocketbase/client'

declare global {
  interface Window {
    OneSignalDeferred?: Array<(os: OneSignalLike) => void>
    OneSignal?: OneSignalLike
  }
}

interface OneSignalLike {
  init: (opts: Record<string, unknown>) => Promise<void>
  // v16: login/logout ficam na RAIZ do SDK, não em User. Chamar User.login()
  // lança TypeError e, engolido por um catch, deixa o aparelho sem external_id —
  // o OneSignal aceita o envio e não entrega (falha silenciosa de 01/11).
  login: (externalId: string) => Promise<void>
  logout: () => Promise<void>
  Notifications: { requestPermission: () => Promise<void>; permission: boolean }
  User: {
    PushSubscription: {
      id?: string
      optIn: () => Promise<void>
      optOut: () => Promise<void>
    }
  }
}

/** Está aberto pelo ícone da Tela de Início? (exigência do iOS para push) */
export const estaInstalado = (): boolean => {
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true || nav.standalone === true
  )
}

/** iOS/iPadOS? */
const ehIOS = (): boolean =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** Corre com prazo: nada pode deixar o botão preso em "Aguarde…". */
const comPrazo = <T>(p: Promise<T>, ms: number, msg: string): Promise<T> =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(msg)), ms))])

let inicializado = false

/**
 * Inicializa uma vez só. Se o SDK já estiver inicializado (o que acontece quando uma
 * tentativa anterior estourou o prazo mas o init concluiu em segundo plano), isso NÃO
 * é erro: o OneSignal responde "SDK already initialized". Tratar como sucesso é o que
 * permite seguir para o pedido de permissão em vez de travar a tela.
 */
const inicializarUmaVez = async (os: OneSignalLike, appId: string): Promise<void> => {
  if (inicializado) return
  try {
    // CAMINHO PADRÃO DA RAIZ, DE PROPÓSITO (01/11/2026).
    // O painel do OneSignal está no modo "Typical Site", que MANDA o caminho do
    // worker e ignora o serviceWorkerPath passado aqui. Movê-lo para
    // /push/onesignal/ fez o SDK falhar com "load failed", sem inscrever o aparelho:
    // o servidor enviava, o OneSignal aceitava e nada aparecia.
    // Agora existe UM worker em /OneSignalSDKWorker.js que faz as duas coisas (push +
    // cache da casca), e o sw.js separado deixou de ser registrado. Ver main.tsx.
    await os.init({ appId })
  } catch (e: unknown) {
    const msg = String((e as { message?: string })?.message ?? e)
    if (!/already\s+initiali[sz]ed/i.test(msg)) throw e
    // já inicializado: segue normalmente
  }
  inicializado = true
}

const carregarSDK = async (appId: string): Promise<OneSignalLike> => {
  // Já existe na página (segunda tentativa): reusa em vez de recarregar o script.
  if (window.OneSignal) {
    await inicializarUmaVez(window.OneSignal, appId)
    return window.OneSignal
  }

  await comPrazo(
    new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
      s.defer = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('Não consegui carregar o serviço de avisos.'))
      document.head.appendChild(s)
    }),
    15000,
    'O serviço de avisos demorou para responder. Tente de novo.',
  )

  const os = await comPrazo(
    new Promise<OneSignalLike>((resolve) => {
      window.OneSignalDeferred = window.OneSignalDeferred || []
      window.OneSignalDeferred.push((o: OneSignalLike) => resolve(o))
    }),
    15000,
    'O serviço de avisos não iniciou. Tente de novo.',
  )

  await comPrazo(
    inicializarUmaVez(os, appId),
    15000,
    'O serviço de avisos não iniciou. Tente de novo.',
  )
  return os
}

// Cache do App ID: sem isso, cada ativação começa com um fetch e o gesto do usuário
// expira antes de chegar ao optIn() (ver comentário em `ativar`).
let appIdCache = ''

export const pushService = {
  async appId(): Promise<string> {
    if (appIdCache) return appIdCache
    try {
      const r = await pb.send('/backend/v1/push/app-id', { method: 'GET' })
      appIdCache = String((r as { appId?: string })?.appId ?? '')
      return appIdCache
    } catch {
      return ''
    }
  },

  /**
   * PRÉ-CARREGA o SDK, sem pedir permissão e sem inscrever nada.
   *
   * POR QUE ISSO EXISTE (02/11/2026 12:25):
   * O Safari/iOS só cria a PushSubscription dentro de um GESTO DO USUÁRIO. Se entre
   * o toque e o optIn() houver awaits demorados (fetch do appId, download do SDK,
   * optOut, loop de unsubscribe), o gesto EXPIRA e o Safari recusa em silêncio —
   * exatamente o que o print mostrou: `inscricao no navegador: NAO` com permissão
   * `granted`.
   * Chamando isto quando a tela abre, o SDK já está carregado e o toque seguinte vai
   * direto ao optIn.
   */
  async preparar(): Promise<boolean> {
    if (!estaInstalado()) return false
    try {
      const appId = await this.appId()
      if (!appId) return false
      await carregarSDK(appId)
      return true
    } catch {
      return false
    }
  },

  /**
   * Cria a inscrição de push DENTRO DO GESTO do usuário.
   * Não faz optOut, não apaga nada: só pede permissão (se faltar) e inscreve.
   * É o único caminho que o Safari aceita. Nada de await pesado antes do optIn.
   */
  async ativarAgora(usuarioId: string): Promise<Record<string, string>> {
    const out: Record<string, string> = {}
    const appId = appIdCache || (await this.appId())
    if (!appId) return { estado: 'O servidor não devolveu o App ID.' }
    if (ehIOS() && !estaInstalado()) {
      return { estado: 'No iPhone, abra pelo ícone da Tela de Início.' }
    }
    let os: OneSignalLike
    try {
      // Já deve estar carregado pelo preparar(); se não, carrega agora (mais lento,
      // e o gesto pode expirar — por isso o preparar() existe).
      os = await carregarSDK(appId)
    } catch (e: unknown) {
      return {
        estado: 'Falha ao carregar o serviço: ' + String((e as { message?: string })?.message ?? e),
      }
    }

    // Permissão primeiro: no iOS ela também exige gesto.
    let perm = 'indefinido'
    try {
      perm = Notification.permission
    } catch {
      perm = 'indisponivel'
    }
    if (perm !== 'granted') {
      try {
        await comPrazo(os.Notifications.requestPermission(), 20000, 'O iPhone não abriu o pedido.')
      } catch (e: unknown) {
        return { estado: String((e as { message?: string })?.message ?? e) }
      }
      try {
        perm = Notification.permission
      } catch {
        perm = 'indisponivel'
      }
    }
    out['permissao'] = perm
    if (perm !== 'granted') {
      return {
        ...out,
        estado: 'Permissão não concedida. Toque em Permitir quando o iPhone perguntar.',
      }
    }

    // O ponto crítico: optIn imediatamente após o gesto.
    try {
      await comPrazo(os.User.PushSubscription.optIn(), 20000, 'A inscrição demorou.')
    } catch (e: unknown) {
      out['erro optIn'] = String((e as { message?: string })?.message ?? e)
    }

    // Confere a PushSubscription REAL do navegador (o id do OneSignal engana).
    let local = false
    for (let i = 0; i < 8; i++) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        for (const r of regs) {
          try {
            if (await r.pushManager.getSubscription()) local = true
          } catch {
            /* segue */
          }
        }
      } catch {
        /* segue */
      }
      if (local) break
      await new Promise((r) => setTimeout(r, 1000))
    }
    out['inscricao no navegador'] = local ? 'SIM' : 'NAO'
    const id = os.User.PushSubscription.id ?? ''
    out['id OneSignal'] = id || '(vazio)'
    if (!local) {
      return {
        ...out,
        estado:
          'O navegador não criou a inscrição. Feche o app, abra pelo ícone e toque em "Ativar avisos no celular" — o toque tem de ser direto, sem outra etapa antes.',
      }
    }

    // Liga ao usuário e grava no servidor.
    try {
      await os.login(usuarioId)
    } catch {
      /* segue: o vínculo pelo servidor abaixo cobre */
    }
    try {
      await pb.send('/backend/v1/push/vincular', {
        method: 'POST',
        body: { subscription_id: id, usuario: usuarioId },
      })
    } catch {
      /* segue */
    }
    const minhas = await pb
      .collection('inscricoes_push')
      .getFullList({ filter: `usuario = "${usuarioId}"` })
      .catch(() => [])
    for (const a of minhas) {
      if (a.id_inscricao !== id && a.ativa) {
        await pb
          .collection('inscricoes_push')
          .update(a.id, { ativa: false })
          .catch(() => null)
      }
    }
    const jaTem = minhas.find((a) => a.id_inscricao === id)
    if (jaTem) {
      await pb
        .collection('inscricoes_push')
        .update(jaTem.id, { ativa: true })
        .catch(() => null)
    } else if (id) {
      await pb
        .collection('inscricoes_push')
        .create({ usuario: usuarioId, id_inscricao: id, ativa: true })
        .catch(() => null)
    }

    out['estado'] = 'OK — inscrição criada neste celular. Pode testar a entrega.'
    return out
  },

  /**
   * Ativa os avisos neste aparelho. Precisa sair de um toque (regra do iOS).
   * Falha rápido e com mensagem clara quando o navegador não permite.
   */
  async ativar(usuarioId: string): Promise<string> {
    const appId = await this.appId()
    if (!appId) throw new Error('Os avisos ainda não estão configurados no servidor.')

    // Checagem que evita o "Aguarde…" eterno no iPhone.
    if (ehIOS() && !estaInstalado()) {
      throw new Error(
        'No iPhone, os avisos só funcionam com o app na Tela de Início. Abra o Safari, toque em Compartilhar → "Adicionar à Tela de Início", e abra o app por esse ícone.',
      )
    }

    const os = await carregarSDK(appId)

    const jaTem = navigator.permissions
      ? await navigator.permissions
          .query({ name: 'notifications' as PermissionName })
          .then((p) => p.state === 'granted')
          .catch(() => false)
      : false

    if (!jaTem) {
      await comPrazo(
        os.Notifications.requestPermission(),
        20000,
        ehIOS()
          ? 'O iPhone não abriu o pedido de permissão. Confirme que você abriu o app pelo ícone da Tela de Início (não pelo Safari).'
          : 'O navegador não abriu o pedido de permissão. Verifique as permissões de notificação do site.',
      )
    }
    if (!os.Notifications.permission) {
      throw new Error(
        'Permissão de notificação não concedida. Os avisos continuam aparecendo na lista.',
      )
    }

    await comPrazo(
      os.User.PushSubscription.optIn(),
      15000,
      'Não consegui inscrever o aparelho. Tente de novo.',
    )

    const id = os.User.PushSubscription.id ?? ''
    if (!id) throw new Error('O aparelho não gerou a inscrição. Feche o app e abra de novo.')

    // Liga o aparelho ao usuário PELO SDK — é o caminho oficial e o único que mantém
    // o TIPO da inscrição correto (SafariPush no iPhone). A versão anterior criava o
    // usuário pelo servidor declarando "ChromePush": a entrega ia para o canal errado
    // e falhava 1 de 1 num iPhone.
    try {
      await os.login(usuarioId)
    } catch (e: unknown) {
      throw new Error(
        'Não consegui ligar o aparelho à sua conta: ' +
          (String((e as { message?: string })?.message ?? e) || 'erro desconhecido'),
      )
    }

    // Confirma no servidor que o vínculo existe de verdade (não confia no "ok" da tela).
    const vinc = (await pb
      .send('/backend/v1/push/vincular', {
        method: 'POST',
        body: { subscription_id: id, usuario: usuarioId },
      })
      .catch(() => null)) as { ok?: boolean; detalhe?: string } | null
    if (!vinc?.ok) {
      throw new Error(
        'O aparelho foi inscrito, mas o serviço não confirmou a entrega. Tente de novo em alguns segundos.',
      )
    }

    // Uma inscrição ativa por usuário: desativa as anteriores.
    const anteriores = await pb
      .collection('inscricoes_push')
      .getFullList({ filter: `usuario = "${usuarioId}" && ativa = true` })
      .catch(() => [])
    for (const a of anteriores) {
      if (a.id_inscricao !== id) {
        await pb
          .collection('inscricoes_push')
          .update(a.id, { ativa: false })
          .catch(() => null)
      }
    }
    const existente = await pb
      .collection('inscricoes_push')
      .getFirstListItem(`usuario = "${usuarioId}" && id_inscricao = "${id}"`)
      .catch(() => null)
    if (existente) {
      await pb.collection('inscricoes_push').update(existente.id, { ativa: true })
    } else {
      await pb
        .collection('inscricoes_push')
        .create({ usuario: usuarioId, id_inscricao: id, ativa: true })
    }
    return id
  },

  /**
   * Reconcilia a inscrição do APARELHO com a do SERVIDOR.
   *
   * POR QUE ISSO EXISTE (01/11/2026): o servidor guardava a inscrição 376e35a7 e
   * enviava para ela; o OneSignal aceitava (successful=1) e nada aparecia. Causa: essa
   * inscrição nasceu sob o worker antigo, na raiz, que foi desregistrado quando o
   * worker do OneSignal passou para /push/onesignal/. A inscrição ficou órfã — existe
   * no OneSignal, mas não pertence mais a nenhum worker ativo do aparelho.
   * Aqui o ID é lido do aparelho, comparado com o banco e corrigido sozinho: não dá
   * para confiar num identificador guardado, ele muda quando o worker muda de escopo
   * ou quando o ícone é reinstalado.
   */
  async sincronizarAparelho(usuarioId: string): Promise<Record<string, string>> {
    const out: Record<string, string> = {}
    const appId = await this.appId()
    if (!appId) return { erro: 'App ID ausente no servidor.' }
    if (!estaInstalado()) return { estado: 'fora do app (aba do navegador) — nada a fazer' }

    let perm = 'indefinido'
    try {
      perm = Notification.permission
    } catch {
      perm = 'indisponivel'
    }
    out['permissao'] = perm
    if (perm !== 'granted') {
      out['estado'] = 'sem permissao — toque em Ativar avisos'
      return out
    }

    let subId = ''
    try {
      const os = await carregarSDK(appId)
      // optIn garante que o aparelho tenha inscrição viva no escopo atual.
      try {
        await comPrazo(
          os.User.PushSubscription.optIn(),
          15000,
          'O aparelho não confirmou a inscrição.',
        )
      } catch {
        /* segue: pode já estar inscrito */
      }
      subId = os.User.PushSubscription.id ?? ''
    } catch (e: unknown) {
      return {
        erro: 'Falha ao carregar o serviço: ' + String((e as { message?: string })?.message ?? e),
      }
    }
    if (!subId) {
      out['estado'] = 'o aparelho não gerou inscrição — toque em Ativar avisos'
      return out
    }
    out['id no aparelho'] = subId

    // O SERVICE WORKER ESTÁ ATIVO? (02/11/2026)
    // Esta é a diferença que faltava. A inscrição pode existir no OneSignal e o
    // aparelho não ter worker nenhum escutando — foi o que aconteceu quando o sw.js
    // antigo foi desregistrado. Nesse caso a notificação nunca aparece, por mais que
    // a Apple aceite. Sem esta checagem, o "sincronizado" mentia.
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      let comPush = 0
      let detalhe: string[] = []
      for (const r of regs) {
        const ativo = r.active || r.waiting || r.installing
        const script = (ativo?.scriptURL || '').replace(location.origin, '')
        let tem = false
        try {
          tem = !!(await r.pushManager.getSubscription())
        } catch {
          tem = false
        }
        if (tem) comPush++
        detalhe.push(script + (tem ? ' [push]' : ' [sem push]'))
      }
      out['service workers'] = String(regs.length) + ': ' + detalhe.join(', ')
      out['worker com push'] = comPush > 0 ? 'SIM' : 'NAO'
      if (comPush === 0) {
        out['estado'] =
          'SEM WORKER DE PUSH no aparelho — a inscrição existe no servidor mas ninguém a escuta aqui. Toque em "Reativar os avisos neste celular".'
        return out
      }
    } catch {
      out['worker com push'] = 'nao foi possivel ler'
    }

    const minhas = await pb
      .collection('inscricoes_push')
      .getFullList({ filter: `usuario = "${usuarioId}"` })
      .catch(() => [])
    const ativa = minhas.find((a) => a.ativa === true)
    const idNoBanco = ativa ? String(ativa.id_inscricao) : ''
    out['id no servidor'] = idNoBanco || '(nenhum)'

    if (idNoBanco === subId) {
      out['estado'] = 'sincronizado'
      return out
    }

    // Divergiu: desativa todas e grava o ID atual como o único ativo.
    for (const a of minhas) {
      if (a.id_inscricao !== subId && a.ativa) {
        await pb
          .collection('inscricoes_push')
          .update(a.id, { ativa: false })
          .catch(() => null)
      }
    }
    const existente = minhas.find((a) => a.id_inscricao === subId)
    if (existente) {
      await pb
        .collection('inscricoes_push')
        .update(existente.id, { ativa: true })
        .catch(() => null)
    } else {
      await pb
        .collection('inscricoes_push')
        .create({ usuario: usuarioId, id_inscricao: subId, ativa: true })
        .catch(() => null)
    }
    out['estado'] = 'CORRIGIDO — o servidor passou a usar o identificador atual do aparelho'
    return out
  },

  /**
   * RECRIA a inscrição do aparelho do zero (02/11/2026).
   *
   * POR QUE É DIFERENTE DE `sincronizarAparelho`: aquele só copia o id atual para o
   * banco. Se a inscrição estiver órfã — existe no OneSignal, mas nenhum service
   * worker do aparelho a escuta — copiar o id não muda nada: o servidor envia, a
   * Apple aceita e a notificação não aparece. Foi exatamente o caso depois de
   * desregistrar o sw.js antigo.
   * Aqui a inscrição velha é DESCARTADA (optOut + unsubscribe no worker) e o SDK cria
   * uma nova, no worker atual. Depois o id novo é gravado como o ativo.
   */
  async reativar(usuarioId: string): Promise<Record<string, string>> {
    const out: Record<string, string> = {}
    const appId = await this.appId()
    if (!appId) return { erro: 'App ID ausente no servidor.' }
    if (!estaInstalado()) {
      return { estado: 'abra pelo ícone da Tela de Início para reativar' }
    }
    try {
      out['permissao'] = Notification.permission
    } catch {
      out['permissao'] = 'indisponivel'
    }
    if (out['permissao'] !== 'granted') {
      return { estado: 'sem permissão — toque em Ativar avisos e permita' }
    }

    let os: OneSignalLike
    try {
      os = await carregarSDK(appId)
    } catch (e: unknown) {
      return {
        erro: 'Falha ao carregar o serviço: ' + String((e as { message?: string })?.message ?? e),
      }
    }

    const antigo = os.User.PushSubscription.id ?? ''
    out['id antigo'] = antigo || '(nenhum)'

    // 1) Descarta a inscrição atual e as registradas no pushManager.
    try {
      await comPrazo(os.User.PushSubscription.optOut(), 15000, 'optOut demorou.')
      out['descartei o vinculo antigo'] = 'sim'
    } catch {
      out['descartei o vinculo antigo'] = 'nao (segue)'
    }
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      for (const r of regs) {
        try {
          const s = await r.pushManager.getSubscription()
          if (s) await s.unsubscribe()
        } catch {
          /* segue */
        }
      }
      out['inscricoes do worker canceladas'] = 'sim'
    } catch {
      out['inscricoes do worker canceladas'] = 'nao'
    }

    // 2) Cria inscrição nova no worker atual.
    try {
      await comPrazo(os.User.PushSubscription.optIn(), 20000, 'optIn demorou.')
    } catch (e: unknown) {
      out['erro optIn'] = String((e as { message?: string })?.message ?? e)
    }

    // A PushSubscription do NAVEGADOR é o que importa — não o id do OneSignal.
    // Impressão de 02/11 12:15 no iPhone: worker registrado, `[sem push]`, e o
    // OneSignal devolvendo o MESMO id. Ou seja: o SDK reusa um id do servidor dele
    // mesmo quando a inscrição local não existe. O id engana; a PushSubscription não.
    // Dá tempo ao navegador: a criação real pode levar alguns segundos após o optIn.
    const temSubscriptionLocal = async (): Promise<boolean> => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        for (const r of regs) {
          try {
            if (await r.pushManager.getSubscription()) return true
          } catch {
            /* segue */
          }
        }
      } catch {
        /* segue */
      }
      return false
    }

    let temLocal = false
    for (let tentativa = 0; tentativa < 10; tentativa++) {
      temLocal = await temSubscriptionLocal()
      if (temLocal) break
      await new Promise((r) => setTimeout(r, 1000))
    }

    const novo = os.User.PushSubscription.id ?? ''
    out['id novo'] = novo || '(vazio)'
    out['inscricao no navegador'] = temLocal ? 'SIM' : 'NAO'
    if (!temLocal) {
      out['estado'] =
        'O aparelho NÃO criou a inscrição de push no navegador (o OneSignal devolve o id antigo, mas nada está inscrito aqui). Use "Limpar o push e recarregar" — isso apaga o estado do SDK neste aparelho e cria a inscrição do zero.'
      return out
    }
    if (!novo) {
      out['estado'] =
        'o aparelho não criou inscrição nova — feche e abra o app, depois tente de novo'
      return out
    }
    if (novo === antigo) {
      out['aviso'] = 'o aparelho devolveu o mesmo id — o worker não recriou a inscrição'
    }

    // 3) Liga ao usuário pelo SDK (mantém o tipo SafariPush correto).
    try {
      await os.login(usuarioId)
    } catch (e: unknown) {
      out['erro login'] = String((e as { message?: string })?.message ?? e)
    }

    // 4) Grava como a única ativa no servidor.
    const minhas = await pb
      .collection('inscricoes_push')
      .getFullList({ filter: `usuario = "${usuarioId}"` })
      .catch(() => [])
    for (const a of minhas) {
      if (a.ativa) {
        await pb
          .collection('inscricoes_push')
          .update(a.id, { ativa: false })
          .catch(() => null)
      }
    }
    const jaTem = minhas.find((a) => a.id_inscricao === novo)
    if (jaTem) {
      await pb
        .collection('inscricoes_push')
        .update(jaTem.id, { ativa: true })
        .catch(() => null)
    } else {
      await pb
        .collection('inscricoes_push')
        .create({ usuario: usuarioId, id_inscricao: novo, ativa: true })
        .catch(() => null)
    }

    out['estado'] = 'OK — este celular criou a inscrição de push. Pode testar a entrega.'
    return out
  },

  /**
   * LIMPA o estado de push deste aparelho e recria do zero.
   *
   * Impressão de 02/11 12:15 no iPhone: worker registrado, mas `[sem push]` — e o
   * OneSignal devolvendo sempre o MESMO id. Ou seja, o SDK reusa um id do servidor
   * dele mesmo quando a inscrição local não existe; limpar só por optOut/optIn não
   * cria a PushSubscription de verdade.
   * Aqui a limpeza é completa: desregistra os workers, apaga os caches e o
   * IndexedDB do SDK, e recarrega o app. Na abertura seguinte o worker registra de
   * novo (ver src/main.tsx) e o SDK não encontra estado antigo — cria inscrição nova.
   * É a versão em código do "remova o ícone e adicione de novo", sem o usuário ter
   * de refazer a instalação.
   */
  async limparTudo(): Promise<Record<string, string>> {
    const out: Record<string, string> = {}
    if (!estaInstalado()) {
      out['estado'] = 'abra pelo ícone da Tela de Início para limpar'
      return out
    }
    try {
      const os = window.OneSignal
      if (os) {
        try {
          await comPrazo(os.User.PushSubscription.optOut(), 8000, 'optOut demorou.')
          out['optOut'] = 'ok'
        } catch {
          out['optOut'] = 'nao (segue)'
        }
      }
    } catch {
      /* segue */
    }

    // 1) Cancela a PushSubscription do navegador
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      for (const r of regs) {
        try {
          const s = await r.pushManager.getSubscription()
          if (s) await s.unsubscribe()
        } catch {
          /* segue */
        }
      }
      out['inscricao do navegador cancelada'] = 'sim'
    } catch {
      out['inscricao do navegador cancelada'] = 'nao'
    }

    // 2) Desregistra os workers (o registro é refeito no próximo carregamento)
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      for (const r of regs) await r.unregister()
      out['workers desregistrados'] = String(regs.length)
    } catch {
      out['workers desregistrados'] = 'nao'
    }

    // 3) Apaga os caches
    try {
      const chaves = await caches.keys()
      for (const k of chaves) await caches.delete(k)
      out['caches apagados'] = String(chaves.length)
    } catch {
      out['caches apagados'] = 'nao'
    }

    // 4) Apaga o IndexedDB do OneSignal (é onde fica o id antigo que ele devolve)
    try {
      const dbs = (await indexedDB.databases?.()) || []
      let n = 0
      for (const d of dbs) {
        if (d.name && /onesignal/i.test(d.name)) {
          indexedDB.deleteDatabase(d.name)
          n++
        }
      }
      out['banco do SDK apagado'] = String(n)
    } catch {
      out['banco do SDK apagado'] = 'nao foi possivel listar'
    }

    // 5) Marca todas as inscrições do usuário como inativas
    try {
      const usuarioId = pb.authStore.model?.id ?? ''
      if (usuarioId) {
        const minhas = await pb
          .collection('inscricoes_push')
          .getFullList({ filter: `usuario = "${usuarioId}" && ativa = true` })
          .catch(() => [])
        for (const a of minhas) {
          await pb
            .collection('inscricoes_push')
            .update(a.id, { ativa: false })
            .catch(() => null)
        }
        out['inscricoes no servidor desativadas'] = String(minhas.length)
      }
    } catch {
      out['inscricoes no servidor desativadas'] = 'nao'
    }

    out['estado'] = 'LIMPO — recarregando o app para criar a inscrição do zero'
    return out
  },

  async desativar(usuarioId: string): Promise<void> {
    try {
      await window.OneSignal?.User.PushSubscription.optOut()
    } catch {
      /* segue para desativar no servidor */
    }
    const minhas = await pb
      .collection('inscricoes_push')
      .getFullList({ filter: `usuario = "${usuarioId}" && ativa = true` })
      .catch(() => [])
    for (const a of minhas) {
      await pb
        .collection('inscricoes_push')
        .update(a.id, { ativa: false })
        .catch(() => null)
    }
  },

  async ativo(usuarioId: string): Promise<boolean> {
    const n = await pb
      .collection('inscricoes_push')
      .getList(1, 1, { filter: `usuario = "${usuarioId}" && ativa = true` })
      .catch(() => null)
    return (n?.totalItems ?? 0) > 0
  },

  /** Diagnóstico do aparelho — mostra ao usuário, em vez de deixar no escuro. */
  diagnostico(): Record<string, string> {
    const nav = window.navigator as Navigator & { standalone?: boolean }
    const os = window.OneSignal
    const ios = ehIOS()
    const inst = estaInstalado()
    let perm = 'indefinido'
    try {
      perm = Notification.permission
    } catch {
      perm = 'sem Notification'
    }
    return {
      aparelho: ios ? 'iPhone/iPad' : 'outro',
      'aberto pelo icone': inst ? 'sim' : 'nao (aba do navegador)',
      'Notification existe': 'Notification' in window ? 'sim' : 'nao',
      serviceWorker: 'serviceWorker' in navigator ? 'sim' : 'nao',
      'permissao do sistema': perm,
      'SDK carregado': os ? 'sim' : 'nao',
      'inscricao OneSignal': os?.User?.PushSubscription?.id ? 'existe' : 'sem inscricao',
      'iOS 16.4+ exige': 'icone na Tela de Inicio, aberto por ele',
    }
  },

  /**
   * Estado completo do push no aparelho, lido do NAVEGADOR (não do SDK).
   *
   * POR QUE ISSO EXISTE (01/11 21:50): o servidor guarda a inscrição 376e35a7, o
   * OneSignal aceita o envio (successful=1) e nada aparece na tela. Para saber onde a
   * notificação morre é preciso ver, no próprio aparelho, QUAIS service workers estão
   * registrados e QUAL deles tem uma inscrição de push ativa. Sem esse dado, qualquer
   * correção é chute — e já queimei duas rodadas de teste assim.
   * `pushManager.getSubscription()` devolve a inscrição daquele escopo: é o que diz se
   * o worker novo (/push/onesignal/) realmente recebe push ou se a inscrição viva
   * continua presa no worker antigo da raiz.
   */
  async estadoCompleto(): Promise<Record<string, string>> {
    const out: Record<string, string> = {}
    out['aberto pelo icone'] = estaInstalado() ? 'sim' : 'nao'
    try {
      out['permissao do sistema'] = Notification.permission
    } catch {
      out['permissao do sistema'] = 'indisponivel'
    }
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      out['quantos service workers'] = String(regs.length)
      for (let i = 0; i < regs.length; i++) {
        const r = regs[i]
        const ativo = r.active || r.waiting || r.installing
        const script = (ativo?.scriptURL || '(nenhum ativo)').replace(location.origin, '')
        let push = 'nao'
        let fim = ''
        try {
          const ps = await r.pushManager.getSubscription()
          if (ps) {
            push = 'SIM'
            fim = ' …' + ps.endpoint.slice(-18)
          }
        } catch (err) {
          push = 'erro'
        }
        out['sw ' + (i + 1)] =
          'escopo=' +
          r.scope.replace(location.origin, '') +
          ' script=' +
          script +
          ' push=' +
          push +
          fim
      }
    } catch (e: unknown) {
      out['service workers'] = 'erro: ' + String((e as { message?: string })?.message ?? e)
    }
    try {
      const appId = await this.appId()
      const os = await carregarSDK(appId)
      out['id no SDK'] = os.User.PushSubscription.id || '(vazio)'
    } catch (e: unknown) {
      out['id no SDK'] = 'erro: ' + String((e as { message?: string })?.message ?? e)
    }
    return out
  },

  /**
   * Lê o ID da inscrição DIRETO DO APARELHO e compara com o que o servidor guarda.
   * Diferente de `diagnostico()`, que só diz "existe/sem inscrição" lendo o SDK já
   * carregado — sinal que dá o mesmo resultado numa abertura nova, mesmo funcionando.
   * Aqui o SDK é carregado na hora, então o dado é real.
   */
  async idDoAparelho(usuarioId: string): Promise<Record<string, string>> {
    const out: Record<string, string> = {}
    const appId = await this.appId()
    if (!appId) {
      out.erro = 'O servidor não devolveu o App ID.'
      return out
    }
    out['aberto pelo icone'] = estaInstalado() ? 'sim' : 'nao (aba do navegador)'
    try {
      out['permissao do sistema'] = Notification.permission
    } catch {
      out['permissao do sistema'] = 'indisponivel'
    }
    let subId = ''
    try {
      const os = await carregarSDK(appId)
      subId = os.User.PushSubscription.id ?? ''
      out['id no aparelho'] = subId || '(vazio — o aparelho nao tem inscricao)'
    } catch (e: unknown) {
      out.erro =
        'Nao consegui carregar o servico de avisos: ' +
        String((e as { message?: string })?.message ?? e)
      return out
    }
    const ativas = await pb
      .collection('inscricoes_push')
      .getFullList({ filter: `usuario = "${usuarioId}" && ativa = true` })
      .catch(() => [])
    const doServidor = ativas.map((a) => String(a.id_inscricao))
    out['id no servidor'] = doServidor.length ? doServidor.join(' | ') : '(nenhum ativo)'
    out['os dois batem?'] =
      subId && doServidor.indexOf(subId) >= 0
        ? 'SIM'
        : 'NAO — o servidor esta enviando para outro identificador'
    if (subId && doServidor.indexOf(subId) < 0) {
      out['o que fazer'] =
        'Toque em "Ativar avisos no celular" para o servidor passar a usar este identificador.'
    }
    return out
  },

  /** Estado que a tela usa para explicar por que não dá no navegador atual. */
  podeAtivar(): { ok: boolean; motivo: string } {
    if (ehIOS() && !estaInstalado()) {
      return {
        ok: false,
        motivo:
          'No iPhone, os avisos só funcionam com o app na Tela de Início (Compartilhar → Adicionar à Tela de Início) aberto por esse ícone.',
      }
    }
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return { ok: false, motivo: 'Este navegador não aceita avisos. Use o app na tela inicial.' }
    }
    return { ok: true, motivo: '' }
  },
}
