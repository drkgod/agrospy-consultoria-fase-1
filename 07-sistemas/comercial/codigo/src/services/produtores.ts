import pb from '@/lib/pocketbase/client'

export const ORIGENS: { value: string; label: string }[] = [
  { value: 'indicacao_cliente', label: 'Indicação de cliente' },
  { value: 'indicacao_socio_parceiro', label: 'Indicação de sócio/parceiro' },
  { value: 'carteira_existente', label: 'Carteira existente' },
  { value: 'contato_direto', label: 'Contato direto' },
  { value: 'prospeccao_ativa', label: 'Prospecção ativa' },
  { value: 'outro', label: 'Outro' },
]

export interface Produtor {
  id: string
  empresa: string
  nome: string
  documento: string
  telefone: string
  email: string
  municipio: string
  regional: string
  origem: string
  indicado_por: string
  relacionamento: string
  responsavel: string
  observacoes: string
  arquivado: boolean
  motivo_arquivamento: string
  criado_por: string
  nivel_tecnologia: string
  tecnologias: string
  expand?: { responsavel?: { id: string; name: string; email: string } }
}

export const produtoresService = {
  async listarDaEmpresa(empresaId: string, busca = ''): Promise<Produtor[]> {
    const filtro = busca
      ? `empresa = "${empresaId}" && (nome ~ "${busca}" || municipio ~ "${busca}" || documento ~ "${busca}")`
      : `empresa = "${empresaId}"`
    return await pb.collection('produtores').getFullList({
      filter: filtro,
      sort: 'nome',
      expand: 'responsavel',
    })
  },

  async buscarPorId(id: string): Promise<Produtor> {
    return await pb.collection('produtores').getOne(id, { expand: 'responsavel' })
  },

  async criar(dados: Partial<Produtor>, empresaId: string): Promise<Produtor> {
    return await pb.collection('produtores').create({ ...dados, empresa: empresaId })
  },

  async atualizar(id: string, dados: Partial<Produtor>): Promise<Produtor> {
    return await pb.collection('produtores').update(id, dados)
  },
}
