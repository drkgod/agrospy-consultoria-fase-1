// SPEC-1-004 (task 4da366fe) — indicador de conexão no topo de todas as telas.
// Offline: banner "Sem conexão — N aguardando envio" + "Sincronizar agora".
// Ao reconectar (evento online do navegador): envia a fila e mostra "Enviado".
// Itens recusados pelo servidor: banner vermelho com atalho para Pendências de envio.
// Sem nada a mostrar e online: não renderiza nada (não polui a tela).
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { filaOffline } from '@/services/fila-offline'

export default function IndicadorConexao() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [online, setOnline] = useState(navigator.onLine)
  const [pendentes, setPendentes] = useState(0)
  const [revisao, setRevisao] = useState(0)
  const [enviando, setEnviando] = useState(false)

  const usuarioId = pb.authStore.record?.id ?? ''

  const atualizar = useCallback(async () => {
    if (!usuarioId) return
    try {
      setPendentes(await filaOffline.contarPendentes(usuarioId))
      setRevisao((await filaOffline.emRevisao(usuarioId)).length)
    } catch {
      /* IndexedDB indisponível: indicador fica mudo */
    }
  }, [usuarioId])

  const sincronizar = useCallback(async () => {
    if (!usuarioId || enviando) return
    setEnviando(true)
    try {
      const { enviados, revisao: emRevisao } = await filaOffline.sincronizar(usuarioId, '')
      if (enviados > 0) {
        await filaOffline.marcarUltimaSincronizacao()
        toast({
          title: `Enviado — ${enviados} registro${enviados > 1 ? 's' : ''} sincronizado${enviados > 1 ? 's' : ''}`,
        })
      } else if (emRevisao > 0) {
        toast({
          title: `${emRevisao} registro${emRevisao > 1 ? 's' : ''} precisa${emRevisao > 1 ? 'm' : ''} de revisão`,
          description: 'Abra Pendências de envio no banner.',
          variant: 'destructive',
        })
      }
    } finally {
      setEnviando(false)
      atualizar()
    }
  }, [usuarioId, enviando, toast, atualizar])

  useEffect(() => {
    atualizar()
    const ligar = () => {
      setOnline(true)
      sincronizar()
    }
    const desligar = () => setOnline(false)
    window.addEventListener('online', ligar)
    window.addEventListener('offline', desligar)
    const t = window.setInterval(atualizar, 15000)
    return () => {
      window.removeEventListener('online', ligar)
      window.removeEventListener('offline', desligar)
      clearInterval(t)
    }
  }, [atualizar, sincronizar])

  if (online && pendentes === 0 && revisao === 0) return null

  if (revisao > 0) {
    return (
      <div
        role="status"
        className="bg-red-100 text-red-900 border-b border-red-300 px-4 py-2 text-sm flex items-center justify-between gap-2"
      >
        <span>
          {revisao} registro{revisao > 1 ? 's' : ''} precisa{revisao > 1 ? 'm' : ''} de revisão
        </span>
        <Button variant="outline" size="sm" onClick={() => navigate('/pendencias')}>
          Abrir pendências
        </Button>
      </div>
    )
  }

  return (
    <div
      role="status"
      className={
        online
          ? 'bg-muted text-foreground px-4 py-2 text-sm flex items-center justify-between gap-2'
          : 'bg-yellow-100 text-yellow-900 border-b border-yellow-300 px-4 py-2 text-sm flex items-center justify-between gap-2'
      }
    >
      <span>
        {online ? `${pendentes} aguardando envio` : `Sem conexão — ${pendentes} aguardando envio`}
      </span>
      <Button variant="outline" size="sm" onClick={sincronizar} disabled={enviando || !online}>
        {enviando ? 'Enviando…' : 'Sincronizar agora'}
      </Button>
    </div>
  )
}
