// FASE 2 — SPEC-2-001 (task 68c2ec27): revisar e confirmar o rascunho.
// O vendedor vê a transcrição, corrige a proposta e confirma. Campos que a IA não
// identificou aparecem vazios e marcados (campos_incertos) — ele preenche.
// Ao confirmar, grava pela API da fase 1 (visita + oportunidade + ação) e chama a
// rota /confirmar, que anexa o áudio e fecha o rascunho.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { empresasService } from '@/services/empresas'
import { rascunhosService, ROTULO_STATUS, type Rascunho } from '@/services/rascunhos'
import { confirmacaoService, prepararDados } from '@/services/confirmacao-rascunho'
import pb from '@/lib/pocketbase/client'

export default function RevisarRascunho() {
  const { id } = useParams()
  const navigate = useNavigate()
  const empresa = empresasService.getAtiva()
  const { toast } = useToast()
  const [r, setR] = useState<Rascunho | null>(null)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [produtores, setProdutores] = useState<Array<{ id: string; nome: string }>>([])
  const [linhas, setLinhas] = useState<Array<{ id: string; nome: string }>>([])
  // Campos editáveis
  const [produtor, setProdutor] = useState('')
  const [assuntos, setAssuntos] = useState('')
  const [destino, setDestino] = useState('')
  const [motivo, setMotivo] = useState('')
  const [oportunidades, setOportunidades] = useState<
    Array<{
      linha_negocio: string
      descricao: string
      proxima_acao: string
      proxima_acao_data: string
    }>
  >([])

  useEffect(() => {
    if (!id || !empresa) return
    Promise.all([
      rascunhosService.buscar(id),
      pb
        .collection('produtores')
        .getFullList({ filter: `empresa = "${empresa.id}"`, sort: 'nome' }),
      pb
        .collection('linhas_negocio')
        .getFullList({ filter: `empresa = "${empresa.id}" && ativa = true`, sort: 'nome' }),
    ])
      .then(([rasc, prods, lins]) => {
        setR(rasc)
        setProdutores(prods.map((p) => ({ id: p.id, nome: p.nome })))
        setLinhas(lins.map((l) => ({ id: l.id, nome: l.nome })))
        const p = rasc.proposta ?? {}
        setProdutor(rasc.produtor || p.produtor || '')
        setAssuntos(p.assuntos_tratados || '')
        setDestino(p.destino || '')
        setMotivo(p.motivo_sem_oportunidade || '')
        setOportunidades(
          (p.oportunidades ?? []).map((o) => ({
            linha_negocio: o.linha_negocio || '',
            descricao: o.descricao || '',
            proxima_acao: o.proxima_acao || '',
            proxima_acao_data: o.proxima_acao_data || '',
          })),
        )
        if (!p.oportunidades || p.oportunidades.length === 0) {
          setOportunidades([
            { linha_negocio: '', descricao: '', proxima_acao: '', proxima_acao_data: '' },
          ])
        }
      })
      .catch(() => setErro('Não foi possível carregar o rascunho.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, empresa?.id])

  const incerto = (campo: string) => (r?.proposta?.campos_incertos ?? []).includes(campo)

  const confirmar = async () => {
    if (!r) return
    setErro('')
    const dados = prepararDados(r, {
      produtor,
      assuntos_tratados: assuntos,
      destino,
      oportunidades,
      motivo_sem_oportunidade: motivo,
    })
    if ('erro' in dados) {
      setErro(dados.erro)
      return
    }
    setSalvando(true)
    try {
      await confirmacaoService.confirmar(r, dados)
      toast({ title: 'Visita confirmada', description: 'O registro entrou na ficha do produtor.' })
      navigate('/rascunhos')
    } catch (e: unknown) {
      const msg =
        (e as { response?: { message?: string } })?.response?.message ||
        (e as { message?: string })?.message ||
        'Não foi possível confirmar. Tente de novo.'
      setErro(msg)
    } finally {
      setSalvando(false)
    }
  }

  const descartar = async () => {
    if (!r) return
    if (!window.confirm('Descartar este rascunho? Ele não entra no histórico.')) return
    try {
      await rascunhosService.descartar(r.id)
      toast({ title: 'Rascunho descartado' })
      navigate('/rascunhos')
    } catch {
      setErro('Não foi possível descartar.')
    }
  }

  if (erro && !r)
    return (
      <div className="container mx-auto py-6 px-4">
        <p className="text-destructive">{erro}</p>
      </div>
    )
  if (!r)
    return (
      <div className="container mx-auto py-6 px-4">
        <p>Carregando…</p>
      </div>
    )
  if (r.status === 'confirmado') {
    return (
      <div className="container mx-auto py-6 px-4 space-y-3">
        <p>Este rascunho já foi confirmado e virou visita.</p>
        <Button onClick={() => navigate('/rascunhos')}>Voltar</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Revisar pós-visita</h1>
        <p className="text-sm text-muted-foreground">
          Confira o que a IA entendeu, corrija o que estiver errado e confirme. Nada entra no
          histórico sem a sua confirmação.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Transcrição · {ROTULO_STATUS[r.status]}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">
            {r.transcricao || r.texto_original || '(sem texto)'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Produtor</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="produtor">
            Produtor{' '}
            {incerto('produtor') && (
              <span className="text-destructive">· a IA não identificou, escolha</span>
            )}
          </Label>
          <select
            id="produtor"
            className="w-full border rounded-md p-2 mt-1"
            value={produtor}
            onChange={(e) => setProdutor(e.target.value)}
          >
            <option value="">Escolha o produtor</option>
            {produtores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">O que foi conversado</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={assuntos}
            onChange={(e) => setAssuntos(e.target.value)}
            placeholder="Assuntos tratados na visita"
            rows={3}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Próximo passo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            className="w-full border rounded-md p-2"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
          >
            <option value="">Escolha o próximo passo</option>
            <option value="nova_oportunidade">Abrir nova oportunidade</option>
            <option value="oportunidade_atualizada">Atualizar oportunidade existente</option>
            <option value="sem_oportunidade">Sem oportunidade agora</option>
          </select>

          {destino === 'nova_oportunidade' && (
            <div className="space-y-3">
              {oportunidades.map((o, i) => (
                <div key={i} className="border rounded-md p-3 space-y-2">
                  <div>
                    <Label>Linha de negócio</Label>
                    <select
                      className="w-full border rounded-md p-2 mt-1"
                      value={o.linha_negocio}
                      onChange={(e) => {
                        const n = [...oportunidades]
                        n[i] = { ...o, linha_negocio: e.target.value }
                        setOportunidades(n)
                      }}
                    >
                      <option value="">Escolha</option>
                      {linhas.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input
                      className="mt-1"
                      value={o.descricao}
                      onChange={(e) => {
                        const n = [...oportunidades]
                        n[i] = { ...o, descricao: e.target.value }
                        setOportunidades(n)
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Label>Próxima ação</Label>
                      <Input
                        className="mt-1"
                        value={o.proxima_acao}
                        onChange={(e) => {
                          const n = [...oportunidades]
                          n[i] = { ...o, proxima_acao: e.target.value }
                          setOportunidades(n)
                        }}
                      />
                    </div>
                    <div>
                      <Label>Data</Label>
                      <Input
                        type="date"
                        className="mt-1"
                        value={o.proxima_acao_data}
                        onChange={(e) => {
                          const n = [...oportunidades]
                          n[i] = { ...o, proxima_acao_data: e.target.value }
                          setOportunidades(n)
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {destino === 'sem_oportunidade' && (
            <div>
              <Label>Motivo</Label>
              <select
                className="w-full border rounded-md p-2 mt-1"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              >
                <option value="">Escolha o motivo</option>
                <option value="sem_interesse_agora">Sem interesse agora</option>
                <option value="sem_perfil">Sem perfil para a Agrospy</option>
                <option value="atendido_por_concorrente">Atendido por concorrente</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {erro && (
        <p className="text-sm text-destructive" role="alert">
          {erro}
        </p>
      )}

      <div className="flex gap-2">
        <Button onClick={confirmar} disabled={salvando}>
          {salvando ? 'Confirmando…' : 'Confirmar visita'}
        </Button>
        <Button
          variant="outline"
          className="text-destructive"
          onClick={descartar}
          disabled={salvando}
        >
          Descartar
        </Button>
        <Button variant="ghost" onClick={() => navigate('/rascunhos')} disabled={salvando}>
          Voltar
        </Button>
      </div>
    </div>
  )
}
