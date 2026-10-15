// SPEC-1-005 (task baad9730) — Minha carteira: tela inicial do Comercial, Gestão e
// Administrador. Grupos RN-26 (Atrasadas/Hoje/Próximos 7 dias/Depois, fuso de Brasília),
// ordem RN-27, ações rápidas concluir/reagendar (regras da SPEC-1-003) e seção de
// produtores sem oportunidade aberta (RN-28). O Operador não tem carteira (cai em Produtores).
// "Última sincronização" fica para a task offline (4da366fe / SPEC-1-004) — aqui é ao vivo.
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { filaOffline } from '@/services/fila-offline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { empresasService } from '@/services/empresas'
import { vinculosService } from '@/services/vinculos'
import { carteiraService, type GruposCarteira } from '@/services/carteira'
import { produtoresService, type Produtor } from '@/services/produtores'
import type { Oportunidade } from '@/services/oportunidades'
import AcaoOportunidadeForm from '@/components/AcaoOportunidadeForm'

/** CA-1-15 — data/hora da última sincronização na carteira. */
function UltimaSincronizacao() {
  const [quando, setQuando] = useState<string | null>(null)
  useEffect(() => {
    filaOffline.ultimaSincronizacao().then((v) => setQuando(v))
  }, [])
  if (!quando) return null
  const d = new Date(quando)
  return (
    <p className="text-sm text-muted-foreground">
      Última sincronização: {d.toLocaleDateString('pt-BR')} às{' '}
      {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
    </p>
  )
}

const GRUPOS: { chave: keyof GruposCarteira; titulo: string }[] = [
  { chave: 'atrasadas', titulo: 'Atrasadas' },
  { chave: 'hoje', titulo: 'Hoje' },
  { chave: 'proximos7', titulo: 'Próximos 7 dias' },
  { chave: 'depois', titulo: 'Depois' },
]

export default function Index() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const empresa = empresasService.getAtiva()
  const empresaId = empresa?.id ?? ''
  const usuarioId = pb.authStore.record?.id ?? ''

  const [perfil, setPerfil] = useState<string>('')
  const [carregando, setCarregando] = useState(true)
  const [cacheUsado, setCacheUsado] = useState(false)
  const [erro, setErro] = useState('')
  const [grupos, setGrupos] = useState<GruposCarteira | null>(null)
  const [semOportunidade, setSemOportunidade] = useState<Produtor[]>([])
  const [acaoAberta, setAcaoAberta] = useState<string | null>(null)

  useEffect(() => {
    if (!empresaId) return
    let vivo = true
    vinculosService
      .listarDoUsuario()
      .then((vs) => {
        if (vivo) setPerfil(vs.find((v) => v.empresa === empresaId)?.perfil ?? '')
      })
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [empresaId])

  const carregar = () => {
    if (!empresaId || !usuarioId) return
    setCarregando(true)
    setErro('')
    Promise.all([
      carteiraService.listarMinhasAbertas(empresaId, usuarioId),
      carteiraService.listarProdutoresSemOportunidadeAberta(empresaId, usuarioId),
    ])
      .then(([oportunidades, produtoresSemOport]: [Oportunidade[], Produtor[]]) => {
        setGrupos(carteiraService.agrupar(oportunidades, carteiraService.hojeBrasilia()))
        setSemOportunidade(produtoresSemOport)
      })
      .catch(() => {
        setErro('Não foi possível carregar sua carteira.')
      })
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    // SPEC-1-004: com internet, atualiza a cópia de consulta (CA-1-15) e envia a fila pendente.
    if (navigator.onLine && usuarioId && empresaId) {
      filaOffline.atualizarCache(empresaId, usuarioId).catch(() => {})
      filaOffline.sincronizar(usuarioId, empresaId).catch(() => {})
    } else if (usuarioId && empresaId) {
      // Offline: lê a carteira do cache (CA-1-15).
      setCacheUsado(true)
      Promise.all([
        filaOffline.cacheLer<never[]>('oportunidades_abertas'),
        filaOffline.cacheLer<never[]>('produtores'),
      ])
        .then(([oportunidades, produtores]) => {
          const abertas = (oportunidades ?? []) as never[]
          setGrupos(carteiraService.agrupar(abertas as never, carteiraService.hojeBrasilia()))
          const comOport = new Set(
            (abertas as unknown as { produtor: string }[]).map((o) => o.produtor),
          )
          setSemOportunidade(
            (produtores ?? []).filter(
              (p: { arquivado?: boolean; id: string }) => !p.arquivado && !comOport.has(p.id),
            ) as never,
          )
        })
        .catch(() => {})
    }
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, usuarioId])

  if (!empresa) return <Navigate to="/escolher-empresa" replace />
  if (perfil === 'operador') return <Navigate to="/produtores" replace />

  const total = grupos
    ? grupos.atrasadas.length + grupos.hoje.length + grupos.proximos7.length + grupos.depois.length
    : 0

  return (
    <div className="container mx-auto py-6 px-4 space-y-4">
      <h1 className="text-2xl font-bold">Minha carteira</h1>
      <UltimaSincronizacao />

      {cacheUsado && (
        <p className="text-sm text-muted-foreground">
          Exibindo a carteira da última sincronização (sem conexão).
        </p>
      )}

      {carregando && <p className="text-muted-foreground">Carregando…</p>}

      {!carregando && erro && (
        <div className="rounded-lg border border-destructive p-3 space-y-2" role="alert">
          <p className="text-sm text-destructive">{erro}</p>
          <Button variant="outline" size="sm" onClick={carregar}>
            Tentar de novo
          </Button>
        </div>
      )}

      {!carregando && !erro && grupos && (
        <>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {GRUPOS.map((g) => (
              <Card key={g.chave}>
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold">{grupos[g.chave].length}</p>
                  <p className="text-sm text-muted-foreground">{g.titulo}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {total === 0 && (
            <p className="text-muted-foreground">
              Nenhuma ação na carteira. Ela aparece quando você registra uma visita com próximo
              passo.
            </p>
          )}

          {GRUPOS.map((g) =>
            grupos[g.chave].length > 0 ? (
              <section key={g.chave} className="space-y-2">
                <h2 className="text-base font-semibold">{g.titulo}</h2>
                {grupos[g.chave].map((o) =>
                  acaoAberta === o.id ? (
                    <AcaoOportunidadeForm
                      key={o.id}
                      oportunidadeId={o.id}
                      empresaId={empresaId}
                      proximaAcaoAtual={o.proxima_acao}
                      proximaDataAtual={String(o.proxima_acao_data || '').slice(0, 10)}
                      onSalvo={() => {
                        setAcaoAberta(null)
                        carregar()
                      }}
                      onCancelar={() => setAcaoAberta(null)}
                    />
                  ) : (
                    <Card key={o.id}>
                      <CardContent className="pt-4 space-y-2">
                        <p className="font-medium">
                          {o.expand?.produtor?.nome ?? 'Produtor'} ·{' '}
                          {o.expand?.linha_negocio?.nome ?? 'Linha'}
                        </p>
                        <p className="text-sm">
                          Próxima ação: {o.proxima_acao} —{' '}
                          <strong>{String(o.proxima_acao_data || '').slice(0, 10)}</strong>
                        </p>
                        {g.chave === 'atrasadas' && (
                          <p className="text-sm text-destructive">
                            {carteiraService.diasDeAtraso(
                              o.proxima_acao_data,
                              carteiraService.hojeBrasilia(),
                            )}{' '}
                            dias de atraso
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => setAcaoAberta(acaoAberta === o.id ? null : o.id)}
                          >
                            Concluir ação
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAcaoAberta(acaoAberta === o.id ? null : o.id)}
                          >
                            Reagendar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/produtores/${o.produtor}`)}
                          >
                            Abrir ficha
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ),
                )}
              </section>
            ) : null,
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Produtores sem oportunidade aberta ({semOportunidade.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {semOportunidade.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Todos os seus produtores têm oportunidade aberta.
                </p>
              )}
              {semOportunidade.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate(`/produtores/${p.id}`)}
                  className="block w-full text-left rounded-lg border p-3 hover:bg-muted/40"
                >
                  <p className="font-medium">{p.nome}</p>
                  <p className="text-sm text-muted-foreground">{p.municipio}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
