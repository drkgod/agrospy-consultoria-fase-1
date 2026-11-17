// FASE 2 — SPEC-2-002 (task bdca5efe): serviço dos avisos.
// O servidor entrega só os avisos do usuário logado (regras da 0040); este serviço só
// organiza a leitura e marca como lido.
import pb from '@/lib/pocketbase/client'

export interface Aviso {
  id: string
  empresa: string
  destinatario: string
  oportunidade: string
  tipo: 'do_dia' | 'atraso' | 'copia_gestor'
  referencia_data: string
  texto_curto: string
  detalhe: string
  lido_em: string
  envio: 'pendente' | 'enviado' | 'sem_inscricao' | 'falhou_envio'
  created: string
  expand?: {
    oportunidade?: { id: string; descricao: string; proxima_acao: string; produtor: string }
  }
}

export const avisosService = {
  /** Avisos do usuário, mais novos primeiro. */
  async listar(): Promise<Aviso[]> {
    return await pb.collection('avisos').getFullList({ sort: '-created', expand: 'oportunidade' })
  },

  /** Contador do topo: não lidos. */
  async contarNaoLidos(): Promise<number> {
    try {
      const r = await pb.collection('avisos').getList(1, 1, { filter: 'lido_em = ""' })
      return r.totalItems
    } catch {
      return 0
    }
  },

  async marcarLido(id: string): Promise<void> {
    await pb.collection('avisos').update(id, { lido_em: new Date().toISOString() })
  },

  async marcarTodosLidos(ids: string[]): Promise<void> {
    const agora = new Date().toISOString()
    for (const id of ids) {
      await pb.collection('avisos').update(id, { lido_em: agora })
    }
  },
}
