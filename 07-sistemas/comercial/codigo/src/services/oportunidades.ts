import pb from '@/lib/pocketbase/client'

export interface Oportunidade {
  id: string
  empresa: string
  produtor: string
  linha_negocio: string
  descricao: string
  responsavel: string
  situacao: string
  proxima_acao: string
  proxima_acao_data: string
  visita_origem: string
  expand?: {
    responsavel?: { id: string; name: string; email: string }
    linha_negocio?: { id: string; nome: string }
  }
}

export interface DadosAcao {
  oportunidade: string
  tipo: 'concluida' | 'reagendada'
  resultado?: string
  nova_acao: string
  nova_data: string
}

export const oportunidadesService = {
  async listarDoProdutor(produtorId: string): Promise<Oportunidade[]> {
    return await pb.collection('oportunidades').getFullList({
      filter: `produtor = "${produtorId}"`,
      sort: '-proxima_acao_data',
      expand: 'responsavel,linha_negocio',
    })
  },

  async listarAbertasDoProdutor(produtorId: string): Promise<Oportunidade[]> {
    return await pb.collection('oportunidades').getFullList({
      filter: `produtor = "${produtorId}" && situacao = "aberta"`,
      sort: '-proxima_acao_data',
      expand: 'responsavel,linha_negocio',
    })
  },

  async criar(dados: Partial<Oportunidade>, empresaId: string): Promise<Oportunidade> {
    return await pb
      .collection('oportunidades')
      .create({ ...dados, empresa: empresaId, situacao: 'aberta' })
  },

  async registrarAcao(dados: DadosAcao, empresaId: string) {
    return await pb.collection('acoes_oportunidade').create({ ...dados, empresa: empresaId })
  },
}
