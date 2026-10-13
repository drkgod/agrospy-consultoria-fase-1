import pb from '@/lib/pocketbase/client'

export const POSSES: { value: string; label: string }[] = [
  { value: 'propria', label: 'Própria' },
  { value: 'arrendada', label: 'Arrendada' },
  { value: 'mista', label: 'Mista' },
  { value: 'nao_informado', label: 'Não informado' },
]

export interface Propriedade {
  id: string
  empresa: string
  produtor: string
  nome: string
  municipio: string
  area_ha: number
  posse: string
  endereco_referencia: string
  latitude: number
  longitude: number
  link_maps: string
}

export const propriedadesService = {
  async listarDoProdutor(produtorId: string): Promise<Propriedade[]> {
    return await pb.collection('propriedades').getFullList({
      filter: `produtor = "${produtorId}"`,
      sort: 'nome',
    })
  },

  async criar(dados: Partial<Propriedade>, empresaId: string): Promise<Propriedade> {
    return await pb.collection('propriedades').create({ ...dados, empresa: empresaId })
  },

  async atualizar(id: string, dados: Partial<Propriedade>): Promise<Propriedade> {
    return await pb.collection('propriedades').update(id, dados)
  },

  async excluir(id: string): Promise<void> {
    await pb.collection('propriedades').delete(id)
  },
}
