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
}
