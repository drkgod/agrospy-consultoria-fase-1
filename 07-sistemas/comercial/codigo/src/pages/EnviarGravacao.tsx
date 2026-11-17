// FASE 2 — SPEC-2-004 (task a9653f03): tela "Enviar gravação".
//
// Duas portas na mesma tela:
//  - ÁUDIO (m4a, mp3, wav, ogg, aac, amr, 3gp, webm até 25 MB): cria o rascunho com o
//    arquivo no campo `midia` (igual à SPEC-2-001) e manda processar (transcreve).
//  - TRANSCRIÇÃO pronta do Plaud (txt, docx, pdf até 5 MB): manda para a rota
//    /gravacoes/texto, que extrai o texto com o extrator nativo do Skip e cria o
//    rascunho já com a transcrição — não transcreve de novo.
//
// Deduplicação pelo conteúdo: SHA-256 do arquivo em base64, calculado aqui no aparelho
// (a spec 2-004 manda). O mesmo arquivo na mesma empresa vira um rascunho só.
import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { empresasService } from '@/services/empresas'
import pb from '@/lib/pocketbase/client'

const VERSAO_TELA = '2-004 · 2026-11-09 13:30 · enviar-gravacao'

const AUDIO = ['m4a', 'mp3', 'wav', 'ogg', 'aac', 'amr', '3gp', 'webm']
const TEXTO = ['txt', 'docx', 'pdf']
const MAX_AUDIO = 25 * 1024 * 1024
const MAX_TEXTO = 5 * 1024 * 1024

const ext = (nome: string) => {
  const p = nome.toLowerCase().split('.')
  return p.length > 1 ? p[p.length - 1] : ''
}

/** SHA-256 em base64 — a spec 2-004 usa esse formato para não duplicar. */
const sha256Base64 = async (arquivo: File): Promise<string> => {
  try {
    const buf = await arquivo.arrayBuffer()
    const digest = await crypto.subtle.digest('SHA-256', buf)
    const bytes = new Uint8Array(digest)
    let bin = ''
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
    return btoa(bin)
  } catch {
    return ''
  }
}

export default function EnviarGravacao() {
  const empresa = empresasService.getAtiva()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState<{
    rascunho?: string
    resposta?: string
    ja_existia?: boolean
  } | null>(null)

  if (!empresa) return <Navigate to="/escolher-empresa" replace />

  const enviar = async (arquivo: File) => {
    setErro('')
    setOk(null)
    const e = ext(arquivo.name)
    const ehAudio = AUDIO.indexOf(e) >= 0
    const ehTexto = TEXTO.indexOf(e) >= 0

    if (!ehAudio && !ehTexto) {
      setErro(
        'Formato não aceito. Áudio: ' +
          AUDIO.join(', ') +
          '. Transcrição: ' +
          TEXTO.join(', ') +
          '.',
      )
      return
    }
    if (ehAudio && arquivo.size > MAX_AUDIO) {
      setErro('Áudio acima de 25 MB. Envie um trecho menor.')
      return
    }
    if (ehTexto && arquivo.size > MAX_TEXTO) {
      setErro('Transcrição acima de 5 MB. Envie um trecho menor.')
      return
    }

    setEnviando(true)
    try {
      const idLocal = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
      const hash = await sha256Base64(arquivo)

      if (ehAudio) {
        // Cria o rascunho com o arquivo de áudio (campo `midia`, regras da 2-001)
        // e manda processar: a transcrição e a proposta rodam no servidor.
        const fd = new FormData()
        fd.append('empresa', empresa.id)
        fd.append('autor', pb.authStore.model?.id ?? '')
        fd.append('origem', 'arquivo_gravador')
        fd.append('chave_dedup', 'gravador:' + idLocal)
        if (hash) fd.append('hash_conteudo', hash)
        fd.append('id_local', idLocal)
        fd.append('midia', arquivo, arquivo.name)
        const rec = await pb.collection('rascunhos').create(fd)
        await pb
          .send('/backend/v1/rascunhos/' + rec.id + '/processar', { method: 'POST' })
          .catch(() => null)
        setOk({
          rascunho: rec.id,
          resposta: 'Áudio recebido. A transcrição roda em segundo plano — confira em Rascunhos.',
        })
      } else {
        // Transcrição pronta: txt vai como texto, docx/pdf pelo extrator do servidor.
        let texto = ''
        if (e === 'txt') {
          texto = await arquivo.text()
        }
        const fd = new FormData()
        fd.append('empresa', empresa.id)
        fd.append('nome_arquivo', arquivo.name)
        fd.append('hash', hash)
        fd.append('id_local', idLocal)
        if (texto) fd.append('texto', texto)
        else fd.append('arquivo', arquivo, arquivo.name)
        const r = (await pb.send('/backend/v1/gravacoes/texto', {
          method: 'POST',
          body: fd,
        })) as {
          ok?: boolean
          erro?: string
          rascunho?: string
          resposta?: string
          ja_existia?: boolean
        }
        if (!r?.ok) {
          setErro(String(r?.erro || 'Não consegui enviar o arquivo.'))
        } else {
          setOk({ rascunho: r.rascunho, resposta: r.resposta, ja_existia: r.ja_existia })
        }
      }
    } catch (err: unknown) {
      const msg = String((err as { message?: string })?.message ?? err)
      setErro(
        /409|já foi enviad/i.test(msg)
          ? 'Esse arquivo já estava na fila.'
          : msg || 'Falha ao enviar.',
      )
    } finally {
      setEnviando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Enviar gravação</h1>
        <p className="text-sm text-muted-foreground">
          Envie o áudio do gravador ou a transcrição pronta do Plaud. Vira rascunho para você
          conferir — nada entra no histórico sem confirmação.
        </p>
        <p className="text-[11px] text-muted-foreground">
          Versão da tela: <span className="font-mono">{VERSAO_TELA}</span>
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Escolher arquivo</CardTitle>
          <CardDescription>
            Áudio: {AUDIO.join(', ')} (até 25 MB). Transcrição: {TEXTO.join(', ')} (até 5 MB).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept={[...AUDIO, ...TEXTO].map((x) => '.' + x).join(',')}
            className="block w-full text-sm"
            disabled={enviando}
            onChange={(ev) => {
              const f = ev.target.files?.[0]
              if (f) enviar(f)
            }}
          />
          {enviando && <p className="text-sm text-muted-foreground">Enviando…</p>}
          {erro && (
            <p className="text-sm text-destructive" role="alert">
              {erro}
            </p>
          )}
          {ok && (
            <div className="rounded-lg border p-3 space-y-2" role="status">
              <p className="text-sm">{ok.resposta || 'Arquivo recebido.'}</p>
              {ok.ja_existia && <p className="text-xs text-muted-foreground">Já estava na fila.</p>}
              {ok.rascunho && (
                <Button size="sm" onClick={() => navigate('/rascunhos/' + ok.rascunho)}>
                  Abrir o rascunho
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Como exportar do Plaud</CardTitle>
          <CardDescription>
            No app do Plaud, abra a gravação e use Exportar → Transcrição (txt, docx ou pdf). Depois
            escolha o arquivo aqui em cima.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={() => navigate('/rascunhos')}>
            Ver os rascunhos
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
