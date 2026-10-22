// SPEC-1-004 (task 4da366fe) — fila offline e cópia de consulta em IndexedDB NATIVO
// (decisão da SPEC: sem biblioteca nova). Stores:
//   fila  — itens de criação aguardando envio (RN-22: só sai após confirmação do servidor)
//   cache — cópia de consulta da empresa ativa (produtores, oportunidades, linhas, data)
// Regras: a fila pertence ao usuário que criou (RN-25); envio na ordem das dependências
// (RN-23); idempotência pelo id_local único no servidor (índices das migrações 0011/0021/0022).
import pb from '@/lib/pocketbase/client'

const DB_NAME = 'agrospy-offline'
const DB_VERSION = 1
const STORE_FILA = 'fila'
const STORE_CACHE = 'cache'

export type ColecaoFila =
  | 'produtores'
  | 'propriedades'
  | 'visitas'
  | 'oportunidades'
  | 'acoes_oportunidade'

export interface ItemFila {
  id_local: string
  colecao: ColecaoFila
  dados: Record<string, unknown>
  depende_de?: string
  usuario: string
  empresa: string
  criado_em_aparelho: string
  estado: 'pendente' | 'enviando' | 'precisa_revisao'
  motivo?: string
  tentativas: number
}

/** Ordem de envio das dependências (RN-23). */
const ORDEM: ColecaoFila[] = [
  'produtores',
  'propriedades',
  'visitas',
  'oportunidades',
  'acoes_oportunidade',
]

const abrir = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_FILA)) {
        const s = db.createObjectStore(STORE_FILA, { keyPath: 'id_local' })
        s.createIndex('usuario', 'usuario')
        s.createIndex('estado', 'estado')
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE)
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

