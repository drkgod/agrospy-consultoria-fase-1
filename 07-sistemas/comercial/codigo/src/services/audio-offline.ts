// FASE 2 — SPEC-2-001 (task 6b4bcbde): gravação do pós-visita sem internet.
// A fila da fase 1 (fila-offline.ts) guarda JSON no IndexedDB. Áudio é binário, então
// este serviço guarda o Blob num store próprio e mantém o item da fila apontando para
// ele por id_local. Ao reconectar, o item sobe UMA vez: a chave é o id_local e, se a
// rede cair no meio, o hash_conteudo impede um segundo rascunho do mesmo áudio.
import pb from '@/lib/pocketbase/client'

const DB_NAME = 'agrospy-offline'
const DB_VERSION = 2 // 1 = fila/cache da fase 1; 2 acrescenta o store de áudio
const STORE_AUDIO = 'audio'
const STORE_FILA_AUDIO = 'fila_audio'

export interface AudioPendente {
  id_local: string
  empresa: string
  autor: string
  nome_arquivo: string
  hash_conteudo: string
  criado_em_aparelho: string
  produtor?: string
  estado: 'aguardando_envio' | 'enviando' | 'falhou'
  tentativas: number
  motivo?: string
}

const abrir = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      // Cria o que faltar (o upgrade da fase 1 pode já ter rodado).
      if (!db.objectStoreNames.contains('fila')) {
        const s = db.createObjectStore('fila', { keyPath: 'id_local' })
        s.createIndex('usuario', 'usuario')
        s.createIndex('estado', 'estado')
      }
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache')
      }
      if (!db.objectStoreNames.contains(STORE_AUDIO)) {
        db.createObjectStore(STORE_AUDIO) // chave = id_local, valor = Blob
      }
      if (!db.objectStoreNames.contains(STORE_FILA_AUDIO)) {
        const f = db.createObjectStore(STORE_FILA_AUDIO, { keyPath: 'id_local' })
        f.createIndex('autor', 'autor')
        f.createIndex('estado', 'estado')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

const comStore = async <T>(
  store: string,
  modo: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
  const db = await abrir()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, modo)
    const req = fn(tx.objectStore(store))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

/** SHA-256 em base64 — a mesma regra do hash_conteudo do servidor (RN-33). */
const hashBase64 = async (blob: Blob): Promise<string> => {
  const buf = await blob.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buf)
  const bytes = new Uint8Array(digest)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

export const audioOffline = {
  novoIdLocal(): string {
    if (crypto.randomUUID) return crypto.randomUUID()
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
  },

  /** Guarda a gravação no aparelho (RN-34): nada sai até haver internet. */
  async guardar(
    blob: Blob,
    autor: string,
    empresa: string,
    produtor?: string,
  ): Promise<AudioPendente> {
    const id = this.novoIdLocal()
    const item: AudioPendente = {
      id_local: id,
      empresa,
      autor,
      nome_arquivo: 'pos-visita-' + id.slice(0, 8) + '.m4a',
      hash_conteudo: await hashBase64(blob),
      criado_em_aparelho: new Date().toISOString(),
      produtor,
      estado: 'aguardando_envio',
      tentativas: 0,
    }
    await comStore(
      STORE_AUDIO,
      'readwrite',
      (s) => s.put(blob, id) as unknown as IDBRequest<IDBValidKey>,
    )
    await comStore(
      STORE_FILA_AUDIO,
      'readwrite',
      (s) => s.put(item) as unknown as IDBRequest<IDBValidKey>,
    )
    return item
  },

  /** Gravações do usuário esperando envio (RN-25: a fila é de quem gravou). */
  async pendentes(autor: string): Promise<AudioPendente[]> {
    const todos = await comStore<AudioPendente[]>(
      STORE_FILA_AUDIO,
      'readonly',
      (s) => s.getAll() as IDBRequest<AudioPendente[]>,
    )
    return todos.filter((i) => i.autor === autor)
  },

  async contarPendentes(autor: string): Promise<number> {
    return (await this.pendentes(autor)).length
  },

  async descartar(idLocal: string, autor: string): Promise<void> {
    const item = await comStore<AudioPendente | undefined>(
      STORE_FILA_AUDIO,
      'readonly',
      (s) => s.get(idLocal) as IDBRequest<AudioPendente | undefined>,
    )
    if (!item || item.autor !== autor) return
    await comStore(
      STORE_AUDIO,
      'readwrite',
      (s) => s.delete(idLocal) as unknown as IDBRequest<undefined>,
    )
    await comStore(
      STORE_FILA_AUDIO,
      'readwrite',
      (s) => s.delete(idLocal) as unknown as IDBRequest<undefined>,
    )
  },

  /**
   * Sobe o que está pendente, uma vez só (CA-2-01).
   * Usa o mesmo id_local como chave_dedup: se já subiu, o servidor devolve o rascunho
   * existente em vez de criar outro. Se a rede cair no meio, o item continua na fila.
   */
  async sincronizar(autor: string): Promise<{ enviados: number; falhas: number }> {
    const itens = await this.pendentes(autor)
    let enviados = 0
    let falhas = 0

    for (const item of itens) {
      if (item.estado === 'enviando') continue
      const blob = await comStore<Blob | undefined>(
        STORE_AUDIO,
        'readonly',
        (s) => s.get(item.id_local) as IDBRequest<Blob | undefined>,
      )
      if (!blob) {
        // Sem o áudio, o item não tem como subir: remove para não travar a fila.
        await comStore(
          STORE_FILA_AUDIO,
          'readwrite',
          (s) => s.delete(item.id_local) as unknown as IDBRequest<undefined>,
        )
        continue
      }

      // Marca enviando (evita subir duas vezes com dois gatilhos simultâneos).
      item.estado = 'enviando'
      await comStore(
        STORE_FILA_AUDIO,
        'readwrite',
        (s) => s.put(item) as unknown as IDBRequest<IDBValidKey>,
      )

      try {
        // Já existe? (reenvio depois de queda de rede) — não cria outro.
        const existente = await pb
          .collection('rascunhos')
          .getFirstListItem(`chave_dedup = "${item.id_local}"`)
          .catch(() => null)
        let idRascunho = existente?.id ?? ''
        if (!idRascunho) {
          const form = new FormData()
          form.append('empresa', item.empresa)
          form.append('autor', item.autor)
          form.append('origem', 'app_audio')
          form.append('chave_dedup', item.id_local)
          form.append('id_local', item.id_local)
          form.append('hash_conteudo', item.hash_conteudo)
          form.append('criado_em_aparelho', item.criado_em_aparelho)
          if (item.produtor) form.append('produtor', item.produtor)
          form.append('midia', blob, item.nome_arquivo)
          const criado = await pb.collection('rascunhos').create(form)
          idRascunho = criado.id
        }
        // Processa (transcrição + proposta). Falha aqui não perde o áudio: a rotina
        // de 10 minutos reprocessa o rascunho.
        await pb
          .send(`/backend/v1/rascunhos/${idRascunho}/processar`, { method: 'POST', body: {} })
          .catch(() => null)

        await comStore(
          STORE_AUDIO,
          'readwrite',
          (s) => s.delete(item.id_local) as unknown as IDBRequest<undefined>,
        )
        await comStore(
          STORE_FILA_AUDIO,
          'readwrite',
          (s) => s.delete(item.id_local) as unknown as IDBRequest<undefined>,
        )
        enviados++
      } catch (e: unknown) {
        const status = (e as { status?: number })?.status ?? 0
        // 409 = a mesma gravação já foi enviada (chave_dedup/hash): trata como enviado
        // e limpa da fila — não cria segundo rascunho (RN-33/CA-2-05).
        if (status === 409) {
          await comStore(
            STORE_AUDIO,
            'readwrite',
            (s) => s.delete(item.id_local) as unknown as IDBRequest<undefined>,
          )
          await comStore(
            STORE_FILA_AUDIO,
            'readwrite',
            (s) => s.delete(item.id_local) as unknown as IDBRequest<undefined>,
          )
          enviados++
          continue
        }
        item.tentativas++
        item.estado = 'falhou'
        item.motivo =
          status === 401
            ? 'Sessão expirada. Entre de novo para enviar.'
            : status === 0
              ? 'Sem internet. Vai enviar quando a conexão voltar.'
              : 'Não foi possível enviar. Tente de novo.'
        await comStore(
          STORE_FILA_AUDIO,
          'readwrite',
          (s) => s.put(item) as unknown as IDBRequest<IDBValidKey>,
        )
        if (status === 0) break // sem rede: para e tenta de novo no próximo gatilho
        falhas++
      }
    }
    return { enviados, falhas }
  },
}
