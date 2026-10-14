import pb from '@/lib/pocketbase/client'

export interface Visita {
  id: string
  empresa: string
  produtor: string
  propriedade: string
  data: string
  responsavel_visita: string
  acompanhantes: string
  assuntos_tratados: string
  estrutura_existente: string
  perfil_tecnologico: string
  nivel_investimento: string
  maquinas: string
  area_potencial: string
  necessidades: string
  acordos: string
  destino: string
  motivo_sem_oportunidade: string
  audio: string
  expand?: { responsavel_visita?: { id: string; name: string; email: string } }
}

export const visitasService = {
  async listarDoProdutor(produtorId: string): Promise<Visita[]> {
    return await pb.collection('visitas').getFullList({
      filter: `produtor = "${produtorId}"`,
      sort: '-data',
      expand: 'responsavel_visita',
    })
  },

  async criar(dados: Partial<Visita>, empresaId: string): Promise<Visita> {
    return await pb.collection('visitas').create({ ...dados, empresa: empresaId })
  },

  async criarComFormData(fd: FormData): Promise<Visita> {
    return await pb.collection('visitas').create(fd)
  },

  urlDoAudio(v: Visita): string {
    return pb.files.getURL(v, v.audio)
  },
}
