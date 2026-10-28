// FASE 2 (f2-004) — Destaque da revisita: o que levar para a próxima visita.
// Monta, a partir do que já existe no banco (sem IA): demandas/oportunidades abertas do
// produtor, as que estão na época de efetividade atual, o histórico de visitas e os
// pontos da última conversa (necessidades, acordos, assuntos).
// Regra do guardanapo: "Antes da próxima visita, o sistema monta o resumo das demandas
// atendíveis naquele período" — leitura pura, nada é gravado.
import pb from '@/lib/pocketbase/client'
import type { Produtor } from '@/services/produtores'
import { oportunidadesService, type Oportunidade } from '@/services/oportunidades'
import { visitasService, type Visita } from '@/services/visitas'

export interface DestaqueRevisita {
  /** Oportunidades abertas do produtor (todas). */
  abertas: Oportunidade[]
  /** Subconjunto que cai na época de efetividade informada agora. */
  naEpoca: Oportunidade[]
  /** Últimas visitas (mais recente primeiro). */
  ultimasVisitas: Visita[]
  /** Texto curto da última conversa. */
  ultimaConversa: string
  /** Necessidades apontadas na última visita. */
  necessidades: string
  /** Acordos combinados na última visita. */
  acordos: string
}

/** A época informada no produtor casa com o mês atual? Aceita "set-dez", "setembro",
 * "09", "9-12". Sem época informada, tudo é considerado atendível. */
export function epocaCasaAgora(epoca: string, mesAtual: number): boolean {
  const texto = (epoca || '').toLowerCase().trim()
  if (!texto) return true
  const meses: Record<string, number> = {
    jan: 1,
    fev: 2,
    mar: 3,
    abr: 4,
    mai: 5,
    jun: 6,
    jul: 7,
    ago: 8,
    set: 9,
    out: 10,
    nov: 11,
    dez: 12,
  }
  const partes = texto
    .split(/[-–a]/)
    .map((p) => p.trim())
    .filter(Boolean)
  const numeros = partes
    .map((p) => {
      const n = Number(p)
      if (!Number.isNaN(n) && n >= 1 && n <= 12) return n
      const tres = p.slice(0, 3)
      return meses[tres] ?? null
    })
    .filter((n): n is number => n !== null)
  if (numeros.length === 0) return true
  if (numeros.length === 1) return numeros[0] === mesAtual
  const [de, ate] = [numeros[0], numeros[numeros.length - 1]]
  return de <= ate ? mesAtual >= de && mesAtual <= ate : mesAtual >= de || mesAtual <= ate
}

export const destaqueService = {
  async montar(produtor: Produtor): Promise<DestaqueRevisita> {
    const [abertas, visitas] = await Promise.all([
      oportunidadesService.listarAbertasDoProdutor(produtor.id).catch(() => []),
      visitasService.listarDoProdutor(produtor.id).catch(() => []),
    ])
    const mesAtual = Number(
      new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })
        .format(new Date())
        .slice(5, 7),
    )
    const epoca = (produtor as unknown as { epoca_efetividade?: string }).epoca_efetividade ?? ''
    const naEpoca = abertas.filter(() => epocaCasaAgora(epoca, mesAtual))
    const ultima = visitas[0]
    return {
      abertas,
      naEpoca,
      ultimasVisitas: visitas.slice(0, 3),
      ultimaConversa: ultima?.assuntos_tratados ?? '',
      necessidades: ultima?.necessidades ?? '',
      acordos: ultima?.acordos ?? '',
    }
  },
}
