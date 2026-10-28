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

/** FASE 2 (f2-005) — os 3 indicadores semanais do guardanapo. */
export interface IndicadoresSemanais {
  inicio: string
  atual: { prospeccoes: number; comPotencial: number; oportunidades: number }
  anterior: { prospeccoes: number; comPotencial: number; oportunidades: number }
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

  /** FASE 2 (f2-005) — os 3 indicadores semanais do guardanapo.
   * Semana = segunda a domingo, no fuso de Brasília.
   * 1) prospecções realizadas = visitas registradas na semana
   * 2) visitas com potencial = visitas na semana cujo produtor está classificado como potencial/cliente
   * 3) oportunidades com necessidade reconhecida = oportunidades criadas na semana
   */
  async indicadoresSemanais(empresaId: string): Promise<IndicadoresSemanais> {
    const hoje = this.hojeBrasilia()
    const d = new Date(`${hoje}T12:00:00Z`)
    const diaSemana = d.getUTCDay() // 0=domingo
    const recuo = diaSemana === 0 ? 6 : diaSemana - 1
    const inicio = new Date(d)
    inicio.setDate(inicio.getDate() - recuo)
    const inicioAnterior = new Date(inicio)
    inicioAnterior.setDate(inicioAnterior.getDate() - 7)
    const fimAnterior = new Date(inicio)
    fimAnterior.setDate(fimAnterior.getDate() - 1)

    const iso = (x: Date) => x.toISOString().slice(0, 10)
    const conta = async (colecao: string, filtroData: string, extra: string) => {
      try {
        const r = await pb.collection(colecao).getList(1, 1, { filter: filtroData + extra })
        return r.totalItems
      } catch {
        return 0
      }
    }
    const periodo = (campo: string, de: Date, ate: Date) =>
      `${campo} >= "${iso(de)} 00:00:00" && ${campo} <= "${iso(ate)} 23:59:59"`

    const semana = async (de: Date, ate: Date) => {
      const [prospeccoes, oportunidades] = await Promise.all([
        conta('visitas', periodo('data', de, ate), ` && empresa = "${empresaId}"`),
        conta('oportunidades', periodo('created', de, ate), ` && empresa = "${empresaId}"`),
      ])
      // visitas com potencial: cruza com o status do produtor
      let comPotencial = 0
      try {
        const vis = await pb.collection('visitas').getFullList({
          filter: periodo('data', de, ate) + ` && empresa = "${empresaId}"`,
          expand: 'produtor',
        })
        comPotencial = vis.filter((v) => {
          const st = (v.expand?.produtor as { status_comercial?: string } | undefined)
            ?.status_comercial
          return st === 'potencial' || st === 'cliente'
        }).length
      } catch {
        comPotencial = 0
      }
      return { prospeccoes, comPotencial, oportunidades }
    }

    const [atual, anterior] = await Promise.all([
      semana(inicio, d),
      semana(inicioAnterior, fimAnterior),
    ])
    return { inicio: iso(inicio), atual, anterior }
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