export const filaOffline = {
  novoIdLocal(): string {
    if (crypto.randomUUID) return crypto.randomUUID()
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
  },

  /** Enfileira uma criação offline (RN-21: só criação). */
  async enfileirar(
    colecao: ColecaoFila,
    dados: Record<string, unknown>,
    usuario: string,
    empresa: string,
    depende_de?: string,
  ): Promise<ItemFila> {
    // id calculado UMA vez (antes, dois chamados geravam ids diferentes entre a chave
    // e o payload — quebrava a idempotência no reenvio).
    const id = String(dados.id_local ?? this.novoIdLocal())
    const item: ItemFila = {
      id_local: id,
      colecao,
      // empresa vai no payload: sem ela o servidor recusa a criação do registro.
      dados: { ...dados, id_local: id, empresa },
      depende_de,
      usuario,
      empresa,
      criado_em_aparelho: new Date().toISOString(),
      estado: 'pendente',
      tentativas: 0,
    }
    await comStore(
      STORE_FILA,
      'readwrite',
      (s) => s.put(item) as unknown as IDBRequest<IDBValidKey>,
    )
    return item
  },

  /** Itens do usuário (RN-25) — pendentes e em revisão. */
  async pendentes(usuario: string): Promise<ItemFila[]> {
    const todos = await comStore<ItemFila[]>(
      STORE_FILA,
      'readonly',
      (s) => s.getAll() as IDBRequest<ItemFila[]>,
    )
    return todos.filter((i) => i.usuario === usuario && i.estado !== 'precisa_revisao')
  },

  /** Itens em `precisa_revisao` do usuário, para a tela de pendências. */
  async emRevisao(usuario: string): Promise<ItemFila[]> {
    const todos = await comStore<ItemFila[]>(
      STORE_FILA,
      'readonly',
      (s) => s.getAll() as IDBRequest<ItemFila[]>,
    )
    return todos.filter((i) => i.usuario === usuario && i.estado === 'precisa_revisao')
  },

  /** Contagem de pendentes do usuário (indicador do topo). */
  async contarPendentes(usuario: string): Promise<number> {
    return (await this.pendentes(usuario)).length
  },

  /** Descarte com confirmação do usuário (RN-22 — só itens em revisão). */
  async descartar(id_local: string, usuario: string): Promise<void> {
    const item = await comStore<ItemFila | undefined>(
      STORE_FILA,
      'readonly',
      (s) => s.get(id_local) as IDBRequest<ItemFila | undefined>,
    )
    if (item && item.usuario === usuario) {
      await comStore(
        STORE_FILA,
        'readwrite',
        (s) => s.delete(id_local) as unknown as IDBRequest<undefined>,
      )
    }
  },

  /** Volta um item em revisão para a fila de envio (botão "Tentar de novo"). */
  async reencaminhar(id_local: string, usuario: string): Promise<void> {
    const item = await comStore<ItemFila | undefined>(
      STORE_FILA,
      'readonly',
      (s) => s.get(id_local) as IDBRequest<ItemFila | undefined>,
    )
    if (item && item.usuario === usuario) {
      item.estado = 'pendente'
      item.tentativas = 0
      await comStore(
        STORE_FILA,
        'readwrite',
        (s) => s.put(item) as unknown as IDBRequest<IDBValidKey>,
      )
    }
  },

  /** Sincroniza a fila do usuário: ordem das dependências, id_local trocado pelo id real.
   * Devolve { enviados, revisao } para o indicador. */
  async sincronizar(
    usuario: string,
    empresa: string,
  ): Promise<{ enviados: number; revisao: number }> {
    const itens = await this.pendentes(usuario)
    const idsServidor = new Map<string, string>() // id_local → id do servidor
    let enviados = 0
    let revisao = 0

    for (const colecao of ORDEM) {
      const doTipo = itens.filter((i) => i.colecao === colecao)
      for (const item of doTipo) {
        // Pai ainda não resolvido → espera o próximo gatilho (RN-23).
        if (item.depende_de && !idsServidor.has(item.depende_de)) continue

        // Substitui referências locais pelos ids do servidor; empresa sempre do item
        // (resgata itens antigos enfileirados sem empresa).
        const payload: Record<string, unknown> = { ...item.dados, empresa: item.empresa }
        if (item.depende_de) {
          const paiCampo = this.campoPai(colecao)
          if (paiCampo) payload[paiCampo] = idsServidor.get(item.depende_de)
        }

        try {
          // Idempotência: se o id_local já existe no servidor, trata como enviado.
          const existente = await pb
            .collection(colecao)
            .getFirstListItem(`id_local = "${item.id_local}"`)
            .catch(() => null)
          if (existente) {
            idsServidor.set(item.id_local, existente.id)
          } else {
            const criado = await pb.collection(colecao).create(payload)
            idsServidor.set(item.id_local, criado.id)
          }
          await comStore(
            STORE_FILA,
            'readwrite',
            (s) => s.delete(item.id_local) as unknown as IDBRequest<undefined>,
          )
          enviados++
        } catch (e: unknown) {
          const status = (e as { status?: number })?.status ?? 0
          if (status === 401) {
            // Sessão expirada: mantém pendente; o app pede login (CA-1-18).
            item.tentativas++
            continue
          }
          if (status === 0) {
            // Rede caiu no meio do envio: continua pendente (não marca revisão).
            item.tentativas++
            continue
          }
          // Motivo claro por tipo de falha (f5877532: nada se perde em silêncio).
          const detalhes = (e as { response?: { data?: Record<string, { message?: string }> } })
            ?.response?.data
          const campo = detalhes
            ? Object.entries(detalhes)
                .map(([k, v]) => `${k}: ${v?.message ?? 'inválido'}`)
                .join('; ')
            : ''
          item.estado = 'precisa_revisao'
          item.motivo =
            campo ||
            (e as { response?: { message?: string } })?.response?.message ||
            (status === 403 || status === 404
              ? 'Sem permissão para enviar este registro.'
              : 'Registro recusado pelo servidor.')
          await comStore(
            STORE_FILA,
            'readwrite',
            (s) => s.put(item) as unknown as IDBRequest<IDBValidKey>,
          )
          revisao++
        }
      }
    }
    return { enviados, revisao }
  },

  /** Campo que aponta para o pai, por coleção (RN-23). */
  campoPai(colecao: ColecaoFila): string | null {
    switch (colecao) {
      case 'propriedades':
        return 'produtor'
      case 'visitas':
        return 'produtor'
      case 'oportunidades':
        return 'visita_origem'
      case 'acoes_oportunidade':
        return 'oportunidade'
      default:
        return null
    }
  },

  // ---------- Cópia de consulta (CA-1-15) ----------
  async cacheSalvar(chave: string, valor: unknown): Promise<void> {
    await comStore(
      STORE_CACHE,
      'readwrite',
      (s) => s.put(valor, chave) as unknown as IDBRequest<IDBValidKey>,
    )
  },

  async cacheLer<T>(chave: string): Promise<T | null> {
    try {
      const v = await comStore<T | undefined>(
        STORE_CACHE,
        'readonly',
        (s) => s.get(chave) as IDBRequest<T | undefined>,
      )
      return v ?? null
    } catch {
      return null
    }
  },

  /** Apaga a cópia local (troca de empresa ou sair — RN-05). */
  async cacheLimpar(): Promise<void> {
    const db = await abrir()
    const tx = db.transaction(STORE_CACHE, 'readwrite')
    tx.objectStore(STORE_CACHE).clear()
    tx.oncomplete = () => db.close()
  },

  async marcarUltimaSincronizacao(): Promise<void> {
    await this.cacheSalvar('ultima_sincronizacao', new Date().toISOString())
  },

  /** CA-1-15 — atualiza a cópia de consulta (produtores, oportunidades abertas do usuário,
   * linhas de negócio) para leitura offline. Chamada quando o app abre com internet. */
  async atualizarCache(empresaId: string, usuarioId: string): Promise<void> {
    const [produtores, oportunidades, linhas] = await Promise.all([
      pb.collection('produtores').getFullList({
        filter: `empresa = "${empresaId}"`,
        sort: 'nome',
      }),
      pb.collection('oportunidades').getFullList({
        filter: `empresa = "${empresaId}" && responsavel = "${usuarioId}" && situacao = "aberta"`,
        sort: 'proxima_acao_data',
      }),
      pb.collection('linhas_negocio').getFullList({
        filter: `empresa = "${empresaId}" && ativa = true`,
        sort: 'nome',
      }),
    ])
    await this.cacheSalvar('produtores', produtores)
    await this.cacheSalvar('oportunidades_abertas', oportunidades)
    await this.cacheSalvar('linhas_negocio', linhas)
    await this.marcarUltimaSincronizacao()
  },

  async ultimaSincronizacao(): Promise<string | null> {
    return this.cacheLer<string>('ultima_sincronizacao')
  },
}
