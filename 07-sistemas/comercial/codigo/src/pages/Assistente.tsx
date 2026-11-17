// FASE 2 — SPEC-2-003 (task 864c6848): tela "Assistente" dentro do app.
//
// O vendedor pergunta por texto e recebe resposta só do que ele pode ver na empresa
// ativa. Um pós-visita escrito vira rascunho para confirmar (nunca entra direto).
// Sem internet: aviso e atalho para "Gravar pós-visita" (RN-45).
//
// A tela NÃO fala com o modelo: ela chama a rota /assistente/perguntar, que aplica a
// matriz de acesso e é a única que escreve (rascunho). O agente só lê.
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { empresasService } from '@/services/empresas'
import pb from '@/lib/pocketbase/client'

interface Link {
  rotulo: string
  url: string
}

interface Fala {
  papel: 'voce' | 'assistente'
  texto: string
  links?: Link[]
  tipo?: string
  hora: string
}

const VERSAO_TELA = '2-003 · 2026-11-09 12:15 · voz-corrigida'

export default function Assistente() {
  const empresa = empresasService.getAtiva()
  const navigate = useNavigate()
  const [texto, setTexto] = useState('')
  const [falas, setFalas] = useState<Fala[]>([])
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [online, setOnline] = useState(navigator.onLine)
  const fim = useRef<HTMLDivElement | null>(null)
  // ---- voz (SPEC-2-003, task fcbe8d32) ----
  const [gravando, setGravando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const gravador = useRef<MediaRecorder | null>(null)
  const pedacos = useRef<Blob[]>([])
  const cronometro = useRef<number | null>(null)

  const usuarioId = pb.authStore.model?.id ?? ''

  useEffect(() => {
    const liga = () => setOnline(true)
    const desliga = () => setOnline(false)
    window.addEventListener('online', liga)
    window.addEventListener('offline', desliga)
    return () => {
      window.removeEventListener('online', liga)
      window.removeEventListener('offline', desliga)
    }
  }, [])

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: 'smooth' })
  }, [falas, enviando])

  if (!empresa) return <Navigate to="/escolher-empresa" replace />

  const agora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const enviar = async (textoDireto?: string) => {
    const t = (textoDireto ?? texto).trim()
    if (!t || enviando) return
    if (!online) {
      setErro('Sem internet. Gravar o pós-visita pelo botão abaixo — ele sobe depois.')
      return
    }
    setErro('')
    setTexto('')
    setFalas((f) => [...f, { papel: 'voce', texto: t, hora: agora() }])
    setEnviando(true)
    try {
      // id_mensagem: a mesma mensagem não pode gerar dois rascunhos (RN-33).
      const idMensagem =
        usuarioId + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
      const r = (await pb.send('/backend/v1/assistente/perguntar', {
        method: 'POST',
        body: { empresa: empresa.id, texto: t, id_mensagem: idMensagem },
      })) as {
        tipo?: string
        resposta?: string
        links?: Link[]
      }
      setFalas((f) => [
        ...f,
        {
          papel: 'assistente',
          texto: String(r?.resposta || 'Não consegui responder agora.'),
          links: Array.isArray(r?.links) ? r.links : [],
          tipo: r?.tipo,
          hora: agora(),
        },
      ])
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? e)
      setErro(
        /fetch|network|failed/i.test(msg)
          ? 'Não consegui consultar agora. Verifique a internet e tente de novo.'
          : msg || 'Não consegui consultar agora.',
      )
    } finally {
      setEnviando(false)
    }
  }

  /** Grava a pergunta em áudio (SPEC-2-003, task fcbe8d32). */
  const comecarGravacao = async () => {
    setErro('')
    if (!online) {
      setErro('Sem internet. Grave o pós-visita pelo botão abaixo — ele sobe depois.')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setErro('Este navegador não deixa gravar áudio. Escreva a pergunta.')
      return
    }
    try {
      const fluxo = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(fluxo)
      pedacos.current = []
      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) pedacos.current.push(ev.data)
      }
      mr.onstop = async () => {
        // Solta o microfone assim que para de gravar.
        fluxo.getTracks().forEach((t) => t.stop())
        if (cronometro.current) {
          window.clearInterval(cronometro.current)
          cronometro.current = null
        }
        setGravando(false)
        setSegundos(0)
        const blob = new Blob(pedacos.current, { type: mr.mimeType || 'audio/mp4' })
        pedacos.current = []
        if (blob.size < 1000) {
          setErro('A gravação ficou vazia. Tente de novo.')
          return
        }
        await enviarAudio(blob)
      }
      gravador.current = mr
      mr.start()
      setGravando(true)
      setSegundos(0)
      cronometro.current = window.setInterval(() => {
        setSegundos((s) => {
          // Limite da spec: 60 segundos.
          if (s + 1 >= 60) {
            try {
              mr.stop()
            } catch {
              /* já parado */
            }
            return 60
          }
          return s + 1
        })
      }, 1000)
    } catch {
      setErro('Não consegui usar o microfone. Verifique a permissão do app.')
      setGravando(false)
    }
  }

  const pararGravacao = () => {
    try {
      gravador.current?.stop()
    } catch {
      setGravando(false)
    }
  }

  /** Sobe o áudio para /assistente/voz e usa o texto devolvido como pergunta. */
  const enviarAudio = async (blob: Blob) => {
    setEnviando(true)
    setErro('')
    try {
      const fd = new FormData()
      const ext = (blob.type || '').indexOf('mp4') >= 0 ? 'm4a' : 'webm'
      fd.append('audio', blob, 'pergunta.' + ext)
      // A empresa vai no mesmo envio: a rota confere o vínculo do usuário com ela.
      fd.append('empresa', empresa.id)
      const r = (await pb.send('/backend/v1/assistente/voz', {
        method: 'POST',
        body: fd,
      })) as { ok?: boolean; texto?: string; erro?: string }
      if (!r?.ok || !r?.texto) {
        setErro(String(r?.erro || 'Não entendi o áudio. Tente escrever.'))
        return
      }
      // Mostra o que foi entendido e já responde, como se tivesse sido escrito.
      await enviar(String(r.texto))
    } catch (e: unknown) {
      setErro(String((e as { message?: string })?.message ?? e) || 'Falha ao enviar o áudio.')
    } finally {
      setEnviando(false)
    }
  }

  const perguntasProntas = [
    'Minhas ações de amanhã',
    'Minhas ações da semana',
    'O que conversei com o produtor TESTE — Produtor A',
  ]

  return (
    <div className="container mx-auto py-6 px-4 space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Assistente</h1>
        <p className="text-sm text-muted-foreground">
          Pergunte sobre a sua carteira ou escreva um pós-visita. O pós-visita vira rascunho para
          você conferir — nada entra no histórico sem confirmação.
        </p>
        <p className="text-[11px] text-muted-foreground">
          Versão da tela: <span className="font-mono">{VERSAO_TELA}</span>
        </p>
      </div>

      {!online && (
        <Card className="border-amber-500">
          <CardContent className="pt-4 space-y-2">
            <p className="text-sm">
              <strong>Sem internet.</strong> O assistente precisa de conexão para responder. Grave o
              pós-visita agora — ele fica guardado e sobe quando o sinal voltar.
            </p>
            <Button size="sm" onClick={() => navigate('/pendencias')}>
              Gravar pós-visita
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Conversa</CardTitle>
          <CardDescription>{empresa.nome}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {falas.length === 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Experimente:</p>
              <div className="flex flex-wrap gap-2">
                {perguntasProntas.map((p) => (
                  <Button
                    key={p}
                    variant="outline"
                    size="sm"
                    onClick={() => setTexto(p)}
                    type="button"
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {falas.map((f, i) => (
            <div
              key={i}
              className={
                f.papel === 'voce'
                  ? 'rounded-lg bg-muted p-2 text-sm ml-8'
                  : 'rounded-lg border p-2 text-sm mr-8'
              }
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={f.papel === 'voce' ? 'secondary' : 'default'}>
                  {f.papel === 'voce' ? 'Você' : 'Assistente'}
                </Badge>
                <span className="text-[11px] text-muted-foreground">{f.hora}</span>
                {f.tipo === 'pos_visita' && <Badge variant="outline">rascunho</Badge>}
                {f.tipo === 'pos_visita_recusado' && <Badge variant="outline">perfil</Badge>}
              </div>
              <p className="whitespace-pre-wrap">{f.texto}</p>
              {f.links && f.links.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {f.links.map((l) => (
                    <Button
                      key={l.url}
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(l.url)}
                      type="button"
                    >
                      {l.rotulo}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {enviando && <p className="text-sm text-muted-foreground">Consultando…</p>}
          {erro && (
            <p className="text-sm text-destructive" role="alert">
              {erro}
            </p>
          )}
          <div ref={fim} />
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Pergunte ou escreva o pós-visita…"
          rows={3}
          onKeyDown={(e) => {
            // Enter envia; Shift+Enter quebra linha (uso no celular é mais rápido).
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              enviar()
            }
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => enviar()} disabled={enviando || gravando || !texto.trim()}>
            {enviando ? 'Enviando…' : 'Enviar'}
          </Button>
          {!gravando ? (
            <Button variant="secondary" onClick={comecarGravacao} disabled={enviando} type="button">
              🎤 Perguntar por voz
            </Button>
          ) : (
            <Button variant="destructive" onClick={pararGravacao} type="button">
              Parar ({segundos}s)
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/rascunhos')} type="button">
            Ver rascunhos
          </Button>
        </div>
        {gravando && (
          <p className="text-xs text-muted-foreground">
            Gravando… fale a pergunta e toque em Parar (máximo 60 segundos).
          </p>
        )}
      </div>
    </div>
  )
}
