import pb from '@/lib/pocketbase/client'

export interface LinhaNegocio {
  id: string
  empresa: string
  nome: string
  ativa: boolean
  fixa: boolean
}

export const linhasNegocioService = {
  async listarAtivas(empresaId: string): Promise<LinhaNegocio[]> {
    return await pb.collection('linhas_negocio').getFullList({
      filter: `empresa = "${empresaId}" && ativa = true`,
      sort: 'nome',
    })
  },
}
