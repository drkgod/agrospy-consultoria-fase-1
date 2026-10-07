import pb from '@/lib/pocketbase/client'

export interface Empresa {
  id: string
  nome: string
  slug: string
  cor_primaria: string
  logo: string
  ativa: boolean
}

const ACTIVE_KEY = 'agrospy_empresa_ativa'

export const empresasService = {
  /** Empresas com vínculo ativo do usuário logado (para a escolha). */
  async listarDoUsuario(): Promise<Empresa[]> {
    const userId = pb.authStore.record?.id
    if (!userId) return []
    const vinculos = await pb.collection('vinculos').getFullList({
      filter: `usuario = "${userId}" && ativo = true`,
      expand: 'empresa',
    })
    return vinculos
      .map((v) => v.expand?.empresa as Empresa | undefined)
      .filter((e): e is Empresa => !!e && e.ativa)
  },

  /** Todas as empresas ativas (uso interno/administrativo). */
  async listarAtivas(): Promise<Empresa[]> {
    return await pb.collection('empresas').getFullList({
      filter: 'ativa = true',
      sort: 'nome',
    })
  },

  getAtiva(): Empresa | null {
    try {
      const raw = localStorage.getItem(ACTIVE_KEY)
      return raw ? (JSON.parse(raw) as Empresa) : null
    } catch {
      return null
    }
  },

  setAtiva(empresa: Empresa | null) {
    if (empresa) {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(empresa))
    } else {
      localStorage.removeItem(ACTIVE_KEY)
    }
  },
}