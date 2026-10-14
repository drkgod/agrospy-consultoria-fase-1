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

  async listarTodas(empresaId: string): Promise<LinhaNegocio[]> {
    return await pb.collection('linhas_negocio').getFullList({
      filter: `empresa = "${empresaId}"`,
      sort: '-ativa,nome',
    })
  },

  async criar(nome: string, empresaId: string): Promise<LinhaNegocio> {
    return await pb.collection('linhas_negocio').create({
      empresa: empresaId,
      nome: nome.trim(),
      ativa: true,
      fixa: false,
    })
  },

  async renomear(id: string, nome: string): Promise<LinhaNegocio> {
    return await pb.collection('linhas_negocio').update(id, { nome: nome.trim() })
  },

  async definirAtiva(id: string, ativa: boolean): Promise<LinhaNegocio> {
    return await pb.collection('linhas_negocio').update(id, { ativa })
  },
}
