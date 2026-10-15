// SPEC-1-005 — formulário de ação sobre oportunidade (concluir ou reagendar),
// extraído da ficha do produtor para reuso na Minha carteira (task baad9730).
// Regras inalteradas (SPEC-1-003): concluir exige resultado + próxima ação/data;
// reagendar só a nova data. Data passada é recusada pelo hook no servidor.
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { oportunidadesService } from '@/services/oportunidades'

interface AcaoOportunidadeFormProps {
  oportunidadeId: string
  empresaId: string
  /** Próxima ação atual (pré-preenche o campo). */
  proximaAcaoAtual?: string
  /** Data atual da próxima ação (pré-preenche, "YYYY-MM-DD"). */
  proximaDataAtual?: string
  onSalvo: () => void
  onCancelar: () => void
}

export default function AcaoOportunidadeForm({
  oportunidadeId,
  empresaId,
  proximaAcaoAtual = '',
  proximaDataAtual = '',
  onSalvo,
  onCancelar,
}: AcaoOportunidadeFormProps) {
  const { toast } = useToast()
  const [tipoAcao, setTipoAcao] = useState<'concluida' | 'reagendada'>('concluida')
  const [resultadoAcao, setResultadoAcao] = useState('')
  const [novaAcao, setNovaAcao] = useState(proximaAcaoAtual)
  const [novaData, setNovaData] = useState(proximaDataAtual)
  const [salvandoAcao, setSalvandoAcao] = useState(false)

  const salvar = async () => {
    if (tipoAcao === 'concluida' && !resultadoAcao.trim()) {
      toast({ title: 'Informe o resultado do que foi feito.', variant: 'destructive' })
      return
    }
    if (!novaAcao.trim() || !novaData) {
      toast({ title: 'Informe a próxima ação e a data.', variant: 'destructive' })
      return
    }
    setSalvandoAcao(true)
    try {
      await oportunidadesService.registrarAcao(
        {
          oportunidade: oportunidadeId,
          tipo: tipoAcao,
          resultado: tipoAcao === 'concluida' ? resultadoAcao.trim() : undefined,
          nova_acao: novaAcao.trim(),
          nova_data: `${novaData} 12:00:00.000Z`,
        },
        empresaId,
      )
      toast({ title: tipoAcao === 'concluida' ? 'Ação concluída' : 'Ação reagendada' })
      onSalvo()
    } catch (e: unknown) {
      const msg = String((e as { response?: { message?: string } })?.response?.message ?? '')
      toast({ title: msg || 'Não foi possível registrar a ação.', variant: 'destructive' })
    } finally {
      setSalvandoAcao(false)
    }
  }

  return (
    <div className="rounded-lg border p-3 space-y-2 bg-muted/40">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={tipoAcao === 'concluida' ? 'default' : 'outline'}
          onClick={() => setTipoAcao('concluida')}
        >
          Concluir ação
        </Button>
        <Button
          size="sm"
          variant={tipoAcao === 'reagendada' ? 'default' : 'outline'}
          onClick={() => setTipoAcao('reagendada')}
        >
          Reagendar
        </Button>
      </div>
      {tipoAcao === 'concluida' && (
        <div className="space-y-1">
          <label htmlFor="resultado-acao" className="text-sm font-medium">
            O que foi feito? *
          </label>
          <Input
            id="resultado-acao"
            placeholder="Resultado do que foi feito"
            value={resultadoAcao}
            onChange={(e) => setResultadoAcao(e.target.value)}
          />
        </div>
      )}
      <div className="space-y-1">
        <label htmlFor="nova-acao" className="text-sm font-medium">
          Próxima ação *
        </label>
        <Input
          id="nova-acao"
          placeholder="Próxima ação"
          value={novaAcao}
          onChange={(e) => setNovaAcao(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="nova-data" className="text-sm font-medium">
          Data da próxima ação *
        </label>
        <Input
          id="nova-data"
          type="date"
          value={novaData}
          onChange={(e) => setNovaData(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button size="sm" onClick={salvar} disabled={salvandoAcao}>
          {salvandoAcao ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}
