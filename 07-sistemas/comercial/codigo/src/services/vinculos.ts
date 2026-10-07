import pb from '@/lib/pocketbase/client'

export interface Vinculo {
  id: string
  usuario: string
  empresa: string
  perfil: 'administrador' | 'gestao' | 'comercial' | 'operador'
  ativo: boolean
  nome_exibicao: string
  expand?: {
    empresa?: {
      id: string
      nome: string
      slug: string
      cor_primaria: string
      logo: string
      ativa: boolean
    }
  }
}

export const vinculosService = {
  async listarDoUsuario(): Promise<Vinculo[]> {
    const userId = pb.authStore.record?.id
    if (!userId) return []
    return await pb.collection('vinculos').getFullList({
      filter: `usuario = "${userId}" && ativo = true`,
      expand: 'empresa',
    })
  },

  async temVinculoAtivo(): Promise<boolean> {
    const lista = await this.listarDoUsuario()
    return lista.length > 0
  },
}