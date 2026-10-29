// FASE 2 — SPEC-2-001 (task 68c2ec27): confirmação do rascunho.
// Fluxo da SPEC (passo 5): o app grava, com o token do usuário e pela API da fase 1,
// a visita, as oportunidades e a ação; depois chama a rota /confirmar, que confere
// empresa, id_local e status, copia a mídia para visitas.audio e marca o rascunho.
// Idempotência: id_local = "rasc-<id do rascunho>" na visita (índice único impede a
// segunda), "rasc-<id>-<n>" nas oportunidades e "rasc-<id>-a" na ação.
import pb from '@/lib/pocketbase/client'
import type { PropostaRascunho, Rascunho } from '@/services/rascunhos'

/** Valores aceitos (iguais aos da fase 1). Campo fora disso é descartado. */
const DESTINOS = ['nova_oportunidade', 'oportunidade_atualizada', 'sem_oportunidade']
const MOTIVOS = ['sem_interesse_agora', 'sem_perfil', 'atendido_por_concorrente', 'outro']

export interface DadosConfirmacao {
  produtor: string
  assuntos_tratados: string
  destino: string
  oportunidades: Array<{
    linha_negocio: string
    descricao: string
    proxima_acao: string
    proxima_acao_data: string
  }>
  motivo_sem_oportunidade: string
}

/** Monta o payload da visita a partir da proposta, com o que o usuário confirmou. */
export function prepararDados(
  rascunho: Rascunho,
  ajustes: Partial<DadosConfirmacao>,
): DadosConfirmacao | { erro: string } {
  const p: PropostaRascunho = rascunho.proposta ?? {}
  const dados: DadosConfirmacao = {
    produtor: String(ajustes.produtor ?? rascunho.produtor ?? p.produtor ?? ''),
    assuntos_tratados: String(ajustes.assuntos_tratados ?? p.assuntos_tratados ?? '').trim(),
    destino: String(ajustes.destino ?? p.destino ?? ''),
    oportunidades: ajustes.oportunidades ?? p.oportunidades ?? [],
    motivo_sem_oportunidade: String(
      ajustes.motivo_sem_oportunidade ?? p.motivo_sem_oportunidade ?? '',
    ),
  }
  if (!dados.produtor) return { erro: 'Escolha o produtor antes de confirmar.' }
  if (!dados.assuntos_tratados) return { erro: 'Escreva o que foi conversado.' }
  if (!DESTINOS.includes(dados.destino)) return { erro: 'Escolha o próximo passo.' }
  if (dados.destino === 'nova_oportunidade') {
    const invalida = dados.oportunidades.some(
      (o) =>
        !o.linha_negocio || !o.descricao?.trim() || !o.proxima_acao?.trim() || !o.proxima_acao_data,
    )
    if (invalida || dados.oportunidades.length === 0) {
      return { erro: 'Preencha linha, descrição, próxima ação e data da oportunidade.' }
    }
  }
  if (dados.destino === 'sem_oportunidade' && !MOTIVOS.includes(dados.motivo_sem_oportunidade)) {
    return { erro: 'Escolha o motivo de não haver oportunidade.' }
  }
  return dados
}

export const confirmacaoService = {
  /**
   * Confirma o rascunho: grava visita/oportunidades pela API da fase 1 (token do
   * usuário, todas as regras e hooks valem) e chama a rota que fecha o rascunho.
   */
  async confirmar(rascunho: Rascunho, dados: DadosConfirmacao): Promise<{ visitaId: string }> {
    const empresaId = rascunho.empresa
    const idVisitaLocal = `rasc-${rascunho.id}`

    // 1) Visita — id_local fixo: o índice único impede a segunda (CA-2-03).
    let visitaId = ''
    const existente = await pb
      .collection('visitas')
      .getFirstListItem(`id_local = "${idVisitaLocal}"`)
      .catch(() => null)
    if (existente) {
      visitaId = existente.id
    } else {
      const visita = await pb.collection('visitas').create({
        empresa: empresaId,
        produtor: dados.produtor,
        data: `${String(rascunho.criado_em_aparelho || rascunho.created).slice(0, 10)} 12:00:00.000Z`,
        assuntos_tratados: dados.assuntos_tratados,
        destino: dados.destino,
        motivo_sem_oportunidade:
          dados.destino === 'sem_oportunidade' ? dados.motivo_sem_oportunidade : '',
        id_local: idVisitaLocal,
      })
      visitaId = visita.id
    }

    // 2) Oportunidades (só no destino "nova oportunidade").
    if (dados.destino === 'nova_oportunidade') {
      for (let i = 0; i < dados.oportunidades.length; i++) {
        const o = dados.oportunidades[i]
        const idLocal = `rasc-${rascunho.id}-${i + 1}`
        const jaExiste = await pb
          .collection('oportunidades')
          .getFirstListItem(`id_local = "${idLocal}"`)
          .catch(() => null)
        if (jaExiste) continue
        await pb.collection('oportunidades').create({
          empresa: empresaId,
          produtor: dados.produtor,
          linha_negocio: o.linha_negocio,
          descricao: o.descricao.trim(),
          proxima_acao: o.proxima_acao.trim(),
          proxima_acao_data: o.proxima_acao_data.includes('T')
            ? o.proxima_acao_data
            : `${o.proxima_acao_data} 12:00:00.000Z`,
          visita_origem: visitaId,
          id_local: idLocal,
        })
      }
    }

    // 3) Fecha o rascunho no servidor (copia a mídia para visitas.audio).
    await pb.send(`/backend/v1/rascunhos/${rascunho.id}/confirmar`, {
      method: 'POST',
      body: { visita: visitaId },
    })
    return { visitaId }
  },
}
