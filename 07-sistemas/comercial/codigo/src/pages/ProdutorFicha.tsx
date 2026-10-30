import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { empresasService } from '@/services/empresas'
import { produtoresService, ORIGENS, type Produtor } from '@/services/produtores'
import { propriedadesService, POSSES, type Propriedade } from '@/services/propriedades'
import { visitasService, type Visita } from '@/services/visitas'
import { destaqueService, type DestaqueRevisita } from '@/services/destaque-revisita'
import { filaOffline } from '@/services/fila-offline'
import pb from '@/lib/pocketbase/client'
import { oportunidadesService, type Oportunidade } from '@/services/oportunidades'
import { usuariosService, type UsuarioDaEmpresa } from '@/services/usuarios'
import { vinculosService } from '@/services/vinculos'
import AcaoOportunidadeForm from '@/components/AcaoOportunidadeForm'
import GravarPosVisita from '@/components/GravarPosVisita'

const VAZIO = {
  nome: '',
  documento: '',
  telefone: '',
  email: '',
  municipio: '',
  regional: '',
  origem: '',
  indicado_por: '',
  relacionamento: '',
  observacoes: '',
  nivel_tecnologia: '',
  tecnologias: '',
  // FASE 2 — perfil do produtor (SPEC-2-001)
  perfil_tecnologia: '',
  perfil_ap: '',
  perfil_estrutura: '',
  status_comercial: '',
  epoca_efetividade: '',
}

const NIVEIS = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'muito_alta', label: 'Muito alta' },
]

