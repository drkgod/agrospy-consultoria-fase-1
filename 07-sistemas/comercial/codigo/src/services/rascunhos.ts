// FASE 2 — SPEC-2-001 (task 0b522b2b): fila de rascunhos do pós-visita.
// A tela mostra os rascunhos que o servidor entrega (regras da migração 0039): cada
// pessoa vê só os próprios; Gestão e Administrador veem os da empresa; a outra empresa
// nunca vê. O Operador não tem acesso (RN-35).
import pb from '@/lib/pocketbase/client'

export interface Rascunho {
  id: string
  empresa: string
  autor: string
  origem: 'app_audio' | 'app_texto' | 'arquivo_gravador' | 'drive'
  midia: string
  texto_original: string
  chave_dedup: string
  hash_conteudo: string
  id_local: string
  criado_em_aparelho: string
  status:
    | 'recebido'
    | 'aguardando_transcricao'
    | 'transcrevendo'
    | 'pronto_para_revisar'
    | 'confirmado'
    | 'descartado'
    | 'falhou'
  transcricao: string
  proposta: PropostaRascunho | null
  produtor: string
  motivo_falha: string
  tentativas: number
  visita_criada: string
  confirmado_por: string
  confirmado_em: string
  created: string
  expand?: { produtor?: { id: string; nome: string; municipio: string } }
}

export interface PropostaRascunho {
  produtor?: string
  propriedade?: string
  data?: string
  assuntos_tratados?: string
  destino?: 'nova_oportunidade' | 'oportunidade_atualizada' | 'sem_oportunidade'
  oportunidades?: Array<{
    linha_negocio?: string
    descricao?: string
    proxima_acao?: string
    proxima_acao_data?: string
  }>
  oportunidade?: string
  resultado?: string
  nova_acao?: string
  nova_data?: string
  motivo_sem_oportunidade?: string
  campos_incertos?: string[]
}

export const ROTULO_STATUS: Record<string, string> = {
  recebido: 'Recebido',
  aguardando_transcricao: 'Aguardando transcrição',
  transcrevendo: 'Transcrevendo…',
  pronto_para_revisar: 'Pronto para revisar',
  confirmado: 'Confirmado',
  descartado: 'Descartado',
  falhou: 'Falhou',
}

export const rascunhosService = {
  /** Rascunhos que o servidor permite ver (regras da 0039), mais recentes primeiro. */
  async listar(): Promise<Rascunho[]> {
    return await pb.collection('rascunhos').getFullList({
      sort: '-created',
      expand: 'produtor',
    })
  },

  /** Contador do topo: quantos esperam revisão. */
  async contarParaRevisar(): Promise<number> {
    try {
      const r = await pb.collection('rascunhos').getList(1, 1, {
        filter: 'status = "pronto_para_revisar"',
      })
      return r.totalItems
    } catch {
      return 0
    }
  },

  async buscar(id: string): Promise<Rascunho> {
    return await pb.collection('rascunhos').getOne(id, { expand: 'produtor' })
  },

  /** Descarta: pede confirmação na tela; não entra no histórico (RN-32). */
  async descartar(id: string): Promise<void> {
    await pb.send(`/backend/v1/rascunhos/${id}/descartar`, { method: 'POST', body: {} })
  },

  /** "Tentar de novo" do rascunho `falhou`: zera tentativas e volta para a fila. */
  async retomar(id: string): Promise<void> {
    await pb.send(`/backend/v1/rascunhos/${id}/retomar`, { method: 'POST', body: {} })
  },

  /** Reprocessa agora (transcrição + proposta), sem esperar a rotina. */
  async processar(id: string): Promise<{ status?: string; erro?: string }> {
    return await pb.send(`/backend/v1/rascunhos/${id}/processar`, { method: 'POST', body: {} })
  },
}
