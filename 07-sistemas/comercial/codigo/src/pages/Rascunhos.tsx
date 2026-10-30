// FASE 2 — SPEC-2-001 (task 0b522b2b): tela "Rascunhos".
// Lista os rascunhos que o servidor entrega; cada um com status, produtor sugerido e
// texto. Confirmar/descartar entram na task 68c2ec27 (próxima); aqui a fila é visível
// e o descarte já funciona (RN-32, com confirmação).
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { empresasService } from '@/services/empresas'
import { vinculosService } from '@/services/vinculos'
import { rascunhosService, ROTULO_STATUS, type Rascunho } from '@/services/rascunhos'
import GravarPosVisita from '@/components/GravarPosVisita'

const dataCurta = (v: string) => (v ? String(v).slice(0, 10).split('-').reverse().join('/') : '')

export default function Rascunhos() {
  const empresa = empresasService.getAtiva()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState('')
  const [lista, setLista] = useState<Rascunho[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!empresa) return
    let vivo = true
    vinculosService
      .listarDoUsuario()
      .then((vs) => {
        if (vivo) setPerfil(vs.find((v) => v.empresa === empresa.id)?.perfil ?? '')
      })
      .catch(() => {})
    rascunhosService
      .listar()
      .then((rs) => {
        if (vivo) setLista(rs)
      })
      .catch(() => {
        if (vivo) setErro('Não foi possível carregar os rascunhos.')
      })
      .finally(() => {
        if (vivo) setCarregando(false)
      })
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa?.id])

  if (!empresa) return <Navigate to="/escolher-empresa" replace />
  if (perfil && perfil === 'operador') return <Navigate to="/" replace />

  const descartar = async (r: Rascunho) => {
    if (
      !window.confirm(
        'Descartar este rascunho? Ele não entra no histórico e a gravação será apagada depois do prazo de guarda.',
      )
    )
      return
    try {
      await rascunhosService.descartar(r.id)
      setLista(await rascunhosService.listar())
      toast({ title: 'Rascunho descartado' })
    } catch {
      toast({ title: 'Não foi possível descartar.', variant: 'destructive' })
    }
  }

  const tentarDeNovo = async (id: string) => {
    try {
      await rascunhosService.retomar(id)
      toast({ title: 'Vai tentar de novo', description: 'Reprocessando a gravação…' })
      // Dispara na hora; se falhar, a rotina de 10 minutos assume.
      await rascunhosService.processar(id).catch(() => null)
      setLista(await rascunhosService.listar())
    } catch {
      toast({ title: 'Não foi possível retomar.', variant: 'destructive' })
    }
  }

  const paraRevisar = lista.filter((r) => r.status === 'pronto_para_revisar').length

  return (
    <div className="container mx-auto py-6 px-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Rascunhos</h1>
        <p className="text-sm text-muted-foreground">
          Pós-visita aguardando sua conferência. Nada entra no histórico sem confirmação.
        </p>
        <div className="mt-3">
          <GravarPosVisita />
        </div>
      </div>

      {paraRevisar > 0 && (
        <p className="text-sm font-medium">
          {paraRevisar} rascunho{paraRevisar > 1 ? 's' : ''} pronto{paraRevisar > 1 ? 's' : ''} para
          revisar
        </p>
      )}

      {carregando && <p className="text-muted-foreground">Carregando…</p>}

      {!carregando && erro && (
        <div className="rounded-lg border border-destructive p-3" role="alert">
          <p className="text-sm text-destructive">{erro}</p>
        </div>
      )}

      {!carregando && !erro && lista.length === 0 && (
        <p className="text-muted-foreground">
          Nenhum rascunho. Grave um pós-visita com o botão "Gravar pós-visita".
        </p>
      )}

      {lista.map((r) => (
        <Card key={r.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 flex-wrap">
              {r.expand?.produtor?.nome || 'Produtor a escolher'}
              <Badge
                variant={
                  r.status === 'pronto_para_revisar'
                    ? 'default'
                    : r.status === 'falhou'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {ROTULO_STATUS[r.status] ?? r.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              {dataCurta(r.criado_em_aparelho || r.created)} ·{' '}
              {r.origem === 'app_audio'
                ? 'gravação do app'
                : r.origem === 'app_texto'
                  ? 'texto do app'
                  : r.origem === 'arquivo_gravador'
                    ? 'arquivo de gravador'
                    : 'Drive'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {r.transcricao && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Transcrição</p>
                <p className="whitespace-pre-wrap">{r.transcricao}</p>
              </div>
            )}
            {!r.transcricao && r.texto_original && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Texto</p>
                <p className="whitespace-pre-wrap">{r.texto_original}</p>
              </div>
            )}
            {r.status === 'falhou' && (
              <div className="space-y-1">
                {r.motivo_falha && (
                  <p className="text-destructive" role="alert">
                    {r.motivo_falha}
                  </p>
                )}
                <Button size="sm" variant="outline" onClick={() => tentarDeNovo(r.id)}>
                  Tentar de novo
                </Button>
              </div>
            )}
            {r.status === 'pronto_para_revisar' && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => navigate(`/rascunhos/${r.id}`)}>
                  Revisar e confirmar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => descartar(r)}
                >
                  Descartar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
