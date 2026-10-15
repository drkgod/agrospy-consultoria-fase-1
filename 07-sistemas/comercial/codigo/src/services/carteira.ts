import pb from '@/lib/pocketbase/client'
import type { Oportunidade } from '@/services/oportunidades'
import { produtoresService, type Produtor } from '@/services/produtores'

// SPEC-1-005 (RN-26/RN-27) — agrupamento da carteira no fuso de Brasília.
// Datas são gravadas ao meio-dia UTC (padrão da casa) e comparadas por string
// "YYYY-MM-DD" — a comparação não desliza por fuso e o runtime não tem startOfDay.

export interface GruposCarteira {
  atrasadas: Oportunidade[]
  hoje: Oportunidade[]
  proximos7: Oportunidade[]
  depois: Oportunidade[]
}

export const carteiraService = {
  /** Data de hoje (Brasília) como "YYYY-MM-DD". */
  hojeBrasilia(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
  },

  /** Oportunidades abertas em que o usuário é o responsável, da mais antiga para a mais nova. */
  async listarMinhasAbertas(empresaId: string, usuarioId: string): Promise<Oportunidade[]> {
    return await pb.collection('oportunidades').getFullList({
      filter: `empresa = "${empresaId}" && responsavel = "${usuarioId}" && situacao = "aberta"`,
      sort: 'proxima_acao_data',
      expand: 'produtor,linha_negocio',
    })
  },

  /** RN-26: Atrasadas < hoje; Hoje = hoje; Próximos 7 dias <= hoje+7; Depois > hoje+7. */
  agrupar(oportunidades: Oportunidade[], hoje: string): GruposCarteira {
    const limite7 = new Date(`${hoje}T12:00:00Z`)
    limite7.setDate(limite7.getDate() + 7)
    const limite7Str = limite7.toISOString().slice(0, 10)
    const grupos: GruposCarteira = { atrasadas: [], hoje: [], proximos7: [], depois: [] }
    for (const o of oportunidades) {
      const data = String(o.proxima_acao_data || '').slice(0, 10)
      if (!data) continue
      if (data < hoje) grupos.atrasadas.push(o)
      else if (data === hoje) grupos.hoje.push(o)
      else if (data <= limite7Str) grupos.proximos7.push(o)
      else grupos.depois.push(o)
    }
    // RN-27: mais atrasada primeiro / data mais próxima primeiro (sort ascendente já garante).
    return grupos
  },

  /** Dias de atraso (inteiro >= 1) entre a data da ação e hoje (Brasília). */
  diasDeAtraso(dataAcao: string, hoje: string): number {
    const a = new Date(`${String(dataAcao).slice(0, 10)}T12:00:00Z`)
    const b = new Date(`${hoje}T12:00:00Z`)
    return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000))
  },

  /** RN-28: produtores do usuário, não arquivados, sem nenhuma oportunidade aberta. */
  async listarProdutoresSemOportunidadeAberta(
    empresaId: string,
    usuarioId: string,
  ): Promise<Produtor[]> {
    const produtores = await produtoresService.listarDaEmpresa(empresaId)
    const abertas = await this.listarMinhasAbertas(empresaId, usuarioId)
    const comOport = new Set(abertas.map((o) => o.produtor))
    return produtores.filter((p) => !p.arquivado && !comOport.has(p.id))
  },

  /** RN-28 para a equipe toda: produtores da empresa, não arquivados, sem oportunidade aberta. */
  async listarProdutoresDaEmpresaSemOportunidadeAberta(empresaId: string): Promise<Produtor[]> {
    const produtores = await produtoresService.listarDaEmpresa(empresaId)
    const abertas = await pb.collection('oportunidades').getFullList({
      filter: `empresa = "${empresaId}" && situacao = "aberta"`,
    })
    const comOport = new Set(abertas.map((o) => o.produtor))
    return produtores.filter((p) => !p.arquivado && !comOport.has(p.id))
  },

  /** RN-29 — visão do gestor: contagens por responsável (ações) + visitas dos últimos 7 dias.
   * O servidor já limita o que cada perfil vê (listRules da SPEC-1-003): para Gestão/Administrador,
   * a consulta sem filtro de responsável devolve a empresa inteira. */
  async visaoGestor(empresaId: string): Promise<{
    linhas: LinhaGestor[]
    semOportunidade: Produtor[]
    totalAbertas: number
  }> {
    const hoje = this.hojeBrasilia()
    const limite7 = new Date(`${hoje}T12:00:00Z`)
    limite7.setDate(limite7.getDate() - 7)
    const desde7Str = limite7.toISOString().slice(0, 10)

    const [abertas, visitas, produtores] = await Promise.all([
      pb.collection('oportunidades').getFullList({
        filter: `empresa = "${empresaId}" && situacao = "aberta"`,
        sort: 'proxima_acao_data',
      }),
      pb.collection('visitas').getFullList({
        filter: `empresa = "${empresaId}" && data >= "${desde7Str} 00:00:00.000Z"`,
      }),
      produtoresService.listarDaEmpresa(empresaId),
    ])

    // Contagens por responsável, com o mesmo agrupamento da Minha carteira (RN-26).
    const porUsuario = new Map<string, LinhaGestor>()
    const linha = (usuarioId: string): LinhaGestor => {
      let l = porUsuario.get(usuarioId)
      if (!l) {
        l = {
          usuarioId,
          nome: usuarioId,
          atrasadas: 0,
          hoje: 0,
          proximos7: 0,
          totalAbertas: 0,
          visitas7d: 0,
        }
        porUsuario.set(usuarioId, l)
      }
      return l
    }
    for (const o of abertas) {
      const l = linha(o.responsavel)
      l.totalAbertas++
      const data = String(o.proxima_acao_data || '').slice(0, 10)
      if (data && data < hoje) l.atrasadas++
      else if (data === hoje) l.hoje++
      else if (data <= this.limite7Dias(hoje)) l.proximos7++
    }
    for (const v of visitas) {
      if (!v.responsavel_visita) continue
      linha(v.responsavel_visita).visitas7d++
    }

    // Nomes dos responsáveis a partir dos produtores expandidos não é confiável (nem todos têm
    // produtor); o nome vem da lista de vínculos — a tela junta com usuariosService.
    const semOportunidade = produtores.filter((p) => {
      if (p.arquivado) return false
      return !abertas.some((o) => o.produtor === p.id)
    })

    return { linhas: [...porUsuario.values()], semOportunidade, totalAbertas: abertas.length }
  },

  /** Limite inclusivo dos próximos 7 dias (RN-26) — "YYYY-MM-DD". */
  limite7Dias(hoje: string): string {
    const limite7 = new Date(`${hoje}T12:00:00Z`)
    limite7.setDate(limite7.getDate() + 7)
    return limite7.toISOString().slice(0, 10)
  },
}

export interface LinhaGestor {
  usuarioId: string
  nome: string
  atrasadas: number
  hoje: number
  proximos7: number
  totalAbertas: number
  visitas7d: number
}
