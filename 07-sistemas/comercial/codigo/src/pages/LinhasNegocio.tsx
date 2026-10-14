// SPEC-1-003 — tela "Linhas de negócio" do Administrador (CA-1-14): criar, renomear
// e desativar (linha fixa não desativa — recusado pelo hook do backend).
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Navigate } from 'react-router-dom'
import { empresasService } from '@/services/empresas'
import { linhasNegocioService, type LinhaNegocio } from '@/services/linhas-negocio'

export default function LinhasNegocio() {
  const empresa = empresasService.getAtiva()
  const { toast } = useToast()
  const empresaId = empresa?.id ?? ''

  const [linhas, setLinhas] = useState<LinhaNegocio[]>([])
  const [nova, setNova] = useState('')
  const [editando, setEditando] = useState<string | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [salvando, setSalvando] = useState(false)

  const recarregar = () => {
    if (!empresaId) return
    linhasNegocioService
      .listarTodas(empresaId)
      .then(setLinhas)
      .catch(() => {})
  }

  useEffect(recarregar, [empresaId])

  if (!empresa) return <Navigate to="/escolher-empresa" replace />

  const criar = async () => {
    if (!nova.trim()) {
      toast({ title: 'Informe o nome da linha.', variant: 'destructive' })
      return
    }
    setSalvando(true)
    try {
      await linhasNegocioService.criar(nova, empresa.id)
      setNova('')
      recarregar()
      toast({ title: 'Linha criada' })
    } catch (e: unknown) {
      const msg = String((e as { response?: { message?: string } })?.response?.message ?? '')
      toast({ title: msg || 'Não foi possível criar a linha.', variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const renomear = async (id: string) => {
    if (!nomeEdicao.trim()) {
      toast({ title: 'Informe o novo nome.', variant: 'destructive' })
      return
    }
    setSalvando(true)
    try {
      await linhasNegocioService.renomear(id, nomeEdicao)
      setEditando(null)
      recarregar()
      toast({ title: 'Linha renomeada' })
    } catch {
      toast({ title: 'Não foi possível renomear.', variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const alternar = async (l: LinhaNegocio) => {
    setSalvando(true)
    try {
      await linhasNegocioService.definirAtiva(l.id, !l.ativa)
      recarregar()
      toast({ title: l.ativa ? 'Linha desativada' : 'Linha reativada' })
    } catch (e: unknown) {
      const msg = String((e as { response?: { message?: string } })?.response?.message ?? '')
      toast({ title: msg || 'Não foi possível alterar a linha.', variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Linhas de negócio</h1>
      <p className="text-sm text-muted-foreground">
        Aparecem nas oportunidades da {empresa.nome}. Linha em uso não é apagada — só desativada.
      </p>

      <Card>
        <CardContent className="pt-4 flex gap-2">
          <Input
            placeholder="Nova linha de negócio"
            value={nova}
            onChange={(e) => setNova(e.target.value)}
          />
          <Button onClick={criar} disabled={salvando}>
            Criar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linhas ({linhas.length})</CardTitle>
          <CardDescription>
            Desativadas ficam no fim da lista e somem das novas oportunidades.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {linhas.map((l) =>
            editando === l.id ? (
              <div key={l.id} className="flex gap-2 items-center">
                <Input value={nomeEdicao} onChange={(e) => setNomeEdicao(e.target.value)} />
                <Button size="sm" onClick={() => renomear(l.id)} disabled={salvando}>
                  Salvar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditando(null)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <div
                key={l.id}
                className="flex items-center justify-between rounded-lg border p-3 gap-2"
              >
                <div>
                  <p className="text-sm font-medium">{l.nome}</p>
                  {l.fixa && <p className="text-xs text-muted-foreground">Fixa (não desativa)</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {l.ativa ? <Badge>Ativa</Badge> : <Badge variant="outline">Desativada</Badge>}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditando(l.id)
                      setNomeEdicao(l.nome)
                    }}
                  >
                    Renomear
                  </Button>
                  {!l.fixa && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alternar(l)}
                      disabled={salvando}
                    >
                      {l.ativa ? 'Desativar' : 'Reativar'}
                    </Button>
                  )}
                </div>
              </div>
            ),
          )}
        </CardContent>
      </Card>
    </div>
  )
}
