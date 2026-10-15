// SPEC-1-004 (task 4da366fe) — Pendências de envio: itens em `precisa_revisao` com o
// motivo. Ações: "Tentar de novo" (volta a pendente e sincroniza) e "Descartar"
// (confirmação dizendo o que será perdido — RN-22). A fila é do usuário (RN-25).
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { filaOffline, type ItemFila } from '@/services/fila-offline'

const ROTULO: Record<string, string> = {
  produtores: 'Produtor',
  propriedades: 'Propriedade',
  visitas: 'Visita',
  oportunidades: 'Oportunidade',
  acoes_oportunidade: 'Ação da oportunidade',
}

export default function Pendencias() {
  const { toast } = useToast()
  const usuarioId = pb.authStore.record?.id ?? ''
  const [itens, setItens] = useState<ItemFila[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = () => {
    if (!usuarioId) return
    filaOffline
      .emRevisao(usuarioId)
      .then(setItens)
      .catch(() => setItens([]))
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId])

  const tentarDeNovo = async (item: ItemFila) => {
    item.estado = 'pendente'
    item.tentativas = 0
    await filaOffline['enfileirar'](
      item.colecao,
      item.dados,
      item.usuario,
      item.empresa,
      item.depende_de,
    )
    await filaOffline.descartar(item.id_local, usuarioId)
    toast({ title: 'De volta à fila de envio' })
    carregar()
  }

  const descartar = async (item: ItemFila) => {
    await filaOffline.descartar(item.id_local, usuarioId)
    toast({ title: 'Registro descartado' })
    carregar()
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-4">
      <h1 className="text-2xl font-bold">Pendências de envio</h1>
      <p className="text-sm text-muted-foreground">
        Registros que o servidor recusou. Nada foi perdido — resolva e reenvie, ou descarte com
        confirmação.
      </p>

      {carregando && <p className="text-muted-foreground">Carregando…</p>}

      {!carregando && itens.length === 0 && (
        <p className="text-muted-foreground">Nenhuma pendência de envio.</p>
      )}

      {itens.map((i) => (
        <Card key={i.id_local}>
          <CardContent className="pt-4 space-y-2">
            <p className="font-medium">
              {ROTULO[i.colecao] ?? i.colecao} ·{' '}
              {String(
                i.dados.nome ??
                  i.dados.assuntos_tratados ??
                  i.dados.descricao ??
                  i.dados.nova_acao ??
                  'registro',
              )}
            </p>
            <p className="text-sm text-destructive" role="alert">
              {i.motivo ?? 'Recusado pelo servidor.'}
            </p>
            <p className="text-xs text-muted-foreground">
              Feito em {new Date(i.criado_em_aparelho).toLocaleString('pt-BR')}
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => tentarDeNovo(i)}>
                Tentar de novo
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                onClick={() => {
                  if (
                    window.confirm(
                      'Descartar este registro? Ele será apagado do aparelho e nunca será enviado.',
                    )
                  ) {
                    descartar(i)
                  }
                }}
              >
                Descartar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
