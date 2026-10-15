// SPEC-1-003 Emenda 1 — gravação e anexo de áudio na visita.
// Gravar: MediaRecorder (Safari iOS 14.3+ grava em mp4/aac; Android em webm/opus).
// Anexar: <input type="file" accept="audio/*"> — o iPhone oferece "Gravar novo" e
// arquivos do Drive/Arquivos em qualquer formato (m4a, mp3, wav, ogg, aac, amr, 3gp).
// Limite do backend: 25 MB por arquivo (migração 0025).
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { empresasService } from '@/services/empresas'
import { produtoresService, type Produtor } from '@/services/produtores'
import { linhasNegocioService, type LinhaNegocio } from '@/services/linhas-negocio'
import { visitasService } from '@/services/visitas'
import { oportunidadesService } from '@/services/oportunidades'
import { filaOffline } from '@/services/fila-offline'
import pb from '@/lib/pocketbase/client'

const HOJE = () => new Date().toISOString().slice(0, 10)
const EM_N_DIAS = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const LIMITE_MB = 25

export default function RegistrarVisita() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const empresa = empresasService.getAtiva()
  const empresaId = empresa?.id ?? ''

  const [produtor, setProdutor] = useState<Produtor | null>(null)
  const [linhas, setLinhas] = useState<LinhaNegocio[]>([])
  const [data, setData] = useState(HOJE())
  const [assuntos, setAssuntos] = useState('')
  const [maisDetalhes, setMaisDetalhes] = useState(false)
  const [estrutura, setEstrutura] = useState('')
  const [necessidades, setNecessidades] = useState('')
  const [acordos, setAcordos] = useState('')
  const [destino, setDestino] = useState<
    '' | 'nova_oportunidade' | 'oportunidade_atualizada' | 'sem_oportunidade'
  >('')
  const [motivo, setMotivo] = useState('')
  const [abertas, setAbertas] = useState<
    ReturnType<typeof oportunidadesService.listarAbertasDoProdutor> extends Promise<infer T>
      ? T
      : never
  >([])
  const [oportEscolhida, setOportEscolhida] = useState('')
  const [resultadoVisita, setResultadoVisita] = useState('')
  const [novaAcaoVisita, setNovaAcaoVisita] = useState('')
  const [novaDataVisita, setNovaDataVisita] = useState(EM_N_DIAS(7))
  const [linha, setLinha] = useState('')
  const [descricao, setDescricao] = useState('')
  const [proximaAcao, setProximaAcao] = useState('')
  const [acaoData, setAcaoData] = useState(EM_N_DIAS(7))
  const [salvando, setSalvando] = useState(false)

  // Áudio: gravado no app ou escolhido do celular.
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [gravando, setGravando] = useState(false)
  const [tempoGravacao, setTempoGravacao] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const inputArquivoRef = useRef<HTMLInputElement | null>(null)

  // Transcrição por voz (Web Speech API — Safari iOS 14.5+ e Chrome).
  const [transcrevendo, setTranscrevendo] = useState(false)
  const [falaAtual, setFalaAtual] = useState('')
  const recognitionRef = useRef<{ stop: () => void; abort: () => void } | null>(null)
  const SpeechRecognitionApi =
    (window as unknown as Record<string, unknown>).SpeechRecognition ??
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  const suportaFala = typeof SpeechRecognitionApi !== 'undefined'

  useEffect(() => {
    if (!id || !empresaId) return
    produtoresService
      .buscarPorId(id)
      .then(setProdutor)
      .catch(() => {})
    linhasNegocioService
      .listarAtivas(empresaId)
      .then(setLinhas)
      .catch(() => {})
    oportunidadesService
      .listarAbertasDoProdutor(id)
      .then(setAbertas)
      .catch(() => {})
  }, [id, empresaId])

  if (!empresa) return null
  if (!produtor)
    return <p className="container mx-auto py-8 px-4 text-muted-foreground">Carregando…</p>

  // ---------- Áudio ----------
  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data)
      }
      rec.onstop = () => {
        const tipo = rec.mimeType || 'audio/mp4'
        const ext = tipo.includes('webm') ? 'webm' : tipo.includes('ogg') ? 'ogg' : 'm4a'
        const arquivo = new File(chunksRef.current, `visita-${Date.now()}.${ext}`, { type: tipo })
        setAudioFile(arquivo)
        stream.getTracks().forEach((t) => t.stop())
      }
      rec.start()
      recorderRef.current = rec
      setGravando(true)
      setTempoGravacao(0)
      timerRef.current = window.setInterval(() => setTempoGravacao((t) => t + 1), 1000)
    } catch {
      toast({
        title: 'Não foi possível acessar o microfone. Autorize no navegador.',
        variant: 'destructive',
      })
    }
  }

  const pararGravacao = () => {
    recorderRef.current?.stop()
    recorderRef.current = null
    setGravando(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const escolherArquivo = (f: File | null) => {
    if (!f) return
    if (f.size > LIMITE_MB * 1024 * 1024) {
      toast({
        title: `Arquivo maior que ${LIMITE_MB} MB. Grave um trecho menor ou comprima.`,
        variant: 'destructive',
      })
      return
    }
    setAudioFile(f)
  }

  const minutosSegundos = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // ---------- Transcrição por voz ----------
  const iniciarTranscricao = () => {
    if (!suportaFala) {
      toast({
        title: 'Seu navegador não tem transcrição por voz (use Safari ou Chrome).',
        variant: 'destructive',
      })
      return
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SR: any = SpeechRecognitionApi
      const rec = new SR()
      rec.lang = 'pt-BR'
      rec.continuous = true
      rec.interimResults = true
      rec.onresult = (ev: {
        resultIndex: number
        results: ArrayLike<ArrayLike<{ transcript: string }>>
      }) => {
        let texto = ''
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const chunk = ev.results[i]
          if (chunk && chunk[0]?.transcript) texto += chunk[0].transcript
        }
        if (texto) setFalaAtual(texto.trim())
      }
      rec.onerror = () => {
        setTranscrevendo(false)
        toast({
          title: 'Não foi possível transcrever (microfone ou permissão).',
          variant: 'destructive',
        })
      }
      rec.onend = () => setTranscrevendo(false)
      rec.start()
      recognitionRef.current = rec
      setTranscrevendo(true)
      setFalaAtual('')
    } catch {
      toast({ title: 'Não foi possível iniciar a transcrição.', variant: 'destructive' })
    }
  }

  const confirmarTranscricao = () => {
    const extra = falaAtual.trim()
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setTranscrevendo(false)
    setFalaAtual('')
    if (!extra) return
    setAssuntos((atual) => (atual ? atual + '\n' : '') + extra)
  }

  const cancelarTranscricao = () => {
    recognitionRef.current?.abort()
    recognitionRef.current = null
    setTranscrevendo(false)
    setFalaAtual('')
  }

  // ---------- Salvar ----------
  const salvar = async () => {
    if (!assuntos.trim()) {
      toast({ title: 'Escreva o que foi conversado.', variant: 'destructive' })
      return
    }
    if (!destino) {
      toast({ title: 'Escolha o próximo passo.', variant: 'destructive' })
      return
    }
    if (
      destino === 'nova_oportunidade' &&
      (!linha || !descricao.trim() || !proximaAcao.trim() || !acaoData)
    ) {
      toast({ title: 'Preencha linha, descrição, próxima ação e data.', variant: 'destructive' })
      return
    }
    if (destino === 'sem_oportunidade' && !motivo) {
      toast({ title: 'Escolha o motivo de não haver oportunidade.', variant: 'destructive' })
      return
    }
    if (
      destino === 'oportunidade_atualizada' &&
      (!oportEscolhida || !resultadoVisita.trim() || !novaAcaoVisita.trim() || !novaDataVisita)
    ) {
      toast({
        title: 'Escolha a oportunidade e preencha resultado, próxima ação e data.',
        variant: 'destructive',
      })
      return
    }
    setSalvando(true)
    try {
      // SPEC-1-004: sem conexão, a criação vai para a fila (CA-1-16). Áudio fica para a fase 2.
      if (!navigator.onLine) {
        if (audioFile) {
          toast({
            title: 'Sem conexão — áudio não pode ser anexado offline',
            description: 'Remova o áudio para salvar a visita no aparelho (fase 2).',
            variant: 'destructive',
          })
          return
        }
        const usuarioId = pb.authStore.record?.id ?? ''
        const dadosVisita = {
          produtor: produtor.id,
          data: `${data} 12:00:00.000Z`,
          assuntos_tratados: assuntos.trim(),
          estrutura_existente: estrutura.trim(),
          necessidades: necessidades.trim(),
          acordos: acordos.trim(),
          destino,
          motivo_sem_oportunidade: destino === 'sem_oportunidade' ? motivo : '',
        }
        let idVisitaLocal: string | undefined
        if (destino === 'nova_oportunidade') {
          const visitaLocal = await filaOffline.enfileirar(
            'visitas',
            dadosVisita,
            usuarioId,
            empresa.id,
          )
          idVisitaLocal = visitaLocal.id_local
          await filaOffline.enfileirar(
            'oportunidades',
            {
              produtor: produtor.id,
              linha_negocio: linha,
              descricao: descricao.trim(),
              proxima_acao: proximaAcao.trim(),
              proxima_acao_data: `${acaoData} 12:00:00.000Z`,
              visita_origem: idVisitaLocal,
            },
            usuarioId,
            empresa.id,
            idVisitaLocal,
          )
        } else {
          await filaOffline.enfileirar('visitas', dadosVisita, usuarioId, empresa.id)
        }
        toast({
          title: 'Sem conexão — visita salva no aparelho',
          description: 'Será enviada sozinha quando a internet voltar.',
        })
        navigate(`/produtores/${produtor.id}`)
        return
      }
      if (audioFile) {
        // Com áudio: FormData (arquivo + campos).
        const fd = new FormData()
        fd.append('empresa', empresa.id)
        fd.append('produtor', produtor.id)
        fd.append('data', `${data} 12:00:00.000Z`)
        fd.append('assuntos_tratados', assuntos.trim())
        if (estrutura.trim()) fd.append('estrutura_existente', estrutura.trim())
        if (necessidades.trim()) fd.append('necessidades', necessidades.trim())
        if (acordos.trim()) fd.append('acordos', acordos.trim())
        fd.append('destino', destino)
        if (destino === 'sem_oportunidade') fd.append('motivo_sem_oportunidade', motivo)
        fd.append('audio', audioFile)
        const visita = await visitasService.criarComFormData(fd)
        if (destino === 'nova_oportunidade') {
          await oportunidadesService.criar(
            {
              produtor: produtor.id,
              linha_negocio: linha,
              descricao: descricao.trim(),
              proxima_acao: proximaAcao.trim(),
              proxima_acao_data: `${acaoData} 12:00:00.000Z`,
              visita_origem: visita.id,
            },
            empresa.id,
          )
        }
      } else {
        // Sem áudio: JSON direto.
        const visita = await visitasService.criar(
          {
            produtor: produtor.id,
            data: `${data} 12:00:00.000Z`,
            assuntos_tratados: assuntos.trim(),
            estrutura_existente: estrutura.trim(),
            necessidades: necessidades.trim(),
            acordos: acordos.trim(),
            destino,
            motivo_sem_oportunidade: destino === 'sem_oportunidade' ? motivo : '',
          },
          empresa.id,
        )
        if (destino === 'nova_oportunidade') {
          await oportunidadesService.criar(
            {
              produtor: produtor.id,
              linha_negocio: linha,
              descricao: descricao.trim(),
              proxima_acao: proximaAcao.trim(),
              proxima_acao_data: `${acaoData} 12:00:00.000Z`,
              visita_origem: visita.id,
            },
            empresa.id,
          )
        }
      }
      if (destino === 'oportunidade_atualizada') {
        await oportunidadesService.registrarAcao(
          {
            oportunidade: oportEscolhida,
            tipo: 'concluida',
            resultado: resultadoVisita.trim(),
            nova_acao: novaAcaoVisita.trim(),
            nova_data: `${novaDataVisita} 12:00:00.000Z`,
          },
          empresa.id,
        )
      }
      toast({ title: 'Visita registrada' })
      navigate(`/produtores/${produtor.id}`)
    } catch (e: unknown) {
      const msg = String((e as { response?: { message?: string } })?.response?.message ?? '')
      toast({ title: msg || 'Não foi possível salvar a visita.', variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Registrar visita</h1>
          <p className="text-sm text-muted-foreground">{produtor.nome}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/produtores/${produtor.id}`)}>
          Voltar
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <Input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            aria-label="Data da visita"
          />
          <textarea
            placeholder="O que foi conversado? (pode ditar pelo teclado do celular)"
            value={assuntos}
            onChange={(e) => setAssuntos(e.target.value)}
            rows={4}
            className="w-full min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {!gravando && suportaFala && (
            <div className="space-y-2">
              {!transcrevendo ? (
                <Button variant="outline" size="sm" onClick={iniciarTranscricao}>
                  🎙 Transcrever o que eu falar
                </Button>
              ) : (
                <div className="rounded-lg border p-2 space-y-2 bg-muted/40">
                  <p className="text-sm text-destructive">● Ouvindo… (fale o que foi conversado)</p>
                  {falaAtual && <p className="text-sm italic whitespace-pre-line">{falaAtual}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={confirmarTranscricao}>
                      ✔ Adicionar ao texto
                    </Button>
                    <Button variant="outline" size="sm" onClick={cancelarTranscricao}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            className="text-sm text-muted-foreground underline"
            onClick={() => setMaisDetalhes(!maisDetalhes)}
          >
            {maisDetalhes ? 'Menos detalhes' : 'Mais detalhes (roteiro completo)'}
          </button>
          {maisDetalhes && (
            <div className="space-y-2">
              <Input
                placeholder="Estrutura existente"
                value={estrutura}
                onChange={(e) => setEstrutura(e.target.value)}
              />
              <Input
                placeholder="Necessidades apontadas"
                value={necessidades}
                onChange={(e) => setNecessidades(e.target.value)}
              />
              <Input
                placeholder="Acordos combinados"
                value={acordos}
                onChange={(e) => setAcordos(e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Áudio da conversa (opcional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={inputArquivoRef}
            type="file"
            accept="audio/*,.m4a,.mp3,.wav,.ogg,.aac,.amr,.3gp,.webm"
            className="hidden"
            onChange={(e) => escolherArquivo(e.target.files?.[0] ?? null)}
          />
          {!gravando && !audioFile && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={iniciarGravacao}>
                ● Gravar no app
              </Button>
              <Button variant="outline" onClick={() => inputArquivoRef.current?.click()}>
                ⬆ Anexar do celular
              </Button>
            </div>
          )}
          {gravando && (
            <div className="space-y-2">
              <p className="text-sm text-destructive">
                ● Gravando… {minutosSegundos(tempoGravacao)}
              </p>
              <Button variant="destructive" onClick={pararGravacao}>
                ■ Parar gravação
              </Button>
            </div>
          )}
          {audioFile && !gravando && (
            <div className="space-y-2">
              <p className="text-sm">
                🎙 {audioFile.name || 'gravação'} · {(audioFile.size / 1024 / 1024).toFixed(1)} MB
              </p>
              <audio controls src={URL.createObjectURL(audioFile)} className="w-full" />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAudioFile(null)
                    if (inputArquivoRef.current) inputArquivoRef.current.value = ''
                  }}
                >
                  Remover
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAudioFile(null)
                    if (inputArquivoRef.current) inputArquivoRef.current.value = ''
                    inputArquivoRef.current?.click()
                  }}
                >
                  Trocar áudio
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Qual o próximo passo?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Button
              variant={destino === 'nova_oportunidade' ? 'default' : 'outline'}
              onClick={() => setDestino('nova_oportunidade')}
            >
              Nova oportunidade
            </Button>
            <Button
              variant={destino === 'oportunidade_atualizada' ? 'default' : 'outline'}
              onClick={() => setDestino('oportunidade_atualizada')}
            >
              Atualizar oportunidade aberta
            </Button>
            <Button
              variant={destino === 'sem_oportunidade' ? 'default' : 'outline'}
              onClick={() => setDestino('sem_oportunidade')}
            >
              Sem oportunidade agora
            </Button>
          </div>

          {destino === 'oportunidade_atualizada' && (
            <div className="space-y-2">
              <select
                aria-label="Oportunidade"
                value={oportEscolhida}
                onChange={(e) => setOportEscolhida(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Oportunidade aberta *</option>
                {abertas.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.expand?.linha_negocio?.nome ?? 'Linha'} · {o.descricao}
                  </option>
                ))}
              </select>
              <Input
                placeholder="O que foi feito? (resultado) *"
                value={resultadoVisita}
                onChange={(e) => setResultadoVisita(e.target.value)}
              />
              <Input
                placeholder="Próxima ação *"
                value={novaAcaoVisita}
                onChange={(e) => setNovaAcaoVisita(e.target.value)}
              />
              <div className="flex gap-2 items-center">
                <Input
                  type="date"
                  value={novaDataVisita}
                  onChange={(e) => setNovaDataVisita(e.target.value)}
                  aria-label="Data da próxima ação"
                />
                <Button variant="outline" size="sm" onClick={() => setNovaDataVisita(EM_N_DIAS(7))}>
                  +7d
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNovaDataVisita(EM_N_DIAS(15))}
                >
                  +15d
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNovaDataVisita(EM_N_DIAS(30))}
                >
                  +30d
                </Button>
              </div>
            </div>
          )}

          {destino === 'nova_oportunidade' && (
            <div className="space-y-2">
              <select
                aria-label="Linha de negócio"
                value={linha}
                onChange={(e) => setLinha(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Linha de negócio *</option>
                {linhas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Descrição curta da oportunidade *"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
              <Input
                placeholder="Próxima ação *"
                value={proximaAcao}
                onChange={(e) => setProximaAcao(e.target.value)}
              />
              <div className="flex gap-2 items-center">
                <Input
                  type="date"
                  value={acaoData}
                  onChange={(e) => setAcaoData(e.target.value)}
                  aria-label="Data da próxima ação"
                />
                <Button variant="outline" size="sm" onClick={() => setAcaoData(EM_N_DIAS(7))}>
                  +7d
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAcaoData(EM_N_DIAS(15))}>
                  +15d
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAcaoData(EM_N_DIAS(30))}>
                  +30d
                </Button>
              </div>
            </div>
          )}

          {destino === 'sem_oportunidade' && (
            <select
              aria-label="Motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Motivo *</option>
              <option value="sem_interesse_agora">Sem interesse agora</option>
              <option value="sem_perfil">Sem perfil para a oferta</option>
              <option value="atendido_por_concorrente">Atendido por concorrente</option>
              <option value="outro">Outro</option>
            </select>
          )}

          <Button className="w-full" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar visita'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
