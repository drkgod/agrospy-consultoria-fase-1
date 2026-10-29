// FASE 2 — SPEC-2-001 (task 6b4bcbde): botão "Gravar pós-visita".
// Grava pelo microfone e:
//  - com internet: cria o rascunho na hora e chama /processar;
//  - sem internet: guarda o áudio no aparelho como "aguardando envio" e sobe sozinho
//    quando a conexão volta (uma vez só — chave_dedup = id_local).
// Usado na tela inicial, na ficha do produtor e na tela Rascunhos.
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { empresasService } from '@/services/empresas'
import { audioOffline } from '@/services/audio-offline'
import pb from '@/lib/pocketbase/client'

interface Props {
  produtor?: string
  produtorNome?: string
}

export default function GravarPosVisita({ produtor, produtorNome }: Props) {
  const empresa = empresasService.getAtiva()
  const { toast } = useToast()
  const [aberto, setAberto] = useState(false)
  const [gravando, setGravando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const [pendentes, setPendentes] = useState(0)
  const gravador = useRef<MediaRecorder | null>(null)
  const pedacos = useRef<Blob[]>([])
  const timer = useRef<number | null>(null)

  const usuarioId = pb.authStore.model?.id ?? ''

  const atualizarPendentes = async () => {
    if (!usuarioId) return
    setPendentes(await audioOffline.contarPendentes(usuarioId))
  }

  useEffect(() => {
    atualizarPendentes()
    // Sobe sozinho quando a conexão volta (RN-34).
    const aoVoltar = async () => {
      if (!usuarioId || !navigator.onLine) return
      const r = await audioOffline.sincronizar(usuarioId)
      if (r.enviados > 0) {
        toast({
          title: 'Gravação enviada',
          description: `${r.enviados} gravação(ões) agora estão em Rascunhos para revisar.`,
        })
      }
      atualizarPendentes()
    }
    window.addEventListener('online', aoVoltar)
    if (navigator.onLine && usuarioId) aoVoltar()
    return () => window.removeEventListener('online', aoVoltar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId])

  const iniciar = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : ''
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      pedacos.current = []
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) pedacos.current.push(ev.data)
      }
      rec.start()
      gravador.current = rec
      setGravando(true)
      setSegundos(0)
      timer.current = window.setInterval(() => setSegundos((s) => s + 1), 1000)
    } catch {
      toast({
        title: 'Não consegui usar o microfone',
        description: 'Verifique a permissão de microfone do navegador.',
        variant: 'destructive',
      })
    }
  }

  const parar = async () => {
    const rec = gravador.current
    if (!rec) return
    setEnviando(true)
    const fim = new Promise<void>((resolve) => {
      rec.onstop = () => resolve()
    })
    rec.stop()
    await fim
    if (timer.current) window.clearInterval(timer.current)
    setGravando(false)
    rec.stream.getTracks().forEach((t) => t.stop())
    const blob = new Blob(pedacos.current, { type: pedacos.current[0]?.type || 'audio/mp4' })
    gravador.current = null

    if (blob.size === 0) {
      setEnviando(false)
      setAberto(false)
      return
    }

    if (!empresa || !usuarioId) {
      setEnviando(false)
      return
    }

    try {
      if (!navigator.onLine) {
        // Sem internet: fica no aparelho (CA-2-01).
        await audioOffline.guardar(blob, usuarioId, empresa.id, produtor)
        toast({
          title: 'Gravação guardada no celular',
          description: 'Vai subir sozinha quando a internet voltar.',
        })
      } else {
        const form = new FormData()
        const chave = audioOffline.novoIdLocal()
        form.append('empresa', empresa.id)
        form.append('autor', usuarioId)
        form.append('origem', 'app_audio')
        form.append('chave_dedup', chave)
        form.append('id_local', chave)
        form.append('criado_em_aparelho', new Date().toISOString())
        if (produtor) form.append('produtor', produtor)
        form.append('midia', blob, 'pos-visita.m4a')
        const criado = await pb.collection('rascunhos').create(form)
        toast({ title: 'Gravado', description: 'Preparando o rascunho…' })
        // Processa em seguida; se falhar, a rotina de 10 minutos assume.
        pb.send(`/backend/v1/rascunhos/${criado.id}/processar`, { method: 'POST', body: {} }).catch(
          () => null,
        )
      }
      setAberto(false)
      await atualizarPendentes()
    } catch {
      // Falha de rede no meio do envio: guarda no aparelho para não perder o áudio.
      await audioOffline.guardar(blob, usuarioId, empresa.id, produtor)
      toast({
        title: 'Guardado no celular',
        description: 'Não consegui enviar agora. Vai subir quando a conexão melhorar.',
      })
      setAberto(false)
      await atualizarPendentes()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setAberto(true)}>
          Gravar pós-visita
        </Button>
        {pendentes > 0 && (
          <span className="text-xs text-muted-foreground">
            {pendentes} gravação{pendentes > 1 ? 'ões' : ''} aguardando envio
          </span>
        )}
      </div>

      <Dialog open={aberto} onOpenChange={(v) => !gravando && setAberto(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gravar pós-visita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {produtorNome && <p className="text-sm text-muted-foreground">{produtorNome}</p>}
            <p className="text-sm">
              Fale o que foi conversado, o que ficou combinado e quando você volta. Pode gravar sem
              internet.
            </p>
            {gravando && (
              <p className="text-2xl font-bold tabular-nums">
                {String(Math.floor(segundos / 60)).padStart(2, '0')}:
                {String(segundos % 60).padStart(2, '0')}
              </p>
            )}
            <div className="flex gap-2">
              {!gravando && (
                <Button onClick={iniciar} disabled={enviando}>
                  {enviando ? 'Enviando…' : 'Começar a gravar'}
                </Button>
              )}
              {gravando && (
                <Button variant="destructive" onClick={parar}>
                  Parar e enviar
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => setAberto(false)}
                disabled={gravando || enviando}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
