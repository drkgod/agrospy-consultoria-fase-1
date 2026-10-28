// SPEC-1-005 (task 684e8557) — Visão do gestor: carteira da equipe da empresa ativa para
// Gestão e Administrador (CA-1-22). Tabela por responsável (atrasadas, hoje, próximos 7 dias,
// total abertas, visitas 7d), filtro por responsável e produtores sem oportunidade aberta.
// No celular a tabela vira cards por responsável (sem rolagem horizontal da página).
// Leitura: o servidor garante as permissões (listRules da SPEC-1-003); não-gestão volta para /.
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { empresasService } from '@/services/empresas'
import { vinculosService } from '@/services/vinculos'
import { usuariosService } from '@/services/usuarios'
import { carteiraService, type IndicadoresSemanais, type LinhaGestor } from '@/services/carteira'
import type { Produtor } from '@/services/produtores'

export default function VisaoGestor() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const empresa = empresasService.getAtiva()
  const empresaId = empresa?.id ?? ''

  const [perfil, setPerfil] = useState<string>('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [linhas, setLinhas] = useState<LinhaGestor[]>([])
  const [nomes, setNomes] = useState<Record<string, string>>({})
  const [semOportunidade, setSemOportunidade] = useState<Produtor[]>([])
  const [filtro, setFiltro] = useState('')
  const [indicadores, setIndicadores] = useState<IndicadoresSemanais | null>(null)

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
    if (!empresaId) return
    setCarregando(true)
    setErro('')
    Promise.all([
      carteiraService.visaoGestor(empresaId),
      usuariosService.listarDaEmpresa(empresaId),
      carteiraService.indicadoresSemanais(empresaId).catch(() => null),
    ])
      .then(([{ linhas, semOportunidade }, usuarios, ind]) => {
        const mapa: Record<string, string> = {}
        for (const u of usuarios) mapa[u.usuarioId] = u.nome || u.email
        setNomes(mapa)
        setLinhas(linhas)
        setSemOportunidade(semOportunidade)
        setIndicadores(ind)
      })
      .catch(() => {
        setErro('Não foi possível carregar a visão da equipe.')
      })
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  if (!empresa) return <Navigate to="/escolher-empresa" replace />
  if (perfil && perfil !== 'gestao' && perfil !== 'administrador')
    return <Navigate to="/" replace />

  const visiveis = filtro ? linhas.filter((l) => l.usuarioId === filtro) : linhas
  const totais = visiveis.reduce(
    (acc, l) => ({
      atrasadas: acc.atrasadas + l.atrasadas,
      hoje: acc.hoje + l.hoje,
      proximos7: acc.proximos7 + l.proximos7,
      totalAbertas: acc.totalAbertas + l.totalAbertas,
      visitas7d: acc.visitas7d + l.visitas7d,
    }),
    { atrasadas: 0, hoje: 0, proximos7: 0, totalAbertas: 0, visitas7d: 0 },
  )

  const colunas = ['Atrasadas', 'Hoje', 'Próx. 7 dias', 'Total abertas', 'Visitas 7d'] as const

  return (
    <div className="container mx-auto py-6 px-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold">Visão do gestor</h1>
        <select
          aria-label="Filtrar por responsável"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Todos os responsáveis</option>
          {linhas.map((l) => (
            <option key={l.usuarioId} value={l.usuarioId}>
              {nomes[l.usuarioId] || l.usuarioId}
            </option>
          ))}
        </select>
      </div>

      {carregando && <p className="text-muted-foreground">Carregando…</p>}

      {!carregando && erro && (
        <div className="rounded-lg border border-destructive p-3 space-y-2" role="alert">
          <p className="text-sm text-destructive">{erro}</p>
          <Button variant="outline" size="sm" onClick={carregar}>
            Tentar de novo
          </Button>
        </div>
      )}

      {!carregando && !erro && indicadores && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Indicadores da semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                { rotulo: 'Prospecções', chave: 'prospeccoes' as const },
                { rotulo: 'Visitas com potencial', chave: 'comPotencial' as const },
                { rotulo: 'Oportunidades', chave: 'oportunidades' as const },
              ].map(({ rotulo, chave }) => {
                const agora = indicadores.atual[chave]
                const antes = indicadores.anterior[chave]
                const variacao = agora - antes
                return (
                  <div key={chave} className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{rotulo}</p>
                    <p className="text-2xl font-bold">{agora}</p>
                    <p
                      className={
                        variacao > 0
                          ? 'text-xs text-green-700'
                          : variacao < 0
                            ? 'text-xs text-destructive'
                            : 'text-xs text-muted-foreground'
                      }
                    >
                      {variacao > 0 ? `+${variacao}` : variacao === 0 ? 'igual' : variacao} vs
                      semana anterior ({antes})
                    </p>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Semana desde {indicadores.inicio.split('-').reverse().join('/')} (segunda a domingo).
            </p>
          </CardContent>
        </Card>
      )}

      {!carregando && !erro && (
        <>
          {/* Desktop: tabela. Celular: cards (sem rolagem horizontal da página). */}
          <div className="hidden md:block">
            <table className="w-full text-sm border rounded-lg">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-3 py-2 font-medium">Responsável</th>
                  {colunas.map((c) => (
                    <th key={c} className="px-3 py-2 font-medium text-right">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visiveis.map((l) => (
                  <tr key={l.usuarioId} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{nomes[l.usuarioId] || l.usuarioId}</td>
                    <td className="px-3 py-2 text-right">{l.atrasadas}</td>
                    <td className="px-3 py-2 text-right">{l.hoje}</td>
                    <td className="px-3 py-2 text-right">{l.proximos7}</td>
                    <td className="px-3 py-2 text-right">{l.totalAbertas}</td>
                    <td className="px-3 py-2 text-right">{l.visitas7d}</td>
                  </tr>
                ))}
                {visiveis.length > 0 && (
                  <tr className="bg-muted/40 font-semibold">
                    <td className="px-3 py-2">Total</td>
                    <td className="px-3 py-2 text-right">{totais.atrasadas}</td>
                    <td className="px-3 py-2 text-right">{totais.hoje}</td>
                    <td className="px-3 py-2 text-right">{totais.proximos7}</td>
                    <td className="px-3 py-2 text-right">{totais.totalAbertas}</td>
                    <td className="px-3 py-2 text-right">{totais.visitas7d}</td>
                  </tr>
                )}
              </tbody>
            </table>
            {visiveis.length === 0 && (
              <p className="text-sm text-muted-foreground py-3">Nenhuma ação aberta na equipe.</p>
            )}
          </div>

          <div className="grid gap-2 md:hidden">
            {visiveis.map((l) => (
              <Card key={l.usuarioId}>
                <CardHeader className="pb-1">
                  <CardTitle className="text-base">{nomes[l.usuarioId] || l.usuarioId}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-1 text-sm">
                  <p>
                    Atrasadas: <strong>{l.atrasadas}</strong>
                  </p>
                  <p>
                    Hoje: <strong>{l.hoje}</strong>
                  </p>
                  <p>
                    Próx. 7 dias: <strong>{l.proximos7}</strong>
                  </p>
                  <p>
                    Total abertas: <strong>{l.totalAbertas}</strong>
                  </p>
                  <p>
                    Visitas 7d: <strong>{l.visitas7d}</strong>
                  </p>
                </CardContent>
              </Card>
            ))}
            {visiveis.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma ação aberta na equipe.</p>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Produtores sem oportunidade aberta ({semOportunidade.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {semOportunidade.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Todos os produtores têm oportunidade aberta.
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
                  <p className="text-sm text-muted-foreground">
                    {p.municipio} · {nomes[p.responsavel] || 'sem responsável'}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
