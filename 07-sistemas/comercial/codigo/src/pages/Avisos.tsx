// FASE 2 — SPEC-2-002 (task bdca5efe): tela "Avisos".
// Existe sempre no app e não depende da permissão do celular (decisão da SPEC).
// Cada pessoa vê só os próprios avisos; tocar abre a oportunidade.
// Aqui também ficam a configuração do Administrador e o desligar da cópia (CA-2-09).
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { empresasService } from '@/services/empresas'
import { vinculosService } from '@/services/vinculos'
import { avisosService, type Aviso } from '@/services/avisos'
import { pushService } from '@/services/push'
import pb from '@/lib/pocketbase/client'

const ROTULO: Record<string, string> = {
  do_dia: 'Para hoje',
  atraso: 'Atrasada',
  copia_gestor: 'Cópia ao gestor',
}

// Muda a cada publicação. Serve para saber se o celular está com a versão nova ou
// ainda em cache — sem isso, uma rodada inteira de teste foi perdida.
const VERSAO_TELA = '2-002 · 2026-11-02 12:40 · gesto-unico'

export default function Avisos() {
  const empresa = empresasService.getAtiva()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [perfil, setPerfil] = useState('')
  const [lista, setLista] = useState<Aviso[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [config, setConfig] = useState<Record<string, unknown> | null>(null)
  const [copiaDesligada, setCopiaDesligada] = useState(false)
  const [pushAtivo, setPushAtivo] = useState(false)
  const [mexendoPush, setMexendoPush] = useState(false)
  const [podePush, setPodePush] = useState<{ ok: boolean; motivo: string }>({
    ok: true,
    motivo: '',
  })
  const [pushErro, setPushErro] = useState('')
  const [diag, setDiag] = useState<Record<string, string>>({})
  const [idReal, setIdReal] = useState<Record<string, string>>({})
  const [lendoId, setLendoId] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [estado, setEstado] = useState<Record<string, string>>({})
  const [lendoEstado, setLendoEstado] = useState(false)

  const usuarioId = pb.authStore.model?.id ?? ''

  useEffect(() => {
    if (!empresa) return
    let vivo = true
    vinculosService
      .listarDoUsuario()
      .then((vs) => {
        if (vivo) setPerfil(vs.find((v) => v.empresa === empresa.id)?.perfil ?? '')
      })
      .catch(() => {})

    avisosService
      .listar()
      .then((as) => {
        if (vivo) setLista(as)
      })
      .catch(() => {
        if (vivo) setErro('Não foi possível carregar os avisos.')
      })
      .finally(() => {
        if (vivo) setCarregando(false)
      })

    // Configuração (visível a quem tem vínculo; só Administrador edita).
    pb.collection('config_avisos')
      .getFirstListItem(`empresa = "${empresa.id}"`)
      .then((c) => {
        if (vivo) setConfig(c)
      })
      .catch(() => {
        if (vivo) setConfig(null)
      })

    // Preferência de cópia do próprio usuário.
    pb.collection('preferencias_avisos')
      .getFirstListItem(`usuario = "${usuarioId}" && empresa = "${empresa.id}"`)
      .then((p) => {
        if (vivo) setCopiaDesligada(!!p.copia_desligada)
      })
      .catch(() => {
        if (vivo) setCopiaDesligada(false)
      })

    setPodePush(pushService.podeAtivar())
    setDiag(pushService.diagnostico())
    // Pré-carrega o SDK e o App ID ao abrir a tela: no Safari a inscrição só nasce
    // dentro do gesto do usuário, e qualquer await entre o toque e o optIn faz o
    // gesto expirar (foi o `inscricao no navegador: NAO` de 02/11 12:25).
    pushService.preparar().catch(() => {})
    pushService
      .ativo(usuarioId)
      .then((a) => {
        if (!vivo) return
        setPushAtivo(a)
        // RELIGA O APARELHO A CADA ABERTURA (02/11).
        // Os avisos das 07:00 saíram com successful=1 no OneSignal e não apareceram.
        // O único envio que comprovadamente chegou foi o que foi precedido de um
        // "Sincronizar". Conclusão: a inscrição fica defasada quando o app passa tempo
        // fechado. Religar na abertura mantém o vínculo vivo antes do envio do dia.
        // Silencioso de propósito: não mexe na tela nem pede nada ao usuário.
        if (a) {
          pushService
            .sincronizarAparelho(usuarioId)
            .then((r) => {
              if (vivo && Object.keys(r).length > 0) setDiag(pushService.diagnostico())
            })
            .catch(() => {})
        }
      })
      .catch(() => {})

    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa?.id, usuarioId])

  const alternarPush = async () => {
    setMexendoPush(true)
    setPushErro('')
    try {
      if (pushAtivo) {
        await pushService.desativar(usuarioId)
        setPushAtivo(false)
        toast({ title: 'Avisos desativados neste aparelho' })
      } else {
        await pushService.ativar(usuarioId)
        setPushAtivo(true)
        toast({ title: 'Avisos ativados', description: 'Você vai receber no celular.' })
      }
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? 'Os avisos continuam aparecendo na lista.'
      setPushErro(msg)
      toast({
        title: 'Não foi possível ativar',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setMexendoPush(false)
      setDiag(pushService.diagnostico())
      setPodePush(pushService.podeAtivar())
    }
  }

  if (!empresa) return <Navigate to="/escolher-empresa" replace />

  const abrir = async (a: Aviso) => {
    if (!a.lido_em) {
      avisosService.marcarLido(a.id).catch(() => null)
    }
    navigate(`/produtores/${a.expand?.oportunidade?.produtor ?? ''}`)
  }

  const marcarTodos = async () => {
    const naoLidos = lista.filter((a) => !a.lido_em).map((a) => a.id)
    if (naoLidos.length === 0) return
    await avisosService.marcarTodosLidos(naoLidos)
    setLista(await avisosService.listar())
    toast({ title: 'Todos marcados como lidos' })
  }

  const salvarConfig = async (campo: string, valor: unknown) => {
    if (!config) return
    try {
      await pb.collection('config_avisos').update(String(config.id), { [campo]: valor })
      toast({ title: 'Configuração salva' })
    } catch {
      toast({ title: 'Só o Administrador pode mudar.', variant: 'destructive' })
    }
  }

  const alternarCopia = async () => {
    const novo = !copiaDesligada
    try {
      const existente = await pb
        .collection('preferencias_avisos')
        .getFirstListItem(`usuario = "${usuarioId}" && empresa = "${empresa.id}"`)
        .catch(() => null)
      if (existente) {
        await pb.collection('preferencias_avisos').update(existente.id, { copia_desligada: novo })
      } else {
        await pb.collection('preferencias_avisos').create({
          usuario: usuarioId,
          empresa: empresa.id,
          copia_desligada: novo,
        })
      }
      setCopiaDesligada(novo)
      toast({ title: novo ? 'Cópia desligada' : 'Cópia ligada' })
    } catch {
      toast({ title: 'Não foi possível salvar a preferência.', variant: 'destructive' })
    }
  }

  /**
   * Lê o ID real da inscrição no aparelho e compara com o do servidor.
   * Existe porque o painel "Ver o que o aparelho está reportando" mostra "sem
   * inscrição" em toda abertura nova (o SDK só carrega ao tocar em Ativar), e esse
   * sinal não distingue aparelho bom de aparelho quebrado.
   */
  const lerIdDoAparelho = async () => {
    setLendoId(true)
    try {
      setIdReal(await pushService.idDoAparelho(usuarioId))
    } catch (e: unknown) {
      setIdReal({ erro: String((e as { message?: string })?.message ?? e) })
    } finally {
      setLendoId(false)
    }
  }

  /**
   * Conserta o vínculo aparelho ⇄ servidor. Substitui o "religar" manual: o servidor
   * estava enviando para uma inscrição órfã (nasceu sob o worker antigo) e o OneSignal
   * aceitava sem entregar. Aqui o ID é lido do aparelho e gravado no lugar.
   */
  const estadoCompleto = async () => {
    setLendoEstado(true)
    try {
      setEstado(await pushService.estadoCompleto())
    } catch (e: unknown) {
      setEstado({ erro: String((e as { message?: string })?.message ?? e) })
    } finally {
      setLendoEstado(false)
    }
  }

  const sincronizar = async () => {
    setSincronizando(true)
    try {
      const r = await pushService.sincronizarAparelho(usuarioId)
      setIdReal(r)
      setPushAtivo(r.estado === 'sincronizado' || String(r.estado || '').indexOf('CORRIGIDO') === 0)
      setDiag(pushService.diagnostico())
    } catch (e: unknown) {
      setIdReal({ erro: String((e as { message?: string })?.message ?? e) })
    } finally {
      setSincronizando(false)
    }
  }

  /**
   * Descarta a inscrição e cria outra. Só isto conserta o caso em que a inscrição
   * existe no servidor mas nenhum service worker do aparelho a escuta.
   */
  const reativar = async () => {
    setSincronizando(true)
    try {
      const r = await pushService.reativar(usuarioId)
      setIdReal(r)
      // Comparação sem depender de maiúscula/minúscula: a versão anterior procurava
      // 'RECRIADO' e o retorno era 'recriado (mesmo id)' — o toast dizia "não foi
      // possível reativar" mesmo quando o estado era bom. Bug meu, em 02/11.
      const estado = String(r.estado || '').toUpperCase()
      const ok = estado.indexOf('RECRIADO') === 0 || estado.indexOf('OK') === 0
      setPushAtivo(ok)
      setDiag(pushService.diagnostico())
      toast({
        title: ok ? 'Avisos reativados neste celular' : 'Não foi possível reativar',
        description: ok ? 'Vou testar a entrega agora.' : String(r.estado || r.erro || ''),
        variant: ok ? undefined : 'destructive',
      })
    } catch (e: unknown) {
      setIdReal({ erro: String((e as { message?: string })?.message ?? e) })
    } finally {
      setSincronizando(false)
    }
  }

  /**
   * Cria a inscrição dentro do gesto — o único caminho que o Safari aceita.
   * Sem optOut, sem limpeza, sem awaits pesados antes: o toque vai direto ao optIn.
   */
  const ativarAgora = async () => {
    setSincronizando(true)
    setPushErro('')
    try {
      const r = await pushService.ativarAgora(usuarioId)
      setIdReal(r)
      const ok = String(r.estado || '').indexOf('OK') === 0
      setPushAtivo(ok)
      setDiag(pushService.diagnostico())
      toast({
        title: ok ? 'Avisos ativados neste celular' : 'Não foi possível ativar',
        description: ok ? 'Vou testar a entrega agora.' : String(r.estado || ''),
        variant: ok ? undefined : 'destructive',
      })
    } catch (e: unknown) {
      setIdReal({ erro: String((e as { message?: string })?.message ?? e) })
    } finally {
      setSincronizando(false)
    }
  }

  /**
   * Limpa todo o estado de push do aparelho e recarrega o app.
   * É a versão em código do "remova o ícone e adicione de novo" — sem refazer a
   * instalação. Necessário porque o SDK devolve sempre o mesmo id mesmo quando a
   * inscrição local não existe (visto no iPhone em 02/11 12:15).
   */
  const limparPush = async () => {
    const confirmar = window.confirm(
      'Isso limpa os avisos deste celular e recarrega o app. Os avisos continuam aparecendo na lista. Continuar?',
    )
    if (!confirmar) return
    setSincronizando(true)
    try {
      const r = await pushService.limparTudo()
      setIdReal(r)
      setPushAtivo(false)
      // Recarrega para o worker registrar de novo e o SDK criar inscrição limpa.
      setTimeout(() => location.reload(), 1200)
    } catch (e: unknown) {
      setIdReal({ erro: String((e as { message?: string })?.message ?? e) })
      setSincronizando(false)
    }
  }

  const naoLidos = lista.filter((a) => !a.lido_em).length
  const ehAdmin = perfil === 'administrador'

  return (
    <div className="container mx-auto py-6 px-4 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Avisos</h1>
          <p className="text-sm text-muted-foreground">
            {naoLidos > 0 ? `${naoLidos} não lido${naoLidos > 1 ? 's' : ''}` : 'Tudo em dia.'}
          </p>
        </div>
        {naoLidos > 0 && (
          <Button variant="outline" size="sm" onClick={marcarTodos}>
            Marcar todos como lidos
          </Button>
        )}
      </div>

      {carregando && <p className="text-muted-foreground">Carregando…</p>}
      {!carregando && erro && (
        <div className="rounded-lg border border-destructive p-3" role="alert">
          <p className="text-sm text-destructive">{erro}</p>
        </div>
      )}
      {!carregando && !erro && lista.length === 0 && (
        <p className="text-muted-foreground">Nenhum aviso. As ações do dia aparecem aqui.</p>
      )}

      {lista.map((a) => (
        <Card key={a.id} className={a.lido_em ? 'opacity-60' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 flex-wrap">
              {a.texto_curto}
              <Badge variant={a.tipo === 'atraso' ? 'destructive' : 'secondary'}>
                {ROTULO[a.tipo] ?? a.tipo}
              </Badge>
              {!a.lido_em && <Badge>novo</Badge>}
            </CardTitle>
            <CardDescription>{a.detalhe}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" variant="outline" onClick={() => abrir(a)}>
              Abrir
            </Button>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Avisos no celular</CardTitle>
          <CardDescription>
            {pushAtivo
              ? 'Este aparelho está recebendo os avisos.'
              : 'No iPhone, o app precisa estar na tela inicial. O aviso mostra só "você tem 1 ação" — o produtor aparece ao abrir.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {!podePush.ok && (
            <p className="text-sm text-amber-700 dark:text-amber-500" role="status">
              {podePush.motivo}
            </p>
          )}
          {pushErro && (
            <p className="text-sm text-destructive" role="alert">
              {pushErro}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={lerIdDoAparelho} disabled={lendoId}>
              {lendoId ? 'Lendo…' : 'Ver o ID da inscrição'}
            </Button>
            <Button size="sm" onClick={ativarAgora} disabled={sincronizando}>
              {sincronizando ? 'Ativando…' : 'Ativar avisos no celular'}
            </Button>
            <Button variant="outline" size="sm" onClick={estadoCompleto} disabled={lendoEstado}>
              {lendoEstado ? 'Lendo…' : 'Estado do push neste celular'}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Toque em Ativar e, se o iPhone perguntar, toque em Permitir. Faça isso com o app aberto
            pelo ícone da Tela de Início.
          </p>
          {Object.keys(estado).length > 0 && (
            <div className="rounded-lg border p-2 text-xs space-y-0.5" role="status">
              {Object.entries(estado).map(([k, v]) => (
                <div key={k}>
                  <span className="font-medium">{k}:</span> {v}
                </div>
              ))}
            </div>
          )}
          {/* Mostra a versão que está rodando: sem isso não dava para saber se o
              celular pegou a publicação nova ou estava em cache. */}
          <p className="text-[11px] text-muted-foreground">
            Versão da tela: <span className="font-mono">{VERSAO_TELA}</span>
          </p>
          {Object.keys(idReal).length > 0 && (
            <div className="rounded-lg border p-2 text-xs space-y-0.5" role="status">
              {Object.entries(idReal).map(([k, v]) => (
                <div key={k}>
                  <span className="font-medium">{k}:</span> {v}
                </div>
              ))}
            </div>
          )}
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">Ver o que o aparelho está reportando</summary>
            <ul className="mt-1 space-y-0.5">
              {Object.entries(diag).map(([k, v]) => (
                <li key={k}>
                  <span className="font-medium">{k}:</span> {v}
                </li>
              ))}
            </ul>
          </details>
          <Button
            variant={pushAtivo ? 'outline' : 'default'}
            size="sm"
            onClick={alternarPush}
            disabled={mexendoPush || (!podePush.ok && !pushAtivo)}
          >
            {mexendoPush
              ? 'Aguarde…'
              : pushAtivo
                ? 'Desativar os avisos neste celular'
                : 'Ativar avisos no celular'}
          </Button>
        </CardContent>
      </Card>

      {(perfil === 'gestao' || ehAdmin) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cópia ao gestor</CardTitle>
            <CardDescription>
              Você recebe cópia dos avisos de atraso da equipe. Pode desligar a sua.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={alternarCopia}>
              {copiaDesligada ? 'Ligar a minha cópia' : 'Desligar a minha cópia'}
            </Button>
          </CardContent>
        </Card>
      )}

      {ehAdmin && config && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Configuração dos avisos</CardTitle>
            <CardDescription>Só o Administrador muda. Horário de Brasília.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="horario">Horário</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="horario"
                  type="time"
                  defaultValue={String(config.horario || '07:00')}
                  step={600}
                  onBlur={(e) => salvarConfig('horario', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="repetir">Repetir o atraso a cada (dias)</Label>
              <Input
                id="repetir"
                type="number"
                min={1}
                max={30}
                defaultValue={Number(config.repetir_atraso_dias || 3)}
                className="mt-1"
                onBlur={(e) => salvarConfig('repetir_atraso_dias', Number(e.target.value))}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => salvarConfig('ativo', !config.ativo)}
            >
              {config.ativo ? 'Desligar os avisos da empresa' : 'Ligar os avisos da empresa'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