export default function ProdutorFicha() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const empresa = empresasService.getAtiva()
  // Deps estáveis por id: getAtiva() devolve objeto novo a cada render — depender do
  // objeto entra em loop de fetch e derruba a API com 429 (lição do /usuarios).
  const empresaId = empresa?.id ?? ''
  const [produtor, setProdutor] = useState<Produtor | null>(null)
  const [props, setProps] = useState<Propriedade[]>([])
  const [ehGestao, setEhGestao] = useState(false)
  const [novoProp, setNovoProp] = useState({
    nome: '',
    municipio: '',
    area_ha: '',
    posse: '',
    link_maps: '',
  })
  const [editando, setEditando] = useState(false)
  const [formEdicao, setFormEdicao] = useState(VAZIO)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [abrirTroca, setAbrirTroca] = useState(false)
  const [novoResp, setNovoResp] = useState('')
  const [usuarios, setUsuarios] = useState<UsuarioDaEmpresa[]>([])
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [destaque, setDestaque] = useState<DestaqueRevisita | null>(null)
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([])
  const [propEditando, setPropEditando] = useState<string | null>(null)
  const [formProp, setFormProp] = useState({
    nome: '',
    municipio: '',
    area_ha: '',
    posse: '',
    link_maps: '',
  })
  const [salvandoProp, setSalvandoProp] = useState(false)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)

  // Ação sobre oportunidade: concluir (resultado + próxima ação/data) ou reagendar (nova data).
  // O formulário virou componente (AcaoOportunidadeForm) — reuso na Minha carteira (SPEC-1-005).
  const [acaoOport, setAcaoOport] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !empresaId) return
    produtoresService
      .buscarPorId(id)
      .then((p) => {
        setProdutor(p)
        setFormEdicao({
          nome: p.nome,
          documento: p.documento,
          telefone: p.telefone,
          email: p.email,
          municipio: p.municipio,
          regional: p.regional,
          origem: p.origem,
          indicado_por: p.indicado_por,
          relacionamento: p.relacionamento,
          observacoes: p.observacoes,
          nivel_tecnologia: p.nivel_tecnologia,
          tecnologias: p.tecnologias,
          perfil_tecnologia: ((p as Record<string, unknown>).perfil_tecnologia as string) ?? '',
          perfil_ap: ((p as Record<string, unknown>).perfil_ap as string) ?? '',
          perfil_estrutura: ((p as Record<string, unknown>).perfil_estrutura as string) ?? '',
          status_comercial: ((p as Record<string, unknown>).status_comercial as string) ?? '',
          epoca_efetividade: ((p as Record<string, unknown>).epoca_efetividade as string) ?? '',
        })
        // FASE 2 (f2-004): destaque da revisita a partir do produtor carregado.
        destaqueService
          .montar(p)
          .then(setDestaque)
          .catch(() => {})
      })
      .catch(() => toast({ title: 'Produtor não encontrado.', variant: 'destructive' }))
    propriedadesService
      .listarDoProdutor(id)
      .then(setProps)
      .catch(() => {})
    visitasService
      .listarDoProdutor(id)
      .then(setVisitas)
      .catch(() => {})
    oportunidadesService
      .listarDoProdutor(id)
      .then(setOportunidades)
      .catch(() => {})

    vinculosService.listarDoUsuario().then((vs) => {
      const meu = vs.find((v) => v.empresa === empresaId)
      const gestao = meu?.perfil === 'gestao' || meu?.perfil === 'administrador'
      setEhGestao(gestao)
      if (gestao) {
        usuariosService
          .listarDaEmpresa(empresaId)
          .then(setUsuarios)
          .catch(() => {})
      }
    })
  }, [id, empresaId, toast])

  if (!empresa) return <Navigate to="/escolher-empresa" replace />
  if (!produtor)
    return <p className="container mx-auto py-8 px-4 text-muted-foreground">Carregando…</p>

  const origemLabel = ORIGENS.find((o) => o.value === produtor.origem)?.label ?? produtor.origem

  const abrirMaps = (link: string) => {
    if (!link) return
    const url = /^https?:\/\//i.test(link) ? link : `https://${link}`
    window.open(url, '_blank', 'noopener')
  }

  const addPropriedade = async () => {
    if (!novoProp.nome.trim()) {
      toast({ title: 'Informe o nome da propriedade.', variant: 'destructive' })
      return
    }
    // SPEC-1-004: sem conexão, a propriedade nova vai para a fila (CA-1-16).
    if (!navigator.onLine) {
      const usuarioId = pb.authStore.record?.id ?? ''
      await filaOffline.enfileirar(
        'propriedades',
        {
          nome: novoProp.nome.trim(),
          municipio: novoProp.municipio.trim() || produtor.municipio,
          area_ha: Number(novoProp.area_ha) || 0,
          posse: novoProp.posse || 'nao_informado',
          link_maps: novoProp.link_maps.trim(),
          produtor: produtor.id,
        },
        usuarioId,
        empresa.id,
      )
      toast({
        title: 'Sem conexão — propriedade salva no aparelho',
        description: 'Será enviada sozinha quando a internet voltar.',
      })
      setNovoProp({ nome: '', municipio: '', area_ha: '', posse: '', link_maps: '' })
      return
    }
    try {
      const criada = await propriedadesService.criar(
        {
          nome: novoProp.nome.trim(),
          municipio: novoProp.municipio.trim() || produtor.municipio,
          area_ha: Number(novoProp.area_ha) || 0,
          posse: novoProp.posse || 'nao_informado',
          link_maps: novoProp.link_maps.trim(),
          produtor: produtor.id,
        },
        empresa.id,
      )
      setProps([...props, criada])
      setNovoProp({ nome: '', municipio: '', area_ha: '', posse: '', link_maps: '' })
      toast({ title: 'Propriedade adicionada' })
    } catch {
      toast({ title: 'Não foi possível adicionar a propriedade.', variant: 'destructive' })
    }
  }

  const salvarEdicao = async () => {
    if (!formEdicao.nome.trim() || !formEdicao.municipio.trim() || !formEdicao.origem) {
      toast({ title: 'Preencha nome, município e origem.', variant: 'destructive' })
      return
    }
    if (
      (formEdicao.origem === 'indicacao_cliente' ||
        formEdicao.origem === 'indicacao_socio_parceiro') &&
      !formEdicao.indicado_por.trim()
    ) {
      toast({ title: 'Indicação exige quem indicou.', variant: 'destructive' })
      return
    }
    setSalvandoEdicao(true)
    try {
      await produtoresService.atualizar(produtor.id, {
        ...formEdicao,
        documento: formEdicao.documento.replace(/\D/g, ''),
      })
      const atualizado = await produtoresService.buscarPorId(produtor.id)
      setProdutor(atualizado)
      setFormEdicao({
        nome: atualizado.nome,
        documento: atualizado.documento,
        telefone: atualizado.telefone,
        email: atualizado.email,
        municipio: atualizado.municipio,
        regional: atualizado.regional,
        origem: atualizado.origem,
        indicado_por: atualizado.indicado_por,
        relacionamento: atualizado.relacionamento,
        observacoes: atualizado.observacoes,
        nivel_tecnologia: atualizado.nivel_tecnologia,
        tecnologias: atualizado.tecnologias,
        perfil_tecnologia:
          ((atualizado as Record<string, unknown>).perfil_tecnologia as string) ?? '',
        perfil_ap: ((atualizado as Record<string, unknown>).perfil_ap as string) ?? '',
        perfil_estrutura:
          ((atualizado as Record<string, unknown>).perfil_estrutura as string) ?? '',
        status_comercial:
          ((atualizado as Record<string, unknown>).status_comercial as string) ?? '',
        epoca_efetividade:
          ((atualizado as Record<string, unknown>).epoca_efetividade as string) ?? '',
      })
      setEditando(false)
      toast({ title: 'Produtor atualizado' })
    } catch (e: unknown) {
      const msg = String((e as { response?: { message?: string } })?.response?.message ?? '')
      toast({
        title: msg.includes('Já cadastrado') ? msg : 'Não foi possível salvar.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoEdicao(false)
    }
  }

  const salvarPropriedade = async (propId: string) => {
    if (!formProp.nome.trim()) {
      toast({ title: 'Informe o nome da propriedade.', variant: 'destructive' })
      return
    }
    setSalvandoProp(true)
    try {
      await propriedadesService.atualizar(propId, {
        nome: formProp.nome.trim(),
        municipio: formProp.municipio.trim(),
        area_ha: Number(formProp.area_ha) || 0,
        posse: formProp.posse || 'nao_informado',
        link_maps: formProp.link_maps.trim(),
      })
      const lista = await propriedadesService.listarDoProdutor(produtor.id)
      setProps(lista)
      setPropEditando(null)
      toast({ title: 'Propriedade atualizada' })
    } catch {
      toast({ title: 'Não foi possível salvar a propriedade.', variant: 'destructive' })
    } finally {
      setSalvandoProp(false)
    }
  }

  const excluirPropriedade = async (propId: string) => {
    setSalvandoProp(true)
    try {
      await propriedadesService.excluir(propId)
      setProps(props.filter((x) => x.id !== propId))
      setConfirmarExclusao(null)
      toast({ title: 'Propriedade excluída' })
    } catch {
      toast({
        title:
          'Não foi possível excluir. Você precisa ser Gestão/Administrador ou o responsável pelo produtor.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoProp(false)
    }
  }

  const confirmarTroca = async () => {
    if (!novoResp) return
    try {
      await produtoresService.atualizar(produtor.id, { responsavel: novoResp })
      setAbrirTroca(false)
      const atualizado = await produtoresService.buscarPorId(produtor.id)
      setProdutor(atualizado)
      toast({ title: 'Responsável alterado' })
    } catch {
      toast({ title: 'Não foi possível trocar o responsável.', variant: 'destructive' })
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{produtor.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {produtor.municipio}
            {produtor.documento ? ` · ${produtor.documento}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/produtores')}>
            Voltar
          </Button>
          <Button onClick={() => navigate(`/produtores/${produtor.id}/visita`)}>
            Registrar visita
          </Button>
          <GravarPosVisita produtor={produtor.id} produtorNome={produtor.nome} />
          <Button onClick={() => setEditando(true)}>Editar produtor</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Origem</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <Badge>{origemLabel}</Badge>
            {produtor.indicado_por && (
              <p>
                Indicado por: <strong>{produtor.indicado_por}</strong>
              </p>
            )}
            {produtor.relacionamento && <p>Próximo de: {produtor.relacionamento}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contato</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>Telefone: {produtor.telefone || '—'}</p>
            <p>E-mail: {produtor.email || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tecnologia</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              Nível:{' '}
              <strong>
                {NIVEIS.find((n) => n.value === produtor.nivel_tecnologia)?.label ??
                  'Não informado'}
              </strong>
            </p>
            {produtor.tecnologias && <p className="whitespace-pre-line">{produtor.tecnologias}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Responsável</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              {produtor.expand?.responsavel?.name || produtor.expand?.responsavel?.email || '—'}
            </p>
            {ehGestao && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNovoResp('')
                  setAbrirTroca(true)
                }}
              >
                Trocar responsável
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {produtor.observacoes && (
        <Card>
          <CardContent className="text-sm pt-4">{produtor.observacoes}</CardContent>
        </Card>
      )}

      {/* FASE 2 (f2-004) — destaque da revisita: o que levar para a próxima conversa. */}
      {destaque && (
        <Card className="border-primary/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Destaque para a próxima visita</CardTitle>
            <CardDescription>
              {destaque.naEpoca.length > 0
                ? `${destaque.naEpoca.length} demanda(s) atendível(is) agora${produtor.epoca_efetividade ? ` · época: ${produtor.epoca_efetividade}` : ''}`
                : 'Nenhuma demanda com época aberta neste momento'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {destaque.naEpoca.length > 0 && (
              <div className="space-y-1">
                <p className="font-medium">Demandas para tratar</p>
                {destaque.naEpoca.map((o) => (
                  <div key={o.id} className="rounded-md border p-2">
                    <p className="font-medium">{o.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      Próxima ação: {o.proxima_acao} ·{' '}
                      {String(o.proxima_acao_data).slice(0, 10).split('-').reverse().join('/')}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {destaque.ultimaConversa && (
              <div>
                <p className="font-medium">Última conversa</p>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {destaque.ultimaConversa}
                </p>
              </div>
            )}
            {destaque.necessidades && (
              <div>
                <p className="font-medium">Necessidades apontadas</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{destaque.necessidades}</p>
              </div>
            )}
            {destaque.acordos && (
              <div>
                <p className="font-medium">Acordos combinados</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{destaque.acordos}</p>
              </div>
            )}
            {!destaque.ultimaConversa && destaque.naEpoca.length === 0 && (
              <p className="text-muted-foreground">
                Ainda não há histórico suficiente. Registre a primeira visita para o destaque
                aparecer.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visitas ({visitas.length})</CardTitle>
          <CardDescription>Da mais recente para a mais antiga, com quem registrou.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {visitas.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma visita registrada.</p>
          )}
          {visitas.map((v) => (
            <div key={v.id} className="rounded-lg border p-3">
              <p className="text-sm font-medium">
                {(v.data || '').slice(0, 10)} ·{' '}
                {v.expand?.responsavel_visita?.name || v.expand?.responsavel_visita?.email || '—'}
              </p>
              <p className="text-sm whitespace-pre-line">{v.assuntos_tratados}</p>
              {v.destino === 'sem_oportunidade' && (
                <p className="text-xs text-muted-foreground mt-1">Sem oportunidade agora</p>
              )}
              {v.audio && (
                <audio controls src={visitasService.urlDoAudio(v)} className="w-full mt-2" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Oportunidades ({oportunidades.length})</CardTitle>
          <CardDescription>Abertas e com próxima ação datada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {oportunidades.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma oportunidade.</p>
          )}
          {oportunidades.map((o) =>
            acaoOport === o.id ? (
              <AcaoOportunidadeForm
                key={o.id}
                oportunidadeId={o.id}
                empresaId={empresa.id}
                proximaAcaoAtual={o.proxima_acao}
                proximaDataAtual={String(o.proxima_acao_data || '').slice(0, 10)}
                onSalvo={() => {
                  setAcaoOport(null)
                  oportunidadesService
                    .listarDoProdutor(produtor.id)
                    .then(setOportunidades)
                    .catch(() => {})
                }}
                onCancelar={() => setAcaoOport(null)}
              />
            ) : (
              <div key={o.id} className="rounded-lg border p-3">
                <p className="text-sm font-medium">
                  {o.expand?.linha_negocio?.nome ?? 'Linha'} · {o.descricao}
                </p>
                <p className="text-sm">
                  Próxima ação: {o.proxima_acao} —{' '}
                  <strong>{(o.proxima_acao_data || '').slice(0, 10)}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Responsável: {o.expand?.responsavel?.name || o.expand?.responsavel?.email || '—'}
                </p>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => setAcaoOport(o.id)}>
                    Concluir / Reagendar
                  </Button>
                </div>
              </div>
            ),
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Propriedades ({props.length})</CardTitle>
          <CardDescription>Áreas em hectares, município, posse e localização.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {props.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma propriedade cadastrada.</p>
          )}
          {props.map((p) =>
            propEditando === p.id ? (
              <div key={p.id} className="rounded-lg border p-3 space-y-2 bg-muted/40">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <Input
                    placeholder="Nome *"
                    value={formProp.nome}
                    onChange={(e) => setFormProp({ ...formProp, nome: e.target.value })}
                  />
                  <Input
                    placeholder="Município"
                    value={formProp.municipio}
                    onChange={(e) => setFormProp({ ...formProp, municipio: e.target.value })}
                  />
                  <Input
                    placeholder="Área (ha)"
                    type="number"
                    value={formProp.area_ha}
                    onChange={(e) => setFormProp({ ...formProp, area_ha: e.target.value })}
                  />
                  <select
                    aria-label="Posse"
                    value={formProp.posse}
                    onChange={(e) => setFormProp({ ...formProp, posse: e.target.value })}
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Posse</option>
                    {POSSES.map((x) => (
                      <option key={x.value} value={x.value}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Link do Google Maps (cole aqui)"
                    value={formProp.link_maps}
                    onChange={(e) => setFormProp({ ...formProp, link_maps: e.target.value })}
                    className="md:col-span-4"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPropEditando(null)}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={() => salvarPropriedade(p.id)} disabled={salvandoProp}>
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border p-3 gap-2"
              >
                <div>
                  <p className="font-medium">{p.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.municipio} · {p.area_ha || 0} ha ·{' '}
                    {POSSES.find((x) => x.value === p.posse)?.label ?? p.posse}
                  </p>
                  {p.link_maps && (
                    <button
                      type="button"
                      onClick={() => abrirMaps(p.link_maps)}
                      className="mt-1 text-sm text-blue-600 underline hover:text-blue-800"
                    >
                      Abrir no Google Maps ↗
                    </button>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPropEditando(p.id)
                      setFormProp({
                        nome: p.nome,
                        municipio: p.municipio,
                        area_ha: String(p.area_ha ?? ''),
                        posse: p.posse,
                        link_maps: p.link_maps ?? '',
                      })
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setConfirmarExclusao(p.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ),
          )}
          {confirmarExclusao && (
            <p className="text-sm text-destructive" role="alert">
              Excluir esta propriedade? Não dá para desfazer.{' '}
              <button
                type="button"
                className="underline font-medium"
                onClick={() => excluirPropriedade(confirmarExclusao)}
              >
                Confirmar exclusão
              </button>
              {' · '}
              <button
                type="button"
                className="underline"
                onClick={() => setConfirmarExclusao(null)}
              >
                Cancelar
              </button>
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Input
              placeholder="Nome *"
              value={novoProp.nome}
              onChange={(e) => setNovoProp({ ...novoProp, nome: e.target.value })}
            />
            <Input
              placeholder="Município"
              value={novoProp.municipio}
              onChange={(e) => setNovoProp({ ...novoProp, municipio: e.target.value })}
            />
            <Input
              placeholder="Área (ha)"
              type="number"
              value={novoProp.area_ha}
              onChange={(e) => setNovoProp({ ...novoProp, area_ha: e.target.value })}
            />
            <select
              aria-label="Posse"
              value={novoProp.posse}
              onChange={(e) => setNovoProp({ ...novoProp, posse: e.target.value })}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Posse</option>
              {POSSES.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>
            <Input
              placeholder="Link do Google Maps (cole aqui)"
              value={novoProp.link_maps}
              onChange={(e) => setNovoProp({ ...novoProp, link_maps: e.target.value })}
              className="md:col-span-4"
            />
          </div>
          <Button onClick={addPropriedade}>Adicionar propriedade</Button>
        </CardContent>
      </Card>

      {editando && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Editar produtor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <Input
                placeholder="Nome *"
                value={formEdicao.nome}
                onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })}
              />
              <Input
                placeholder="CPF/CNPJ"
                value={formEdicao.documento}
                onChange={(e) => setFormEdicao({ ...formEdicao, documento: e.target.value })}
              />
              <Input
                placeholder="Telefone"
                value={formEdicao.telefone}
                onChange={(e) => setFormEdicao({ ...formEdicao, telefone: e.target.value })}
              />
              <Input
                placeholder="E-mail"
                value={formEdicao.email}
                onChange={(e) => setFormEdicao({ ...formEdicao, email: e.target.value })}
              />
              <Input
                placeholder="Município *"
                value={formEdicao.municipio}
                onChange={(e) => setFormEdicao({ ...formEdicao, municipio: e.target.value })}
              />
              <Input
                placeholder="Regional"
                value={formEdicao.regional}
                onChange={(e) => setFormEdicao({ ...formEdicao, regional: e.target.value })}
              />
            </div>
            <select
              aria-label="Origem"
              value={formEdicao.origem}
              onChange={(e) => setFormEdicao({ ...formEdicao, origem: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Origem *</option>
              {ORIGENS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {(formEdicao.origem === 'indicacao_cliente' ||
              formEdicao.origem === 'indicacao_socio_parceiro') && (
              <Input
                placeholder="Quem indicou *"
                value={formEdicao.indicado_por}
                onChange={(e) => setFormEdicao({ ...formEdicao, indicado_por: e.target.value })}
              />
            )}
            <Input
              placeholder="Próximo de quem"
              value={formEdicao.relacionamento}
              onChange={(e) => setFormEdicao({ ...formEdicao, relacionamento: e.target.value })}
            />
            <Input
              placeholder="Observações"
              value={formEdicao.observacoes}
              onChange={(e) => setFormEdicao({ ...formEdicao, observacoes: e.target.value })}
            />
            <select
              aria-label="Nível de tecnologia"
              value={formEdicao.nivel_tecnologia}
              onChange={(e) => setFormEdicao({ ...formEdicao, nivel_tecnologia: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Nível de tecnologia: não informado</option>
              {NIVEIS.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Tecnologias: automações, agricultura de precisão, implementos (piloto automático, desligamento linha a linha, taxa variável…)"
              value={formEdicao.tecnologias}
              onChange={(e) => setFormEdicao({ ...formEdicao, tecnologias: e.target.value })}
              rows={4}
              className="w-full min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {/* FASE 2 — perfil do produtor (SPEC-2-001) */}
            <select
              aria-label="Adoção de tecnologia"
              value={formEdicao.perfil_tecnologia}
              onChange={(e) => setFormEdicao({ ...formEdicao, perfil_tecnologia: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Adoção de tecnologia: não informado</option>
              <option value="adepto">Adepto (usa e gosta)</option>
              <option value="parcial">Parcial (usa parte)</option>
              <option value="nao_adepto">Não adepto</option>
            </select>
            <select
              aria-label="Agricultura de precisão"
              value={formEdicao.perfil_ap}
              onChange={(e) => setFormEdicao({ ...formEdicao, perfil_ap: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Agricultura de precisão: não informado</option>
              <option value="faz">Já faz</option>
              <option value="fez">Já fez</option>
              <option value="nunca">Nunca fez</option>
            </select>
            <textarea
              placeholder="Equipamentos e estrutura que possui (ex.: piloto automático, plantadeira com desligamento, estação meteorológica…)"
              value={formEdicao.perfil_estrutura}
              onChange={(e) => setFormEdicao({ ...formEdicao, perfil_estrutura: e.target.value })}
              rows={3}
              className="w-full min-h-16 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <select
              aria-label="Classificação comercial"
              value={formEdicao.status_comercial}
              onChange={(e) => setFormEdicao({ ...formEdicao, status_comercial: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Classificação: não informado</option>
              <option value="potencial">Potencial</option>
              <option value="nao_potencial">Não potencial</option>
              <option value="cliente">Cliente</option>
            </select>
            <input
              placeholder="Época de maior efetividade (ex.: set-dez)"
              value={formEdicao.epoca_efetividade}
              onChange={(e) => setFormEdicao({ ...formEdicao, epoca_efetividade: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditando(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={salvarEdicao} disabled={salvandoEdicao}>
                {salvandoEdicao ? 'Salvando…' : 'Salvar alterações'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {abrirTroca && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trocar responsável</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              aria-label="Novo responsável"
              value={novoResp}
              onChange={(e) => setNovoResp(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Escolha o novo responsável</option>
              {usuarios
                .filter((u) => u.ativo)
                .map((u) => (
                  <option key={u.usuarioId} value={u.usuarioId}>
                    {u.nome || u.email}
                  </option>
                ))}
            </select>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setAbrirTroca(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={confirmarTroca}>
                Confirmar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
